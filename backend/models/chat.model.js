import mongoose, { Schema } from "mongoose";

const chatSchema = new Schema(
  {
    name: { type: String },
    isGroupChat: { type: Boolean, default: false },
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    admins: [{ type: Schema.Types.ObjectId, ref: "User" }], // multiple admins
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);
