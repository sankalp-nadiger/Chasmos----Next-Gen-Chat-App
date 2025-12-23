import React, { useEffect, useRef } from "react";

/**
 * GoogleLoginButton
 * Props:
 * - clientId (optional) — falls back to VITE_GOOGLE_CLIENT_ID if not provided
 * - onSuccess(credentialResponse) — callback with Google response (response.credential)
 * - onError(err) — optional error callback
 */
const GoogleLoginButton = ({ clientId, onSuccess, onError, buttonId = "google-login-btn", shape = "rectangular", useCode = true }) => {
  const containerRef = useRef(null);
  const finalClientId = clientId || import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!finalClientId) {
      console.error("VITE_GOOGLE_CLIENT_ID is not set in environment variables.");
      onError && onError(new Error("Missing Google Client ID"));
      return;
    }
    // Ensure the Google Identity Services script is loaded
    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    const onScriptReady = () => {
      // Wait until google.accounts is available
      const tryInit = () => {
        if (!window.google || !window.google.accounts) {
          // try again shortly
          setTimeout(tryInit, 200);
          return;
        }

        try {
          if (useCode && window.google.accounts.oauth2 && window.google.accounts.oauth2.initCodeClient) {
            console.log('GoogleLoginButton: using oauth2.initCodeClient (auth-code flow)');
            if (!window.google.accounts.oauth2.initCodeClient) {
              console.warn('initCodeClient not available despite check');
            }

          // Initialize the OAuth2 code client for server-side exchange
          const codeClient = window.google.accounts.oauth2.initCodeClient({
            client_id: finalClientId,
            scope: 'openid email profile https://www.googleapis.com/auth/contacts.readonly',
            ux_mode: 'popup',
            // Request offline access and force consent to get a refresh token
            access_type: 'offline',
            prompt: 'consent',
            callback: (resp) => {
              if (resp && resp.code) {
                onSuccess && onSuccess({ code: resp.code });
              } else {
                onError && onError(new Error('No auth code returned'));
              }
            },
          });

          // Render a simple button that triggers requestCode when clicked
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'w-full py-2 px-4 rounded-md bg-white border text-sm flex items-center justify-center';
          btn.innerHTML = `
            <span style="display:inline-flex;align-items:center;">
              <img src="https://www.google.com/favicon.ico" width="18" height="18" alt="Google" style="display:block;vertical-align:middle;">
              <span style="margin-left:10px;">Continue with Google</span>
            </span>
          `;
          btn.onclick = (e) => {
            e.preventDefault();
            try {
              codeClient.requestCode();
            } catch (err) {
              console.error('Failed to request auth code', err);
              onError && onError(err);
            }
          };

          if (containerRef.current) {
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(btn);
          }
          } else if (window.google.accounts.id) {
            console.log('GoogleLoginButton: falling back to id token flow (accounts.id)');
            // Fallback to ID token flow if code client isn't available
            window.google.accounts.id.initialize({
              client_id: finalClientId,
              callback: (response) => {
                console.log('GoogleLoginButton: id callback', response && !!response.credential);
                if (response && response.credential) {
                  onSuccess && onSuccess(response);
                } else {
                  onError && onError(new Error('No credential returned'));
                }
              },
            });

            window.google.accounts.id.renderButton(
              containerRef.current,
              {
                theme: 'outline',
                size: 'large',
                shape,
                width: '100%',
              }
            );
          } else {
            throw new Error('Google Identity Services not available');
          }
        } catch (err) {
          onError && onError(err);
          console.error('Google Identity init error:', err);
        }
      };

      tryInit();
    };

    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = onScriptReady;
      script.onerror = (e) => {
        console.error('Failed to load Google Identity script', e);
        onError && onError(new Error('Failed to load Google Identity script'));
      };
      document.body.appendChild(script);
    } else if (window.google && window.google.accounts) {
      // Script already present and ready
      onScriptReady();
    } else {
      // Script exists but google object not ready yet
      script.onload = onScriptReady;
    }
    // Cleanup: remove any widgets if unmounting
    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
      // do not remove the global script to avoid affecting other components
    };
  }, [finalClientId, onSuccess, onError, shape, useCode]);

  return <div id={buttonId} ref={containerRef} className="w-full" />;
};

export default GoogleLoginButton;