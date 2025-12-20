import { AES, enc, mode, pad } from 'crypto-js';
import JSEncrypt from 'jsencrypt';

class ChatEncryption {
  constructor() {
    this.sessionKeys = new Map();
    this.rsaKeys = new Map();
  }

  /**
   * Generate RSA key pair
   */
  async generateRSAKeyPair() {
    const encrypt = new JSEncrypt({ default_key_size: 2048 });
    encrypt.getKey();
    
    return {
      privateKey: encrypt.getPrivateKey(),
      publicKey: encrypt.getPublicKey()
    };
  }

  /**
   * Encrypt message with AES-GCM
   */
  encryptAES(text, key, iv) {
    try {
      const encrypted = AES.encrypt(
        text,
        enc.Hex.parse(key),
        {
          iv: enc.Hex.parse(iv),
          mode: mode.GCM,
          padding: pad.NoPadding
        }
      );
      
      return {
        ciphertext: encrypted.ciphertext.toString(enc.Base64),
        iv: iv,
        authTag: encrypted.authTag?.toString(enc.Base64) || ''
      };
    } catch (error) {
      console.error('AES encryption error:', error);
      throw error;
    }
  }

  /**
   * Decrypt message with AES-GCM
   */
  decryptAES(encryptedData, key) {
    try {
      const decrypted = AES.decrypt(
        {
          ciphertext: enc.Base64.parse(encryptedData.ciphertext),
          iv: enc.Hex.parse(encryptedData.iv),
          authTag: enc.Base64.parse(encryptedData.authTag)
        },
        enc.Hex.parse(key),
        {
          mode: mode.GCM,
          padding: pad.NoPadding
        }
      );
      
      return decrypted.toString(enc.Utf8);
    } catch (error) {
      console.error('AES decryption error:', error);
      throw error;
    }
  }

  /**
   * Encrypt with RSA public key
   */
  encryptRSA(text, publicKey) {
    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(publicKey);
    
    const encrypted = encrypt.encrypt(text);
    if (!encrypted) {
      throw new Error('RSA encryption failed');
    }
    
    return encrypted;
  }

  /**
   * Decrypt with RSA private key
   */
  decryptRSA(encryptedText, privateKey) {
    const decrypt = new JSEncrypt();
    decrypt.setPrivateKey(privateKey);
    
    const decrypted = decrypt.decrypt(encryptedText);
    if (!decrypted) {
      throw new Error('RSA decryption failed');
    }
    
    return decrypted;
  }

  /**
   * Setup user encryption
   */
  async setupUserEncryption(passphrase) {
    try {
      // Generate RSA keys
      const rsaKeys = await this.generateRSAKeyPair();
      
      // Derive key from passphrase
      const salt = this.generateSalt();
      const derivedKey = await this.deriveKey(passphrase, salt);
      
      // Encrypt private key with passphrase
      const encryptedPrivateKey = this.encryptAES(
        rsaKeys.privateKey,
        derivedKey,
        salt
      );
      
      // Store keys locally
      localStorage.setItem('rsa_public_key', rsaKeys.publicKey);
      localStorage.setItem('encrypted_private_key', JSON.stringify(encryptedPrivateKey));
      localStorage.setItem('key_salt', salt);
      
      return {
        publicKey: rsaKeys.publicKey,
        encryptedPrivateKey: encryptedPrivateKey,
        salt: salt
      };
    } catch (error) {
      console.error('User setup error:', error);
      throw error;
    }
  }

  /**
   * Decrypt private key with passphrase
   */
  async getPrivateKey(passphrase) {
    try {
      const encryptedPrivateKey = JSON.parse(
        localStorage.getItem('encrypted_private_key')
      );
      const salt = localStorage.getItem('key_salt');
      
      if (!encryptedPrivateKey || !salt) {
        throw new Error('No encrypted key found');
      }
      
      const derivedKey = await this.deriveKey(passphrase, salt);
      const privateKey = this.decryptAES(encryptedPrivateKey, derivedKey);
      
      return privateKey;
    } catch (error) {
      console.error('Get private key error:', error);
      throw error;
    }
  }

  /**
   * Setup chat session
   */
  setupChatSession(chatId, encryptedSessionKey, privateKey) {
    try {
      // Decrypt session key with private key
      const sessionKey = this.decryptRSA(encryptedSessionKey, privateKey);
      
      // Store session key
      this.sessionKeys.set(chatId, sessionKey);
      
      return sessionKey;
    } catch (error) {
      console.error('Chat setup error:', error);
      throw error;
    }
  }

  /**
   * Encrypt message for chat
   */
  encryptMessage(chatId, message) {
    const sessionKey = this.sessionKeys.get(chatId);
    if (!sessionKey) {
      throw new Error('No session key for chat');
    }
    
    const iv = this.generateIV();
    const encrypted = this.encryptAES(message, sessionKey, iv);
    
    return {
      encrypted: encrypted.ciphertext,
      iv: iv,
      authTag: encrypted.authTag,
      algorithm: 'aes-256-gcm'
    };
  }

  /**
   * Decrypt message from chat
   */
  decryptMessage(chatId, encryptedData) {
    const sessionKey = this.sessionKeys.get(chatId);
    if (!sessionKey) {
      throw new Error('No session key for chat');
    }
    
    return this.decryptAES(encryptedData, sessionKey);
  }

  /**
   * Generate random IV
   */
  generateIV() {
    const array = new Uint8Array(12);
    window.crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate salt
   */
  generateSalt() {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Derive key from passphrase
   */
  async deriveKey(passphrase, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    const exported = await window.crypto.subtle.exportKey('raw', derivedKey);
    return Array.from(new Uint8Array(exported))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

export default new ChatEncryption();