import { google } from 'googleapis';
import asyncHandler from 'express-async-handler';
import dotenv from 'dotenv';
dotenv.config();
// Ensure these environment variables are set in your .env file
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI; // e.g., http://localhost:5000/api/contacts/google/callback

/*if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.warn("⚠️ Google OAuth environment variables (ID, SECRET, URI) are missing. Contacts sync will be disabled.");
}*/

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Define the scopes needed. 'contacts.readonly' is for reading contacts.
export const CONTACTS_SCOPES = [
    'https://www.googleapis.com/auth/contacts.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
];

export const getAuthUrl = () => {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline', // crucial for getting a refresh token
        scope: CONTACTS_SCOPES,
        prompt: 'consent' // ensures refresh token is requested even after first time
    });
};

export const getOAuth2Client = () => {
    return oauth2Client;
};

export default { getAuthUrl, getOAuth2Client, CONTACTS_SCOPES };