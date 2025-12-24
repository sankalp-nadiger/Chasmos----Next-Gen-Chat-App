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
    // Users who should still see this message's media even if they deleted the chat
    keepFor: [{ type: Schema.Types.ObjectId, ref: "User" }],
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
    }],

    // Poll reference
    poll: { type: Schema.Types.ObjectId, ref: "Poll" }
    ,
    // Mentioned users in this message (for @mentions in group chats)
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    // Delivery / read tracking
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    // For group chats: list of users who have read this message
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
    ,
    // For delivery tracking per-user (useful for group delivered state)
    deliveredBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
    ,
    // List of user ids who should NOT see this message when fetching messages
    excludeUsers: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] }
  },
  { timestamps: true }
);

// Index for better performance
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ "starredBy.user": 1 });
messageSchema.index({ "reactions.user": 1 });
messageSchema.index({ isScheduled: 1, scheduledFor: 1, scheduledSent: 1 });
// Index repliedTo for faster lookups when fetching referenced messages
messageSchema.index({ repliedTo: 1 });
// Index keepFor for faster lookups when filtering media visibility
messageSchema.index({ keepFor: 1 });
// Index mentions for fast unread-mention queries
messageSchema.index({ mentions: 1 });
// Index excludeUsers for efficient filtering of per-message visibility
messageSchema.index({ excludeUsers: 1 });

export default mongoose.model("Message", messageSchema);