import express from "express";
import { allMessages, sendMessage, deleteMessage, deleteMessagesForMe } from "../controllers/message.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/:chatId").get(protect, allMessages);
router.route("/").post(protect, sendMessage);
router.route("/:messageId").delete(protect, deleteMessage);
router.route("/:messageId/delete-for-me").put(protect, deleteMessagesForMe);

export default router;