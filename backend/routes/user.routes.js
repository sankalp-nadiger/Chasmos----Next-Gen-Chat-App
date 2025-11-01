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
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/", registerUser);
router.post("/login", authUser);

// Protected routes
router.get("/", protect, allUsers);
router.route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Chat request routes
// Send a chat request to another user (protected)
router.post("/request/send", protect, sendChatRequest);

// Accept a received chat request (protected)
router.put("/request/accept", protect, acceptChatRequest);

// Get received chat requests for current user (protected)
router.get("/requests", protect, getReceivedChatRequests);

// Get accepted chat requests (i.e. users who accepted requests sent by current user)
router.get("/requests/accepted", protect, getAcceptedChatRequestsSentByUser);

export default router;