import asyncHandler from "express-async-handler";
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import ChatKey from "../models/chatKey.model.js";
import KeyManagementService from "../services/keyManagement.service.js";
import EncryptionService from "../services/encryption.service.js";

// Helper to decrypt last message for chat preview (E2E encryption)
const decryptLastMessage = async (lastMessage, chatId, userId) => {
  if (!lastMessage) return null;
  
  const lmObj = (lastMessage.toObject && typeof lastMessage.toObject === 'function') 
    ? lastMessage.toObject() 
    : { ...lastMessage };
  
  // Add timestamp
  const ts = (lmObj.isScheduled && lmObj.scheduledSent && lmObj.scheduledFor) 
    ? lmObj.scheduledFor 
    : (lmObj.createdAt || lmObj.updatedAt || null);
  lmObj.timestamp = ts;
  
  // Decrypt if encrypted
  if (lmObj.isEncrypted && lmObj.encryptedContent && lmObj.encryptionMetadata) {
    try {
      const chatKeyInfo = await KeyManagementService.getChatKeyForUser(chatId, userId);
      
      if (chatKeyInfo && chatKeyInfo.aesKey) {
        const decryptedContent = EncryptionService.decryptAES(
          {
            encrypted: lmObj.encryptedContent,
            iv: lmObj.encryptionMetadata.iv,
            tag: lmObj.encryptionMetadata.tag
          },
          chatKeyInfo.aesKey
        );
        
        lmObj.content = decryptedContent;
        lmObj.wasDecrypted = true;
      } else {
        lmObj.content = '[ENCRYPTED]';
      }
    } catch (decryptError) {
      console.error('[decryptLastMessage] Failed to decrypt:', decryptError);
      lmObj.content = '[ENCRYPTED]';
    }
  }
  
  return lmObj;
};

// Archive a chat for current user
export const archiveChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  // Check if chat exists (don't restrict by participant - allow archiving even if blocked)
  const chat = await Chat.findById(chatId);

  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  // Add to user's archived chats
  await User.findByIdAndUpdate(userId, {
    $addToSet: {
      archivedChats: {
        chat: chatId,
        archivedAt: new Date()
      }
    }
  });

  res.status(200).json({
    message: "Chat archived successfully",
    chatId: chatId
  });
});

// Unarchive a chat for current user
export const unarchiveChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  await User.findByIdAndUpdate(userId, {
    $pull: {
      archivedChats: { chat: chatId }
    }
  });

  res.status(200).json({
    message: "Chat unarchived successfully",
    chatId: chatId
  });
});

// Get archived chats for current user
export const getArchivedChats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId)
    .populate({
      path: "archivedChats.chat",
      populate: [
        { path: "users", select: "name avatar email" },
        { path: "participants", select: "name avatar email" },
        { path: "lastMessage" }
      ]
    });

  const archivedChats = [];
  for (const archived of (user.archivedChats || [])) {
    const chatObj = archived.chat.toObject();
    
    // Decrypt lastMessage if encrypted
    if (chatObj.lastMessage) {
      try {
        chatObj.lastMessage = await decryptLastMessage(chatObj.lastMessage, chatObj._id, userId);
      } catch (e) {
        console.error('[getArchivedChats] Failed to decrypt lastMessage:', e);
      }
    }
    
    archivedChats.push({
      ...chatObj,
      archivedAt: archived.archivedAt
    });
  }

  res.status(200).json(archivedChats);
});

// Archive a chat completely (for group admins)
export const archiveGroupChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  // Check if user is admin for group chats
  if (chat.isGroupChat && !chat.admins.includes(userId)) {
    res.status(403);
    throw new Error("Only admins can archive group chats");
  }

  chat.isArchived = true;
  chat.archivedBy = userId;
  chat.archivedAt = new Date();
  await chat.save();

  res.status(200).json({
    message: "Group chat archived successfully",
    chat: chat
  });
});

// Unarchive a group chat
export const unarchiveGroupChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  // Check if user is admin for group chats
  if (chat.isGroupChat && !chat.admins.includes(userId)) {
    res.status(403);
    throw new Error("Only admins can unarchive group chats");
  }

  chat.isArchived = false;
  chat.archivedBy = undefined;
  chat.archivedAt = undefined;
  await chat.save();

  res.status(200).json({
    message: "Group chat unarchived successfully",
    chat: chat
  });
});

// Check if chat is archived for user
export const checkChatArchiveStatus = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  const user = await User.findById(userId);
  const isArchived = user.archivedChats.some(
    archived => archived.chat.toString() === chatId
  );

  res.status(200).json({
    isArchived,
    chatId
  });
});