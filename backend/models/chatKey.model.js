// models/chatKey.model.js
import mongoose, { Schema } from "mongoose";

const chatKeySchema = new Schema(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true
    },
    
    // Symmetric AES key for this chat (encrypted for each participant)
    participants: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      encryptedAESKey: { type: String, required: true }, // AES key encrypted with user's RSA public key
      keyVersion: { type: Number, default: 1 },
      addedAt: { type: Date, default: Date.now },
      
      // For perfect forward secrecy
      ecdhPublicKey: { type: String },
      encryptedEphemeralKey: { type: String }, // Ephemeral key for this session
      sessionId: { type: String } // Unique session identifier
    }],
    
    // Current active key
    currentAESKey: { type: String }, // Base64 encoded AES key (master key)
    keyVersion: { type: Number, default: 1 },
    
    // Key rotation
    keyRotationDate: { type: Date },
    nextRotationDate: { type: Date },
    rotationInterval: { type: Number, default: 7 * 24 * 60 * 60 * 1000 }, // 7 days in ms
    
    // For group chats
    adminKeys: [{
      admin: { type: Schema.Types.ObjectId, ref: "User" },
      encryptedAdminKey: { type: String } // Special admin key for adding new members
    }],
    
    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Index for faster queries
chatKeySchema.index({ chat: 1, "participants.user": 1 });
chatKeySchema.index({ keyRotationDate: 1 });

// Method to get encrypted key for a specific user
chatKeySchema.methods.getEncryptedKeyForUser = function(userId) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  return participant ? participant.encryptedAESKey : null;
};

// Method to add a new participant
chatKeySchema.methods.addParticipant = function(userId, encryptedAESKey, ecdhPublicKey = null) {
  const existingIndex = this.participants.findIndex(p => 
    p.user.toString() === userId.toString()
  );
  
  if (existingIndex >= 0) {
    // Update existing
    this.participants[existingIndex].encryptedAESKey = encryptedAESKey;
    this.participants[existingIndex].keyVersion = this.keyVersion;
    this.participants[existingIndex].addedAt = new Date();
    if (ecdhPublicKey) {
      this.participants[existingIndex].ecdhPublicKey = ecdhPublicKey;
    }
  } else {
    // Add new
    this.participants.push({
      user: userId,
      encryptedAESKey: encryptedAESKey,
      keyVersion: this.keyVersion,
      ecdhPublicKey: ecdhPublicKey
    });
  }
  
  this.updatedAt = new Date();
};

// Method to rotate keys
chatKeySchema.methods.rotateKey = function(newAESKey) {
  this.currentAESKey = newAESKey;
  this.keyVersion += 1;
  this.keyRotationDate = new Date();
  this.nextRotationDate = new Date(Date.now() + this.rotationInterval);
  this.updatedAt = new Date();
};

export default mongoose.model("ChatKey", chatKeySchema);