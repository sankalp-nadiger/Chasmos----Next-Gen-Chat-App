// utils/clientEncryption.js 
import CryptoJS from 'crypto-js';

class ClientEncryption {
  // Generate RSA key pair (Web Crypto API)
  static async generateRSAKeyPair() {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      );

      // Export keys
      const publicKey = await window.crypto.subtle.exportKey(
        "spki",
        keyPair.publicKey
      );
      
      const privateKey = await window.crypto.subtle.exportKey(
        "pkcs8",
        keyPair.privateKey
      );

      return {
        publicKey: this.arrayBufferToBase64(publicKey),
        privateKey: this.arrayBufferToBase64(privateKey),
        keyPair // Keep Web Crypto keys for performance
      };
    } catch (error) {
      console.error("RSA key generation failed:", error);
      throw error;
    }
  }

  // Generate AES key
  static async generateAESKey() {
    try {
      const key = await window.crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"]
      );

      const exportedKey = await window.crypto.subtle.exportKey("raw", key);
      return {
        key,
        base64: this.arrayBufferToBase64(exportedKey)
      };
    } catch (error) {
      console.error("AES key generation failed:", error);
      throw error;
    }
  }

  // Encrypt message with AES
  static async encryptMessageAES(message, aesKeyBase64) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      
      // Import AES key
      const key = await this.importAESKey(aesKeyBase64);
      
      // Generate IV
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt
      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        key,
        data
      );

      return {
        encrypted: this.arrayBufferToBase64(encrypted),
        iv: this.arrayBufferToBase64(iv)
      };
    } catch (error) {
      console.error("AES encryption failed:", error);
      throw error;
    }
  }

  // Decrypt message with AES
  static async decryptMessageAES(encryptedData, aesKeyBase64, ivBase64) {
    try {
      // Import AES key
      const key = await this.importAESKey(aesKeyBase64);
      
      // Convert data
      const encrypted = this.base64ToArrayBuffer(encryptedData);
      const iv = this.base64ToArrayBuffer(ivBase64);
      
      // Decrypt
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error("AES decryption failed:", error);
      throw error;
    }
  }

  // Encrypt AES key with RSA public key
  static async encryptAESKeyWithRSA(aesKeyBase64, publicKeyBase64) {
    try {
      // Import RSA public key
      const publicKey = await this.importRSAPublicKey(publicKeyBase64);
      
      // Convert AES key to ArrayBuffer
      const aesKeyBuffer = this.base64ToArrayBuffer(aesKeyBase64);
      
      // Encrypt
      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: "RSA-OAEP"
        },
        publicKey,
        aesKeyBuffer
      );

      return this.arrayBufferToBase64(encrypted);
    } catch (error) {
      console.error("RSA encryption failed:", error);
      throw error;
    }
  }

  // Decrypt AES key with RSA private key
  static async decryptAESKeyWithRSA(encryptedAESKeyBase64, privateKeyBase64) {
    try {
      // Import RSA private key
      const privateKey = await this.importRSAPrivateKey(privateKeyBase64);
      
      // Convert encrypted key
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedAESKeyBase64);
      
      // Decrypt
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: "RSA-OAEP"
        },
        privateKey,
        encryptedBuffer
      );

      return this.arrayBufferToBase64(decrypted);
    } catch (error) {
      console.error("RSA decryption failed:", error);
      throw error;
    }
  }

  // Helper methods
  static arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  static base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  static async importAESKey(keyBase64) {
    const keyBuffer = this.base64ToArrayBuffer(keyBase64);
    return await window.crypto.subtle.importKey(
      "raw",
      keyBuffer,
      {
        name: "AES-GCM"
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  static async importRSAPublicKey(keyBase64) {
    const keyBuffer = this.base64ToArrayBuffer(keyBase64);
    return await window.crypto.subtle.importKey(
      "spki",
      keyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256"
      },
      true,
      ["encrypt"]
    );
  }

  static async importRSAPrivateKey(keyBase64) {
    const keyBuffer = this.base64ToArrayBuffer(keyBase64);
    return await window.crypto.subtle.importKey(
      "pkcs8",
      keyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256"
      },
      true,
      ["decrypt"]
    );
  }

  // Store keys securely in localStorage (encrypted with passphrase)
  static storeKeys(userId, keys, passphrase) {
    try {
      const encryptedKeys = CryptoJS.AES.encrypt(
        JSON.stringify(keys),
        passphrase + userId
      ).toString();
      
      localStorage.setItem(`encryption_keys_${userId}`, encryptedKeys);
      return true;
    } catch (error) {
      console.error("Failed to store keys:", error);
      return false;
    }
  }

  // Retrieve keys from localStorage
  static retrieveKeys(userId, passphrase) {
    try {
      const encryptedKeys = localStorage.getItem(`encryption_keys_${userId}`);
      if (!encryptedKeys) return null;
      
      const decrypted = CryptoJS.AES.decrypt(
        encryptedKeys,
        passphrase + userId
      ).toString(CryptoJS.enc.Utf8);
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error("Failed to retrieve keys:", error);
      return null;
    }
  }

  // Generate key fingerprint for verification
  static generateKeyFingerprint(key) {
    const hash = CryptoJS.SHA256(key).toString(CryptoJS.enc.Hex);
    return hash.substring(0, 16).toUpperCase(); // First 16 chars as fingerprint
  }
}

export default ClientEncryption;