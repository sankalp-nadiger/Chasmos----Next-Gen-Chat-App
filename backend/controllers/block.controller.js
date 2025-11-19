import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";

// Block a user
export const blockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  if (userId === currentUserId.toString()) {
    res.status(400);
    throw new Error("You cannot block yourself");
  }

  const userToBlock = await User.findById(userId);
  if (!userToBlock) {
    res.status(404);
    throw new Error("User not found");
  }

  // Add to blocked users
  await User.findByIdAndUpdate(currentUserId, {
    $addToSet: { blockedUsers: userId }
  });

  // Archive any existing one-on-one chats
  const existingChat = await Chat.findOne({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: currentUserId } } },
      { users: { $elemMatch: { $eq: userId } } }
    ]
  });

  if (existingChat) {
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: {
        archivedChats: {
          chat: existingChat._id,
          archivedAt: new Date()
        }
      }
    });
  }

  res.status(200).json({
    message: `You have blocked ${userToBlock.name}`,
    blockedUserId: userId
  });
});

// Unblock a user
export const unblockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  await User.findByIdAndUpdate(currentUserId, {
    $pull: { blockedUsers: userId }
  });

  const unblockedUser = await User.findById(userId).select("name email");

  res.status(200).json({
    message: `You have unblocked ${unblockedUser.name}`,
    unblockedUserId: userId
  });
});

// Get blocked users list
export const getBlockedUsers = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId)
    .populate("blockedUsers", "name email avatar phoneNumber")
    .select("blockedUsers");

  res.status(200).json(user.blockedUsers || []);
});

// Check if user is blocked
export const checkBlockStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  const currentUser = await User.findById(currentUserId).select("blockedUsers");
  
  const isBlocked = currentUser.blockedUsers.some(
    blockedId => blockedId.toString() === userId
  );

  // Also check if the other user has blocked current user
  const otherUser = await User.findById(userId).select("blockedUsers");
  const hasBlockedYou = otherUser.blockedUsers.some(
    blockedId => blockedId.toString() === currentUserId.toString()
  );

  res.status(200).json({
    isBlocked: isBlocked,
    hasBlockedYou: hasBlockedYou,
    blockStatus: isBlocked ? "you_blocked_them" : 
                hasBlockedYou ? "they_blocked_you" : "no_block"
  });
});