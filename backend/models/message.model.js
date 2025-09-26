import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, trim: true },
    chat: { type: Schema.Types.ObjectId, ref: "Chat" },
    documentSession: { type: Schema.Types.ObjectId, ref: "Document" },
    attachments: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
