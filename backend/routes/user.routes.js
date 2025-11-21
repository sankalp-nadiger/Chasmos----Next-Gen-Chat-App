import express from "express";
import {
  registerUser,
  authUser,
  allUsers,
  getUserProfile,
  updateUserProfile,
  sendChatRequest,
  acceptChatRequest,
  getReceivedChatRequests,
  getAcceptedChatRequestsSentByUser,
  withdrawChatRequest,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { checkBlockStatus } from "../middleware/block.middleware.js"; // NEW

const router = express.Router();

// Public routes
router.post("/", registerUser);
router.post("/login", authUser);

// Protected routes
router.get("/", protect, allUsers);
router.route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.post("/request/send", protect, checkBlockStatus, sendChatRequest); 
router.put("/request/accept", protect, acceptChatRequest);
router.get("/requests", protect, getReceivedChatRequests);
router.get("/requests/accepted", protect, getAcceptedChatRequestsSentByUser);
router.get("/requests/received", protect, getReceivedChatRequests);
router.post("/request/withdraw", protect, withdrawChatRequest);

export default router;