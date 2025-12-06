import express from "express";
import { 
  allMessages, 
  sendMessage, 
  deleteMessage, 
  deleteMessagesForMe,
  editMessage,
  starMessage,
  unstarMessage,
  getStarredMessages,
  addReaction,
  removeReaction,
  forwardMessage,
  pinMessage,
  unpinMessage,
  getPinnedMessages,
  getMediaAttachments,
  getLinkAttachments,
  getDocumentAttachments
} from "../controllers/message.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Attachment routes for media viewer (must be before /:chatId and other parameterized routes)
router.route("/media").get(protect, getMediaAttachments);
router.route("/links").get(protect, getLinkAttachments);
router.route("/documents").get(protect, getDocumentAttachments);

// Forward route (must be before /:chatId)
router.route("/forward").post(protect, forwardMessage);

// Pin routes (must be before /:chatId and /:messageId)
router.route("/pin").post(protect, pinMessage);
router.route("/unpin").post(protect, unpinMessage);
router.route("/pinned/:chatId").get(protect, getPinnedMessages);

// Starring routes (must be before /:messageId)
router.route("/starred/:chatId").get(protect, getStarredMessages);

// General routes
router.route("/:chatId").get(protect, allMessages);
router.route("/").post(protect, sendMessage);
router.route("/:messageId").delete(protect, deleteMessage);
router.route("/:messageId/delete-for-me").put(protect, deleteMessagesForMe);
router.route("/:messageId/edit").put(protect, editMessage);

// Message-specific routes
router.route("/:messageId/star").put(protect, starMessage);
router.route("/:messageId/unstar").put(protect, unstarMessage);

// Reaction routes
router.route("/:messageId/reaction").put(protect, addReaction);
router.route("/:messageId/reaction/remove").put(protect, removeReaction);

export default router;