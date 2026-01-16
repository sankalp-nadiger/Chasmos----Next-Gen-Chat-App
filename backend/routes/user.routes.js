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
  getAcceptedChatRequests,
  withdrawChatRequest,
  getUserSettings,
  updateUserSettings,
  rejectChatRequest,
  getChatRequestStatus,
  getBusinessUsers,
  getUserChanges,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPasswordFromOtp,
  getUserById,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { checkBlockStatus } from "../middleware/block.middleware.js"; // NEW

const router = express.Router();

// Public routes
router.post("/", registerUser);
router.post("/login", authUser);
// Forgot password (public)
router.post('/forgot-password', sendPasswordResetOtp);
router.post('/verify-reset-otp', verifyPasswordResetOtp);
router.post('/reset-password', resetPasswordFromOtp);

// Protected routes
router.get("/", protect, allUsers);
router.route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.route("/settings")
  .get(protect, getUserSettings)
  .put(protect, updateUserSettings);

// Business users route (must come before /:userId to avoid conflict)
router.get("/business", protect, getBusinessUsers);

// Chat request routes (must come before /:userId to avoid conflict)
router.post("/request/send", protect, checkBlockStatus, sendChatRequest); 
router.put("/request/accept", protect, acceptChatRequest);
router.get("/requests", protect, getReceivedChatRequests);
router.get("/requests/accepted", protect, getAcceptedChatRequests);
router.get("/requests/received", protect, getReceivedChatRequests);
router.post("/request/withdraw", protect, withdrawChatRequest);
router.get(
  "/request/status/:email",
  protect,
  getChatRequestStatus
);
router.post(
  "/request/reject",
  protect,
  rejectChatRequest
);

// returns only additions/removals compared to client keys
router.post("/changes", protect, getUserChanges);

// Get user by ID (for auto message check) - MUST come last to avoid catching other routes
router.get("/:userId", protect, getUserById);

export default router;