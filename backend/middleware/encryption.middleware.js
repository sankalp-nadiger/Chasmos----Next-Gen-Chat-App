// middleware/encryption.middleware.js
import EncryptionService from '../services/encryption.service.js';
import KeyManagementService from '../services/keyManagement.service.js';
import User from '../models/user.model.js';

// Middleware to encrypt outgoing messages
export const encryptOutgoingMessage = async (req, res, next) => {
  try {
    const { chatId, content, isEncrypted = true } = req.body;
    
    // Skip encryption if explicitly disabled
    if (!isEncrypted) {
      return next();
    }
    
    // Get user's chat key
    const chatKeyInfo = await KeyManagementService.getChatKeyForUser(
      chatId,
      req.user._id
    );
    
    if (!chatKeyInfo) {
      // Chat is not encrypted or user doesn't have keys
      return next();
    }
    
    // Encrypt the message content
    const encryptedData = EncryptionService.encryptAES(
      content,
      chatKeyInfo.aesKey
    );
    
    // Add encryption metadata to request body
    req.body.encryptedContent = encryptedData.encrypted;
    req.body.encryptionMetadata = {
      iv: encryptedData.iv,
      tag: encryptedData.tag,
      algorithm: 'AES-256-GCM',
      keyVersion: chatKeyInfo.keyVersion
    };
    req.body.isEncrypted = true;
    
    // Clear plaintext content (server should not store it)
    req.body.content = '[ENCRYPTED]';
    
    next();
  } catch (error) {
    console.error('Encryption middleware error:', error);
    
    // If encryption fails, send as unencrypted with warning
    req.body.content = `[ENCRYPTION FAILED: ${content.substring(0, 50)}...]`;
    req.body.isEncrypted = false;
    
    next();
  }
};

// Middleware to decrypt incoming messages
export const decryptIncomingMessage = async (req, res, next) => {
  try {
    const message = req.message || res.locals.message;
    
    if (!message || !message.isEncrypted) {
      return next();
    }
    
    // Get user's chat key
    const chatKeyInfo = await KeyManagementService.getChatKeyForUser(
      message.chat,
      req.user._id
    );
    
    if (!chatKeyInfo) {
      // User can't decrypt this message
      message.content = '[ENCRYPTED - NO KEY]';
      return next();
    }
    
    // Decrypt the message
    const decryptedContent = EncryptionService.decryptAES(
      {
        encrypted: message.encryptedContent,
        iv: message.encryptionMetadata.iv,
        tag: message.encryptionMetadata.tag
      },
      chatKeyInfo.aesKey
    );
    
    // Replace encrypted content with decrypted
    message.content = decryptedContent;
    message.wasDecrypted = true;
    
    next();
  } catch (error) {
    console.error('Decryption middleware error:', error);
    
    // Mark as failed to decrypt
    if (req.message) {
      req.message.content = '[FAILED TO DECRYPT]';
      req.message.decryptionError = error.message;
    }
    
    next();
  }
};

// Middleware to check if user has encryption keys
export const requireEncryptionKeys = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('rsaPublicKey rsaPrivateKey');
    
    if (!user || !user.rsaPublicKey || !user.rsaPrivateKey) {
      return res.status(400).json({
        success: false,
        message: 'Encryption keys not set up',
        requiresKeySetup: true
      });
    }
    
    next();
  } catch (error) {
    console.error('Encryption key check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking encryption keys'
    });
  }
};

// Middleware to handle encrypted attachments
export const encryptAttachment = async (req, res, next) => {
  try {
    if (!req.file || !req.body.chatId) {
      return next();
    }
    
    // Get chat key
    const chatKeyInfo = await KeyManagementService.getChatKeyForUser(
      req.body.chatId,
      req.user._id
    );
    
    if (!chatKeyInfo) {
      // Chat is not encrypted
      return next();
    }
    
    // Encrypt the file
    const encryptedFile = EncryptionService.encryptFile(
      req.file.buffer,
      chatKeyInfo.aesKey
    );
    
    // Replace file buffer with encrypted version
    req.file.buffer = encryptedFile.encrypted;
    
    // Store encryption metadata
    req.file.encryptionMetadata = {
      iv: encryptedFile.iv,
      tag: encryptedFile.tag,
      keyVersion: chatKeyInfo.keyVersion
    };
    
    next();
  } catch (error) {
    console.error('Attachment encryption error:', error);
    next();
  }
};

// Decrypt attachment middleware
export const decryptAttachment = async (req, res, next) => {
  try {
    const { fileUrl, chatId, encryptionMetadata } = req.query;
    
    if (!encryptionMetadata || !chatId) {
      return next();
    }
    
    // Get chat key
    const chatKeyInfo = await KeyManagementService.getChatKeyForUser(
      chatId,
      req.user._id
    );
    
    if (!chatKeyInfo) {
      return res.status(403).json({
        success: false,
        message: 'Cannot decrypt attachment: No encryption key'
      });
    }
    
    // Parse encryption metadata
    const metadata = JSON.parse(encryptionMetadata);
    
    // Here you would fetch the encrypted file from storage
    // For now, we'll just add the decryption key to the response
    res.locals.decryptionKey = chatKeyInfo.aesKey;
    res.locals.encryptionMetadata = metadata;
    
    next();
  } catch (error) {
    console.error('Attachment decryption middleware error:', error);
    next();
  }
};