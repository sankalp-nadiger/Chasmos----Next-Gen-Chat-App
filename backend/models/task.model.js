import mongoose, { Schema } from "mongoose";

const taskSchema = new Schema(
  {
    chat: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["not started", "started", "deprecated", "completed", "in review"],
      default: "not started",
    },
    document: { type: Schema.Types.ObjectId, ref: "Document" },
    contributors: [{ type: Schema.Types.ObjectId, ref: "User" }],
    assigner: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
