import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { 
    googleConnect, 
    googleCallback, 
    syncGoogleContacts,
    triggerSyncForUser
} from "../controllers/contact.controller.js";

const router = express.Router();

// 1. Initiates the OAuth flow
router.route("/google/connect").get(protect, googleConnect);

// 2. Handles the redirect from Google, exchanges code for tokens
// Note: Google will redirect to this endpoint and include the `state` query param
// which carries the user's JWT so we do not require `protect` here.
router.route("/google/callback").get(googleCallback);

// 3. Manually trigger contacts sync
router.route("/sync").post(protect, syncGoogleContacts);

// 4. Trigger sync even if sync flag is false; returns connect URL if consent required
router.route("/trigger-sync").post(protect, triggerSyncForUser);

export default router;