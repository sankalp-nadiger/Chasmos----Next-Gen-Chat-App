import express from "express";
import { 
  allMessages, 
  sendMessage, 
  deleteMessage, 
  deleteMessagesForMe,
  starMessage,
  unstarMessage,
  getStarredMessages,
  addReaction,
  removeReaction
} from "../controllers/message.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/:chatId").get(protect, allMessages);
router.route("/").post(protect, sendMessage);
router.route("/:messageId").delete(protect, deleteMessage);
router.route("/:messageId/delete-for-me").put(protect, deleteMessagesForMe);

// Starring routes
router.route("/:messageId/star").put(protect, starMessage);
router.route("/:messageId/unstar").put(protect, unstarMessage);
router.route("/starred/:chatId").get(protect, getStarredMessages);

// Reaction routes
router.route("/:messageId/reaction").put(protect, addReaction);
router.route("/:messageId/reaction/remove").put(protect, removeReaction);

export default router;