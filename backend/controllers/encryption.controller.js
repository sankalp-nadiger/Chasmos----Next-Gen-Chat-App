import asyncHandler from 'express-async-handler';
import encryptionService from '../services/encryption.service.js';
import { EncryptionKey, ChatKey } from '../models/encryption.model.js';

/**
 * @desc    Setup user encryption
 * @route   POST /api/encryption/setup
 * @access  Private
 */
export const setupUserEncryption = asyncHandler(async (req, res) => {
  const { passphrase } = req.body;
  
  if (!passphrase) {
    res.status(400);
    throw new Error('Passphrase is required');
  }
  
  const result = await encryptionService.setupUserEncryption(
    req.user._id,
    passphrase
  );
  
  res.status(201).json({
    success: true,
    message: 'Encryption setup completed',
    data: result
  });
});

/**
 * @desc    Get user's public key
 * @route   GET /api/encryption/public-key/:userId
 * @access  Private
 */
export const getPublicKey = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const encryptionKey = await EncryptionKey.findOne({ user: userId });
  
  if (!encryptionKey) {
    res.status(404);
    throw new Error('User encryption key not found');
  }
  
  res.json({
    success: true,
    publicKey: encryptionKey.rsaPublicKey,
    keyVersion: encryptionKey.keyVersion
  });
});

/**
 * @desc    Setup chat encryption
 * @route   POST /api/encryption/chat/:chatId
 * @access  Private
 */
export const setupChatEncryption = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { participants } = req.body;
  
  if (!participants || !Array.isArray(participants)) {
    res.status(400);
    throw new Error('Participants array is required');
  }
  
  // Add current user to participants if not included
  if (!participants.includes(req.user._id.toString())) {
    participants.push(req.user._id.toString());
  }
  
  const result = await encryptionService.setupChatEncryption(
    chatId,
    participants
  );
  
  res.status(201).json({
    success: true,
    message: 'Chat encryption setup completed',
    data: result
  });
});

/**
 * @desc    Get encrypted session key for chat
 * @route   GET /api/encryption/chat/:chatId/key
 * @access  Private
 */
export const getChatSessionKey = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  
  const result = await encryptionService.getEncryptedSessionKey(
    chatId,
    req.user._id
  );
  
  res.json({
    success: true,
    data: result
  });
});

/**
 * @desc    Add participant to encrypted chat
 * @route   POST /api/encryption/chat/:chatId/participant
 * @access  Private
 */
export const addChatParticipant = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { userId } = req.body;
  
  if (!userId) {
    res.status(400);
    throw new Error('User ID is required');
  }
  
  const result = await encryptionService.addParticipantToChat(
    chatId,
    userId
  );
  
  res.status(201).json({
    success: true,
    message: 'Participant added to encrypted chat',
    data: result
  });
});

/**
 * @desc    Rotate chat keys
 * @route   POST /api/encryption/chat/:chatId/rotate
 * @access  Private
 */
export const rotateChatKeys = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  
  const result = await encryptionService.rotateChatKeys(chatId);
  
  res.json({
    success: true,
    message: 'Chat keys rotated successfully',
    data: result
  });
});

/**
 * @desc    Get encryption status
 * @route   GET /api/encryption/status
 * @access  Private
 */
export const getEncryptionStatus = asyncHandler(async (req, res) => {
  const userKey = await EncryptionKey.findOne({ user: req.user._id });
  const encryptedChats = await ChatKey.find({
    'participants.user': req.user._id,
    isActive: true
  }).populate('chat', 'chatName');
  
  res.json({
    success: true,
    data: {
      userEncryption: !!userKey,
      encryptedChatsCount: encryptedChats.length,
      encryptedChats: encryptedChats.map(c => ({
        chatId: c.chat._id,
        chatName: c.chat.chatName,
        keyGeneration: c.generation
      })),
      keyVersion: userKey?.keyVersion || 'none'
    }
  });
});