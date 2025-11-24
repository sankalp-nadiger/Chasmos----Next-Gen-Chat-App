import asyncHandler from "express-async-handler";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import Chat from "../models/chat.model.js";

export const allMessages = asyncHandler(async (req, res) => {
  try {
    console.log("Fetching messages for chatId:", req.params.chatId);
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name avatar email")
      .populate({ path: 'attachments' })
      .populate("chat");
    
    await User.populate(messages, {
      path: 'chat.participants',
      select: 'name avatar email',
    });
    
    console.log("Populating messages with chat participants:", messages);
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  const chat = await Chat.findById(chatId)
    .populate("users", "blockedUsers")
    .populate("participants", "blockedUsers");

  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  if (!chat.isGroupChat) {
    const otherUser = chat.users.find(user => 
      user._id.toString() !== req.user._id.toString()
    );
    
    if (otherUser && otherUser.blockedUsers.includes(req.user._id)) {
      res.status(403);
      throw new Error("You cannot send messages to this user as you have been blocked");
    }
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  if (req.body.attachments && Array.isArray(req.body.attachments)) {
    newMessage.attachments = req.body.attachments;
  }
  if (req.body.type) newMessage.type = req.body.type;

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name avatar email");
    message = await message.populate("chat");
    message = await message.populate({ path: 'attachments' });
    message = await User.populate(message, {
      path: "chat.participants",
      select: "name avatar email",
    });

    if (!message.chat.participants || message.chat.participants.length === 0) {
      try {
        const chatWithUsers = await Chat.findById(message.chat._id).populate(
          "users",
          "name avatar email"
        );
        if (chatWithUsers && chatWithUsers.users && chatWithUsers.users.length > 0) {
          message.chat.participants = chatWithUsers.users;
        }
      } catch (e) {
      }
    }

    try {
      await Chat.findByIdAndUpdate(req.body.chatId, { lastMessage: message._id });
    } catch (e) {
    }

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
  const isChatAdmin = chat.admins.includes(userId);

  if (!isSender && !isGroupAdmin && !isChatAdmin) {
    res.status(403);
    throw new Error("Not authorized to delete this message");
  }

  await Message.findByIdAndDelete(messageId);

  res.status(200).json({
    message: "Message deleted successfully",
    messageId: messageId
  });
});

export const deleteMessagesForMe = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await Message.findById(messageId);
  
  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  if (!message.deletedFor) {
    message.deletedFor = [];
  }

  if (!message.deletedFor.includes(userId)) {
    message.deletedFor.push(userId);
    await message.save();
  }

  res.status(200).json({
    message: "Message deleted for you",
    messageId: messageId
  });
});