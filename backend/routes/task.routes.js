import express from "express";
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  assignTask,
  updateTaskStatus,
  addComment,
  getTaskAnalytics
} from "../controllers/task.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/")
  .post(protect, createTask)
  .get(protect, getTasks);

router.route("/analytics")
  .get(protect, getTaskAnalytics);

router.route("/:taskId")
  .get(protect, getTask)
  .put(protect, updateTask)
  .delete(protect, deleteTask);

router.route("/:taskId/assign")
  .put(protect, assignTask);

router.route("/:taskId/status")
  .put(protect, updateTaskStatus);

router.route("/:taskId/comments")
  .post(protect, addComment);

export default router;