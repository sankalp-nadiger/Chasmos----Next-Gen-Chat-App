// routes/encryption.routes.js
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  generateUserKeys,
  getPublicKey,
  initializeChatEncryption,
  rotateChatKeys,
  getUserEncryptedChats,
  addParticipantToEncryptedChat,
  decryptMessage,
  verifyEncryptionStatus
} from "../controllers/encryption.controller.js";

const router = express.Router();

// Key management routes
router.post("/keys/generate", protect, generateUserKeys);
router.get("/keys/public/:userId", protect, getPublicKey);
router.get("/keys/status", protect, verifyEncryptionStatus);

// Chat encryption routes
router.post("/chat/initialize", protect, initializeChatEncryption);
router.post("/chat/:chatId/rotate-keys", protect, rotateChatKeys);
router.post("/chat/:chatId/add-participant", protect, addParticipantToEncryptedChat);
router.get("/chat/encrypted", protect, getUserEncryptedChats);

// Message encryption routes
router.post("/message/decrypt", protect, decryptMessage);

export default router;