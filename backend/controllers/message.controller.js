import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";
import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import Attachment from "../models/attachment.model.js";
import { deleteFileFromSupabase } from "../utils/supabaseHelper.js";
import { getSocketIOInstance } from "../services/scheduledMessageCron.js";

// Helper to normalize message timestamp for clients
const normalizeMessage = (m) => {
  const obj = (m && m.toObject) ? m.toObject() : m;
  obj.timestamp = obj.isScheduled ? obj.scheduledFor : obj.createdAt;

  return obj;

};

export const allMessages = asyncHandler(async (req, res) => {
  try {
    // Exclude messages that are scheduled and not yet sent
    // We will compute membership intervals (joined/joinedAt and left/leftAt)
    // and only return messages that fall within any membership interval for this user.
    let messages = await Message.find({
      chat: req.params.chatId,
      // Exclude messages that the current user has soft-deleted
      deletedFor: { $not: { $elemMatch: { $eq: req.user._id } } },
      // Exclude messages explicitly hidden from this user
      excludeUsers: { $not: { $elemMatch: { $eq: req.user._id } } },
      $or: [
        { isScheduled: { $ne: true } },
        { scheduledSent: true }
      ]
    })
      .populate("sender", "name avatar email")
      .populate("attachments")
      .populate({
        path: "repliedTo",
        populate: [
          { path: "sender", select: "name avatar" },
          { path: "attachments" }
        ]
      })
      .populate({
        path: "poll",
        populate: [
          {
            path: "createdBy",
            select: "name avatar"
          },
          {
            path: "options.votes.user",
            select: "name avatar"
          }
        ]
      })
      .populate("starredBy.user", "name avatar")
      .populate("reactions.user", "name avatar")
      .populate("mentions", "name avatar")
      .sort({ createdAt: 1 });
      // If this chat is not a group chat, skip membership interval checks
      const chatObj = await Chat.findById(req.params.chatId).select('isGroupChat').lean();
      if (!chatObj || !chatObj.isGroupChat) {
        const out = messages.map(normalizeMessage);
        return res.json(out);
      }
    // Compute membership intervals for this user from Group.joinedBy/joinedAt and leftBy/leftAt
    try {
      const group = await Group.findOne({ chat: req.params.chatId }).select('joinedBy joinedAt leftBy leftAt participants').lean();
      const uid = String(req.user._id);
      let intervals = [];

      if (group) {
        const events = [];
        if (Array.isArray(group.joinedBy) && Array.isArray(group.joinedAt)) {
          group.joinedBy.forEach((entry, idx) => {
            try {
              if (String(entry) === uid && group.joinedAt && group.joinedAt[idx]) {
                events.push({ t: new Date(group.joinedAt[idx]), type: 'join' });
              }
            } catch (e) {}
          });
        }
        if (Array.isArray(group.leftBy) && Array.isArray(group.leftAt)) {
          group.leftBy.forEach((entry, idx) => {
            try {
              if (String(entry) === uid && group.leftAt && group.leftAt[idx]) {
                events.push({ t: new Date(group.leftAt[idx]), type: 'left' });
              }
            } catch (e) {}
          });
        }

        // Build sorted events and derive intervals (apply same logic whether or not
        // the user is currently a participant — we will add an open interval
        // from the last join if they are currently in the group).
        events.sort((a, b) => a.t - b.t);
        let currentStart = null;
        for (const ev of events) {
          if (ev.type === 'join') {
            // start a membership window
            if (!currentStart) currentStart = ev.t;
          } else if (ev.type === 'left') {
            if (currentStart) {
              intervals.push([currentStart, ev.t]);
              currentStart = null;
            } else {
              // left without a prior recorded join: assume membership from epoch
              intervals.push([new Date(0), ev.t]);
            }
          }
        }
        // If a join was seen without a subsequent left, create an open interval
        if (currentStart) intervals.push([currentStart, null]);

        // If no events recorded but the user is currently a participant, fall back
        // to an open interval (they should see messages from now onwards). If
        // events exist and the user is currently participant but no open interval
        // was created (e.g., left/join records missing), attempt to derive last
        // join from the group's joinedAt array and open from there.
        const currentlyParticipant = Array.isArray(group.participants) && group.participants.some(p => String(p) === uid);
        if (currentlyParticipant) {
          const hasOpen = intervals.some(([s, e]) => e === null);
          if (!hasOpen) {
            // try to find the last recorded join time for this user
            let lastJoin = null;
            if (Array.isArray(group.joinedBy) && Array.isArray(group.joinedAt)) {
              for (let i = 0; i < group.joinedBy.length; i++) {
                try {
                  if (String(group.joinedBy[i]) === uid && group.joinedAt[i]) lastJoin = new Date(group.joinedAt[i]);
                } catch (e) {}
              }
            }
            if (lastJoin) {
              intervals.push([lastJoin, null]);
            } else if (intervals.length === 0) {
              // absolute fallback: allow all time if we have no event data
              intervals.push([new Date(0), null]);
            }
          }
        }
      }

      // Filter messages by intervals (if intervals empty and user not participant, result will be empty)
      if (intervals && intervals.length) {
        const filtered = messages.filter(m => {
          // Use scheduledFor when this was a scheduled message that was sent,
          // otherwise use createdAt/timestamp. This prevents a scheduled message
          // (created earlier but scheduled to send later) from being included
          // in membership windows based on its creation time.
          let t = null;
          try {
            if (m && m.isScheduled && m.scheduledSent && m.scheduledFor) {
              t = new Date(m.scheduledFor);
            } else if (m && (m.createdAt || m.timestamp)) {
              t = new Date(m.createdAt || m.timestamp);
            } else {
              t = new Date();
            }
          } catch (e) {
            t = new Date(m.createdAt || m.timestamp || Date.now());
          }

          return intervals.some(([s, e]) => {
            const startOk = s ? t >= s : true;
            const endOk = e ? t <= e : true;
            return startOk && endOk;
          });
        });
        messages = filtered;
      } else {
        // No intervals -> if user not participant return empty
        messages = [];
      }
    } catch (e) {
      console.warn('allMessages: failed to apply membership intervals', e && e.message);
    }

    // Attach a normalized `timestamp` field so clients can use scheduledFor when appropriate
    const out = messages.map(normalizeMessage);
    res.json(out);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId, attachments, type = "text", isScheduled, scheduledFor, userId, poll, repliedTo, mentions, autoMessage } = req.body;
  // normalize isScheduled which may be boolean or string from client
  const isScheduledFlag = (isScheduled === true || isScheduled === 'true' || isScheduled === '1' || isScheduled === 1);
  // normalize scheduledFor into a Date if present
  const scheduledForDate = scheduledFor ? new Date(scheduledFor) : null;
  
  console.log("➡️ [SEND MESSAGE] Request received", { 
    chatId, 
    userId, 
    content: content?.substring(0, 50), 
    hasAttachments: !!attachments?.length,
    type, 
    isScheduled: isScheduledFlag, 
    scheduledFor: scheduledForDate, 
    hasPoll: !!poll, 
    hasRepliedTo: !!repliedTo,
    hasAutoMessage: !!(autoMessage && autoMessage.content),
    autoMessageSenderId: autoMessage?.senderId
  });
  
  if (!content && (!attachments || attachments.length === 0) && !poll) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  // Validate scheduled message
  if (isScheduledFlag) {
    if (!scheduledForDate || isNaN(scheduledForDate.getTime())) {
      res.status(400);
      throw new Error("Scheduled time is required for scheduled messages and must be a valid date");
    }
    if (scheduledForDate <= new Date()) {
      res.status(400);
      throw new Error("Scheduled time must be in the future");
    }
  }

  let chat = null;
  let createdNewChat = false;
  if (chatId) {
    chat = await Chat.findById(chatId);
    if (chat) {
      console.log("[sendMessage] Found existing chat:", chat._id);
    } else {
      console.log("[sendMessage] No chat found for chatId:", chatId);
    }
  }
  // If chat does not exist, try to create it (for 1-on-1 only)
  if (!chat) {
    console.log("[sendMessage] Attempting to create/access chat for userId:", userId);
    if (!userId || userId === req.user._id.toString()) {
      console.error("[sendMessage] userId missing or invalid for new chat creation", { userId, reqUser: req.user._id });
      res.status(400);
      throw new Error("userId is required to create a new chat");
    }
    // Check if chat already exists between these users
    let isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    });
    if (isChat.length > 0) {
      chat = isChat[0];
      console.log("[sendMessage] Found existing 1-on-1 chat:", chat._id);
    } else {
      // Create new chat
      const chatData = {
        chatName: "sender",
        isGroupChat: false,
        users: [req.user._id, userId],
        participants: [req.user._id, userId],
      };
      chat = await Chat.create(chatData);
      createdNewChat = true;
      console.log("[sendMessage] Created new 1-on-1 chat:", chat._id);
    }
  }

  // Check if user is blocked in 1-on-1 chat
  if (!chat.isGroupChat) {
    const otherUser = chat.users.find(user => user.toString() !== req.user._id.toString());
    if (otherUser) {
      const userDoc = await User.findById(otherUser);
      if (userDoc && userDoc.blockedUsers.includes(req.user._id)) {
        res.status(403);
        throw new Error("You are blocked by this user");
      }
    }
  }

  // Normalize and validate repliedTo ids
  let normalizedRepliedTo = Array.isArray(repliedTo) ? repliedTo : repliedTo ? [repliedTo] : [];
  const invalidRepliedTo = [];
  normalizedRepliedTo = normalizedRepliedTo.filter((id) => {
    if (mongoose.Types.ObjectId.isValid(String(id))) return true;
    invalidRepliedTo.push(id);
    return false;
  });
  if (invalidRepliedTo.length) {
    console.warn('[sendMessage] Ignoring invalid repliedTo ids:', invalidRepliedTo);
  }

  // Normalize and validate mentions (array of user ids)
  let normalizedMentions = Array.isArray(mentions) ? mentions : mentions ? [mentions] : [];
  const invalidMentions = [];
  normalizedMentions = normalizedMentions.filter((id) => {
    if (mongoose.Types.ObjectId.isValid(String(id))) return true;
    invalidMentions.push(id);
    return false;
  });
  if (invalidMentions.length) {
    console.warn('[sendMessage] Ignoring invalid mention ids:', invalidMentions);
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chat._id,
    type: type,
    attachments: attachments || [],
    // allow replying to one or multiple messages (only valid ObjectIds)
    repliedTo: normalizedRepliedTo,
    // store mentions (validated ObjectIds)
    mentions: normalizedMentions,
    isScheduled: !!isScheduledFlag,
    scheduledFor: isScheduledFlag ? scheduledForDate : null,
    scheduledSent: false,
    poll: poll || null,
  };

  try {
    console.log("[sendMessage] Creating user's message...");
    var message = await Message.create(newMessage);
    console.log("[sendMessage] Message created:", message._id);

    // Debug: refetch saved message from DB to verify persisted fields
    try {
      const saved = await Message.findById(message._id).lean();
      console.log('[sendMessage] Saved message in DB (raw):', {
        id: saved && saved._id,
        isScheduled: saved && saved.isScheduled,
        scheduledFor: saved && saved.scheduledFor,
        createdAt: saved && saved.createdAt
      });
    } catch (err) {
      console.warn('[sendMessage] Failed to fetch saved message for debug:', err && err.message);
    }

    message = await message.populate("sender", "name avatar");
    message = await message.populate("attachments");
    // populate replied messages
    message = await message.populate({
      path: "repliedTo",
      populate: [
        { path: "sender", select: "name avatar" },
        { path: "attachments" }
      ]
    });
    message = await message.populate({
      path: "poll",
      populate: [
        {
          path: "createdBy",
          select: "name avatar"
        },
        {
          path: "options.votes.user",
          select: "name avatar"
        }
      ]
    });
    message = await message.populate("chat");
    // Populate mentions so clients receive user objects (name/avatar) instead of raw ids
    message = await message.populate("mentions", "name avatar");
    // Ensure mentions are populated for the just-created message
    message = await message.populate("mentions", "name avatar");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name avatar email",
    });

    // Only update lastMessage if it's not scheduled or if it's being sent now
    if (!isScheduled) {
      await Chat.findByIdAndUpdate(chat._id, { lastMessage: message });
      console.log("[sendMessage] Updated chat lastMessage:", chat._id);
    }

    // When a new message is created, clear any soft-deletes on the chat
    // so the chat revives for all participants.
    try {
      await Chat.findByIdAndUpdate(chat._id, { $set: { deletedBy: [] } });
    } catch (err) {
      console.warn('[sendMessage] Failed to clear chat.deletedBy:', err && err.message);
    }

    // Attach normalized timestamp before sending
    const messageOut = normalizeMessage(message);

    // Emit user's message via socket
    try {
      const io = getSocketIOInstance();
      if (io && chat && chat._id) {
        try {
          io.to(String(chat._id)).emit("message recieved", messageOut);
        } catch (e) {}

        const users = (chat.users && chat.users.length) ? chat.users : (chat.participants || []);
        if (Array.isArray(users)) {
          users.forEach((u) => {
            try {
              const uid = u && (u._id ? String(u._id) : String(u));
              if (uid) {
                io.to(uid).emit("message recieved", messageOut);
              }
            } catch (e) {}
          });
        }
      }
    } catch (e) {}

    // If a new chat was created, return chat info as well
    if (createdNewChat) {
      console.log("[sendMessage] Returning new chat and message");
      return res.json({ message: messageOut, chat });
    }

    // Return consistent envelope `{ message: ... }` so frontend can read `resJson.message`
    return res.json({ message: messageOut });
  } catch (error) {
    console.error("[sendMessage] Error creating message:", error);
    res.status(400);
    throw new Error(error.message);
  }
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await Message.findById(messageId).populate('attachments');
  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  const chat = await Chat.findById(message.chat);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  const isSender = message.sender.toString() === userId.toString();
  const isGroupAdmin = chat.isGroupChat && chat.admins.includes(userId);

  if (!isSender && !isGroupAdmin) {
    res.status(403);
    throw new Error("Not authorized to delete this message");
  }

  // Delete attachments if any
  if (message.attachments && message.attachments.length > 0) {
    for (const attachment of message.attachments) {
      try {
        // Extract file path from URL for deletion
        if (attachment.fileUrl) {
          const urlParts = attachment.fileUrl.split('/');
          const bucketIndex = urlParts.findIndex(part => part === 'storage');
          if (bucketIndex !== -1 && urlParts[bucketIndex + 2]) {
            const bucket = urlParts[bucketIndex + 2];
            const filePath = urlParts.slice(bucketIndex + 3).join('/');
            
            // Delete file from Supabase storage
            await deleteFileFromSupabase(filePath, bucket);
          }
        }
        
        // Delete attachment document from database
        await Attachment.findByIdAndDelete(attachment._id);
      } catch (err) {
        console.error(`Failed to delete attachment ${attachment._id}:`, err.message);
        // Continue with other attachments even if one fails
      }
    }
  }

  await Message.findByIdAndDelete(messageId);

  // Update last message if needed
  if (chat.lastMessage && chat.lastMessage.toString() === messageId) {
    const previousMessage = await Message.findOne({ chat: chat._id })
      .sort({ createdAt: -1 });
    await Chat.findByIdAndUpdate(chat._id, { lastMessage: previousMessage });
  }

  res.json({ message: "Message deleted successfully" });
});


