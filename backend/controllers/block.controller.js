import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";

// Block a user
export const blockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  console.log(`➡️ [BLOCK USER] Request received`);
  console.log(`👤 Current User: ${currentUserId}`);
  console.log(`🚫 User to Block: ${userId}`);

  if (userId === currentUserId.toString()) {
    console.log("❌ Block failed: User attempted to block themselves");
    res.status(400);
    throw new Error("You cannot block yourself");
  }

  console.log(`🔍 Fetching user: ${userId}`);
  const userToBlock = await User.findById(userId);

  if (!userToBlock) {
    console.log(`❌ Block failed: User ${userId} not found`);
    res.status(404);
    throw new Error("User not found");
  }

  console.log(`🛑 Updating block list for user ${currentUserId}`);
  await User.findByIdAndUpdate(currentUserId, {
    $addToSet: { blockedUsers: userId }
  });

  console.log(`✅ User ${userId} successfully blocked by ${currentUserId}`);

  // Find the chat between these users to add system message
  const chat = await Chat.findOne({
    isGroupChat: false,
    users: { $all: [currentUserId, userId] }
  });

  if (chat) {
    // Create system message (but don't update lastMessage)
    await Message.create({
      sender: currentUserId,
      content: 'You blocked this contact',
      type: 'system',
      chat: chat._id,
    });

    console.log(`📝 System message created for block action`);
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

  console.log(`➡️ [UNBLOCK USER] Request received`);
  console.log(`👤 Current User: ${currentUserId}`);
  console.log(`🔓 User to Unblock: ${userId}`);

  console.log(`🔄 Removing user ${userId} from blocked list of ${currentUserId}`);
  await User.findByIdAndUpdate(currentUserId, {
    $pull: { blockedUsers: userId }
  });

  console.log(`🔍 Fetching user ${userId} after unblock`);
  const unblockedUser = await User.findById(userId).select("name email");

  if (!unblockedUser) {
    console.log(`⚠️ Unblock completed but user ${userId} no longer exists`);
  } else {
    console.log(`✅ User ${userId} (${unblockedUser.name}) unblocked successfully`);
  }

  // Find the chat between these users to add system message
  const chat = await Chat.findOne({
    isGroupChat: false,
    users: { $all: [currentUserId, userId] }
  });

  if (chat) {
    // Create system message (but don't update lastMessage)
    await Message.create({
      sender: currentUserId,
      content: 'You unblocked this contact',
      type: 'system',
      chat: chat._id,
    });

    console.log(`📝 System message created for unblock action`);
  }

  res.status(200).json({
    message: `You have unblocked ${unblockedUser?.name || "User"}`,
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

  console.log(`[checkBlockStatus] Checking block status for userId: ${userId}, currentUserId: ${currentUserId}`);

  const currentUser = await User.findById(currentUserId).select("blockedUsers");
  
  if (!currentUser) {
    console.error(`[checkBlockStatus] Current user not found: ${currentUserId}`);
    res.status(404);
    throw new Error("Current user not found");
  }
  
  const isBlocked = currentUser.blockedUsers.some(
    blockedId => blockedId.toString() === userId
  );

  console.log(`[checkBlockStatus] isBlocked: ${isBlocked}`);

  // Also check if the other user has blocked current user
  const otherUser = await User.findById(userId).select("blockedUsers");
  
  if (!otherUser) {
    console.error(`[checkBlockStatus] Other user not found: ${userId}`);
    res.status(404);
    throw new Error("User not found");
  }
  
  const hasBlockedYou = otherUser.blockedUsers.some(
    blockedId => blockedId.toString() === currentUserId.toString()
  );

  console.log(`[checkBlockStatus] hasBlockedYou: ${hasBlockedYou}, blockStatus: ${isBlocked ? "you_blocked_them" : hasBlockedYou ? "they_blocked_you" : "no_block"}`);

  res.status(200).json({
    isBlocked: isBlocked,
    hasBlockedYou: hasBlockedYou,
    blockStatus: isBlocked ? "you_blocked_them" : 
                hasBlockedYou ? "they_blocked_you" : "no_block"
  });
});