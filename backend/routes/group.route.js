import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createGroup,
  joinGroupByInviteLink,
  regenerateLink,
  addMember,
  removeMember,
  addAdmin,
  exitGroup,
  deleteGroup
} from "../controllers/group.controller.js";
import { getGroupInfo } from "../controllers/group.controller.js";


const router = express.Router();

router.post("/create", protect, createGroup);
router.post("/join-by-invite-link", protect, joinGroupByInviteLink);
router.post("/regenerate-invite-link", protect, regenerateLink);
router.post("/add-member", protect, addMember);
router.post("/remove-member", protect, removeMember);
router.post("/make-admin", protect, addAdmin);
router.post("/exit-group", protect, exitGroup);
router.get("/group/:groupId", protect, getGroupInfo);

router.post("/delete-group", protect, deleteGroup);

export default router;