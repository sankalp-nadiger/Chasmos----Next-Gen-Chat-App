// services/encryption.service.js
import CryptoJS from 'crypto-js';
import crypto from 'crypto';

class EncryptionService {
  // Generate RSA key pair for a user
  static generateRSAKeyPair() {
    return crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: ''
      }
    });
  }

  // Generate AES key for a chat
  static generateAESKey() {
    return crypto.randomBytes(32).toString('base64'); // 256-bit key
  }

  // Encrypt with AES-256-GCM
  static encryptAES(text, key) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'base64'), iv);
      
      let encrypted = cipher.update(text, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted: encrypted,
        iv: iv.toString('base64'),
        tag: tag.toString('base64')
      };
    } catch (error) {
      console.error('AES encryption error:', error);
      throw error;
    }
  }

  // Decrypt with AES-256-GCM
  static decryptAES(encryptedData, key) {
    try {
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const tag = Buffer.from(encryptedData.tag, 'base64');
      const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'base64'), iv);
      
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('AES decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  // Encrypt AES key with RSA public key
  static encryptAESKeyWithRSA(aesKey, publicKey) {
    try {
      const encrypted = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        Buffer.from(aesKey, 'base64')
      );
      return encrypted.toString('base64');
    } catch (error) {
      console.error('RSA encryption error:', error);
      throw error;
    }
  }

  // Decrypt AES key with RSA private key
  static decryptAESKeyWithRSA(encryptedAESKey, privateKey) {
    try {
      const decrypted = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
          passphrase: ''
        },
        Buffer.from(encryptedAESKey, 'base64')
      );
      return decrypted.toString('base64');
    } catch (error) {
      console.error('RSA decryption error:', error);
      throw error;
    }
  }

  // Generate ECDH key pair for perfect forward secrecy
  static generateECDHKeyPair() {
    const ecdh = crypto.createECDH('prime256v1');
    ecdh.generateKeys();
    
    return {
      publicKey: ecdh.getPublicKey('base64'),
      privateKey: ecdh.getPrivateKey('base64')
    };
  }

  // Compute shared secret using ECDH
  static computeSharedSecret(privateKey, otherPublicKey) {
    const ecdh = crypto.createECDH('prime256v1');
    ecdh.setPrivateKey(Buffer.from(privateKey, 'base64'));
    
    const sharedSecret = ecdh.computeSecret(Buffer.from(otherPublicKey, 'base64'));
    return sharedSecret.toString('base64');
  }

  // Derive AES key from shared secret using HKDF
  static deriveAESKeyFromSharedSecret(sharedSecret, salt = null) {
    if (!salt) {
      salt = crypto.randomBytes(32);
    }
    
    const hkdf = crypto.createHkdf('sha256', Buffer.from(sharedSecret, 'base64'));
    const key = hkdf.expand('aes-256-key', 32);
    
    return {
      key: key.toString('base64'),
      salt: salt.toString('base64')
    };
  }

  // Hash password for key derivation
  static hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('base64');
  }

  // Generate message signature
  static signMessage(message, privateKey) {
    const sign = crypto.createSign('SHA256');
    sign.update(message);
    sign.end();
    return sign.sign(privateKey, 'base64');
  }

  // Verify message signature
  static verifySignature(message, signature, publicKey) {
    const verify = crypto.createVerify('SHA256');
    verify.update(message);
    verify.end();
    return verify.verify(publicKey, signature, 'base64');
  }

  // Encrypt file/attachment
  static encryptFile(fileBuffer, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'base64'), iv);
    
    const encrypted = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted,
      iv: iv.toString('base64'),
      tag: tag.toString('base64')
    };
  }

  // Decrypt file/attachment
  static decryptFile(encryptedFile, key, iv, tag) {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(key, 'base64'),
      Buffer.from(iv, 'base64')
    );
    
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    
    const decrypted = Buffer.concat([
      decipher.update(encryptedFile),
      decipher.final()
    ]);
    
    return decrypted;
  }
}

export default EncryptionService;