export const deleteMessagesForMe = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  if (!message.deletedFor.includes(userId)) {
    message.deletedFor.push(userId);
    await message.save();
  }

  res.json({ message: "Message deleted for you" });
});

export const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;

  if (!content || !content.trim()) {
    res.status(400);
    throw new Error("Message content is required");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  // Only the sender can edit the message
  if (message.sender.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("You can only edit your own messages");
  }

  // Update the message
  message.content = content.trim();
  message.isEdited = true;
  message.editedAt = new Date();

  await message.save();

  // Populate necessary fields
  await message.populate("sender", "name avatar email");
  await message.populate("attachments");

  res.json({
    message: "Message edited successfully",
    updatedMessage: message
  });
});

export const starMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  // Check if already starred
  const alreadyStarred = message.starredBy.some(star => 
    star.user.toString() === userId.toString()
  );

  if (alreadyStarred) {
    res.status(400);
    throw new Error("Message already starred");
  }

  message.starredBy.push({
    user: userId,
    starredAt: new Date()
  });

  await message.save();
  await message.populate("starredBy.user", "name avatar");

  res.json({
    message: "Message starred successfully",
    starredBy: message.starredBy
  });
});

export const unstarMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  message.starredBy = message.starredBy.filter(star => 
    star.user.toString() !== userId.toString()
  );

  await message.save();

  res.json({
    message: "Message unstarred successfully",
    starredBy: message.starredBy
  });
});

