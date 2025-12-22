import express from "express";
import { handleGoogleAuth, completeGoogleSignup } from "../controllers/auth.controller.js";
// Accept callback forwarded here as a safe fallback in case the OAuth redirect
// URI is configured to /api/auth/google/callback (some deployments use this).
import { googleCallback } from "../controllers/contact.controller.js";

const router = express.Router();

// Handle Google authentication (both login and initial signup)
router.post("/google", handleGoogleAuth);

// Complete Google signup with additional info (frontend posts to `complete-signup`)
router.post("/google/complete", completeGoogleSignup);
router.post("/google/complete-signup", completeGoogleSignup);

// Fallback: allow GET /api/auth/google/callback to be handled by contact.controller.googleCallback
// This prevents a 404 when Google redirects to /api/auth/google/callback instead of /api/contacts/google/callback
router.get('/google/callback', googleCallback);

export default router;