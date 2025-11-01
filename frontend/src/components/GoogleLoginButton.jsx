import React, { useEffect, useRef } from "react";

/**
 * GoogleLoginButton
 * Props:
 * - clientId (optional) — falls back to VITE_GOOGLE_CLIENT_ID if not provided
 * - onSuccess(credentialResponse) — callback with Google response (response.credential)
 * - onError(err) — optional error callback
 */
const GoogleLoginButton = ({ clientId, onSuccess, onError, buttonId = "google-login-btn", shape = "rectangular" }) => {
  const containerRef = useRef(null);
  const finalClientId = clientId || import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!finalClientId) {
      console.error("VITE_GOOGLE_CLIENT_ID is not set in environment variables.");
      onError && onError(new Error("Missing Google Client ID"));
      return;
    }

    // Wait until google.accounts is available
    const tryInit = () => {
      if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        // try again shortly
        setTimeout(tryInit, 200);
        return;
      }

      try {
        // Initialize
        window.google.accounts.id.initialize({
          client_id: finalClientId,
          callback: (response) => {
            // response.credential is the ID token (JWT)
            if (response && response.credential) {
              onSuccess && onSuccess(response);
            } else {
              onError && onError(new Error("No credential returned"));
            }
          },
        });

        // Render the button into containerRef
        window.google.accounts.id.renderButton(
          containerRef.current,
          {
            theme: "outline",
            size: "large",
            shape,
            width: "100%",
          }
        );

        // Optional: do not auto-select (prevents auto prompt)
        // window.google.accounts.id.disableAutoSelect();
      } catch (err) {
        onError && onError(err);
        console.error("Google Identity init error:", err);
      }
    };

    tryInit();

    // Cleanup: remove any widgets if unmounting
    return () => {
      // Google SDK doesn't offer a formal destroy; clearing container is enough
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [finalClientId, onSuccess, onError, shape]);

  return <div id={buttonId} ref={containerRef} className="w-full" />;
};

export default GoogleLoginButton;