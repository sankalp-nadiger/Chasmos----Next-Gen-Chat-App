import mongoose from 'mongoose';

const encryptionKeySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    
    // RSA key pair (private key is client-side encrypted)
    rsaPublicKey: {
      type: String,
      required: true
    },
    
    // Encrypted private key (encrypted with user's passphrase)
    encryptedPrivateKey: {
      type: String,
      required: true
    },
    
    // Key metadata
    keyVersion: {
      type: String,
      default: 'v1'
    },
    
    createdAt: {
      type: Date,
      default: Date.now
    },
    
    lastRotated: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

const chatKeySchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true
    },
    
    // Session key encrypted for each participant
    participants: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      
      // Session key encrypted with user's public key
      encryptedSessionKey: {
        type: String,
        required: true
      },
      
      // Ephemeral key for forward secrecy (optional)
      ephemeralPublicKey: String,
      
      // Key ID for key rotation
      keyId: {
        type: String,
        default: () => crypto.randomBytes(16).toString('hex')
      }
    }],
    
    // Current session key (server never sees plaintext)
    encryptedSessionKey: {
      type: String,
      required: true
    },
    
    // Key metadata
    generation: {
      type: Number,
      default: 1
    },
    
    createdAt: {
      type: Date,
      default: Date.now
    },
    
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Indexes
encryptionKeySchema.index({ user: 1 });
chatKeySchema.index({ chat: 1, 'participants.user': 1 });
chatKeySchema.index({ chat: 1, isActive: 1 });

export const EncryptionKey = mongoose.model('EncryptionKey', encryptionKeySchema);
export const ChatKey = mongoose.model('ChatKey', chatKeySchema);