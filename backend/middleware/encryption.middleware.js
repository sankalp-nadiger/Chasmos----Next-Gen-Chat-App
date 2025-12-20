import encryptionService from '../services/encryption.service.js';
import { ChatKey } from '../models/encryption.model.js';

/**
 * Middleware to encrypt outgoing messages
 */
export const encryptOutgoingMessages = async (req, res, next) => {
  // Skip if not a message request
  if (!req.body.content || req.path !== '/api/message') {
    return next();
  }
  
  try {
    const { chatId, content } = req.body;
    const userId = req.user._id;
    
    // Get encrypted session key for this chat
    const sessionKeyData = await encryptionService.getEncryptedSessionKey(chatId, userId);
    
    // Note: In production, decryption happens client-side
    // This is just for demonstration - server should NOT have plaintext keys
    
    // Encrypt the message
    const key = Buffer.from(sessionKeyData.encryptedSessionKey, 'base64');
    const iv = crypto.randomBytes(12);
    
    const encrypted = await encryptionService.encryptMessage(
      content,
      key,
      iv
    );
    
    // Add encryption metadata
    req.body.encryptedContent = encrypted.encrypted;
    req.body.encryption = {
      algorithm: encrypted.algorithm,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      keyId: sessionKeyData.keyId,
      generation: sessionKeyData.generation
    };
    
    // Remove plaintext content
    delete req.body.content;
    
    next();
  } catch (error) {
    console.error('Encryption middleware error:', error);
    res.status(500).json({ 
      error: 'Message encryption failed',
      message: 'Could not encrypt message'
    });
  }
};

/**
 * Middleware to verify encrypted messages
 */
export const verifyEncryptedMessage = async (req, res, next) => {
  if (!req.body.encryptedContent) {
    return next();
  }
  
  try {
    const { encryption } = req.body;
    
    if (!encryption || !encryption.iv || !encryption.authTag) {
      return res.status(400).json({
        error: 'Invalid encryption data',
        message: 'Missing required encryption fields'
      });
    }
    
    // Verify encryption algorithm
    if (encryption.algorithm !== 'aes-256-gcm') {
      return res.status(400).json({
        error: 'Unsupported encryption algorithm',
        message: 'Only AES-256-GCM is supported'
      });
    }
    
    next();
  } catch (error) {
    console.error('Verification middleware error:', error);
    res.status(500).json({ 
      error: 'Message verification failed' 
    });
  }
};

/**
 * Check if chat is encrypted
 */
export const checkChatEncryption = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    
    const chatKey = await ChatKey.findOne({ 
      chat: chatId, 
      isActive: true 
    });
    
    if (chatKey) {
      req.isEncryptedChat = true;
      req.chatKey = chatKey;
    } else {
      req.isEncryptedChat = false;
    }
    
    next();
  } catch (error) {
    console.error('Chat encryption check error:', error);
    next();
  }
};