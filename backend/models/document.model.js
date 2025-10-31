import mongoose, { Schema } from "mongoose";

const documentSchema = new Schema(
  {
    fileUrl: { 
      type: String, 
      required: true 
    },
    filePath: { 
      type: String, 
      required: true 
    },
    fileType: { 
      type: String, 
      required: true 
    },
    originalName: { 
      type: String,
      required: true
    },
    fileSize: { 
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    settings: {
      emotion: { 
        type: String, 
        enum: ["neutral", "formal", "casual", "professional"],
        default: "neutral"
      },
      depth: { 
        type: String, 
        enum: ["brief", "detailed", "comprehensive"],
        default: "detailed"
      },
      clarity: { 
        type: String, 
        enum: ["simple", "clear", "technical"],
        default: "clear"
      },
    },
    context: {
      type: String,
      default: ""
    },
    ocrData: {
      type: Schema.Types.Mixed
    },
    questions: [{
      question: String,
      answer: String,
      askedAt: {
        type: Date,
        default: Date.now
      }
    }],
    isProcessed: {
      type: Boolean,
      default: false
    },
    processingStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending"
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

documentSchema.index({ createdBy: 1, updatedAt: -1 });

export default mongoose.model("Document", documentSchema);