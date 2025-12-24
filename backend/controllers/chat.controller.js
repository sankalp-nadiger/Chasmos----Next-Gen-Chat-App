import asyncHandler from "express-async-handler";
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Group from "../models/group.model.js";
import Attachment from "../models/attachment.model.js";
import Screenshot from "../models/screenshot.model.js";
import { deleteFileFromSupabase } from "../utils/supabaseHelper.js";
import path from "path";
import { getSocketIOInstance } from "../services/scheduledMessageCron.js";
import { uploadBase64ImageToSupabase } from "../utils/uploadToSupabase.js";
import crypto from "crypto";

export const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("lastMessage");

  isChat = await User.populate(isChat, {
    path: "lastMessage.sender",
    select: "name avatar email",
  });

  if (isChat.length > 0) {
    // Ensure consistent timestamp on lastMessage for client display
    const chat = isChat[0];
    if (chat && chat.lastMessage) {
      try {
        const lm = chat.lastMessage;
        const ts = (lm.isScheduled && lm.scheduledSent && lm.scheduledFor) ? lm.scheduledFor : (lm.createdAt || lm.updatedAt || null);
        if (lm.toObject && typeof lm.toObject === 'function') {
          const obj = lm.toObject();
          obj.timestamp = ts;
          chat.lastMessage = obj;
        } else {
          chat.lastMessage.timestamp = ts;
        }
      } catch (e) {}
    }
    // Produce a plain object and ensure a `name` property exists for frontend
    const chatObj = (chat && chat.toObject && typeof chat.toObject === 'function') ? chat.toObject() : { ...chat };
    chatObj.name = chatObj.chatName || chatObj.name || (chatObj.groupSettings && chatObj.groupSettings.name) || "";
    res.send(chatObj);
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
      participants: [req.user._id, userId],
    };

    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      const fullObj = (FullChat && FullChat.toObject && typeof FullChat.toObject === 'function') ? FullChat.toObject() : { ...FullChat };
      fullObj.name = fullObj.chatName || fullObj.name || (fullObj.groupSettings && fullObj.groupSettings.name) || "";
      res.status(200).json(fullObj);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
});

export const fetchChats = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId).select("blockedUsers archivedChats");
    const blockedUserIds = user.blockedUsers || [];
    const archivedChatIds = user.archivedChats.map(archived => archived.chat.toString());

    const results = await Chat.find({ 
      users: { $elemMatch: { $eq: userId } },
      _id: { $nin: archivedChatIds },
      // Exclude chats the current user has soft-deleted
      deletedBy: { $not: { $elemMatch: { $eq: userId } } },
      $or: [
        { isGroupChat: true },
        { 
          isGroupChat: false,
          users: { 
            $not: { 
              $elemMatch: { 
                $in: blockedUserIds 
              } 
            } 
          } 
        }
      ]
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("lastMessage")
      .populate("admins", "name email avatar")
      .sort({ updatedAt: -1 });

    const populatedResults = await User.populate(results, {
      path: "lastMessage.sender",
      select: "name avatar email",
    });

    // Preload Group documents linked to these chats so frontend can access group.features
    const chatIds = (Array.isArray(populatedResults) ? populatedResults : []).map(c => c._id).filter(Boolean);
    let groupsByChat = {};
    if (chatIds.length) {
      try {
        const groups = await Group.find({ chat: { $in: chatIds } }).lean();
        for (const g of groups) {
          if (g && g.chat) groupsByChat[String(g.chat)] = g;
        }
      } catch (e) {
        console.warn('[fetchChats] failed to preload groups:', e && e.message);
      }
    }

    // For each chat compute unreadCount for the current user (exclude system messages)
    const resultsWithUnread = [];
    for (const chat of (Array.isArray(populatedResults) ? populatedResults : [])) {
      try {
        // Normalize lastMessage timestamp like before
        if (chat && chat.lastMessage) {
          try {
            const lm = chat.lastMessage;
            const ts = (lm.isScheduled && lm.scheduledSent && lm.scheduledFor) ? lm.scheduledFor : (lm.createdAt || lm.updatedAt || null);
            if (lm.toObject && typeof lm.toObject === 'function') {
              const obj = lm.toObject();
              obj.timestamp = ts;
              chat.lastMessage = obj;
            } else {
              chat.lastMessage.timestamp = ts;
            }
          } catch (e) {}
        }

        // Count unread messages for this user (exclude messages of type 'system', deleted messages,
        // and messages authored by the current user)
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          isDeleted: { $ne: true },
          type: { $ne: 'system' },
          readBy: { $not: { $elemMatch: { $eq: req.user._id } } },
          sender: { $ne: req.user._id },
        });

        // attach unreadCount to the chat object (lean/POJO safe)
        const chatObj = (chat && chat.toObject && typeof chat.toObject === 'function') ? chat.toObject() : { ...chat };
        // If a Group doc exists for this chat, attach it and mirror feature flags into groupSettings
        const maybeGroup = groupsByChat && groupsByChat[String(chatObj._id)];
        if (maybeGroup) {
          chatObj.group = maybeGroup;
          chatObj.features = maybeGroup.features || chatObj.features || {};
          chatObj.groupSettings = chatObj.groupSettings || {};
          chatObj.groupSettings.features = maybeGroup.features || chatObj.groupSettings.features || {};
        }
        chatObj.unreadCount = unreadCount || 0;
        // ensure frontend has a stable `name` field
        chatObj.name = chatObj.chatName || chatObj.name || (chatObj.groupSettings && chatObj.groupSettings.name) || (chatObj.users && chatObj.users[0] && (chatObj.users[0].name || chatObj.users[0].email)) || "";
        resultsWithUnread.push(chatObj);
      } catch (e) {
        // on error, push chat without unread count
        const chatObj = (chat && chat.toObject && typeof chat.toObject === 'function') ? chat.toObject() : { ...chat };
        chatObj.unreadCount = 0;
        resultsWithUnread.push(chatObj);
      }
    }

    res.status(200).send(resultsWithUnread);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// Fetch recent chats tailored for the Forward modal: exclude group chats
