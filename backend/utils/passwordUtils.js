// utils/passwordUtils.js
import crypto from 'crypto';

/**
 * Hash password using PBKDF2
 * @param {string} password - The password to hash
 * @param {string} salt - The salt (base64 or buffer)
 * @returns {string} - The hashed password in base64 format
 */
export const hashPassword = (password, salt) => {
  try {
    const saltBuffer = typeof salt === 'string' ? Buffer.from(salt, 'base64') : salt;
    return crypto.pbkdf2Sync(password, saltBuffer, 100000, 32, 'sha256').toString('base64');
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Generate a random salt
 * @returns {string} - Base64 encoded salt
 */
export const generateSalt = () => {
  return crypto.randomBytes(32).toString('base64');
};

/**
 * Verify password against hash
 * @param {string} password - The password to verify
 * @param {string} hash - The expected hash
 * @param {string} salt - The salt used
 * @returns {boolean} - True if password matches
 */
export const verifyPassword = (password, hash, salt) => {
  try {
    const computedHash = hashPassword(password, salt);
    return computedHash === hash;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};
