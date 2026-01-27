// models/encryptedMessage.model.js
import mongoose, { Schema } from "mongoose";

const encryptedMessageSchema = new Schema(
  {
    // Reference to original message (for backward compatibility)
    message: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: true,
      index: true
    },
    
    // Encrypted content
    encryptedContent: { type: String, required: true },
    encryptionMetadata: {
      iv: { type: String, required: true },
      tag: { type: String, required: true },
      keyVersion: { type: Number, required: true },
      algorithm: { type: String, default: "AES-256-GCM" },
      
      // For perfect forward secrecy
      ephemeralPublicKey: { type: String },
      sessionId: { type: String },
      
      // For signature verification
      signature: { type: String },
      signerPublicKey: { type: String }
    },
    
    // Message type (to help with decryption)
    type: {
      type: String,
      enum: ["text", "file", "system", "key_exchange", "key_rotation"],
      default: "text"
    },
    
    // For attachments
    encryptedAttachments: [{
      fileId: { type: String },
      encryptedUrl: { type: String },
      encryptedMetadata: {
        fileName: { type: String },
        fileType: { type: String },
        fileSize: { type: Number }
      },
      encryptionMetadata: {
        iv: { type: String },
        tag: { type: String }
      }
    }],
    
    // Forward secrecy
    isEphemeral: { type: Boolean, default: false },
    ephemeralLifetime: { type: Number }, // in milliseconds
    
    // Key exchange messages
    isKeyExchange: { type: Boolean, default: false },
    keyExchangeData: {
      targetUser: { type: Schema.Types.ObjectId, ref: "User" },
      encryptedKeyMaterial: { type: String },
      keyType: { type: String, enum: ["aes", "ecdh"] }
    },
    
    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Indexes
encryptedMessageSchema.index({ message: 1 });
encryptedMessageSchema.index({ createdAt: 1 });
encryptedMessageSchema.index({ "encryptionMetadata.sessionId": 1 });

// Virtual for checking if message is expired (for ephemeral messages)
encryptedMessageSchema.virtual('isExpired').get(function() {
  if (!this.isEphemeral || !this.ephemeralLifetime) return false;
  
  const expiryTime = new Date(this.createdAt.getTime() + this.ephemeralLifetime);
  return new Date() > expiryTime;
});

export default mongoose.model("EncryptedMessage", encryptedMessageSchema);