import mongoose, { Schema } from "mongoose";

const chatSchema = new Schema(
  {
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    users: [{ type: Schema.Types.ObjectId, ref: "User" }],
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    admins: [{ type: Schema.Types.ObjectId, ref: "User" }],
    groupAdmin: { type: Schema.Types.ObjectId, ref: "User" },
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    isArchived: { type: Boolean, default: false },
    archivedBy: { type: Schema.Types.ObjectId, ref: "User" },
    archivedAt: { type: Date }
  },
  { timestamps: true }
);

chatSchema.index({ users: 1 });
chatSchema.index({ isGroupChat: 1, users: 1 });

export default mongoose.model("Chat", chatSchema);