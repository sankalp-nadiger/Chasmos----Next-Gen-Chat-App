import express from "express";
import { handleGoogleAuth, completeGoogleSignup } from "../controllers/auth.controller.js";

const router = express.Router();

// Handle Google authentication (both login and initial signup)
router.post("/google", handleGoogleAuth);

// Complete Google signup with additional info
router.post("/google/complete-signup", completeGoogleSignup);

export default router;