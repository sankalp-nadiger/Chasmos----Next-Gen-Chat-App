import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 20,
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  icon: {
    type: String,
    default: "",
  },
  inviteLink: {
    type: String,
    default: "",
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true,
  },
}, { timestamps: true });

export default mongoose.model("Group", groupSchema);
