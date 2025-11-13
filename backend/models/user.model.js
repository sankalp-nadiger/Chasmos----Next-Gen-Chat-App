import mongoose from "mongoose";
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
    // Stores emails of users who have sent a chat/invite request to this user
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
 //Fields for Google Contacts Integration
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