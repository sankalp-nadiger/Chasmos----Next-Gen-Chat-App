import mongoose, { Schema } from "mongoose";

const documentSchema = new Schema(
  {
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    settings: {
      emotion: { type: String },
      depth: { type: String },
      clarity: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
