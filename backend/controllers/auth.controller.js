import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import generateToken from "../config/generatetoken.js";
import { google } from "googleapis";
import { getOAuth2Client, CONTACTS_SCOPES } from "../config/google-auth.config.js";
import jwt from 'jsonwebtoken';
import { performSyncForUser } from './contact.controller.js';

/**
 * GOOGLE LOGIN / CHECK USER
 * Called immediately after Google Sign-In
 */
export const handleGoogleAuth = asyncHandler(async (req, res) => {
  // Support two flows from the frontend:
  // 1) Authorization code flow: { code }
  // 2) ID token / credential flow: { idToken } or { credential }
  const { code, idToken, credential } = req.body;
  console.log('handleGoogleAuth: invoked with body:', { body: req.body });
  // If an authorization code was provided, exchange it server-side for tokens
  if (code) {
    console.log('handleGoogleAuth: received code from client');
    console.log('handleGoogleAuth: request body:', { body: req.body });
    // Codes issued via the JS popup client use the special 'postmessage' redirect
    // target. Create a transient OAuth2 client with that redirect to exchange the code.
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'postmessage'
    );
    try {
      const { tokens } = await oauth2Client.getToken(code);
      console.log('handleGoogleAuth: tokens received from Google:', { has_access_token: Boolean(tokens.access_token), has_refresh_token: Boolean(tokens.refresh_token) });
      oauth2Client.setCredentials(tokens);

      // Fetch userinfo from Google using the obtained tokens
      const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
      const { data: userinfo } = await oauth2.userinfo.get();
      const email = (userinfo.email || '').toLowerCase();

      if (!email) {
        res.status(400);
        throw new Error('Unable to retrieve email from Google');
      }

      let user = await User.findOne({ email });
      console.log('handleGoogleAuth: found user?', !!user, 'email=', email);

      // If existing user, persist tokens and optionally trigger sync
      if (user) {
        console.log('handleGoogleAuth: persisting access/refresh tokens to user', user._id);
        user.googleAccessToken = tokens.access_token || user.googleAccessToken;
        if (tokens.refresh_token) user.googleRefreshToken = tokens.refresh_token;
        await user.save();
        const reloaded = await User.findById(user._id).select('googleAccessToken googleRefreshToken');
        console.log('handleGoogleAuth: after save, tokens on user:', { access: Boolean(reloaded.googleAccessToken), refresh: Boolean(reloaded.googleRefreshToken) });

        const baseResponse = {
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
        };

        try {
          if (user.googleContactsSyncEnabled) {
            if (user.googleRefreshToken) {
              await performSyncForUser(user._id);
              baseResponse.googleContactsSynced = true;
            } else {
              // If no refresh token after exchange, request consent explicitly
              const stateToken = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '10m' });
              const connectUrl = oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: CONTACTS_SCOPES,
                login_hint: user.email,
                prompt: 'consent',
                state: stateToken,
              });
              baseResponse.needsGoogleConnect = true;
              baseResponse.googleConnectUrl = connectUrl;
            }
          }
        } catch (err) {
          console.error('Auto-sync failed after code exchange for user', user._id, err);
          baseResponse.googleContactsSynced = false;
          baseResponse.googleSyncError = err.message || 'sync_failed';
        }

        return res.status(200).json(baseResponse);
      }

      // New user: return userinfo + tokens so frontend can continue signup and optionally pass tokens to create account
      return res.status(200).json({
        email: userinfo.email,
        name: userinfo.name,
        avatar: userinfo.picture,
        isExistingUser: false,
        isNewUser: true,
        googleData: userinfo,
        googleTokens: tokens,
      });
    } catch (err) {
      console.error('Error exchanging Google authorization code', err);
      res.status(500);
      throw new Error(err.message || 'Failed to exchange authorization code');
    }
  }

  // Fallback: ID token / credential flow (existing behavior)
  const token = idToken || credential;

  if (!token) {
    res.status(400);
    throw new Error('No token provided');
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
    throw new Error('Invalid Google token');
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // ---------------- EXISTING USER → LOGIN ----------------
  if (user) {
    const baseResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      // Prefer stored DB avatar, otherwise use Google's picture from token payload
      avatar: user.avatar || avatar || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
      phoneNumber: user.phoneNumber,
      isAdmin: user.isAdmin,
      isBusiness: user.isBusiness,
      businessCategory: user.businessCategory,
      token: generateToken(user._id),
      isExistingUser: true,
      isNewUser: false,
    };

    // If user has enabled contacts sync, try to sync now. If refresh token is missing, include connect URL.
    try {
      if (user.googleContactsSyncEnabled) {
        console.log('Auto-syncing Google contacts for user', user._id);
        if (user.googleRefreshToken) {
          console.log('Found refresh token, performing sync for user', user._id);
          await performSyncForUser(user._id);
          baseResponse.googleContactsSynced = true;
        } else {
          console.log('No refresh token, generating connect URL for user', user._id);
          // Generate per-user connect URL with state so frontend can redirect user to consent flow
          const oauth2Client = getOAuth2Client();
          const stateToken = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '10m' });
          const connectUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: CONTACTS_SCOPES,
            login_hint: user.email,
            prompt: 'consent',
            state: stateToken,
          });
          baseResponse.needsGoogleConnect = true;
          baseResponse.googleConnectUrl = connectUrl;
        }
      }
    } catch (err) {
      console.error('Auto-sync failed during Google login for user', user._id, err);
      baseResponse.googleContactsSynced = false;
      baseResponse.googleSyncError = err.message || 'sync_failed';
    }

    return res.status(200).json(baseResponse);
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
    // optional tokens from prior code exchange
    googleTokens,
    googleAccessToken,
    googleRefreshToken,

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

    // persist tokens if provided
    googleAccessToken: (googleTokens && googleTokens.access_token) || googleAccessToken || undefined,
    googleRefreshToken: (googleTokens && googleTokens.refresh_token) || googleRefreshToken || undefined,

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
