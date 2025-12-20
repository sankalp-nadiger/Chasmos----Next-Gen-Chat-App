import crypto from 'crypto';
import forge from 'node-forge';

// Encryption constants
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_DERIVATION_ALGORITHM = 'sha256';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12;  // 96 bits for GCM
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;

// Session key management
const sessionKeys = new Map();

class EncryptionConfig {
  constructor() {
    // Generate server's master key (store securely in production)
    this.masterKey = process.env.ENCRYPTION_MASTER_KEY || 
      crypto.randomBytes(32).toString('hex');
    
    // Initialize key derivation
    this.keyDerivationIterations = 100000;
  }

  /**
   * Derive encryption key from password/passphrase
   */
  deriveKey(password, salt) {
    return crypto.pbkdf2Sync(
      password,
      salt || crypto.randomBytes(SALT_LENGTH),
      this.keyDerivationIterations,
      KEY_LENGTH,
      KEY_DERIVATION_ALGORITHM
    );
  }

  /**
   * Generate RSA key pair for user
   */
  generateRSAKeyPair() {
    const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
    
    return {
      privateKey: forge.pki.privateKeyToPem(keypair.privateKey),
      publicKey: forge.pki.publicKeyToPem(keypair.publicKey)
    };
  }

  /**
   * Generate session key for chat
   */
  generateSessionKey() {
    return {
      key: crypto.randomBytes(32),
      salt: crypto.randomBytes(SALT_LENGTH),
      iv: crypto.randomBytes(IV_LENGTH),
      timestamp: Date.now()
    };
  }

  /**
   * Encrypt session key with user's public key
   */
  encryptSessionKey(sessionKey, publicKeyPem) {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const encrypted = publicKey.encrypt(
      forge.util.encode64(sessionKey.toString('base64')),
      'RSA-OAEP'
    );
    return forge.util.encode64(encrypted);
  }

  /**
   * Decrypt session key with user's private key
   */
  decryptSessionKey(encryptedKey, privateKeyPem) {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const decrypted = privateKey.decrypt(
      forge.util.decode64(encryptedKey),
      'RSA-OAEP'
    );
    return Buffer.from(forge.util.decode64(decrypted), 'base64');
  }
}

export default new EncryptionConfig();