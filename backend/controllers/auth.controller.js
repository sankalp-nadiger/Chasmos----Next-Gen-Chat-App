import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import generateToken from "../config/generatetoken.js";
import { google } from "googleapis";

export const handleGoogleAuth = asyncHandler(async (req, res) => {
  // Accept either `idToken` or `credential` (frontend may send `credential`)
  const { idToken, credential } = req.body;
  const token = idToken || credential;

  // Verify the token and get user info
  const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  const { email, name, picture: avatar } = payload || {};

  // Check if user exists
  let user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    // If user exists, return user data (login flow)
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
      phoneNumber: user.phoneNumber,
      token: generateToken(user._id),
      isExistingUser: true,
      isNewUser: false
    });
  } else {
    // If user doesn't exist, return Google data for signup completion
    // The frontend will show the completion form (phone/password/avatar optional)
    // and call `/api/auth/google/complete-signup` to create the account.
    res.status(200).json({
      email,
      name,
      avatar,
      isExistingUser: false,
      isNewUser: true,
      googleData: payload
    });
  }
});

export const completeGoogleSignup = asyncHandler(async (req, res) => {
  const { 
    email, 
    name, 
    avatar, 
    phoneNumber, 
    password = "", // Optional
    enableGoogleContacts 
  } = req.body;

  // Validate required fields (phone number is optional)
  if (!email || !name) {
    res.status(400);
    throw new Error("Please provide at least name and email");
  }

  // Check if user exists by email
  const existingByEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingByEmail) {
    res.status(400);
    throw new Error("User already exists with this email");
  }

  // If phoneNumber was provided, ensure it's unique
  if (phoneNumber) {
    const existingByPhone = await User.findOne({ phoneNumber });
    if (existingByPhone) {
      res.status(400);
      throw new Error("User already exists with this phone number");
    }
  }

  // Create user (include phoneNumber only if provided)
  const userPayload = {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: password || Math.random().toString(36).slice(-8), // Generate random password if not provided
    avatar,
    googleId: email, // Using email as googleId for now
    googleContactsSyncEnabled: enableGoogleContacts
  };
  if (phoneNumber) userPayload.phoneNumber = phoneNumber;

  const user = await User.create(userPayload);

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
      phoneNumber: user.phoneNumber,
      googleContactsSyncEnabled: user.googleContactsSyncEnabled,
      token: generateToken(user._id)
    });
  } else {
    res.status(400);
    throw new Error("Failed to create user");
  }
});