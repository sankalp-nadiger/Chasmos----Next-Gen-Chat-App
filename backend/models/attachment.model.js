import mongoose, { Schema } from "mongoose";

const attachmentSchema = new Schema(
  {
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true }, // image, video, doc, etc.
    fileName: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String },
    uploader: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model("Attachment", attachmentSchema);