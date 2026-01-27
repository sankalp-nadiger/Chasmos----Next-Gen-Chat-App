// scripts/migrateToEncryption.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import Chat from '../models/chat.model.js';
import Message from '../models/message.model.js';
import EncryptionService from '../services/encryption.service.js';

dotenv.config();

const migrateToEncryption = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');
    
    // 1. Generate encryption keys for existing users
    const users = await User.find({ rsaPublicKey: { $exists: false } });
    
    console.log(`Found ${users.length} users without encryption keys`);
    
    for (const user of users) {
      try {
        // Generate RSA key pair for user
        const rsaKeyPair = EncryptionService.generateRSAKeyPair();
        
        user.rsaPublicKey = rsaKeyPair.publicKey;
        user.rsaPrivateKey = rsaKeyPair.privateKey;
        
        // Generate ECDH key pair
        const ecdhKeyPair = EncryptionService.generateECDHKeyPair();
        user.ecdhPublicKey = ecdhKeyPair.publicKey;
        user.ecdhPrivateKey = ecdhKeyPair.privateKey;
        
        // Generate salt
        user.keySalt = require('crypto').randomBytes(32).toString('base64');
        
        await user.save();
        console.log(`Generated keys for user: ${user.email}`);
      } catch (error) {
        console.error(`Failed to generate keys for user ${user.email}:`, error);
      }
    }
    
    console.log('User key generation complete');
    
    // 2. Create chat keys for existing chats (optional - can be done on-demand)
    console.log('Migration complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateToEncryption();