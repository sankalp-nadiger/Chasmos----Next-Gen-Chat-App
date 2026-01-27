// services/keyManagement.service.js
import ChatKey from '../models/chatKey.model.js';
import User from '../models/user.model.js';
import EncryptionService from './encryption.service.js';
import mongoose from 'mongoose';

class KeyManagementService {
  // Initialize chat with encryption keys
  static async initializeChatEncryption(chatId, participants, creatorId) {
    try {
      // Generate new AES key for the chat
      const aesKey = EncryptionService.generateAESKey();
      
      // Get creator's public key
      const creator = await User.findById(creatorId).select('rsaPublicKey ecdhPublicKey');
      if (!creator || !creator.rsaPublicKey) {
        throw new Error('Creator does not have encryption keys');
      }
      
      // Create chat key document
      const chatKeyData = {
        chat: chatId,
        currentAESKey: aesKey,
        keyVersion: 1,
        keyRotationDate: new Date(),
        nextRotationDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days
        participants: [],
        adminKeys: []
      };
      
      // Encrypt AES key for each participant
      for (const participantId of participants) {
        const participant = await User.findById(participantId).select('rsaPublicKey');
        
        if (participant && participant.rsaPublicKey) {
          const encryptedAESKey = EncryptionService.encryptAESKeyWithRSA(
            aesKey,
            participant.rsaPublicKey
          );
          
          chatKeyData.participants.push({
            user: participantId,
            encryptedAESKey: encryptedAESKey,
            keyVersion: 1
          });
        }
      }
      
      // Store special admin key for creator
      const encryptedAdminKey = EncryptionService.encryptAESKeyWithRSA(
        aesKey,
        creator.rsaPublicKey
      );
      
      chatKeyData.adminKeys.push({
        admin: creatorId,
        encryptedAdminKey: encryptedAdminKey
      });
      
      // Save to database
      const chatKey = await ChatKey.create(chatKeyData);
      
      return {
        chatKeyId: chatKey._id,
        aesKey: aesKey, // Return plain key only to creator
        keyVersion: 1
      };
    } catch (error) {
      console.error('Failed to initialize chat encryption:', error);
      throw error;
    }
  }

  // Get chat key for a user
  static async getChatKeyForUser(chatId, userId) {
    try {
      const chatKey = await ChatKey.findOne({ chat: chatId, isActive: true });
      
      if (!chatKey) {
        throw new Error('No encryption keys found for this chat');
      }
      
      // Find participant's encrypted key
      const participant = chatKey.participants.find(p => 
        p.user.toString() === userId.toString()
      );
      
      if (!participant) {
        throw new Error('User is not a participant in this chat');
      }
      
      // Get user's private key
      const user = await User.findById(userId).select('rsaPrivateKey');
      if (!user || !user.rsaPrivateKey) {
        throw new Error('User does not have private key');
      }
      
      // Decrypt AES key with user's private key
      const aesKey = EncryptionService.decryptAESKeyWithRSA(
        participant.encryptedAESKey,
        user.rsaPrivateKey
      );
      
      return {
        aesKey: aesKey,
        keyVersion: participant.keyVersion,
        chatKeyId: chatKey._id
      };
    } catch (error) {
      console.error('Failed to get chat key:', error);
      throw error;
    }
  }

  // Add new participant to encrypted chat
  static async addParticipantToEncryptedChat(chatId, newUserId, adminId) {
    try {
      const chatKey = await ChatKey.findOne({ chat: chatId, isActive: true });
      
      if (!chatKey) {
        throw new Error('No encryption keys found for this chat');
      }
      
      // Verify admin has admin key
      const adminKey = chatKey.adminKeys.find(a => 
        a.admin.toString() === adminId.toString()
      );
      
      if (!adminKey) {
        throw new Error('User is not authorized to add participants');
      }
      
      // Get new user's public key
      const newUser = await User.findById(newUserId).select('rsaPublicKey');
      if (!newUser || !newUser.rsaPublicKey) {
        throw new Error('New user does not have encryption keys');
      }
      
      // Get admin's private key to decrypt admin key
      const admin = await User.findById(adminId).select('rsaPrivateKey');
      const decryptedAdminKey = EncryptionService.decryptAESKeyWithRSA(
        adminKey.encryptedAdminKey,
        admin.rsaPrivateKey
      );
      
      // Encrypt chat AES key with new user's public key
      const encryptedAESKey = EncryptionService.encryptAESKeyWithRSA(
        decryptedAdminKey,
        newUser.rsaPublicKey
      );
      
      // Add new participant
      chatKey.addParticipant(newUserId, encryptedAESKey);
      await chatKey.save();
      
      // Create key exchange message
      await this.createKeyExchangeMessage(chatId, adminId, newUserId, encryptedAESKey);
      
      return {
        success: true,
        message: 'Participant added to encrypted chat'
      };
    } catch (error) {
      console.error('Failed to add participant:', error);
      throw error;
    }
  }

