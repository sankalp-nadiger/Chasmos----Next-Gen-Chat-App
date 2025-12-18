import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import generateToken from "../config/generatetoken.js";
import { google } from "googleapis";
import { getOAuth2Client, CONTACTS_SCOPES } from "../config/google-auth.config.js";

/**
 * GOOGLE LOGIN / CHECK USER
 * Called immediately after Google Sign-In
 */
export const handleGoogleAuth = asyncHandler(async (req, res) => {
  const { idToken, credential } = req.body;
  const token = idToken || credential;

  if (!token) {
    res.status(400);
    throw new Error("No token provided");
  }

  const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { email, name, picture: avatar } = payload || {};

  if (!email) {
    res.status(400);
    throw new Error("Invalid Google token");
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // ---------------- EXISTING USER → LOGIN ----------------
  if (user) {
    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      phoneNumber: user.phoneNumber,
      isAdmin: user.isAdmin,
      isBusiness: user.isBusiness,
      businessCategory: user.businessCategory,
      token: generateToken(user._id),
      isExistingUser: true,
      isNewUser: false,
    });
  }

  // ---------------- NEW USER → COMPLETE SIGNUP ----------------
  res.status(200).json({
    email,
    name,
    avatar,
    isExistingUser: false,
    isNewUser: true,
    googleData: payload,
  });
});

/**
 * COMPLETE GOOGLE SIGNUP
 * Called after user fills extra details form
 */
export const completeGoogleSignup = asyncHandler(async (req, res) => {
  const {
    email,
    name,
    avatar,
    phoneNumber,
    password = "",
    enableGoogleContacts,

    // 🔥 BUSINESS FIELDS
    isBusiness,
    businessCategory,
    bio,
  } = req.body;

  if (!email || !name) {
    res.status(400);
    throw new Error("Name and email are required");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(400);
    throw new Error("User already exists with this email");
  }

  if (phoneNumber) {
    const existingByPhone = await User.findOne({ phoneNumber });
    if (existingByPhone) {
      res.status(400);
      throw new Error("User already exists with this phone number");
    }
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: password || Math.random().toString(36).slice(-8),
    phoneNumber,
    avatar:
      avatar ||
      "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    bio: bio || "Hey there! I am using Chasmos.",

    // ✅ GOOGLE
    googleId: email,
    googleContactsSyncEnabled: Boolean(enableGoogleContacts),

    // ✅ BUSINESS
    isBusiness: Boolean(isBusiness),
    businessCategory: isBusiness ? businessCategory : "",
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    phoneNumber: user.phoneNumber,
    bio: user.bio,
    isAdmin: user.isAdmin,
    isBusiness: user.isBusiness,
    businessCategory: user.businessCategory,
    googleContactsSyncEnabled: user.googleContactsSyncEnabled,
    token: generateToken(user._id),
  });
});
