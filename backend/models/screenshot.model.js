import mongoose, { Schema } from "mongoose";

const screenshotSchema = new Schema(
  {
    chat: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    capturedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    imageUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number },
    mimeType: { type: String, default: "image/png" },
    dimensions: {
      width: { type: Number },
      height: { type: Number }
    },
    systemMessage: { type: Schema.Types.ObjectId, ref: "Message" }, // Reference to the system message created
    metadata: {
      userAgent: String,
      timestamp: Date,
      chatName: String
    }
  },
  { timestamps: true }
);

// Index for better performance
screenshotSchema.index({ chat: 1, createdAt: -1 });
screenshotSchema.index({ capturedBy: 1 });

export default mongoose.model("Screenshot", screenshotSchema);
