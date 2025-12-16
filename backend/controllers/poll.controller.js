import asyncHandler from "express-async-handler";
import Poll from "../models/poll.model.js";
import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";

// Create a new poll
export const createPoll = asyncHandler(async (req, res) => {
  const { question, description, options, chatId, allowMultipleVotes = false } = req.body;
  const userId = req.user._id;

  if (!question || !options || options.length < 2) {
    res.status(400);
    throw new Error("Poll must have a question and at least 2 options");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  // Check if user is part of the chat
  const isUserInChat = chat.users.some(user => user.toString() === userId.toString());
  if (!isUserInChat) {
    res.status(403);
    throw new Error("Not authorized to create poll in this chat");
  }

  // Only allow polls in group chats
  if (!chat.isGroupChat) {
    res.status(400);
    throw new Error("Polls are only allowed in group chats");
  }

  const pollOptions = options.map(opt => ({
    text: opt.trim(),
    votes: []
  }));

  const poll = await Poll.create({
    question: question.trim(),
    description: description?.trim() || "",
    options: pollOptions,
    chat: chatId,
    createdBy: userId,
    allowMultipleVotes
  });

  await poll.populate("createdBy", "name avatar");

  res.status(201).json({
    message: "Poll created successfully",
    poll
  });
});

// Vote on a poll
export const votePoll = asyncHandler(async (req, res) => {
  const { pollId, optionId } = req.body;
  const userId = req.user._id;

  if (!pollId || !optionId) {
    res.status(400);
    throw new Error("Poll ID and option ID are required");
  }

  const poll = await Poll.findById(pollId).populate("createdBy", "name avatar");
  if (!poll) {
    res.status(404);
    throw new Error("Poll not found");
  }

  if (poll.isClosed) {
    res.status(400);
    throw new Error("This poll is closed");
  }

  // Check if user is part of the chat
  const chat = await Chat.findById(poll.chat);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  const isUserInChat = chat.users.some(user => user.toString() === userId.toString());
  if (!isUserInChat) {
    res.status(403);
    throw new Error("Not authorized to vote in this poll");
  }

  const option = poll.options.find(opt => opt._id.toString() === optionId.toString());
  if (!option) {
    res.status(404);
    throw new Error("Option not found");
  }

  // Check if user already voted
  const hasVoted = option.votes.some(vote => vote.user.toString() === userId.toString());

  if (hasVoted) {
    if (!poll.allowMultipleVotes) {
      // Remove previous vote and add new one
      poll.options.forEach(opt => {
        opt.votes = opt.votes.filter(vote => vote.user.toString() !== userId.toString());
      });
    } else {
      res.status(400);
      throw new Error("You have already voted for this option");
    }
  }

  // If multiple votes not allowed, remove user's previous vote
  if (!poll.allowMultipleVotes) {
    poll.options.forEach(opt => {
      opt.votes = opt.votes.filter(vote => vote.user.toString() !== userId.toString());
    });
  }

  // Add new vote
  option.votes.push({
    user: userId,
    votedAt: new Date()
  });

  await poll.save();
  await poll.populate("options.votes.user", "name avatar");

  res.json({
    message: "Vote recorded successfully",
    poll
  });
});

// Get poll details with vote information
export const getPoll = asyncHandler(async (req, res) => {
  const { pollId } = req.params;
  const userId = req.user._id;

  const poll = await Poll.findById(pollId)
    .populate("createdBy", "name avatar")
    .populate("options.votes.user", "name avatar");

  if (!poll) {
    res.status(404);
    throw new Error("Poll not found");
  }

  // Check if user is part of the chat
  const chat = await Chat.findById(poll.chat);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  const isUserInChat = chat.users.some(user => user.toString() === userId.toString());
  if (!isUserInChat) {
    res.status(403);
    throw new Error("Not authorized to view this poll");
  }

  res.json(poll);
});

// Get all polls in a chat
export const getChatPolls = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  const isUserInChat = chat.users.some(user => user.toString() === userId.toString());
  if (!isUserInChat) {
    res.status(403);
    throw new Error("Not authorized to view polls in this chat");
  }

  const polls = await Poll.find({ chat: chatId })
    .populate("createdBy", "name avatar")
    .populate("options.votes.user", "name avatar")
    .sort({ createdAt: -1 });

  res.json(polls);
});

// Close a poll
export const closePoll = asyncHandler(async (req, res) => {
  const { pollId } = req.params;
  const userId = req.user._id;

  const poll = await Poll.findById(pollId);
  if (!poll) {
    res.status(404);
    throw new Error("Poll not found");
  }

  // Only creator or chat admin can close poll
  const chat = await Chat.findById(poll.chat);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  const isCreator = poll.createdBy.toString() === userId.toString();
  const isAdmin = chat.admins && chat.admins.some(admin => admin.toString() === userId.toString());

  if (!isCreator && !isAdmin) {
    res.status(403);
    throw new Error("Not authorized to close this poll");
  }

  poll.isClosed = true;
  poll.closedAt = new Date();
  await poll.save();

  await poll.populate("createdBy", "name avatar");
  await poll.populate("options.votes.user", "name avatar");

  res.json({
    message: "Poll closed successfully",
    poll
  });
});

// Remove a vote
export const removeVote = asyncHandler(async (req, res) => {
  const { pollId, optionId } = req.body;
  const userId = req.user._id;

  if (!pollId || !optionId) {
    res.status(400);
    throw new Error("Poll ID and option ID are required");
  }

  const poll = await Poll.findById(pollId);
  if (!poll) {
    res.status(404);
    throw new Error("Poll not found");
  }

  const option = poll.options.find(opt => opt._id.toString() === optionId.toString());
  if (!option) {
    res.status(404);
    throw new Error("Option not found");
  }

  // Remove user's vote
  const voteIndex = option.votes.findIndex(vote => vote.user.toString() === userId.toString());
  if (voteIndex === -1) {
    res.status(400);
    throw new Error("You have not voted for this option");
  }

  option.votes.splice(voteIndex, 1);
  await poll.save();

  await poll.populate("options.votes.user", "name avatar");

  res.json({
    message: "Vote removed successfully",
    poll
  });
});
