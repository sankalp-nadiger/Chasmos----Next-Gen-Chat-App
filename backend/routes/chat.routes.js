import express from "express";
import {
  accessChat,
  fetchChats,
   createGroupChat,
  // renameGroup,
  // removeFromGroup,
  // addToGroup,
  getRecentChats,
  fetchPreviousChats,
  deleteChat,
   getGroupChatById,
    getChatParticipants,
    fetchRecentChatsForForward
  // leaveGroup,
  // updateGroupSettings,
  
  // removeAdmin,
  // joinGroupByInvite
} from "../controllers/chat.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../config/multer.js";
const router = express.Router();

router.route("/").post(protect, accessChat);
router.route("/").get(protect, fetchChats);
router.route("/recent").get(protect, getRecentChats);
router.route("/recent/forward").get(protect, fetchRecentChatsForForward);
router.route("/previous").get(protect, fetchPreviousChats);
router.route("/group").post(protect, createGroupChat);
// router.route("/rename").put(protect, renameGroup);
// router.route("/settings").put(protect, updateGroupSettings);
// router.route("/groupremove").put(protect, removeFromGroup);
// router.route("/groupadd").put(protect, addToGroup);
// router.route("/admin/add").put(protect, addAdmin);
// router.route("/admin/remove").put(protect, removeAdmin);
// router.route("/join").post(protect, joinGroupByInvite);
router.route("/:chatId").delete(protect, deleteChat);
router.route("/group/:chatId").get(protect, getGroupChatById);
router.route("/:chatId/participants").get(protect, getChatParticipants);
// router.route("/:chatId/leave").put(protect, leaveGroup);

export default router;