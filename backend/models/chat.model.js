import mongoose, { Schema } from "mongoose";

const chatSchema = new Schema(
  {
    name: { type: String },
    isGroupChat: { type: Boolean, default: false },
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    // Keep both `users` and `participants` to support existing controller code
    users: [{ type: Schema.Types.ObjectId, ref: "User" }],
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    admins: [{ type: Schema.Types.ObjectId, ref: "User" }], // multiple admins

    //Archive functionality (for group admins)
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

// Ensure both arrays stay in sync when saving (covers code that sets either field)
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

export default mongoose.model("Chat", chatSchema);