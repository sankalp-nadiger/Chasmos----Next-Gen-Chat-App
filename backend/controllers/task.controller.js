import asyncHandler from "express-async-handler";
import Task from "../models/task.model.js";
import Sprint from "../models/sprint.model.js";
import Chat from "../models/chat.model.js";
import Notification from "../models/notification.model.js";
const createTaskNotification = async (type, task, chat, createdBy, additionalRecipients = []) => {
  try {
    const chatData = await Chat.findById(chat).populate('admins');
    const admins = chatData.admins.map(admin => admin._id);
    const recipients = [
      ...admins,
      createdBy,
      ...task.assignees,
      ...additionalRecipients
    ].filter((value, index, self) => 
      self.indexOf(value) === index && value.toString() !== createdBy.toString()
    );

    let message = '';
    switch (type) {
      case 'task_created':
        message = `New task created: ${task.title}`;
        break;
      case 'task_updated':
        message = `Task updated: ${task.title}`;
        break;
      case 'task_assigned':
        message = `You have been assigned to task: ${task.title}`;
        break;
      case 'task_completed':
        message = `Task completed: ${task.title}`;
        break;
      default:
        message = `Task notification: ${task.title}`;
    }

    await Notification.create({
      type,
      task: task._id,
      chat,
      recipients,
      message,
      createdBy
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
export const createTask = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    chatId,
    sprintId,
    priority,
    assignees,
    dueDate,
    tags,
    estimatedHours
  } = req.body;

  if (!title || !description || !chatId) {
    res.status(400);
    throw new Error("Please provide title, description, and chat ID");
  }

  // Verify chat exists and user is member
  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  if (!chat.participants.includes(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to create tasks in this chat");
  }

  // Verify sprint exists if provided
  if (sprintId) {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      res.status(404);
      throw new Error("Sprint not found");
    }
  }

  const task = await Task.create({
    title,
    description,
    chat: chatId,
    sprint: sprintId,
    priority: priority || 'medium',
    assignees: assignees || [],
    createdBy: req.user._id,
    dueDate,
    tags: tags || [],
    estimatedHours
  });

  const populatedTask = await Task.findById(task._id)
    .populate("assignees", "name email avatar")
    .populate("createdBy", "name email avatar")
    .populate("sprint", "title status");

  // Create notification for task creation
  await createTaskNotification('task_created', populatedTask, chatId, req.user._id);

  res.status(201).json(populatedTask);
});

//@description     Get all tasks for a chat
//@route           GET /api/tasks?chatId=:chatId&sprintId=:sprintId&status=:status
//@access          Protected
export const getTasks = asyncHandler(async (req, res) => {
  const { chatId, sprintId, status, assignee } = req.query;
  
  let filter = { chat: chatId };
  
  if (sprintId) filter.sprint = sprintId;
  if (status) filter.status = status;
  if (assignee) filter.assignees = assignee;

  const tasks = await Task.find(filter)
    .populate("assignees", "name email avatar")
    .populate("createdBy", "name email avatar")
    .populate("sprint", "title status")
    .sort({ createdAt: -1 });

  res.status(200).json(tasks);
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId)
    .populate("assignees", "name email avatar")
    .populate("createdBy", "name email avatar")
    .populate("sprint", "title status")
    .populate("attachments");

  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  // Check if user is member of the chat
  const chat = await Chat.findById(task.chat);
  if (!chat.participants.includes(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to access this task");
  }

  res.status(200).json(task);
});
export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  // Check if user is member of the chat
  const chat = await Chat.findById(task.chat);
  if (!chat.participants.includes(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to update this task");
  }

  const updatedTask = await Task.findByIdAndUpdate(
    req.params.taskId,
    { $set: req.body },
    { new: true, runValidators: true }
  )
    .populate("assignees", "name email avatar")
    .populate("createdBy", "name email avatar")
    .populate("sprint", "title status");

  // Create notification for task update
  await createTaskNotification('task_updated', updatedTask, task.chat, req.user._id);

  res.status(200).json(updatedTask);
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  // Check if user is admin of the chat or task creator
  const chat = await Chat.findById(task.chat);
  const isAdmin = chat.admins.includes(req.user._id);
  const isCreator = task.createdBy.toString() === req.user._id.toString();
  
  if (!isAdmin && !isCreator) {
    res.status(403);
    throw new Error("Not authorized to delete this task");
  }

  await Task.findByIdAndDelete(req.params.taskId);

  res.status(200).json({ message: "Task deleted successfully" });
});

export const assignTask = asyncHandler(async (req, res) => {
  const { assignees } = req.body;
  
  const task = await Task.findById(req.params.taskId);
  
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  // Check if user is member of the chat
  const chat = await Chat.findById(task.chat);
  if (!chat.participants.includes(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to assign this task");
  }

  task.assignees = assignees;
  await task.save();

  const updatedTask = await Task.findById(task._id)
    .populate("assignees", "name email avatar")
    .populate("createdBy", "name email avatar")
    .populate("sprint", "title status");

  // Create notification for assignment
  await createTaskNotification('task_assigned', updatedTask, task.chat, req.user._id, assignees);

  res.status(200).json(updatedTask);
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  const task = await Task.findById(req.params.taskId);
  
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  // Check if user is assignee or admin
  const chat = await Chat.findById(task.chat);
  const isAssignee = task.assignees.includes(req.user._id);
  const isAdmin = chat.admins.includes(req.user._id);
  
  if (!isAssignee && !isAdmin) {
    res.status(403);
    throw new Error("Not authorized to update this task's status");
  }

  task.status = status;
  
  // If marking as done, update actual hours if provided
  if (status === 'done' && req.body.actualHours) {
    task.actualHours = req.body.actualHours;
  }
  
  await task.save();

  const updatedTask = await Task.findById(task._id)
    .populate("assignees", "name email avatar")
    .populate("createdBy", "name email avatar")
    .populate("sprint", "title status");

  if (status === 'done') {
    await createTaskNotification('task_completed', updatedTask, task.chat, req.user._id);
  }

  res.status(200).json(updatedTask);
});
export const addComment = asyncHandler(async (req, res) => {
  const { comment } = req.body;
  
  const task = await Task.findById(req.params.taskId);
  
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  // Check if user is member of the chat
  const chat = await Chat.findById(task.chat);
  if (!chat.participants.includes(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to comment on this task");
  }

  task.comments.push({
    user: req.user._id,
    comment
  });

  await task.save();

  const updatedTask = await Task.findById(task._id)
    .populate("assignees", "name email avatar")
    .populate("createdBy", "name email avatar")
    .populate("sprint", "title status")
    .populate("comments.user", "name email avatar");

  res.status(200).json(updatedTask);
});
export const getTaskAnalytics = asyncHandler(async (req, res) => {
  const { chatId } = req.query;

  if (!chatId) {
    res.status(400);
    throw new Error("Chat ID is required");
  }

  // Check if user is member of the chat
  const chat = await Chat.findById(chatId);
  if (!chat || !chat.participants.includes(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to view analytics for this chat");
  }

  const tasks = await Task.find({ chat: chatId });
  
  const analytics = {
    total: tasks.length,
    byStatus: {
      backlog: tasks.filter(t => t.status === 'backlog').length,
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      in_review: tasks.filter(t => t.status === 'in_review').length,
      done: tasks.filter(t => t.status === 'done').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length
    },
    byPriority: {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length,
      urgent: tasks.filter(t => t.priority === 'urgent').length
    },
    completionRate: tasks.length > 0 ? 
      (tasks.filter(t => t.status === 'done').length / tasks.length) * 100 : 0
  };

  res.status(200).json(analytics);
});