import mongoose, { Schema } from "mongoose";

const sprintSchema = new Schema(
  {
    title: { 
      type: String, 
      required: true,
      trim: true
    },
    description: { 
      type: String 
    },
    chat: { 
      type: Schema.Types.ObjectId, 
      ref: "Chat", 
      required: true 
    },
    startDate: { 
      type: Date, 
      required: true 
    },
    endDate: { 
      type: Date, 
      required: true 
    },
    status: {
      type: String,
      enum: ["planned", "active", "completed", "cancelled"],
      default: "planned"
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    goals: [{
      type: String,
      trim: true
    }],
    velocity: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

sprintSchema.virtual('durationDays').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

sprintSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now && this.status === 'active';
});

sprintSchema.index({ chat: 1, status: 1 });
sprintSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.model("Sprint", sprintSchema);