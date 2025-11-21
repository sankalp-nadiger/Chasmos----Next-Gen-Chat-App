import express from "express";
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
  checkBlockStatus
} from "../controllers/block.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/:userId")
  .post(protect, blockUser)
  .delete(protect, unblockUser)
  .get(protect, checkBlockStatus);

router.route("/")
  .get(protect, getBlockedUsers);

export default router;