export const getStarredMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  const messages = await Message.find({
    chat: chatId,
    "starredBy.user": userId,
    // Exclude messages explicitly hidden from this user
    excludeUsers: { $not: { $elemMatch: { $eq: userId } } }
  })
    .populate("sender", "name avatar email")
    .populate({ path: "chat", select: "chatName isGroupChat groupSettings.avatar" })
    .populate("attachments")
    .populate("starredBy.user", "name avatar")
    .sort({ createdAt: -1 });

  // Normalize timestamps so scheduled messages expose `scheduledFor` as `timestamp`
  const out = messages.map(normalizeMessage);
  res.json(out);
});

export const addReaction = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  if (!emoji) {
    res.status(400);
    throw new Error("Emoji is required");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  // Remove existing reaction from same user
  message.reactions = message.reactions.filter(
    reaction => reaction.user.toString() !== userId.toString()
  );

  // Add new reaction
  message.reactions.push({
    user: userId,
    emoji: emoji,
    reactedAt: new Date()
  });

  await message.save();
  await message.populate("reactions.user", "name avatar");

  res.json({
    message: "Reaction added successfully",
    reactions: message.reactions
  });
});


export const removeReaction = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  message.reactions = message.reactions.filter(
    reaction => reaction.user.toString() !== userId.toString()
  );

  await message.save();

  res.json({
    message: "Reaction removed successfully",
    reactions: message.reactions
  });
});

