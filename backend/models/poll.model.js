import mongoose, { Schema } from "mongoose";

const pollSchema = new Schema(
  {
    question: { 
      type: String, 
      required: true,
      trim: true 
    },
    description: { 
      type: String, 
      trim: true 
    },
    options: [{
      _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
      text: { 
        type: String, 
        required: true,
        trim: true 
      },
      votes: [{
        user: { type: Schema.Types.ObjectId, ref: "User" },
        votedAt: { type: Date, default: Date.now }
      }]
    }],
    chat: { 
      type: Schema.Types.ObjectId, 
      ref: "Chat",
      required: true 
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User",
      required: true 
    },
    isClosed: { 
      type: Boolean, 
      default: false 
    },
    closedAt: { type: Date },
    allowMultipleVotes: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Index for better performance
pollSchema.index({ chat: 1, createdAt: -1 });
pollSchema.index({ "options.votes.user": 1 });

export default mongoose.model("Poll", pollSchema);
