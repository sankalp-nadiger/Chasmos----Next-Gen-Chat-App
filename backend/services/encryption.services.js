import crypto from 'crypto';
import forge from 'node-forge';
import config from '../config/encryption.config.js';
import { EncryptionKey, ChatKey } from '../models/encryption.model.js';
import User from '../models/user.model.js';

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
  }

  /**
   * Encrypt message with AES-GCM
   */
  async encryptMessage(plaintext, key, iv) {
    try {
      const cipher = crypto.createCipheriv(
        this.algorithm,
        key,
        iv || crypto.randomBytes(config.IV_LENGTH)
      );
      
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted: encrypted,
        iv: iv ? iv.toString('base64') : cipher.getIV().toString('base64'),
        authTag: authTag.toString('base64'),
        algorithm: this.algorithm
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt message with AES-GCM
   */
  async decryptMessage(encryptedData, key) {
    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        key,
        Buffer.from(encryptedData.iv, 'base64')
      );
      
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Generate and store keys for new user
   */
  async setupUserEncryption(userId, passphrase) {
    try {
      // Generate RSA key pair
      const keyPair = config.generateRSAKeyPair();
      
      // Derive key from passphrase for private key encryption
      const salt = crypto.randomBytes(16);
      const key = config.deriveKey(passphrase, salt);
      
      // Encrypt private key with passphrase
      const encryptedPrivateKey = await this.encryptMessage(
        keyPair.privateKey,
        key,
        salt
      );
      
      // Store in database
      const encryptionKey = await EncryptionKey.create({
        user: userId,
        rsaPublicKey: keyPair.publicKey,
        encryptedPrivateKey: JSON.stringify(encryptedPrivateKey),
        keyVersion: 'v1'
      });
      
      return {
        publicKey: keyPair.publicKey,
        encryptedPrivateKey: encryptedPrivateKey,
        salt: salt.toString('base64')
      };
    } catch (error) {
      console.error('User encryption setup error:', error);
      throw error;
    }
  }

  /**
   * Setup encryption for new chat
   */
  async setupChatEncryption(chatId, participants) {
    try {
      // Generate session key for this chat
      const sessionKey = config.generateSessionKey();
      
      // Get public keys for all participants
      const userKeys = await EncryptionKey.find({
        user: { $in: participants }
      });
      
      const participantsData = [];
      
      // Encrypt session key for each participant
      for (const userKey of userKeys) {
        const encryptedKey = config.encryptSessionKey(
          sessionKey.key,
          userKey.rsaPublicKey
        );
        
        participantsData.push({
          user: userKey.user,
          encryptedSessionKey: encryptedKey,
          keyId: crypto.randomBytes(16).toString('hex')
        });
      }
      
      // Store chat key
      const chatKey = await ChatKey.create({
        chat: chatId,
        participants: participantsData,
        encryptedSessionKey: sessionKey.key.toString('base64'),
        generation: 1,
        isActive: true
      });
      
      return {
        chatId,
        sessionKey: sessionKey.key.toString('base64'),
        participants: participantsData
      };
    } catch (error) {
      console.error('Chat encryption setup error:', error);
      throw error;
    }
  }

  /**
   * Add participant to encrypted chat
   */
  async addParticipantToChat(chatId, userId) {
    try {
      const chatKey = await ChatKey.findOne({ chat: chatId, isActive: true });
      if (!chatKey) {
        throw new Error('Chat key not found');
      }
      
      // Get user's public key
      const userKey = await EncryptionKey.findOne({ user: userId });
      if (!userKey) {
        throw new Error('User encryption key not found');
      }
      
      // Decrypt session key (in real implementation, this would be client-side)
      const sessionKey = Buffer.from(chatKey.encryptedSessionKey, 'base64');
      
      // Encrypt session key for new participant
      const encryptedKey = config.encryptSessionKey(
        sessionKey,
        userKey.rsaPublicKey
      );
      
      // Add participant
      chatKey.participants.push({
        user: userId,
        encryptedSessionKey: encryptedKey,
        keyId: crypto.randomBytes(16).toString('hex')
      });
      
      await chatKey.save();
      
      return {
        encryptedSessionKey: encryptedKey,
        keyId: chatKey.participants[chatKey.participants.length - 1].keyId
      };
    } catch (error) {
      console.error('Add participant error:', error);
      throw error;
    }
  }

  /**
   * Rotate chat keys (forward secrecy)
   */
  async rotateChatKeys(chatId) {
    try {
      const oldKey = await ChatKey.findOne({ chat: chatId, isActive: true });
      if (!oldKey) {
        throw new Error('Active chat key not found');
      }
      
      // Generate new session key
      const newSessionKey = config.generateSessionKey();
      
      // Get all participants
      const participants = oldKey.participants.map(p => p.user);
      
      // Create new chat key record
      const newKeyData = await this.setupChatEncryption(chatId, participants);
      
      // Deactivate old key
      oldKey.isActive = false;
      await oldKey.save();
      
      return newKeyData;
    } catch (error) {
      console.error('Key rotation error:', error);
      throw error;
    }
  }

  /**
   * Get encrypted session key for user
   */
  async getEncryptedSessionKey(chatId, userId) {
    try {
      const chatKey = await ChatKey.findOne({
        chat: chatId,
        isActive: true,
        'participants.user': userId
      });
      
      if (!chatKey) {
        throw new Error('Session key not found for user');
      }
      
      const participant = chatKey.participants.find(p => 
        p.user.toString() === userId.toString()
      );
      
      return {
        encryptedSessionKey: participant.encryptedSessionKey,
        keyId: participant.keyId,
        chatId,
        generation: chatKey.generation
      };
    } catch (error) {
      console.error('Get session key error:', error);
      throw error;
    }
  }

  /**
   * Verify message integrity
   */
  async verifyMessageIntegrity(encryptedMessage, expectedHash) {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(encryptedMessage))
      .digest('hex');
    
    return hash === expectedHash;
  }
}

export default new EncryptionService();