// where the linked Group document explicitly shows the current user is no longer a participant.
export const fetchRecentChatsForForward = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("archivedChats");
    const archivedChatIds = (user && Array.isArray(user.archivedChats)) ? user.archivedChats.map(a => a.chat.toString()) : [];

      const chats = await Chat.find({ 
        $or: [ { participants: userId }, { users: userId } ],
        _id: { $nin: archivedChatIds },
        // Exclude chats the current user has soft-deleted
        deletedBy: { $not: { $elemMatch: { $eq: userId } } }
      })
      .sort({ updatedAt: -1 })
      .populate('participants', '_id name email avatar')
      .populate('users', '_id name email avatar')
      .populate('admins', '_id name email avatar')
      .populate('groupAdmin', '_id name email avatar')
      .populate({ path: 'lastMessage', populate: { path: 'attachments' } })
      .populate({ path: 'lastMessage.sender', select: '_id email name' })
      .lean();

    const formattedChats = [];
    for (const chat of chats) {
      try {
        // For group chats, consult Group document to ensure the user is still a participant
        if (chat.isGroupChat) {
          try {
            const group = await Group.findOne({ chat: chat._id }).select('participants');
            if (group && Array.isArray(group.participants) && group.participants.length > 0) {
              const isMember = group.participants.some(p => String(p) === String(userId));
              if (!isMember) {
                // skip this chat entirely
                continue;
              }
            }
          } catch (e) {
            // on error, include the chat to avoid false negatives
          }
        }

        let unread = 0;
        try {
          unread = await Message.countDocuments({
            chat: chat._id,
            isDeleted: { $ne: true },
            type: { $ne: 'system' },
            readBy: { $not: { $elemMatch: { $eq: userId } } },
            sender: { $ne: userId },
          });
        } catch (e) {
          unread = 0;
        }

        let mentionCount = 0;
        try {
          mentionCount = await Message.countDocuments({
            chat: chat._id,
            mentions: userId,
            isDeleted: { $ne: true },
            readBy: { $not: { $elemMatch: { $eq: userId } } },
            sender: { $ne: userId },
          });
        } catch (e) {
          mentionCount = 0;
        }

        const otherUser =
          (Array.isArray(chat.participants) &&
            chat.participants.find((p) => String(p._id) !== String(userId))) ||
          (Array.isArray(chat.participants) ? chat.participants[0] : null);

        if (typeof chat.unreadCount === "number") {
          unread = chat.unreadCount;
        } else if (chat.unreadCount && typeof chat.unreadCount === "object") {
          unread = chat.unreadCount[String(userId)] || chat.unreadCount[userId] || 0;
        }

        let previewTimestamp = chat.updatedAt || chat.timestamp;
        if (chat.lastMessage) {
          const lm = chat.lastMessage;
          previewTimestamp = (lm.isScheduled && lm.scheduledSent && lm.scheduledFor) ? lm.scheduledFor : (lm.createdAt || lm.updatedAt || previewTimestamp);
        }

        let lastMessageText = "";
        if (chat.lastMessage) {
          const msg = chat.lastMessage;
          if (msg.type === 'system') {
            lastMessageText = "";
          } else {
            const text = (msg.content || msg.text || "").toString().trim();
            const hasAttachments = Array.isArray(msg.attachments) && msg.attachments.length > 0;
            if (text && text.length > 0) {
              const preview = text.split(/\s+/).slice(0, 8).join(" ");
              lastMessageText = hasAttachments ? `${preview} 📎` : preview;
            } else if (hasAttachments) {
              const att = msg.attachments[0];
              let filename = att.fileName || att.file_name || att.filename || "";
              if (!filename && att.fileUrl) {
                try {
                  filename = path.basename(new URL(att.fileUrl).pathname);
                } catch (e) {
                  filename = path.basename(att.fileUrl || "");
                }
              }
              filename = filename.replace(/^[\d\-:.]+_/, "");
              lastMessageText = filename || "Attachment";
            }
          }
        }

        const chatData = {
          chatId: chat._id,
          lastMessage: lastMessageText || "Say hi!",
          timestamp: previewTimestamp,
          unreadCount: unread,
          mentionCount: mentionCount || 0,
          isGroupChat: !!chat.isGroupChat,
          chatName: chat.chatName,
          name: chat.chatName || chat.name || (chat.groupSettings && chat.groupSettings.name) || (chat.isGroupChat ? "Group" : (otherUser?.name || otherUser?.email || "")),
        };

        if (chat.isGroupChat) {
          chatData.users = chat.users || chat.participants || [];
          chatData.admins = chat.admins || [];
          chatData.groupAdmin = chat.groupAdmin || null;
          chatData.groupSettings = chat.groupSettings || {};
        } else {
          chatData.participants = chat.participants;
          chatData.otherUser = {
            id: otherUser?._id ? String(otherUser._id) : null,
            username: otherUser?.name || otherUser?.email || null,
            email: otherUser?.email || null,
            avatar: otherUser?.avatar || null,
            isOnline: !!otherUser?.isOnline,
          };
        }

        formattedChats.push(chatData);
      } catch (err) {
        // skip problematic chat
        continue;
      }
    }
    res.status(200).json(formattedChats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch recent chats for forward" });
  }
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Update fields
  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;

  // ✅ Handle avatar upload
  if (req.body.avatar) {
    if (req.body.avatar.startsWith("data:image/")) {
      // It's a base64 image → upload to Supabase
      user.avatar = await uploadBase64ImageToSupabase(
        req.body.avatar,
        "avatars",
        "users"
      );
    } else {
      // Already a Supabase public URL → just store it
      user.avatar = req.body.avatar;
    }
  }

  // Update password if provided
  if (req.body.password) {
    if (req.body.password.length < 6) {
      res.status(400);
      throw new Error("Password must be at least 6 characters long");
    }
    user.password = req.body.password;
  }

  const updatedUser = await user.save();

  res.status(200).json({
    _id: updatedUser._id,
    name: updatedUser.name,
    phoneNumber: updatedUser.phoneNumber,
    email: updatedUser.email,
    avatar: updatedUser.avatar, // ✅ Supabase URL
    bio: updatedUser.bio,
    isAdmin: updatedUser.isAdmin,
    token: generateToken(updatedUser._id),
  });
});


