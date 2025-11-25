import mongoose, { Schema } from "mongoose";

const chatSchema = new Schema(
  {
    name: { type: String },
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    users: [{ type: Schema.Types.ObjectId, ref: "User" }],
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    admins: [{ type: Schema.Types.ObjectId, ref: "User" }],
    groupAdmin: { type: Schema.Types.ObjectId, ref: "User" },
    
    // Group settings
    groupSettings: {
      description: { type: String, default: "" },
      avatar: { type: String, default: "" },
      isPublic: { type: Boolean, default: false },
      inviteLink: { type: String, unique: true, sparse: true },
      allowInvites: { type: Boolean, default: true },
      maxMembers: { type: Number, default: 100 }
    },
    
    // Archive functionality (for group admins)
    isArchived: {
      type: Boolean,
      default: false
    },
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    archivedAt: Date,

    // For soft deletion
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    deletedAt: Date
  },
  { timestamps: true }
);

// Ensure both arrays stay in sync when saving
chatSchema.pre("save", function (next) {
  try {
    if (this.users && (!this.participants || this.participants.length === 0)) {
      this.participants = this.users;
    } else if (this.participants && (!this.users || this.users.length === 0)) {
      this.users = this.participants;
    }
  } catch (e) {
    // ignore sync errors
  }
  next();
});

// Generate invite link before save
chatSchema.pre("save", function (next) {
  if (this.isGroupChat && !this.groupSettings.inviteLink) {
    this.groupSettings.inviteLink = `chasmos_${this._id}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

chatSchema.index({ users: 1 });
chatSchema.index({ isGroupChat: 1, users: 1 });
chatSchema.index({ "groupSettings.inviteLink": 1 });

export default mongoose.model("Chat", chatSchema);