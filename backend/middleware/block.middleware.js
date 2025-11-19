import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import Chat from "../models/chat.model.js";

// Middleware to check if users can interact (not blocked)
export const checkBlockStatus = asyncHandler(async (req, res, next) => {
  const currentUserId = req.user._id;
  const { userId, recipientEmail } = req.body;
  
  // Check for direct user ID
  if (userId && userId !== currentUserId.toString()) {
    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);
    
    if (currentUser.blockedUsers.includes(userId) || 
        targetUser.blockedUsers.includes(currentUserId)) {
      res.status(403);
      throw new Error("This action cannot be performed due to block restrictions");
    }
  }
  
  // Check for recipient email (for chat requests)
  if (recipientEmail) {
    const recipient = await User.findOne({ email: recipientEmail.toLowerCase().trim() });
    if (recipient) {
      const currentUser = await User.findById(currentUserId);
      if (currentUser.blockedUsers.includes(recipient._id) || 
          recipient.blockedUsers.includes(currentUserId)) {
        res.status(403);
        throw new Error("Cannot send chat request to blocked user");
      }
    }
  }
  
  next();
});

// Middleware for chat interactions
export const checkChatBlockStatus = asyncHandler(async (req, res, next) => {
  const currentUserId = req.user._id;
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId)
    .populate("users", "blockedUsers")
    .populate("participants", "blockedUsers");

  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  const participants = chat.users || chat.participants;
  
  for (let participant of participants) {
    if (participant._id.toString() !== currentUserId.toString() &&
        participant.blockedUsers.includes(currentUserId)) {
      res.status(403);
      throw new Error("You cannot interact in this chat as you have been blocked");
    }
  }

  next();
});