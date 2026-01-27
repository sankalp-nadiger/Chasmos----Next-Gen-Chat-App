// controllers/encryption.controller.js
import asyncHandler from "express-async-handler";
import EncryptionService from "../services/encryption.service.js";
import KeyManagementService from "../services/keyManagement.service.js";
import User from "../models/user.model.js";
import Chat from "../models/chat.model.js";
import ChatKey from "../models/chatKey.model.js";
import { hashPassword } from "../utils/passwordUtils.js";

// Generate RSA key pair for user
export const generateUserKeys = asyncHandler(async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      res.status(400);
      throw new Error("Password is required to generate encryption keys");
    }
    
    const user = await User.findById(req.user._id);
    
    if (user.rsaPublicKey) {
      res.status(400);
      throw new Error("Encryption keys already generated for this user");
    }
    
    // Generate RSA key pair
    const rsaKeyPair = EncryptionService.generateRSAKeyPair();
    
    // Generate ECDH key pair for perfect forward secrecy
    const ecdhKeyPair = EncryptionService.generateECDHKeyPair();
    
    // Generate salt for password-based key derivation
    const salt = require('crypto').randomBytes(32).toString('base64');
    
    // Derive key from password to encrypt private keys
    const derivedKey = EncryptionService.hashPassword(password, salt);
    
    // Encrypt private keys with derived key (simplified - in production use proper key wrapping)
    // Note: In production, consider using WebCrypto API or dedicated key management system
    
    // Store keys in user document
    user.rsaPublicKey = rsaKeyPair.publicKey;
    user.rsaPrivateKey = rsaKeyPair.privateKey; // Store encrypted in production
    user.ecdhPublicKey = ecdhKeyPair.publicKey;
    user.ecdhPrivateKey = ecdhKeyPair.privateKey; // Store encrypted in production
    user.keySalt = salt;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: "Encryption keys generated successfully",
      publicKey: rsaKeyPair.publicKey,
      // In production, don't send private keys to client
      // Client should generate and store keys locally
    });
  } catch (error) {
    console.error("Key generation error:", error);
    res.status(500);
    throw new Error("Failed to generate encryption keys");
  }
});

// Get user's public key
export const getPublicKey = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('rsaPublicKey ecdhPublicKey');
    
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    
    if (!user.rsaPublicKey) {
      res.status(404);
      throw new Error("User does not have encryption keys");
    }
    
    res.status(200).json({
      success: true,
      rsaPublicKey: user.rsaPublicKey,
      ecdhPublicKey: user.ecdhPublicKey
    });
  } catch (error) {
    console.error("Get public key error:", error);
    res.status(500);
    throw new Error("Failed to get public key");
  }
});

// Initialize encryption for a chat
export const initializeChatEncryption = asyncHandler(async (req, res) => {
  try {
    const { chatId } = req.body;
    
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      res.status(404);
      throw new Error("Chat not found");
    }
    
    // Check if user is in chat
    if (!chat.users.includes(req.user._id) && !chat.participants.includes(req.user._id)) {
      res.status(403);
      throw new Error("Not authorized to initialize encryption for this chat");
    }
    
    // Get all participants
    const participants = chat.users.length > 0 ? chat.users : chat.participants;
    
    // Initialize chat encryption
    const encryptionInfo = await KeyManagementService.initializeChatEncryption(
      chatId,
      participants,
      req.user._id
    );
    
    res.status(200).json({
      success: true,
      message: "Chat encryption initialized",
      data: {
        chatId,
        keyVersion: encryptionInfo.keyVersion,
        // Send AES key only to creator (client should store it securely)
        aesKey: encryptionInfo.aesKey
      }
    });
  } catch (error) {
    console.error("Chat encryption initialization error:", error);
    res.status(500);
    throw new Error("Failed to initialize chat encryption");
  }
});

// Rotate chat encryption keys
export const rotateChatKeys = asyncHandler(async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const result = await KeyManagementService.rotateChatKeys(chatId, req.user._id);
    
    res.status(200).json({
      success: true,
      message: "Chat keys rotated successfully",
      keyVersion: result.keyVersion
    });
  } catch (error) {
    console.error("Key rotation error:", error);
    res.status(500);
    throw new Error("Failed to rotate chat keys");
  }
});

// Add participant to encrypted chat
export const addParticipantToEncryptedChat = asyncHandler(async (req, res) => {
  try {
    const { chatId } = req.params;
    const { newUserId } = req.body;
    
    const result = await KeyManagementService.addParticipantToEncryptedChat(
      chatId,
      newUserId,
      req.user._id
    );
    
    res.status(200).json({
      success: true,
      message: "Participant added to encrypted chat"
    });
  } catch (error) {
    console.error("Add participant error:", error);
    res.status(500);
    throw new Error("Failed to add participant to encrypted chat");
  }
});

// Get user's encrypted chats
export const getUserEncryptedChats = asyncHandler(async (req, res) => {
  try {
    const encryptedChats = await KeyManagementService.getUserEncryptedChats(req.user._id);
    
    res.status(200).json({
      success: true,
      encryptedChats
    });
  } catch (error) {
    console.error("Get encrypted chats error:", error);
    res.status(500);
    throw new Error("Failed to get encrypted chats");
  }
});

// Decrypt a specific message
export const decryptMessage = asyncHandler(async (req, res) => {
  try {
    const { messageId, chatId } = req.body;
    
    // Get chat key
    const chatKeyInfo = await KeyManagementService.getChatKeyForUser(chatId, req.user._id);
    
    if (!chatKeyInfo) {
      res.status(403);
      throw new Error("Cannot decrypt: No encryption key for this chat");
    }
    
    // Get message
    const Message = require('../models/message.model.js').default;
    const message = await Message.findById(messageId);
    
    if (!message) {
      res.status(404);
      throw new Error("Message not found");
    }
    
    if (!message.isEncrypted) {
      res.status(400);
      throw new Error("Message is not encrypted");
    }
    
    // Decrypt message
    const decryptedContent = EncryptionService.decryptAES(
      {
        encrypted: message.encryptedContent,
        iv: message.encryptionMetadata.iv,
        tag: message.encryptionMetadata.tag
      },
      chatKeyInfo.aesKey
    );
    
    res.status(200).json({
      success: true,
      decryptedContent,
      keyVersion: chatKeyInfo.keyVersion,
      wasEncrypted: true
    });
  } catch (error) {
    console.error("Message decryption error:", error);
    res.status(500);
    throw new Error("Failed to decrypt message");
  }
});

// Verify encryption status
export const verifyEncryptionStatus = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('rsaPublicKey rsaPrivateKey');
    
    const hasKeys = !!(user.rsaPublicKey && user.rsaPrivateKey);
    
    res.status(200).json({
      success: true,
      hasEncryptionKeys: hasKeys,
      publicKey: user.rsaPublicKey ? 'Present' : 'Missing',
      privateKey: user.rsaPrivateKey ? 'Present' : 'Missing'
    });
  } catch (error) {
    console.error("Encryption status check error:", error);
    res.status(500);
    throw new Error("Failed to check encryption status");
  }
});