export const forwardMessage = asyncHandler(async (req, res) => {
  const { content, chatId, attachments, type = "text", isForwarded = true, repliedTo, mentions } = req.body;

  // Validate basic input
  if (!content && (!attachments || attachments.length === 0)) {
    console.log("❌ Validation failed: No content or attachments provided");
    return res.sendStatus(400);
  }

  if (!chatId) {
    console.log("❌ Validation failed: chatId missing");
    res.status(400);
    throw new Error("Chat ID is required");
  }

  console.log(`🔍 Fetching chat: ${chatId}`);
  const chat = await Chat.findById(chatId);

  if (!chat) {
    console.log("❌ Chat not found");
    res.status(404);
    throw new Error("Chat not found");
  }

  //console.log("👥 Chat users:", chat.users, "participants:", chat.participants);

  // Determine membership list. For group chats, prefer the separate Group model's `participants` array
  // (some groups store members there, linked by `group.chat`), otherwise fall back to chat.users or chat.participants.
  let chatMembers = [];
  if (chat.isGroupChat) {
    try {
      const groupObj = await Group.findOne({ chat: chatId }).select('participants').lean();
      if (groupObj && Array.isArray(groupObj.participants) && groupObj.participants.length) {
        chatMembers = groupObj.participants;
      } else if (Array.isArray(chat.users) && chat.users.length) {
        chatMembers = chat.users;
      } else if (Array.isArray(chat.participants) && chat.participants.length) {
        chatMembers = chat.participants;
      }
    } catch (e) {
      console.warn('forwardMessage: failed to load Group participants', e && e.message);
      chatMembers = (Array.isArray(chat.users) && chat.users.length) ? chat.users : (Array.isArray(chat.participants) ? chat.participants : []);
    }
  } else {
    chatMembers = (Array.isArray(chat.users) && chat.users.length > 0)
      ? chat.users
      : (Array.isArray(chat.participants) ? chat.participants : []);
  }

  const isUserInChat = chatMembers.some(
    (user) => user && user.toString() === req.user._id.toString()
  );

  if (!isUserInChat) {
    console.log(`🚫 User ${req.user._id} not authorized to send messages in chat ${chatId}`);
    res.status(403);
    throw new Error("You are not authorized to send messages to this chat");
  }

  // Block check (only 1-to-1 chats)
  if (!chat.isGroupChat) {
    const otherUser = chat.users.find(
      (user) => user.toString() !== req.user._id.toString()
    );
    console.log("🔎 Checking block status. Other user:", otherUser);

    if (otherUser) {
      const userDoc = await User.findById(otherUser);
      console.log("🧾 Other user doc:", userDoc);

      if (userDoc && userDoc.blockedUsers.includes(req.user._id)) {
        console.log(`🚫 Forward failed: User ${req.user._id} is blocked by ${otherUser}`);
        res.status(403);
        throw new Error("You are blocked by this user");
      }
    }
  }

  // Normalize and validate repliedTo ids for forwarded messages
  let normalizedForwardRepliedTo = Array.isArray(repliedTo) ? repliedTo : repliedTo ? [repliedTo] : [];
  const invalidForwardRepliedTo = [];
  normalizedForwardRepliedTo = normalizedForwardRepliedTo.filter((id) => {
    if (mongoose.Types.ObjectId.isValid(String(id))) return true;
    invalidForwardRepliedTo.push(id);
    return false;
  });
  if (invalidForwardRepliedTo.length) {
    console.warn('[forwardMessage] Ignoring invalid repliedTo ids:', invalidForwardRepliedTo);
  }

  // Normalize and validate mentions for forwarded messages
  let normalizedForwardMentions = Array.isArray(mentions) ? mentions : mentions ? [mentions] : [];
  const invalidForwardMentions = [];
  normalizedForwardMentions = normalizedForwardMentions.filter((id) => {
    if (mongoose.Types.ObjectId.isValid(String(id))) return true;
    invalidForwardMentions.push(id);
    return false;
  });
  if (invalidForwardMentions.length) {
    console.warn('[forwardMessage] Ignoring invalid mention ids:', invalidForwardMentions);
  }

  const newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
    type: type,
    attachments: attachments || [],
    isForwarded: isForwarded,
    repliedTo: normalizedForwardRepliedTo,
    mentions: normalizedForwardMentions,
  };

  //console.log("📝 Creating message:", newMessage);

  try {
    var message = await Message.create(newMessage);
    //console.log("✅ Message created:", message._id);

    message = await message.populate("sender", "name avatar");
    //console.log("📌 Populated sender");

    message = await message.populate("attachments");
    //console.log("📎 Populated attachments");

    // populate replied messages if any
    message = await message.populate({
      path: "repliedTo",
      populate: [
        { path: "sender", select: "name avatar" },
        { path: "attachments" }
      ]
    });
    //console.log("📎 Populated repliedTo messages");

    message = await message.populate("chat");
    //console.log("💬 Populated chat");
    // Populate mentions so forwarded messages include user info
    message = await message.populate("mentions", "name avatar");
    console.log("🔖 Populated mentions");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name avatar email",
    });
    //console.log("👥 Populated chat users info");

    //console.log("🆙 Updating chat lastMessage");
    await Chat.findByIdAndUpdate(chatId, { lastMessage: message });

    // Attach normalized timestamp for forwarded message
    const forwardOut = normalizeMessage(message);
    //console.log("🎉 Forward message complete");
    res.json(forwardOut);

  } catch (error) {
    console.error("🔥 ERROR in forwardMessage:", error.message);
    res.status(400);
    throw new Error(error.message);
  }
});


