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
    
    // Create a state JWT that includes user ID and optional origin for verification in callback
    const origin = req.query?.origin || '';
    const stateToken = jwt.sign({ id: userId, email: userEmail, origin }, process.env.JWT_SECRET, { expiresIn: '10m' });

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
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Sync Error</title></head><body><script>try{ if(window.opener && !window.opener.closed) window.opener.postMessage({type:'google_sync', success:false, error:'missing_state'}, '*'); }catch(e){} try{ if(!window.opener||window.opener.closed){ if(${JSON.stringify(frontendUrl)}){ window.location.href = ${JSON.stringify(frontendUrl + '/chats?sync=error&reason=missing_state')}; } } }catch(e){} setTimeout(()=>{ try{ window.close(); }catch(e){} },800);</script><p>Missing state token. You can close this window.</p></body></html>`;
            return res.status(400).send(html);
        }

        let user;
        let decodedState = {};
        try {
            decodedState = jwt.verify(state, process.env.JWT_SECRET);
            user = await User.findById(decodedState.id).select('-password');
            if (!user) {
                console.error('User not found from state token');
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Sync Error</title></head><body><script>try{ if(window.opener && !window.opener.closed) window.opener.postMessage({type:'google_sync', success:false, error:'user_not_found', origin:${JSON.stringify(decodedState.origin||'')}}, '*'); }catch(e){} try{ if(!window.opener||window.opener.closed){ if(${JSON.stringify(frontendUrl)}){ window.location.href = ${JSON.stringify(frontendUrl + '/chats?sync=error&reason=user_not_found')}; } } }catch(e){} setTimeout(()=>{ try{ window.close(); }catch(e){} },800);</script><p>User not found. You can close this window.</p></body></html>`;
                return res.status(404).send(html);
            }
            console.log('User authenticated from state token:', user._id);
        } catch (err) {
            console.error('Invalid state token:', err);
            const frontendUrl = process.env.FRONTEND_URL || '';
            const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Sync Error</title></head><body><script>try{ if(window.opener && !window.opener.closed) window.opener.postMessage({type:'google_sync', success:false, error:'invalid_token', origin:${JSON.stringify(decodedState.origin||'')}}, '*'); }catch(e){} try{ if(!window.opener||window.opener.closed){ if(${JSON.stringify(frontendUrl)}){ window.location.href = ${JSON.stringify(frontendUrl + '/chats?sync=error&reason=invalid_token')}; } } }catch(e){} setTimeout(()=>{ try{ window.close(); }catch(e){} },800);</script><p>Invalid state token. You can close this window.</p></body></html>`;
            return res.status(400).send(html);
        }

        if (!code) {
            console.error("Authorization code missing");
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Sync Error</title></head><body><script>try{ if(window.opener && !window.opener.closed) window.opener.postMessage({type:'google_sync', success:false, error:'no_code'}, '*'); }catch(e){} try{ if(!window.opener||window.opener.closed){ if(${JSON.stringify(frontendUrl)}){ window.location.href = ${JSON.stringify(frontendUrl + '/chats?sync=error&reason=no_code')}; } } }catch(e){} setTimeout(()=>{ try{ window.close(); }catch(e){} },800);</script><p>Authorization code missing. You can close this window.</p></body></html>`;
            return res.status(400).send(html);
        }

        const oauth2Client = getOAuth2Client();

        // Exchange authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        console.log('googleCallback: tokens received from Google:', { has_access_token: Boolean(tokens.access_token), has_refresh_token: Boolean(tokens.refresh_token) });

        // Save tokens and sync status to the user model
        await User.findByIdAndUpdate(user._id, {
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token || user.googleRefreshToken,
            googleContactsSyncEnabled: true,
            lastContactsSync: new Date(),
        });
        const check = await User.findById(user._id).select('googleAccessToken googleRefreshToken');
        console.log('googleCallback: tokens saved to user document? ', { access: Boolean(check.googleAccessToken), refresh: Boolean(check.googleRefreshToken) });

        // Trigger immediate sync
        const syncResult = await _syncContactsInternal(user._id, oauth2Client);
        console.log('Sync result:', syncResult);

                // Generate a fresh JWT token for the user
                const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

                // Instead of redirecting (which can resolve relatively if FRONTEND_URL is missing),
                // respond with a small HTML page that posts a message to the opener window and closes itself.
                // This avoids showing a 404 at a relative path like `/api/auth/google/undefined/home`.
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                const originFromState = decodedState?.origin || '';
                const message = JSON.stringify({ type: 'google_sync', success: true, token, origin: originFromState });
                // Always redirect the popup to the frontend with the token in query string.
                // This ensures the frontend can reliably pick up the result (either via postMessage
                // or by reading the query) even if the opener missed the initial message.
                const encodedToken = encodeURIComponent(String(token));
                const redirectUrl = frontendUrl ? frontendUrl + '/chats?sync=success&token=' + encodedToken : '';
                const successHtml = `<!doctype html>
<html>
    <head>
        <meta charset="utf-8" />
        <title>Sync Complete</title>
    </head>
    <body>
        <script>
            try {
                if (window.opener && !window.opener.closed) {
                    try { window.opener.postMessage({ type: 'google_sync', success: true, token: ${JSON.stringify(token)}, origin: ${JSON.stringify(originFromState)} }, '*'); } catch(e) {}
                }
            } catch (e) { /* ignore */ }

            // Always navigate the popup to the frontend so the frontend can run logic
            // (e.g., re-post message or persist token) and then close the popup.
            try {
                if (${JSON.stringify(frontendUrl)}) {
                    window.location.href = ${JSON.stringify(frontendUrl + '/chats?sync=success&token=') } + encodeURIComponent(${JSON.stringify(token)});
                    return;
                }
            } catch (e) {}

            setTimeout(() => { try { window.close(); } catch (e) {} }, 500);
        </script>
        <p>Sync complete. You can close this window and hit the refresh icon in the Your Contacts section.</p>
    </body>
</html>`;

                return res.send(successHtml);
    } catch (error) {
                console.error('Error in googleCallback:', error);
                const frontendUrl = process.env.FRONTEND_URL || '';
                const errHtml = `<!doctype html>
<html>
    <head><meta charset="utf-8" /><title>Sync Error</title></head>
    <body>
        <script>
            try { if (window.opener && !window.opener.closed) window.opener.postMessage({ type: 'google_sync', success: false, error: ${JSON.stringify(error.message || 'server_error')} }, '*'); } catch (e) {}
            try { if (!window.opener || window.opener.closed) { if (${JSON.stringify(frontendUrl)}) { window.location.href = ${JSON.stringify(frontendUrl + '/home?sync=error')}; return; } } } catch(e) {}
            setTimeout(() => { try { window.close(); } catch (e) {} }, 1000);
        </script>
        <p>Sync failed. You can close this window.</p>
    </body>
</html>`;
                return res.status(500).send(errHtml);
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

// Trigger a contacts sync for the authenticated user regardless of the
// `googleContactsSyncEnabled` flag. If user lacks a refresh token, return a
// `googleConnectUrl` so frontend can send the user through consent flow.
export const triggerSyncForUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // If user has refresh token, perform sync
    if (user.googleRefreshToken) {
        try {
            const result = await performSyncForUser(user._id, { force: true });
            return res.status(200).json({ success: true, count: result.count, data: result.contacts });
        } catch (err) {
            console.error('Error during forced sync:', err);
            return res.status(500).json({ success: false, message: 'Failed to sync contacts', error: err.message });
        }
    }

    // No refresh token — generate connect URL to prompt consent
    try {
        const oauth2Client = getOAuth2Client();
        const origin = req.body?.origin || '';
        const stateToken = jwt.sign({ id: user._id, email: user.email, origin }, process.env.JWT_SECRET, { expiresIn: '10m' });
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: CONTACTS_SCOPES,
            login_hint: user.email,
            prompt: 'consent',
            state: stateToken,
        });

        return res.status(200).json({ success: false, needsGoogleConnect: true, googleConnectUrl: url });
    } catch (err) {
        console.error('Failed to generate google connect url:', err);
        res.status(500);
        throw new Error('Failed to generate google connect url');
    }
});

// Public helper to perform sync for a given user ID (used by login flows)
export const performSyncForUser = async (userId, options = {}) => {
    const force = options?.force === true;
    const user = await User.findById(userId);
    console.log('Performing contact sync for user:', userId, 'force=', force);
    if (!user) throw new Error('User not found');
    if (!force && !user.googleContactsSyncEnabled) throw new Error('Google contacts sync not enabled');
    if (!user.googleRefreshToken) throw new Error('No google refresh token available');

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });

    // Refresh access token
    const { credentials } = await oauth2Client.refreshAccessToken();
    if (credentials?.access_token) {
        await User.findByIdAndUpdate(userId, { googleAccessToken: credentials.access_token, lastContactsSync: new Date() });
    }

    const result = await _syncContactsInternal(userId, oauth2Client);
    return result;
}