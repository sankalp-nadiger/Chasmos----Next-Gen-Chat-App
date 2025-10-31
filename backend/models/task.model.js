import mongoose, { Schema } from "mongoose";

const taskSchema = new Schema(
  {
    title: { 
      type: String, 
      required: true,
      trim: true
    },
    description: { 
      type: String, 
      required: true 
    },
    chat: { 
      type: Schema.Types.ObjectId, 
      ref: "Chat", 
      required: true 
    },
    sprint: { 
      type: Schema.Types.ObjectId, 
      ref: "Sprint" 
    },
    status: {
      type: String,
      enum: ["backlog", "todo", "in_progress", "in_review", "done", "cancelled"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },
    assignees: [{ 
      type: Schema.Types.ObjectId, 
      ref: "User" 
    }],
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    dueDate: {
      type: Date
    },
    tags: [{
      type: String,
      trim: true
    }],
    estimatedHours: {
      type: Number,
      min: 0
    },
    actualHours: {
      type: Number,
      min: 0,
      default: 0
    },
    attachments: [{
      type: Schema.Types.ObjectId,
      ref: "Attachment"
    }],
    comments: [{
      user: { type: Schema.Types.ObjectId, ref: "User" },
      comment: String,
      createdAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

taskSchema.index({ chat: 1, sprint: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ assignees: 1 });
taskSchema.index({ dueDate: 1 });

export default mongoose.model("Task", taskSchema);