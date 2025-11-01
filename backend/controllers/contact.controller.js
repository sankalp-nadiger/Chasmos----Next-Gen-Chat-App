import asyncHandler from "express-async-handler";
import { getAuthUrl, getOAuth2Client } from "../config/google-auth.config.js";
import { google } from "googleapis";
import User from "../models/user.model.js";

// --- OAuth Flow Handlers ---

export const googleConnect = asyncHandler(async (req, res) => {
    // Redirect to Google for authorization
    const url = getAuthUrl();
    res.send({ url }); // Send the URL to the frontend for redirection
});

export const googleCallback = asyncHandler(async (req, res) => {
    const { code } = req.query;
    const user = req.user; // User authenticated via JWT in protect middleware

    if (!code) {
        throw new Error("Authorization code missing.");
    }

    const oauth2Client = getOAuth2Client();

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save tokens and sync status to the user model
    await User.findByIdAndUpdate(user._id, {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token || user.googleRefreshToken,
        googleContactsSyncEnabled: true,
        lastContactsSync: new Date(),
    });

    // Optionally trigger an immediate sync
    await _syncContactsInternal(user._id, oauth2Client);

    // Redirect or send success response to the frontend
    res.redirect(`${process.env.FRONTEND_URL}/home?sync=success`); 
});


// --- Contact Sync Logic ---

const _syncContactsInternal = async (userId, oauth2Client) => {
    const people = google.people({ version: 'v1', auth: oauth2Client });
    
    // Fetch up to 1000 contacts, requesting name and phone number fields
    const response = await people.people.connections.list({
        resourceName: 'people/me',
        personFields: 'names,emailAddresses,phoneNumbers,photos',
        pageSize: 1000,
    });

    const connections = response.data.connections;

    if (!connections || connections.length === 0) {
        console.log(`User ${userId} has no Google contacts to sync.`);
        return { count: 0 };
    }
    
    const syncedContacts = connections.map(person => {
        const name = person.names?.[0]?.displayName;
        const email = person.emailAddresses?.[0]?.value;
        const phone = person.phoneNumbers?.[0]?.value;
        const avatar = person.photos?.[0]?.url;

        // Logic to either create a new user or match an existing user in your DB
        // For simplicity, we'll return the raw data here.
        return {
            name,
            email,
            phone,
            avatar,
            isGoogleContact: true,
        };
    }).filter(c => c.name); // Filter out contacts with no name

    // TODO: Implement logic to process and store syncedContacts:
    // 1. Check if a User already exists with the matching email/phone.
    // 2. If not, consider creating a new 'Contact' document (or a specialized 'GoogleContact' model) for them.
    // 3. Since 'Chasmos' is a chat app, you likely want to link these to discoverable users.

    return { count: syncedContacts.length, contacts: syncedContacts };
};


export const syncGoogleContacts = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user.googleContactsSyncEnabled || !user.googleRefreshToken) {
        res.status(400);
        throw new Error("Google Contacts sync is not enabled for this user.");
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
        refresh_token: user.googleRefreshToken,
    });

    // Use token refresh mechanism (automatic with the `googleapis` library)
    const { credentials } = await oauth2Client.refreshAccessToken();

    // Update the database with the new access token
    await User.findByIdAndUpdate(user._id, {
        googleAccessToken: credentials.access_token,
        lastContactsSync: new Date(),
    });
    
    // Perform the sync
    const syncResult = await _syncContactsInternal(user._id, oauth2Client);

    res.status(200).json({
        success: true,
        message: `Successfully synced ${syncResult.count} contacts.`,
        data: syncResult.contacts,
    });
});