export const pinMessage = asyncHandler(async (req, res) => {
  const { messageId, chatId } = req.body;
  const userId = req.user._id;

  if (!messageId || !chatId) {
    res.status(400);
    throw new Error("Message ID and Chat ID are required");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  const chat = await Chat.findById(chatId)
    .populate({
      path: "pinnedMessages.message",
      populate: {
        path: "sender",
        select: "name avatar email"
      }
    })
    .populate("pinnedMessages.pinnedBy", "name avatar");

  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  // Check if user is part of the chat
  const isUserInChat = chat.users.some(
    user => user.toString() === userId.toString()
  );

  if (!isUserInChat) {
    res.status(403);
    throw new Error("You are not authorized to pin messages in this chat");
  }

  // Check if message is already pinned
  const alreadyPinned = chat.pinnedMessages.some(
    pinned => pinned.message && pinned.message._id.toString() === messageId
  );

  if (alreadyPinned) {
    res.status(400);
    throw new Error("Message is already pinned");
  }

  // WhatsApp allows up to 3 pinned messages
  if (chat.pinnedMessages.length >= 3) {
    res.status(400);
    throw new Error("Maximum 3 messages can be pinned. Please unpin a message first.");
  }

  // Add to pinned messages
  chat.pinnedMessages.push({
    message: messageId,
    pinnedBy: userId,
    pinnedAt: new Date()
  });

  await chat.save();

  // Populate the newly added pinned message
  await chat.populate({
    path: "pinnedMessages.message",
    populate: {
      path: "sender",
      select: "name avatar email"
    }
  });
  await chat.populate("pinnedMessages.pinnedBy", "name avatar");

  res.json({
    message: "Message pinned successfully",
    pinnedMessages: chat.pinnedMessages
  });
});

export const unpinMessage = asyncHandler(async (req, res) => {
  const { messageId, chatId } = req.body;
  const userId = req.user._id;

  if (!messageId || !chatId) {
    res.status(400);
    throw new Error("Message ID and Chat ID are required");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  // Check if user is part of the chat
  const isUserInChat = chat.users.some(
    user => user.toString() === userId.toString()
  );

  if (!isUserInChat) {
    res.status(403);
    throw new Error("You are not authorized to unpin messages in this chat");
  }

  // Remove from pinned messages
  chat.pinnedMessages = chat.pinnedMessages.filter(
    pinned => pinned.message && pinned.message.toString() !== messageId
  );

  await chat.save();

  // Populate the remaining pinned messages
  await chat.populate({
    path: "pinnedMessages.message",
    populate: {
      path: "sender",
      select: "name avatar email"
    }
  });
  await chat.populate("pinnedMessages.pinnedBy", "name avatar");

  res.json({
    message: "Message unpinned successfully",
    pinnedMessages: chat.pinnedMessages
  });
});

export const getPinnedMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  const chat = await Chat.findById(chatId)
    .populate({
      path: "pinnedMessages.message",
      populate: [
        {
          path: "sender",
          select: "name avatar email"
        },
        {
          path: "attachments"
        }
      ]
    })
    .populate("pinnedMessages.pinnedBy", "name avatar");

  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  // Check if user is part of the chat
  const isUserInChat = chat.users.some(
    user => user.toString() === userId.toString()
  );

  if (!isUserInChat) {
    res.status(403);
    throw new Error("You are not authorized to view pinned messages in this chat");
  }

  // Normalize timestamps on pinned messages' nested message objects
  const pinned = (chat.pinnedMessages || []).map(pm => {
    if (pm && pm.message) {
      try {
        pm.message = normalizeMessage(pm.message);
      } catch (e) {
        // ignore
      }
    }
    return pm;
  });

  res.json(pinned);
});

