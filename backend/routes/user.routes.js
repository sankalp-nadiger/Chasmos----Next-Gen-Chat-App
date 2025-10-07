import express from "express";
import {
  registerUser,
  authUser,
  allUsers,
  getUserProfile,
  updateUserProfile,
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

export default router;