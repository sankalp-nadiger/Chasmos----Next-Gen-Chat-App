import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, trim: true },
    type: { type: String, default: "text" },
    chat: { type: Schema.Types.ObjectId, ref: "Chat" },
    documentSession: { type: Schema.Types.ObjectId, ref: "Document" },
    attachments: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
    deletedFor: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isDeleted: { type: Boolean, default: false },
    
    // New starring feature
    starredBy: [{ 
      user: { type: Schema.Types.ObjectId, ref: "User" },
      starredAt: { type: Date, default: Date.now }
    }],
    
    // Message reactions
    reactions: [{
      user: { type: Schema.Types.ObjectId, ref: "User" },
      emoji: { type: String, required: true },
      reactedAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

// Index for better performance
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ "starredBy.user": 1 });
messageSchema.index({ "reactions.user": 1 });

export default mongoose.model("Message", messageSchema);