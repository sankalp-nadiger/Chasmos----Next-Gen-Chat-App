import asyncHandler from "express-async-handler";
import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";
import Attachment from "../models/attachment.model.js";
import { deleteFileFromSupabase } from "../utils/supabaseHelper.js";

export const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name avatar email")
      .populate("attachments")
      .populate("starredBy.user", "name avatar")
      .populate("reactions.user", "name avatar")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId, attachments, type = "text", isScheduled = false, scheduledFor, userId } = req.body;
  console.log("➡️ [SEND MESSAGE] Request received", { chatId, userId, content, attachments, type, isScheduled, scheduledFor });
  if (!content && (!attachments || attachments.length === 0)) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  // Validate scheduled message
  if (isScheduled) {
    if (!scheduledFor) {
      res.status(400);
      throw new Error("Scheduled time is required for scheduled messages");
    }
    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
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

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chat._id,
    type: type,
    attachments: attachments || [],
    isScheduled: isScheduled,
    scheduledFor: isScheduled ? new Date(scheduledFor) : null,
    scheduledSent: false,
  };

  try {
    var message = await Message.create(newMessage);
    console.log("[sendMessage] Message created:", message._id);

    message = await message.populate("sender", "name avatar");
    message = await message.populate("attachments");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name avatar email",
    });

    // Only update lastMessage if it's not scheduled or if it's being sent now
    if (!isScheduled) {
      await Chat.findByIdAndUpdate(chat._id, { lastMessage: message });
      console.log("[sendMessage] Updated chat lastMessage:", chat._id);
    }

    // If a new chat was created, return chat info as well
    if (createdNewChat) {
      console.log("[sendMessage] Returning new chat and message");
      return res.json({ message, chat });
    }
    res.json(message);
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
    "starredBy.user": userId
  })
    .populate("sender", "name avatar email")
    .populate("attachments")
    .populate("starredBy.user", "name avatar")
    .sort({ createdAt: -1 });

  res.json(messages);
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
  console.log("➡️ [FORWARD MESSAGE] Request received");
  console.log("📥 Body:", req.body);
  console.log("👤 User:", req.user?._id);

  const { content, chatId, attachments, type = "text", isForwarded = true } = req.body;

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

  console.log("👥 Chat users:", chat.users);

  // Check if user is part of the chat
  const isUserInChat = chat.users.some(
    (user) => user.toString() === req.user._id.toString()
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

  const newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
    type: type,
    attachments: attachments || [],
    isForwarded: isForwarded,
  };

  console.log("📝 Creating message:", newMessage);

  try {
    var message = await Message.create(newMessage);
    console.log("✅ Message created:", message._id);

    message = await message.populate("sender", "name avatar");
    console.log("📌 Populated sender");

    message = await message.populate("attachments");
    console.log("📎 Populated attachments");

    message = await message.populate("chat");
    console.log("💬 Populated chat");

    message = await User.populate(message, {
      path: "chat.users",
      select: "name avatar email",
    });
    console.log("👥 Populated chat users info");

    console.log("🆙 Updating chat lastMessage");
    await Chat.findByIdAndUpdate(chatId, { lastMessage: message });

    console.log("🎉 Forward message complete");
    res.json(message);

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

  res.json(chat.pinnedMessages || []);
});

// Get media attachments (images, videos) from chats
export const getMediaAttachments = asyncHandler(async (req, res) => {
  try {
    console.log('📸 [getMediaAttachments] Request received');
    console.log('Query params:', req.query);
    
    const { chatIds } = req.query;

    if (!chatIds) {
      console.log('❌ No chatIds provided');
      res.status(400);
      throw new Error("Chat IDs are required");
    }

    // Parse comma-separated chat IDs
    const chatIdArray = chatIds.split(',').map(id => id.trim());
    console.log('📋 Parsed chat IDs:', chatIdArray);

    // Verify user has access to these chats
    const chats = await Chat.find({
      _id: { $in: chatIdArray },
      users: req.user._id
    });

    console.log(`✅ Found ${chats.length} chats user has access to`);

    if (chats.length === 0) {
      console.log('⚠️ No accessible chats found, returning empty array');
      return res.json([]);
    }

    const verifiedChatIds = chats.map(chat => chat._id);
    console.log('🔐 Verified chat IDs:', verifiedChatIds);

    // Find all messages with media attachments in these chats
    const messages = await Message.find({
      chat: { $in: verifiedChatIds },
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

    console.log(`📨 Found ${messages.length} messages with attachments`);

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
              senderName: message.sender?.name || message.sender?.email,
              chatId: message.chat,
              messageId: message._id  // Add message ID for navigation
            });
          }
        });
      }
    });

    console.log(`✨ Returning ${mediaItems.length} media items`);
    res.json(mediaItems);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// Get link attachments from chats
export const getLinkAttachments = asyncHandler(async (req, res) => {
  try {
    console.log('🔗 [getLinkAttachments] Request received');
    console.log('Query params:', req.query);
    
    const { chatIds } = req.query;

    if (!chatIds) {
      console.log('❌ No chatIds provided');
      res.status(400);
      throw new Error("Chat IDs are required");
    }

    // Parse comma-separated chat IDs
    const chatIdArray = chatIds.split(',').map(id => id.trim());
    console.log('📋 Parsed chat IDs:', chatIdArray);

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
    console.log('📄 [getDocumentAttachments] Request received');
    console.log('Query params:', req.query);
    
    const { chatIds } = req.query;

    if (!chatIds) {
      console.log('❌ No chatIds provided');
      res.status(400);
      throw new Error("Chat IDs are required");
    }

    // Parse comma-separated chat IDs
    const chatIdArray = chatIds.split(',').map(id => id.trim());
    console.log('📋 Parsed chat IDs:', chatIdArray);

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

  res.json(scheduledMessages);
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