  // Rotate chat keys
  static async rotateChatKeys(chatId, adminId) {
    try {
      const chatKey = await ChatKey.findOne({ chat: chatId, isActive: true });
      
      if (!chatKey) {
        throw new Error('No encryption keys found for this chat');
      }
      
      // Generate new AES key
      const newAESKey = EncryptionService.generateAESKey();
      
      // Encrypt new key for each participant
      for (const participant of chatKey.participants) {
        const user = await User.findById(participant.user).select('rsaPublicKey');
        
        if (user && user.rsaPublicKey) {
          const encryptedNewKey = EncryptionService.encryptAESKeyWithRSA(
            newAESKey,
            user.rsaPublicKey
          );
          
          participant.encryptedAESKey = encryptedNewKey;
          participant.keyVersion = chatKey.keyVersion + 1;
        }
      }
      
      // Update admin keys
      for (const adminKey of chatKey.adminKeys) {
        const admin = await User.findById(adminKey.admin).select('rsaPublicKey');
        
        if (admin && admin.rsaPublicKey) {
          const encryptedAdminKey = EncryptionService.encryptAESKeyWithRSA(
            newAESKey,
            admin.rsaPublicKey
          );
          
          adminKey.encryptedAdminKey = encryptedAdminKey;
        }
      }
      
      // Update chat key
      chatKey.rotateKey(newAESKey);
      await chatKey.save();
      
      // Create key rotation notification
      await this.createKeyRotationMessage(chatId, adminId, chatKey.keyVersion);
      
      return {
        success: true,
        keyVersion: chatKey.keyVersion
      };
    } catch (error) {
      console.error('Failed to rotate keys:', error);
      throw error;
    }
  }

  // Create key exchange message
  static async createKeyExchangeMessage(chatId, senderId, targetUserId, encryptedKey) {
    try {
      const Message = mongoose.model('Message');
      
      const keyExchangeMessage = await Message.create({
        sender: senderId,
        chat: chatId,
        content: 'New encryption key distributed',
        type: 'key_exchange',
        isEncrypted: false, // This message itself is not encrypted
        isKeyExchange: true,
        keyExchangeData: {
          targetUser: targetUserId,
          encryptedKeyMaterial: encryptedKey
        }
      });
      
      return keyExchangeMessage;
    } catch (error) {
      console.error('Failed to create key exchange message:', error);
      throw error;
    }
  }

  // Create key rotation message
  static async createKeyRotationMessage(chatId, senderId, keyVersion) {
    try {
      const Message = mongoose.model('Message');
      
      const rotationMessage = await Message.create({
        sender: senderId,
        chat: chatId,
        content: `Encryption keys rotated to version ${keyVersion}`,
        type: 'system',
        isEncrypted: false
      });
      
      return rotationMessage;
    } catch (error) {
      console.error('Failed to create key rotation message:', error);
      throw error;
    }
  }

  // Verify user can decrypt messages
  static async verifyUserCanDecrypt(chatId, userId) {
    try {
      const chatKey = await ChatKey.findOne({ chat: chatId, isActive: true });
      
      if (!chatKey) {
        return { canDecrypt: true }; // Chat is not encrypted
      }
      
      const participant = chatKey.participants.find(p => 
        p.user.toString() === userId.toString()
      );
      
      if (!participant) {
        return { canDecrypt: false, reason: 'Not a participant' };
      }
      
      // Check if user has private key
      const user = await User.findById(userId).select('rsaPrivateKey');
      if (!user || !user.rsaPrivateKey) {
        return { canDecrypt: false, reason: 'No private key' };
      }
      
      return { canDecrypt: true, keyVersion: participant.keyVersion };
    } catch (error) {
      console.error('Failed to verify decryption capability:', error);
      return { canDecrypt: false, reason: 'Error checking keys' };
    }
  }

  // Get all encrypted chats for a user
  static async getUserEncryptedChats(userId) {
    try {
      const chatKeys = await ChatKey.find({
        'participants.user': userId,
        isActive: true
      }).populate('chat', 'chatName isGroupChat');
      
      return chatKeys.map(chatKey => ({
        chatId: chatKey.chat._id,
        chatName: chatKey.chat.chatName,
        isGroupChat: chatKey.chat.isGroupChat,
        keyVersion: chatKey.keyVersion,
        lastRotation: chatKey.keyRotationDate
      }));
    } catch (error) {
      console.error('Failed to get encrypted chats:', error);
      return [];
    }
  }
}

export default KeyManagementService;