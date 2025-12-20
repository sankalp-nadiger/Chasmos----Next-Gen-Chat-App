import api from './api.service';
import chatEncryption from '../lib/encryption';

class CryptoService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize user encryption
   */
  async initializeUser(passphrase) {
    try {
      // Generate and store keys locally
      const keys = await chatEncryption.setupUserEncryption(passphrase);
      
      // Send public key to server
      await api.post('/api/encryption/setup', {
        passphrase: passphrase // In production, never send passphrase to server
      });
      
      this.initialized = true;
      return keys;
    } catch (error) {
      console.error('Initialization error:', error);
      throw error;
    }
  }

  /**
   * Setup encrypted chat
   */
  async setupEncryptedChat(chatId, participants) {
    try {
      const response = await api.post(`/api/encryption/chat/${chatId}`, {
        participants
      });
      
      // Store session key locally
      const privateKey = await chatEncryption.getPrivateKey(
        localStorage.getItem('user_passphrase') // Get from secure storage
      );
      
      const sessionKey = chatEncryption.setupChatSession(
        chatId,
        response.data.data.sessionKey,
        privateKey
      );
      
      return sessionKey;
    } catch (error) {
      console.error('Chat setup error:', error);
      throw error;
    }
  }

  /**
   * Join existing encrypted chat
   */
  async joinEncryptedChat(chatId) {
    try {
      // Get encrypted session key from server
      const response = await api.get(`/api/encryption/chat/${chatId}/key`);
      
      // Decrypt with private key
      const privateKey = await chatEncryption.getPrivateKey(
        localStorage.getItem('user_passphrase')
      );
      
      const sessionKey = chatEncryption.setupChatSession(
        chatId,
        response.data.data.encryptedSessionKey,
        privateKey
      );
      
      return sessionKey;
    } catch (error) {
      console.error('Join chat error:', error);
      throw error;
    }
  }

  /**
   * Encrypt message before sending
   */
  async encryptMessage(chatId, message) {
    if (!this.isChatEncrypted(chatId)) {
      return message; // Return plaintext for non-encrypted chats
    }
    
    try {
      return chatEncryption.encryptMessage(chatId, message);
    } catch (error) {
      console.error('Message encryption error:', error);
      throw error;
    }
  }

  /**
   * Decrypt received message
   */
  async decryptMessage(chatId, encryptedMessage) {
    if (!this.isChatEncrypted(chatId)) {
      return encryptedMessage; // Already plaintext
    }
    
    try {
      return chatEncryption.decryptMessage(chatId, encryptedMessage);
    } catch (error) {
      console.error('Message decryption error:', error);
      throw error;
    }
  }

  /**
   * Check if chat is encrypted
   */
  isChatEncrypted(chatId) {
    return chatEncryption.sessionKeys.has(chatId);
  }

  /**
   * Get encryption status
   */
  async getStatus() {
    try {
      const response = await api.get('/api/encryption/status');
      return response.data;
    } catch (error) {
      console.error('Status check error:', error);
      return { initialized: false };
    }
  }
}

export default new CryptoService();