export const createGroupChat = asyncHandler(async (req, res) => {
  const { name, users, description, isPublic, avatarBase64, inviteEnabled, inviteLink, permissions, features, groupType } = req.body;

  if (!name || !users) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }

  // ✅ HANDLE BOTH ARRAY & STRING (IMPORTANT FIX)
  let parsedUsers;

  if (Array.isArray(users)) {
    parsedUsers = users;
  } else {
    try {
      parsedUsers = JSON.parse(users);
    } catch {
      return res.status(400).json({ message: "Invalid users format" });
    }
  }

  if (!Array.isArray(parsedUsers) || parsedUsers.length < 2) {
    return res.status(400).json({
      message: "More than 2 users are required to form a group chat",
    });
  }

  // ✅ Upload avatar to Supabase
  let avatar = "";
  if (avatarBase64) {
    avatar = await uploadBase64ImageToSupabase(
      avatarBase64,
      "avatars",
      "groups"
    );
  }

  // ✅ Ensure creator included once
  const creatorId = req.user._id.toString();
  if (!parsedUsers.includes(creatorId)) {
    parsedUsers.push(creatorId);
  }

  let groupChat;
  try {
    groupChat = await Chat.create({
      chatName: name,
      users: parsedUsers,
      participants: parsedUsers,
      isGroupChat: true,
      groupAdmin: req.user._id,
      admins: [req.user._id],
      groupSettings: {
        description: description || "",
        avatar, // ✅ SUPABASE PUBLIC URL
        isPublic: Boolean(isPublic),
      },
    });
  } catch (createErr) {
    console.error('[createGroupChat] Failed to create Chat record:', createErr && (createErr.message || createErr));
    return res.status(500).json({ message: 'Failed to create chat record' });
  }

  const fullGroupChat = await Chat.findById(groupChat._id)
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate("admins", "name email avatar");
  // Ensure a Group document exists and is linked to this Chat
  // Create or fetch linked Group document and ensure it's persisted with provided settings
  const inviteEnabledBool = inviteEnabled === true || inviteEnabled === 'true' || inviteEnabled === '1' || inviteEnabled === 1;
  let group = await Group.findOne({ chat: fullGroupChat._id });
  let finalInviteLink = '';
  if (inviteEnabledBool) {
    finalInviteLink = inviteLink || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/group-${crypto.randomBytes(8).toString('hex')}`;
  }

  if (!group) {
    const groupData = {
      name: name.trim(),
      description: description || "",
      avatar: avatar || "",
      icon: avatar || "",
      participants: parsedUsers,
      admin: req.user._id,
      admins: [req.user._id],
      chat: fullGroupChat._id,
      inviteLink: finalInviteLink,
      inviteEnabled: inviteEnabledBool === true,
      permissions: {
        allowCreatorAdmin: permissions && permissions.allowCreatorAdmin !== false,
        allowOthersAdmin: permissions && permissions.allowOthersAdmin === true,
        allowMembersAdd: permissions && permissions.allowMembersAdd !== false,
      },
      features: {
        media: features && features.media !== false,
        gallery: features && features.gallery !== false,
        docs: features && features.docs !== false,
        polls: features && features.polls !== false,
      },
      groupType: groupType || 'Casual',
    };

    try {
      group = await Group.create(groupData);
      console.log('[createGroupChat] Group created:', { groupId: group._id ? String(group._id) : null });
    } catch (err) {
      console.error('[createGroupChat] Failed to create Group document:', err && (err.message || err));
      return res.status(500).json({ message: 'Failed to create group record' });
    }

    try {
      const setObj = {
        'groupSettings.allowInvites': inviteEnabledBool === true,
        'groupSettings.avatar': avatar || null,
        'groupSettings.description': description || '',
        'groupSettings.isPublic': Boolean(isPublic),
        'groupSettings.maxMembers': 100,
      };
      const unsetObj = {};
      if (finalInviteLink) setObj['groupSettings.inviteLink'] = finalInviteLink;
      else unsetObj['groupSettings.inviteLink'] = "";

      const updateObj = {};
      if (Object.keys(setObj).length) updateObj.$set = setObj;
      if (Object.keys(unsetObj).length) updateObj.$unset = unsetObj;
      if (Object.keys(updateObj).length) {
        await Chat.findByIdAndUpdate(fullGroupChat._id, updateObj);
      }
    } catch (e) {
      console.warn('[createGroupChat] failed to sync Chat.groupSettings:', e && e.message);
    }
  }

  // Attach group to response for frontend convenience
  fullGroupChat._doc = fullGroupChat._doc || {};
  fullGroupChat._doc.group = group;
// Emit socket event to participants so other connected users update immediately
  try {
    const io = getSocketIOInstance();
    const participants = Array.isArray(fullGroupChat.participants) && fullGroupChat.participants.length ? fullGroupChat.participants : fullGroupChat.users || [];
    const payload = {
      _id: fullGroupChat._id,
      chatId: fullGroupChat._id,
      id: fullGroupChat._id,
      chatName: fullGroupChat.chatName,
      name: fullGroupChat.chatName,
      isGroupChat: true,
      users: fullGroupChat.users,
      participants,
      admins: fullGroupChat.admins || [],
      groupAdmin: fullGroupChat.groupAdmin || null,
      groupSettings: fullGroupChat.groupSettings || {},
    };

    console.log("[chat.controller] Emitting group created:", { ioAvailable: !!io, chatId: String(fullGroupChat._id), participantCount: (participants || []).length });

    if (io) {
      // Emit to chat room
      try { io.to(String(fullGroupChat._id)).emit("group created", payload); } catch (e) { console.error('emit to chat room failed', e); }

      // Also emit to each participant's personal room so sidebar updates
      (participants || []).forEach((u) => {
        const uid = u && (u._id ? u._id.toString() : (typeof u === 'string' ? u : (u.toString && u.toString())));
        if (uid) {
          try { io.to(String(uid)).emit("group created", payload); } catch (e) { console.error('emit to user room failed', uid, e); }
        }
      });
    }
  } catch (e) {
    console.error("Failed to emit group created socket event:", e);
  }
  const fullObj = (fullGroupChat && fullGroupChat.toObject && typeof fullGroupChat.toObject === 'function') ? fullGroupChat.toObject() : { ...fullGroupChat };
  fullObj.name = fullObj.chatName || fullObj.name || (fullObj.groupSettings && fullObj.groupSettings.name) || "";
  console.log('[createGroupChat] responding with chat:', { chatId: String(fullGroupChat._id), hasGroup: !!group, groupId: group && group._id ? String(group._id) : null });
  // Return explicit shape so frontend doesn't rely on driver-internal _doc hacks
  return res.status(201).json({ chat: fullObj, group: group || null });
});

export const getRecentChats = async (req, res) => {
  try {
    const userId = req.user._id; 

    const user = await User.findById(userId).select("archivedChats");
    const archivedChatIds = user.archivedChats.map(archived => archived.chat.toString());

    const chats = await Chat.find({ 
      $or: [ { participants: userId }, { users: userId } ],
      _id: { $nin: archivedChatIds },
      // Exclude chats the current user has soft-deleted
      deletedBy: { $not: { $elemMatch: { $eq: userId } } }
    })
      .sort({ updatedAt: -1 })
      .populate('participants', '_id name email avatar')
      .populate('users', '_id name email avatar')
      .populate('admins', '_id name email avatar')
      .populate('groupAdmin', '_id name email avatar')
      .populate({ path: 'lastMessage', populate: { path: 'attachments' } })
      .populate({ path: 'lastMessage.sender', select: '_id email name' })
      .lean();

    const formattedChats = [];
    // Compute unread counts for each chat (exclude system messages)
    for (const chat of chats) {
      let unread = 0;
      try {
        unread = await Message.countDocuments({
          chat: chat._id,
          isDeleted: { $ne: true },
          type: { $ne: 'system' },
          readBy: { $not: { $elemMatch: { $eq: userId } } },
          // Exclude messages authored by the requesting user
          sender: { $ne: userId },
        });
      } catch (e) {
        unread = 0;
      }

      // Count mention notifications for this user (messages that mention this user and are unread for them)
      let mentionCount = 0;
      try {
        mentionCount = await Message.countDocuments({
          chat: chat._id,
          mentions: userId,
          isDeleted: { $ne: true },
          readBy: { $not: { $elemMatch: { $eq: userId } } },
          // Exclude messages authored by the requesting user
          sender: { $ne: userId },
        });
      } catch (e) {
        mentionCount = 0;
      }

      // preserve existing mapping logic but inject unread
       const otherUser =
        (Array.isArray(chat.participants) &&
          chat.participants.find((p) => String(p._id) !== String(userId))) ||
        (Array.isArray(chat.participants) ? chat.participants[0] : null);

      if (typeof chat.unreadCount === "number") {
        unread = chat.unreadCount;
      } else if (chat.unreadCount && typeof chat.unreadCount === "object") {
        unread = chat.unreadCount[String(userId)] || chat.unreadCount[userId] || 0;
      }
      // Determine a timestamp for this chat preview. Prefer lastMessage's scheduledFor
      // when the last message was a scheduled message that has been sent.
      let previewTimestamp = chat.updatedAt || chat.timestamp;
      if (chat.lastMessage) {
        const lm = chat.lastMessage;
        previewTimestamp = (lm.isScheduled && lm.scheduledSent && lm.scheduledFor) ? lm.scheduledFor : (lm.createdAt || lm.updatedAt || previewTimestamp);
      }

      // For group chats, return all members; for 1-on-1, return the other user
      let lastMessageText = "";
      if (chat.lastMessage) {
        const msg = chat.lastMessage;
        // Skip system messages for chat preview
        if (msg.type === 'system') {
          lastMessageText = "";
        } else {
          const text = (msg.content || msg.text || "").toString().trim();
          const hasAttachments = Array.isArray(msg.attachments) && msg.attachments.length > 0;
          if (text && text.length > 0) {
            const preview = text.split(/\s+/).slice(0, 8).join(" ");
            lastMessageText = hasAttachments ? `${preview} 📎` : preview;
          } else if (hasAttachments) {
            const att = msg.attachments[0];
            let filename = att.fileName || att.file_name || att.filename || "";
            if (!filename && att.fileUrl) {
              try {
                filename = path.basename(new URL(att.fileUrl).pathname);
              } catch (e) {
                filename = path.basename(att.fileUrl || "");
              }
            }
            filename = filename.replace(/^[\d\-:.]+_/, "");
            lastMessageText = filename || "Attachment";
          }
        }
      }

      // For group chats, return all members; for 1-on-1, return the other user
      const chatData = {
        chatId: chat._id,
        lastMessage: lastMessageText || "Say hi!",
        timestamp: previewTimestamp,
        // unread is computed per-message (messages authored by the requesting user were excluded above)
        unreadCount: unread,
        mentionCount: mentionCount || 0,
        isGroupChat: !!chat.isGroupChat,
        chatName: chat.chatName,
        name: chat.chatName || chat.name || (chat.groupSettings && chat.groupSettings.name) || (chat.isGroupChat ? "Group" : (otherUser?.name || otherUser?.email || "")),
      };

      if (chat.isGroupChat) {
        // Group chat: include all members, admins, and group admin
        chatData.users = chat.users || chat.participants || [];
        chatData.admins = chat.admins || [];
        chatData.groupAdmin = chat.groupAdmin || null;
        chatData.groupSettings = chat.groupSettings || {};
      } else {
        // 1-on-1 chat: include participants and otherUser for backward compatibility
        chatData.participants = chat.participants;
        chatData.otherUser = {
          id: otherUser?._id ? String(otherUser._id) : null,
          username: otherUser?.name || otherUser?.email || null,
          email: otherUser?.email || null,
          avatar: otherUser?.avatar || null,
          isOnline: !!otherUser?.isOnline,
        };
      }

      formattedChats.push(chatData);
    }
    res.status(200).json(formattedChats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch recent chats" });
  }
};

// Fetch chats that the current user has previously deleted (soft-deleted)
export const fetchPreviousChats = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    // Find chats where the user is a participant and has soft-deleted the chat
    const chats = await Chat.find({ 
      $or: [ { participants: userId }, { users: userId } ],
      deletedBy: { $elemMatch: { $eq: userId } }
    })
      .sort({ updatedAt: -1 })
      .populate('participants', '_id name email avatar')
      .populate('users', '_id name email avatar')
      .populate('admins', '_id name email avatar')
      .populate('groupAdmin', '_id name email avatar')
      .populate({ path: 'lastMessage', populate: { path: 'attachments' } })
      .populate({ path: 'lastMessage.sender', select: '_id email name' })
      .lean();

    const formattedChats = (chats || []).map((chat) => {
      const otherUser =
        (Array.isArray(chat.participants) &&
          chat.participants.find((p) => String(p._id) !== String(userId))) ||
        (Array.isArray(chat.participants) ? chat.participants[0] : null);

      let unread = 0;
      if (typeof chat.unreadCount === "number") {
        unread = chat.unreadCount;
      } else if (chat.unreadCount && typeof chat.unreadCount === "object") {
        unread = chat.unreadCount[String(userId)] || chat.unreadCount[userId] || 0;
      }
      // previous chats: keep unread as provided (do not force-clear based on lastMessage sender)

      let previewTimestamp = chat.updatedAt || chat.timestamp;
      if (chat.lastMessage) {
        const lm = chat.lastMessage;
        previewTimestamp = (lm.isScheduled && lm.scheduledSent && lm.scheduledFor) ? lm.scheduledFor : (lm.createdAt || lm.updatedAt || previewTimestamp);
      }

      let lastMessageText = "";
      if (chat.lastMessage) {
        const msg = chat.lastMessage;
        if (msg.type === 'system') {
          lastMessageText = "";
        } else {
          const text = (msg.content || msg.text || "").toString().trim();
          const hasAttachments = Array.isArray(msg.attachments) && msg.attachments.length > 0;
          if (text && text.length > 0) {
            const preview = text.split(/\s+/).slice(0, 8).join(" ");
            lastMessageText = hasAttachments ? `${preview} 📎` : preview;
          } else if (hasAttachments) {
            const att = msg.attachments[0];
            let filename = att.fileName || att.file_name || att.filename || "";
            if (!filename && att.fileUrl) {
              try {
                filename = path.basename(new URL(att.fileUrl).pathname);
              } catch (e) {
                filename = path.basename(att.fileUrl || "");
              }
            }
            filename = filename.replace(/^[\d\-:.]+_/, "");
            lastMessageText = filename || "Attachment";
          }
        }
      }

      const chatData = {
        chatId: chat._id,
        lastMessage: lastMessageText || "Say hi!",
        timestamp: previewTimestamp,
        unreadCount: unread,
        isGroupChat: !!chat.isGroupChat,
        chatName: chat.chatName,
        name: chat.chatName || chat.name || (chat.groupSettings && chat.groupSettings.name) || (chat.isGroupChat ? "Group" : (otherUser?.name || otherUser?.email || "")),
      };

      if (chat.isGroupChat) {
        chatData.users = chat.users || chat.participants || [];
        chatData.admins = chat.admins || [];
        chatData.groupAdmin = chat.groupAdmin || null;
        chatData.groupSettings = chat.groupSettings || {};
      } else {
        chatData.participants = chat.participants;
        chatData.otherUser = {
          id: otherUser?._id ? String(otherUser._id) : null,
          username: otherUser?.name || otherUser?.email || null,
          email: otherUser?.email || null,
          avatar: otherUser?.avatar || null,
          isOnline: !!otherUser?.isOnline,
        };
      }

      return chatData;
    });

    res.status(200).json(formattedChats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch previous chats" });
  }
});

export const deleteChat = asyncHandler(async (req, res) => {
  console.log("Delete chat request received");
  const { chatId } = req.params;
  const userId = req.user._id;

  const chat = await Chat.findById(chatId);
  console.log("Chat found:", chat);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  // Normalize isGroupChat checks to handle boolean, string or numeric values
  // Treat as group chat only when flagged AND has more than 2 users.
  const rawIsGroup = (chat.isGroupChat === true || chat.isGroupChat === 'true' || chat.isGroupChat === 1 || chat.isGroupChat === '1');
  const participantCount = (Array.isArray(chat.users) && chat.users.length) || (Array.isArray(chat.participants) && chat.participants.length) || 0;
  const isGroupChatFlag = rawIsGroup && participantCount > 2;

  console.log(`[deleteChat] chatId=${chatId} rawIsGroup=${rawIsGroup} participantCount=${participantCount} isGroupChatFlag=${isGroupChatFlag}`);

  // Perform soft-delete for all chats (group or 1-on-1): mark messages/screenshots deletedFor this user
  // and add this user to chat.deletedBy so the chat is hidden for them only.
  try {
    if (!chat.users.includes(userId)) {
      res.status(403);
      throw new Error("Not authorized to delete this chat");
    }

    const keepMedia = String(req.query.keepMedia || '').toLowerCase() === 'true';

    // Mark messages as deletedFor this user (soft-delete)
    try {
      await Message.updateMany(
        { chat: chatId },
        { $addToSet: { deletedFor: userId } }
      );
    } catch (mErr) {
      console.warn('[deleteChat] Failed to mark messages deletedFor user:', mErr && mErr.message);
    }

    // If the user requested to keep media, add them to `keepFor` on messages that have attachments
    if (keepMedia) {
      try {
        await Message.updateMany(
          { chat: chatId, attachments: { $exists: true, $ne: [] } },
          { $addToSet: { keepFor: userId } }
        );
      } catch (kErr) {
        console.warn('[deleteChat] Failed to add user to keepFor for messages with attachments:', kErr && kErr.message);
      }
    }

    // Mark screenshots as deletedFor this user
    try {
      await Screenshot.updateMany(
        { chat: chatId },
        { $addToSet: { deletedFor: userId } }
      );
    } catch (sErr) {
      console.warn('[deleteChat] Failed to mark screenshots deletedFor user:', sErr && sErr.message);
    }

    // If keepMedia is requested, also add user to keepFor on screenshots
    if (keepMedia) {
      try {
        await Screenshot.updateMany(
          { chat: chatId },
          { $addToSet: { keepFor: userId } }
        );
      } catch (kSErr) {
        console.warn('[deleteChat] Failed to add user to keepFor for screenshots:', kSErr && kSErr.message);
      }
    }

    await Chat.findByIdAndUpdate(
      chatId,
      { $addToSet: { deletedBy: userId }, $set: { deletedAt: new Date() } },
      { new: true }
    );

    console.log("Chat soft-deleted for user:", String(userId));

    // Notify only the requesting user so their UI can remove the chat locally
    try {
      const io = getSocketIOInstance();
      if (io) {
        try { io.to(String(userId)).emit('chat deleted', { chatId: String(chatId) }); } catch (e) { console.error('emit chat deleted to requester failed', e); }
      }
    } catch (e) {
      console.error('Failed to emit chat deleted event:', e);
    }

    res.status(200).json({
      message: "Chat deleted for you",
      chatId: chatId
    });
  } catch (err) {
    console.error('Failed to soft-delete chat:', err);
    res.status(500);
    throw new Error('Failed to delete chat');
  }
});

export const leaveGroup = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  const chat = await Chat.findById(chatId);
  
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  if (!chat.isGroupChat) {
    res.status(400);
    throw new Error("This is not a group chat");
  }

  if (!chat.users.includes(userId)) {
    res.status(403);
    throw new Error("You are not a member of this group");
  }

  // Check if user is the only admin
  if (chat.admins.includes(userId) && chat.admins.length === 1) {
    res.status(400);
    throw new Error("You are the only admin. Assign another admin before leaving.");
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId, participants: userId, admins: userId },
    },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate("admins", "name email avatar");

  if (updatedChat.users.length === 0) {
    await Message.deleteMany({ chat: chatId });
    await Chat.findByIdAndDelete(chatId);
    
    res.status(200).json({
      message: "You have left the group and the group has been deleted as it has no members",
      chatId: chatId
    });
  } else {
    res.status(200).json({
      message: "You have left the group successfully",
      chat: updatedChat
    });
  }
});

export const joinGroupByInvite = asyncHandler(async (req, res) => {
  const { inviteLink } = req.body;

  const chat = await Chat.findOne({ "groupSettings.inviteLink": inviteLink });
  
  if (!chat) {
    res.status(404);
    throw new Error("Invalid invite link");
  }

  if (!chat.groupSettings.allowInvites) {
    res.status(403);
    throw new Error("This group is not accepting new members");
  }

  if (chat.users.includes(req.user._id)) {
    res.status(400);
    throw new Error("You are already a member of this group");
  }

  // Check group size limit
  if (chat.users.length >= chat.groupSettings.maxMembers) {
    res.status(400);
    throw new Error("Group has reached maximum member limit");
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chat._id,
    {
      $addToSet: { users: req.user._id, participants: req.user._id },
    },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate("admins", "name email avatar");

  res.json({
    message: "Successfully joined the group",
    chat: updatedChat
  });
});

export const getGroupChatById = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  if (!chatId) {
    return res.status(400).json({ message: "Chat ID is required" });
  }

  try {
   // Backend: controllers/chatController.js
const groupChat = await Chat.findById(chatId)
  .populate("participants", "_id name email avatar") // ✅ populate members
  .populate("admins", "_id name email avatar")      // populate admins
  .populate("groupAdmin", "_id name email avatar"); // populate creator


    if (!groupChat || !groupChat.isGroupChat) {
      return res.status(404).json({ message: "Group not found" });
    }

    const groupObj = (groupChat && groupChat.toObject && typeof groupChat.toObject === 'function') ? groupChat.toObject() : { ...groupChat };
    groupObj.name = groupObj.chatName || groupObj.name || (groupObj.groupSettings && groupObj.groupSettings.name) || "";

    // Format createdAt based on provided locale (frontend may pass navigator.language)
    try {
      const locale = req.query.locale || (req.headers['accept-language'] ? req.headers['accept-language'].split(',')[0] : 'en-US');
      if (groupObj.createdAt) {
        const d = new Date(groupObj.createdAt);
        groupObj.createdAtIso = d.toISOString();
        groupObj.createdAtFormatted = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
      }
    } catch (e) {
      // If formatting fails, still return ISO timestamp
      if (groupObj.createdAt) {
        groupObj.createdAtIso = new Date(groupObj.createdAt).toISOString();
      }
    }

    // Try to fetch linked Group document to obtain invite/permissions/features
    try {
      const linkedGroup = await Group.findOne({ chat: groupChat._id })
        .populate('participants', '_id name avatar email username')
        .populate('admin', '_id name avatar email username')
        .populate('admins', '_id name avatar email username');

      if (linkedGroup) {
        //console.log('[getGroupChatById] linked Group found for chat', String(chatId), String(linkedGroup._id));
        groupObj.group = linkedGroup;
        // copy important settings to top-level for backward-compatibility
        groupObj.inviteEnabled = Boolean(linkedGroup.inviteEnabled);
        groupObj.inviteLink = linkedGroup.inviteLink || '';
        groupObj.permissions = linkedGroup.permissions || {};
        groupObj.features = linkedGroup.features || {};
        groupObj.groupId = linkedGroup._id;
      } else {
        console.log('[getGroupChatById] no linked Group document for chat', String(chatId));
      }
    } catch (e) {
      console.warn('[getGroupChatById] failed to load linked Group:', e && e.message);
    }

    res.status(200).json(groupObj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch group chat" });
  }
});

// Return participants for a chat (convenience endpoint for frontend mentions)
export const getChatParticipants = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  if (!chatId) return res.status(400).json({ message: 'chatId is required' });
  try {
    const chat = await Chat.findById(chatId)
      .select('participants users')
      .populate('participants', '_id name email avatar username')
      .populate('users', '_id name email avatar username')
      .lean();

    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    // Prefer populated participants, fallback to users
    const participants = (chat.participants && chat.participants.length) ? chat.participants : (chat.users || []);
    return res.status(200).json({ members: participants });
  } catch (err) {
    console.error('getChatParticipants error:', err);
    return res.status(500).json({ message: 'Failed to fetch participants' });
  }
});
