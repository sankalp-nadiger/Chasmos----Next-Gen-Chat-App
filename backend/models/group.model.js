// models/group.model.js
import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },
    avatar: { type: String, default: "" },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Multiple admins support
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    inviteLink: { type: String, default: "" },
    
    // ✅ Permissions
    permissions: {
      allowCreatorAdmin: { type: Boolean, default: true },
      allowOthersAdmin: { type: Boolean, default: false },
      allowMembersAdd: { type: Boolean, default: true },
    },
    
    // ✅ Features
    features: {
      // Casual features
      media: { type: Boolean, default: true },
      gallery: { type: Boolean, default: true },
      docs: { type: Boolean, default: true },
      polls: { type: Boolean, default: true },
      
      // Business features
      taskManagement: { type: Boolean, default: false },
      sprintManagement: { type: Boolean, default: false },
      meets: { type: Boolean, default: false },
      collaborativeDocs: { type: Boolean, default: false },
      threads: { type: Boolean, default: false },
      mentions: { type: Boolean, default: false },
      
      // Business add-ons
      businessDirectory: { type: Boolean, default: false },
      organizationProfile: { type: Boolean, default: false },
      aiAssistance: { type: Boolean, default: false },
    },
    
    groupType: { type: String, enum: ["Casual", "Business"], default: "Casual" },
    inviteEnabled: { type: Boolean, default: false },
    // Track users who left and when. Arrays kept in parallel order: leftBy[i] leftAt[i]
    leftBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    leftAt: [{ type: Date }],
  },
  { timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);
export default Group;