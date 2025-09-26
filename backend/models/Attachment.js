import mongoose, { Schema } from "mongoose";

const attachmentSchema = new Schema(
  {
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true }, // image, video, doc, etc.
  },
  { timestamps: true }
);

export default mongoose.model("Attachment", attachmentSchema);
