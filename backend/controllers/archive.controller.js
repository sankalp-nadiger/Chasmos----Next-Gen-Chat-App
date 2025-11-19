import asyncHandler from "express-async-handler";
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

// Archive a chat for current user
export const archiveChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  // Check if chat exists and user is participant
  const chat = await Chat.findOne({
    _id: chatId,
    $or: [
      { users: { $elemMatch: { $eq: userId } } },
      { participants: { $elemMatch: { $eq: userId } } }
    ]
  });

  if (!chat) {
    res.status(404);
    throw new Error("Chat not found or you are not a participant");
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

  const archivedChats = user.archivedChats.map(archived => ({
    ...archived.chat.toObject(),
    archivedAt: archived.archivedAt
  }));

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