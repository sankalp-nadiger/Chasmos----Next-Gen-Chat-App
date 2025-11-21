import express from "express";
import {
  archiveChat,
  unarchiveChat,
  getArchivedChats,
  archiveGroupChat,
  unarchiveGroupChat,
  checkChatArchiveStatus
} from "../controllers/archive.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Personal archive routes
router.route("/chat/:chatId")
  .post(protect, archiveChat)
  .delete(protect, unarchiveChat);

router.route("/chats")
  .get(protect, getArchivedChats);

// Group chat archive routes (admin only)
router.route("/group/:chatId")
  .post(protect, archiveGroupChat)
  .delete(protect, unarchiveGroupChat);

// Check archive status
router.route("/status/:chatId")
  .get(protect, checkChatArchiveStatus);

export default router;