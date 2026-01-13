import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phoneNumber: { 
      type: String, 
      required: true, 
      unique: true
    },
    avatar: { 
      type: String,
      default: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
    },
    bio: {
      type: String,
      default: "Hey there! I am using Chasmos."
    },
    
    // User settings
    settings: {
      notifications: {
        type: Boolean,
        default: true
      },
      sound: {
        type: Boolean,
        default: true
      }
    },
    
    // Chat request fields
    receivedChatRequests: [
      {
        email: { type: String },
        message: { type: String, default: "" },
        date: { type: Date, default: Date.now },
      },
    ],

    sentChatRequests: [
      {
        email: { type: String },
        message: { type: String, default: "" },
        date: { type: Date, default: Date.now },
      },
    ],

    // Stores emails of users who accepted this user's chat requests
    acceptedChatRequests: [{
      type: String
    }],
    
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    
    // Fields for Google Contacts Integration
    googleId: { 
      type: String, 
      unique: true, 
      sparse: true // Allows multiple null values
    },
    googleAccessToken: { 
      type: String 
    },
    googleRefreshToken: { 
      type: String 
    },
    lastContactsSync: { 
      type: Date 
    },
    googleContactsSyncEnabled: {
      type: Boolean,
      default: false
    },
    // Password reset OTP fields
    passwordResetOTP: {
      type: String,
    },
    passwordResetOTPExpires: {
      type: Date,
    },
    passwordResetVerified: {
      type: Boolean,
      default: false,
    },
    // Stored synced Google contacts (basic info needed for NewChat / GroupCreation)
    googleContacts: [
      {
        name: { type: String },
        email: { type: String, lowercase: true },
        phone: { type: String },
        avatar: { type: String },
        googleId: { type: String }
      }
    ],

    // Block functionality
    blockedUsers: [{
      type: Schema.Types.ObjectId,
      ref: "User"
    }],
    
    //Archive functionality for chats
    archivedChats: [{
      chat: {
        type: Schema.Types.ObjectId,
        ref: "Chat"
      },
      archivedAt: {
        type: Date,
        default: Date.now
      }
    }],
    isBusiness: {
      type: Boolean,
      default: false
    },
    businessCategory: {
      type: String,
      default: ""
    },
    // Auto message for business accounts
    autoMessageEnabled: {
      type: Boolean,
      default: false
    },
    autoMessageText: {
      type: String,
      default: ""
    },
    autoMessageImage: {
      type: String,
      default: ""
    }
  },
  
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", userSchema);

export default User;