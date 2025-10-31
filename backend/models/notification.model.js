import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["task_created", "task_updated", "task_assigned", "task_completed", "sprint_created", "sprint_updated"],
      required: true
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task"
    },
    sprint: {
      type: Schema.Types.ObjectId,
      ref: "Sprint"
    },
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true
    },
    recipients: [{
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }],
    message: {
      type: String,
      required: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readBy: [{
      user: { type: Schema.Types.ObjectId, ref: "User" },
      readAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

notificationSchema.index({ recipients: 1, isRead: 1 });
notificationSchema.index({ chat: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);