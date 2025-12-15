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
    isForwarded: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    
    // Scheduled message fields
    isScheduled: { type: Boolean, default: false },
    scheduledFor: { type: Date },
    scheduledSent: { type: Boolean, default: false },

    // Reply to multiple messages
    repliedTo: [{ type: Schema.Types.ObjectId, ref: "Message" }],

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
messageSchema.index({ isScheduled: 1, scheduledFor: 1, scheduledSent: 1 });

export default mongoose.model("Message", messageSchema);