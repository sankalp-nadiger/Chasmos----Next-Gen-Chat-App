import asyncHandler from "express-async-handler";
import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";

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
  const { content, chatId, attachments, type = "text" } = req.body;

  if (!content && (!attachments || attachments.length === 0)) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
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
    chat: chatId,
    type: type,
    attachments: attachments || [],
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name avatar");
    message = await message.populate("attachments");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name avatar email",
    });

    await Chat.findByIdAndUpdate(chatId, { lastMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await Message.findById(messageId);
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