// Get media attachments (images, videos) from chats
export const getMediaAttachments = asyncHandler(async (req, res) => {
  try {
    
    const { chatIds } = req.query;

    if (!chatIds) {
      console.log('❌ No chatIds provided');
      res.status(400);
      throw new Error("Chat IDs are required");
    }

    // Parse comma-separated chat IDs
    const chatIdArray = chatIds.split(',').map(id => id.trim());

    // Verify user has access to these chats
    const chats = await Chat.find({
      _id: { $in: chatIdArray },
      users: req.user._id
    });

    if (chats.length === 0) {
      console.log('⚠️ No accessible chats found, returning empty array');
      return res.json([]);
    }

    const verifiedChatIds = chats.map(chat => chat._id);

    // Find all messages with media attachments in these chats
    const messages = await Message.find({
      chat: { $in: verifiedChatIds },
      // Include messages that are not deletedFor the user OR where the user is listed in keepFor
      $or: [ { deletedFor: { $ne: req.user._id } }, { keepFor: req.user._id } ],
      // Exclude messages explicitly hidden from this user
      excludeUsers: { $not: { $elemMatch: { $eq: req.user._id } } },
      attachments: { $exists: true, $ne: [] }
    })
      .populate({
        path: 'attachments',
        match: {
          mimeType: { $regex: '^(image|video)/', $options: 'i' }
        }
      })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean();

    // Extract and flatten attachments
    const mediaItems = [];
    messages.forEach(message => {
      if (message.attachments && message.attachments.length > 0) {
        message.attachments.forEach(attachment => {
          // Filter out null attachments (ones that didn't match the populate condition)
          if (attachment && attachment._id && (attachment.mimeType?.startsWith('image/') || attachment.mimeType?.startsWith('video/'))) {
            mediaItems.push({
              _id: attachment._id,
              url: attachment.fileUrl,
              fileName: attachment.fileName,
              mimeType: attachment.mimeType,
              fileSize: attachment.fileSize,
              createdAt: message.createdAt,
              sender: message.sender?._id,
              senderName: message.sender?.name || message.sender?.email,
              chatId: message.chat,
              messageId: message._id  // Add message ID for navigation
            });
          }
        });
      }
    });

    res.json(mediaItems);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// Get link attachments from chats
export const getLinkAttachments = asyncHandler(async (req, res) => {
  try {
    
    const { chatIds } = req.query;

    if (!chatIds) {
      console.log('❌ No chatIds provided');
      res.status(400);
      throw new Error("Chat IDs are required");
    }

    // Parse comma-separated chat IDs
    const chatIdArray = chatIds.split(',').map(id => id.trim());

    // Verify user has access to these chats
    const chats = await Chat.find({
      _id: { $in: chatIdArray },
      users: req.user._id
    });

    if (chats.length === 0) {
      return res.json([]);
    }

    const verifiedChatIds = chats.map(chat => chat._id);

    // URL regex pattern
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // Find all messages with URLs in content
    const messages = await Message.find({
      chat: { $in: verifiedChatIds },
      // Include messages that are not deletedFor the user OR where the user is listed in keepFor
      $or: [ { deletedFor: { $ne: req.user._id } }, { keepFor: req.user._id } ],
      // Exclude messages explicitly hidden from this user
      excludeUsers: { $not: { $elemMatch: { $eq: req.user._id } } },
      content: { $regex: urlRegex }
    })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean();

    // Extract URLs from messages
    const linkItems = [];
    messages.forEach(message => {
      const urls = message.content.match(urlRegex);
      if (urls && urls.length > 0) {
        urls.forEach(url => {
          linkItems.push({
            _id: message._id + '_' + url,
            url: url,
            content: message.content,
            createdAt: message.createdAt,
            sender: message.sender?._id,
            senderName: message.sender?.name || message.sender?.email,
            chatId: message.chat,
            messageId: message._id  // Add message ID for navigation
          });
        });
      }
    });

    res.json(linkItems);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// Get document attachments from chats
export const getDocumentAttachments = asyncHandler(async (req, res) => {
  try {
    
    const { chatIds } = req.query;

    if (!chatIds) {
      console.log('❌ No chatIds provided');
      res.status(400);
      throw new Error("Chat IDs are required");
    }

    // Parse comma-separated chat IDs
    const chatIdArray = chatIds.split(',').map(id => id.trim());

    // Verify user has access to these chats
    const chats = await Chat.find({
      _id: { $in: chatIdArray },
      users: req.user._id
    });

    if (chats.length === 0) {
      return res.json([]);
    }

    const verifiedChatIds = chats.map(chat => chat._id);

    // Find all messages with document attachments in these chats
    const messages = await Message.find({
      chat: { $in: verifiedChatIds },
      // Include messages that are not deletedFor the user OR where the user is listed in keepFor
      $or: [ { deletedFor: { $ne: req.user._id } }, { keepFor: req.user._id } ],
      // Exclude messages explicitly hidden from this user
      excludeUsers: { $not: { $elemMatch: { $eq: req.user._id } } },
      attachments: { $exists: true, $ne: [] }
    })
      .populate({
        path: 'attachments',
        match: {
          mimeType: { 
            $regex: '^(?!image|video)', 
            $options: 'i' 
          }
        }
      })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean();

    // Extract and flatten document attachments
    const docItems = [];
    messages.forEach(message => {
      if (message.attachments && message.attachments.length > 0) {
        message.attachments.forEach(attachment => {
          // Filter out null attachments (ones that didn't match the populate condition)
          if (attachment && attachment._id && 
              !attachment.mimeType?.startsWith('image/') && 
              !attachment.mimeType?.startsWith('video/')) {
            docItems.push({
              _id: attachment._id,
              url: attachment.fileUrl,
              fileName: attachment.fileName,
              mimeType: attachment.mimeType,
              fileSize: attachment.fileSize,
              createdAt: message.createdAt,
              sender: message.sender?._id,
              senderName: message.sender?.name || message.sender?.email,
              chatId: message.chat,
              messageId: message._id  // Add message ID for navigation
            });
          }
        });
      }
    });

    res.json(docItems);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// Get scheduled messages for a chat
export const getScheduledMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  // Check if user is part of the chat
  const isUserInChat = chat.users.some(
    user => user.toString() === userId.toString()
  );

  if (!isUserInChat) {
    res.status(403);
    throw new Error("You are not authorized to view scheduled messages in this chat");
  }

  const scheduledMessages = await Message.find({
    chat: chatId,
    sender: userId, // Only show user's own scheduled messages
    isScheduled: true,
    scheduledSent: false,
  })
    .populate("sender", "name avatar email")
    .populate("attachments")
    .sort({ scheduledFor: 1 });

  // Ensure `timestamp` field present for scheduled messages
  const scheduledOut = scheduledMessages.map(normalizeMessage);
  res.json(scheduledOut);
});

// Cancel/delete a scheduled message
export const cancelScheduledMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  // Only the sender can cancel their scheduled message
  if (message.sender.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("You can only cancel your own scheduled messages");
  }

  if (!message.isScheduled || message.scheduledSent) {
    res.status(400);
    throw new Error("This message cannot be cancelled");
  }

  await Message.findByIdAndDelete(messageId);

  res.json({ message: "Scheduled message cancelled successfully" });
});

// Update scheduled message time
export const updateScheduledMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { scheduledFor, content } = req.body;
  const userId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  // Only the sender can update their scheduled message
  if (message.sender.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("You can only update your own scheduled messages");
  }

  if (!message.isScheduled || message.scheduledSent) {
    res.status(400);
    throw new Error("This message cannot be updated");
  }

  if (scheduledFor) {
    const newScheduledDate = new Date(scheduledFor);
    if (newScheduledDate <= new Date()) {
      res.status(400);
      throw new Error("Scheduled time must be in the future");
    }
    message.scheduledFor = newScheduledDate;
  }

  if (content !== undefined) {
    message.content = content;
  }

  await message.save();

  await message.populate("sender", "name avatar email");
  await message.populate("attachments");

  res.json({
    message: "Scheduled message updated successfully",
    updatedMessage: message
  });
});

// Update message delivery status (recipient acknowledges receipt -> 'delivered')
export const updateMessageStatus = asyncHandler(async (req, res) => {
  const { messageId } = req.body;
  const userId = req.user._id;

  if (!messageId) {
    res.status(400);
    throw new Error('messageId is required');
  }

  const message = await Message.findById(messageId).populate('chat');
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  const chat = await Chat.findById(message.chat);
  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  // Only update delivered for 1-on-1 chats. For group chats we rely on readBy and markAsRead.
  if (!chat.isGroupChat) {
    // Ensure only the recipient (not the sender) can mark delivered
    if (message.sender.toString() === userId.toString()) {
      return res.json({ message: 'Sender cannot mark own message delivered', updated: false });
    }

    if (message.status !== 'delivered' && message.status !== 'read') {
      message.status = 'delivered';
      await message.save();
    }
  }

  res.json({ message: 'Status updated', status: message.status });
});

// Mark messages in a chat as read by the current user
export const markAsRead = asyncHandler(async (req, res) => {
  const { chatId } = req.body;
  const userId = req.user._id;

  if (!chatId) {
    res.status(400);
    throw new Error('chatId is required');
  }

  const chat = await Chat.findById(chatId).lean();
  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  if (chat.isGroupChat) {
    // For group chats: add user to readBy for unread messages, and set status to 'read' when everyone has read
    const msgs = await Message.find({ chat: chatId, $or: [ { readBy: { $exists: false } }, { readBy: { $nin: [userId] } } ], excludeUsers: { $not: { $elemMatch: { $eq: userId } } } });
    const updated = [];
    for (const m of msgs) {
      if (!m.readBy) m.readBy = [];
      if (!m.readBy.map(r => String(r)).includes(String(userId))) {
        m.readBy.push(userId);
      }
      // If all users have read, mark message status as 'read'
      const uniqueReaders = (m.readBy || []).map(r => String(r));
      const participantIds = (chat.participants && chat.participants.length) ? chat.participants.map(p => String(p)) : (chat.users || []).map(u => String(u));
      const allRead = participantIds.every(pid => uniqueReaders.includes(pid));
      if (allRead) m.status = 'read';
      await m.save();
      updated.push(m._id);
    }

    return res.json({ message: 'Group messages marked read', updatedCount: updated.length, updatedIds: updated });
  } else {
    // 1-on-1 chats: mark all messages in chat not sent by current user as 'read'
    const result = await Message.updateMany(
      { chat: chatId, sender: { $ne: userId }, status: { $ne: 'read' } },
      { $set: { status: 'read' } }
    );
    return res.json({ message: 'Messages marked read', modifiedCount: result.nModified || result.modifiedCount || 0 });
  }
});