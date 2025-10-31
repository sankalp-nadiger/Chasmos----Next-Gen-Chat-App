import asyncHandler from "express-async-handler";
import Sprint from "../models/sprint.model.js";
import Task from "../models/task.model.js";
import Chat from "../models/chat.model.js";
import Notification from "../models/notification.model.js";
export const createSprint = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    chatId,
    startDate,
    endDate,
    goals
  } = req.body;

  if (!title || !chatId || !startDate || !endDate) {
    res.status(400);
    throw new Error("Please provide title, chat ID, start date, and end date");
  }

  // Verify chat exists and user is member
  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  if (!chat.participants.includes(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to create sprints in this chat");
  }

  const sprint = await Sprint.create({
    title,
    description,
    chat: chatId,
    startDate,
    endDate,
    goals: goals || [],
    createdBy: req.user._id
  });

  const populatedSprint = await Sprint.findById(sprint._id)
    .populate("createdBy", "name email avatar");

  res.status(201).json(populatedSprint);
});

export const getSprints = asyncHandler(async (req, res) => {
  const { chatId, status } = req.query;
  
  let filter = { chat: chatId };
  if (status) filter.status = status;

  const sprints = await Sprint.find(filter)
    .populate("createdBy", "name email avatar")
    .sort({ createdAt: -1 });

  res.status(200).json(sprints);
});
export const getSprint = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.sprintId)
    .populate("createdBy", "name email avatar");

  if (!sprint) {
    res.status(404);
    throw new Error("Sprint not found");
  }

  // Check if user is member of the chat
  const chat = await Chat.findById(sprint.chat);
  if (!chat.participants.includes(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to access this sprint");
  }

  res.status(200).json(sprint);
});
export const updateSprint = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.sprintId);
  
  if (!sprint) {
    res.status(404);
    throw new Error("Sprint not found");
  }

  // Check if user is admin of the chat
  const chat = await Chat.findById(sprint.chat);
  if (!chat.admins.includes(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to update this sprint");
  }

  const updatedSprint = await Sprint.findByIdAndUpdate(
    req.params.sprintId,
    { $set: req.body },
    { new: true, runValidators: true }
  ).populate("createdBy", "name email avatar");

  res.status(200).json(updatedSprint);
});
export const startSprint = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.sprintId);
  
  if (!sprint) {
    res.status(404);
    throw new Error("Sprint not found");
  }

  // Check if user is admin of the chat
  const chat = await Chat.findById(sprint.chat);
  if (!chat.admins.includes(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to start this sprint");
  }

  sprint.status = 'active';
  await sprint.save();

  const updatedSprint = await Sprint.findById(sprint._id)
    .populate("createdBy", "name email avatar");

  res.status(200).json(updatedSprint);
});
export const completeSprint = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.sprintId);
  
  if (!sprint) {
    res.status(404);
    throw new Error("Sprint not found");
  }

  // Check if user is admin of the chat
  const chat = await Chat.findById(sprint.chat);
  if (!chat.admins.includes(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to complete this sprint");
  }

  sprint.status = 'completed';
  await sprint.save();

  const updatedSprint = await Sprint.findById(sprint._id)
    .populate("createdBy", "name email avatar");

  res.status(200).json(updatedSprint);
});
export const getSprintTasks = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.sprintId);
  
  if (!sprint) {
    res.status(404);
    throw new Error("Sprint not found");
  }

  // Check if user is member of the chat
  const chat = await Chat.findById(sprint.chat);
  if (!chat.participants.includes(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to access this sprint's tasks");
  }

  const tasks = await Task.find({ sprint: req.params.sprintId })
    .populate("assignees", "name email avatar")
    .populate("createdBy", "name email avatar")
    .sort({ createdAt: -1 });

  res.status(200).json(tasks);
});

export const deleteSprint = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.sprintId);
  
  if (!sprint) {
    res.status(404);
    throw new Error("Sprint not found");
  }

  // Check if user is admin of the chat
  const chat = await Chat.findById(sprint.chat);
  if (!chat.admins.includes(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to delete this sprint");
  }

  // Remove sprint reference from tasks
  await Task.updateMany(
    { sprint: req.params.sprintId },
    { $unset: { sprint: "" } }
  );

  await Sprint.findByIdAndDelete(req.params.sprintId);

  res.status(200).json({ message: "Sprint deleted successfully" });
});