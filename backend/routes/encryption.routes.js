import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  setupUserEncryption,
  getPublicKey,
  setupChatEncryption,
  getChatSessionKey,
  addChatParticipant,
  rotateChatKeys,
  getEncryptionStatus
} from '../controllers/encryption.controller.js';

const router = express.Router();

// User encryption routes
router.route('/setup')
  .post(protect, setupUserEncryption);

router.route('/status')
  .get(protect, getEncryptionStatus);

router.route('/public-key/:userId')
  .get(protect, getPublicKey);

// Chat encryption routes
router.route('/chat/:chatId')
  .post(protect, setupChatEncryption);

router.route('/chat/:chatId/key')
  .get(protect, getChatSessionKey);

router.route('/chat/:chatId/participant')
  .post(protect, addChatParticipant);

router.route('/chat/:chatId/rotate')
  .post(protect, rotateChatKeys);

export default router;