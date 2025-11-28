import asyncHandler from "express-async-handler";
import { getAuthUrl, getOAuth2Client, CONTACTS_SCOPES } from "../config/google-auth.config.js";
import { google } from "googleapis";
import User from "../models/user.model.js";
import jwt from 'jsonwebtoken';

// --- OAuth Flow Handlers ---

export const googleConnect = asyncHandler(async (req, res) => {
    // Get current user from the protected route middleware
    const userId = req.user._id;
    const userEmail = req.user.email;
    
    const oauth2Client = getOAuth2Client();
    
    // Create a state JWT that includes user ID for verification in callback
    const stateToken = jwt.sign({ id: userId, email: userEmail }, process.env.JWT_SECRET, { expiresIn: '10m' });

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: CONTACTS_SCOPES,
        // login_hint pre-selects the account (no selection screen shown)
        login_hint: userEmail,
        // prompt: none would skip consent if already granted, but we need consent for new permissions
        // Use 'consent' but with login_hint to avoid re-selection
        prompt: 'consent',
        state: stateToken
    });

    console.log('Google Connect URL generated for user:', userEmail);
    res.json({ url }); // Send the URL to the frontend for redirection
});

export const googleCallback = asyncHandler(async (req, res) => {
    try {
        console.log('Google callback received. Query params:', req.query);
        const { code, state } = req.query;
        
        // Decode the state JWT to get the user ID
        if (!state) {
            console.error('Missing state token');
            return res.redirect(`${process.env.FRONTEND_URL}/home?sync=error&reason=missing_state`);
        }

        let user;
        try {
            const decoded = jwt.verify(state, process.env.JWT_SECRET);
            user = await User.findById(decoded.id).select('-password');
            if (!user) {
                console.error('User not found from state token');
                return res.redirect(`${process.env.FRONTEND_URL}/home?sync=error&reason=user_not_found`);
            }
            console.log('User authenticated from state token:', user._id);
        } catch (err) {
            console.error('Invalid state token:', err);
            return res.redirect(`${process.env.FRONTEND_URL}/home?sync=error&reason=invalid_token`);
        }

        if (!code) {
            console.error("Authorization code missing");
            return res.redirect(`${process.env.FRONTEND_URL}/home?sync=error&reason=no_code`);
        }

        const oauth2Client = getOAuth2Client();

        // Exchange authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        console.log('Got tokens from Google. Access token:', tokens.access_token ? 'present' : 'missing');

        // Save tokens and sync status to the user model
        await User.findByIdAndUpdate(user._id, {
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token || user.googleRefreshToken,
            googleContactsSyncEnabled: true,
            lastContactsSync: new Date(),
        });
        console.log('Tokens saved to user document');

        // Trigger immediate sync
        const syncResult = await _syncContactsInternal(user._id, oauth2Client);
        console.log('Sync result:', syncResult);

        // Generate a fresh JWT token for the user
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Redirect with success and include token in URL
        res.redirect(`${process.env.FRONTEND_URL}/home?sync=success&token=${encodeURIComponent(token)}`); 
    } catch (error) {
        console.error('Error in googleCallback:', error);
        res.redirect(`${process.env.FRONTEND_URL}/home?sync=error&reason=server_error`);
    }
});


// --- Contact Sync Logic ---

const _syncContactsInternal = async (userId, oauth2Client) => {
    try {
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

            return {
                name,
                email,
                phone,
                avatar,
                isGoogleContact: true,
            };
        }).filter(c => c.name); // Filter out contacts with no name
        
        // Deduplicate by email (preferred) or phone
        const uniq = {};
        const normalized = [];
        for (const c of syncedContacts) {
            const key = (c.email || c.phone || c.name).toString().toLowerCase();
            if (!key) continue;
            if (!uniq[key]) {
                uniq[key] = true;
                normalized.push({
                    name: c.name,
                    email: c.email,
                    phone: c.phone,
                    avatar: c.avatar,
                    googleId: c.email || undefined
                });
            }
        }

        // Save to user document (replace previous googleContacts)
        await User.findByIdAndUpdate(userId, { 
            googleContacts: normalized, 
            lastContactsSync: new Date() 
        });

        console.log(`Successfully synced ${normalized.length} contacts for user ${userId}`);
        return { count: normalized.length, contacts: normalized };
    } catch (err) {
        console.error('Failed to sync contacts for user', userId, err);
        throw err;
    }
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

// Return stored google contacts for the current user
export const getGoogleContacts = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('googleContacts');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    res.status(200).json({ data: user.googleContacts || [] });
});