import { useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

/**
 * Custom hook to detect screenshot events and capture the visible area
 * @param {Object} options - Configuration options
 * @param {string} options.chatId - Current chat ID
 * @param {string} options.userId - Current user ID
 * @param {Function} options.onScreenshotDetected - Callback when screenshot is detected
 * @param {boolean} options.enabled - Whether screenshot detection is enabled
 */
export const useScreenshotDetection = ({ chatId, userId, onScreenshotDetected, enabled = true }) => {
  const isCapturing = useRef(false);
  const lastCaptureTime = useRef(0);

  useEffect(() => {
    if (!enabled) {
      console.log('Screenshot detection disabled by flag:', { enabled, chatId, userId });
      return;
    }

    const isOnChatsRoute = () => {
      try {
        const p = window.location.pathname || '';
        // Accept paths that start with or contain /chats (covers mounted routers)
        return p === '/chats' || p.startsWith('/chats/') || p.indexOf('/chats') !== -1;
      } catch (e) {
        return false;
      }
    };

    // Detect if the NewChat modal is open by searching for a visible element
    // that contains the header text "New Chat". This avoids capturing when
    // the full-screen NewChat modal is active (it mounts while still on /chats).
    const isNewChatOpen = () => {
      try {
        const nodes = Array.from(document.querySelectorAll('h1,h2,h3,div,span'));
        return nodes.some((n) => {
          if (!n || !n.textContent) return false;
          const txt = n.textContent.trim().toLowerCase();
          if (!txt) return false;
          if (txt.includes('new chat')) {
            // ensure element is visible and likely part of a modal/dialog
            const style = window.getComputedStyle(n);
            if (!style || style.display === 'none' || style.visibility === 'hidden' || n.offsetParent === null) return false;
            // prefer elements that are inside a dialog/modal container
            const dialogAncestor = n.closest('[role="dialog"], .modal, .dialog, [data-modal]');
            return Boolean(dialogAncestor);
          }
          return false;
        });
      } catch (e) {
        return false;
      }
    };

    // Debug helper
    const debugStatus = () => ({
      enabled,
      chatId,
      userId,
      onChatsRoute: isOnChatsRoute(),
      newChatOpen: isNewChatOpen(),
      documentHidden: document.hidden,
    });

    // Always register listeners when enabled; handlers will verify route/modal state.


    // Removed visibilitychange screenshot detection to avoid false positives (e.g., Alt+Tab)
    // const handleVisibilityChange = async () => {};

    // Detect screenshot via keyboard shortcut (Windows/Linux: PrtScr, Mac: Cmd+Shift+3/4)
    const handleScreenshotKey = async (e) => {
      // Only detect screenshot if tab is visible and user is on /chats
      if (document.hidden) return;
      if (!isOnChatsRoute() || isNewChatOpen()) {
        console.log('Screenshot key pressed but detection blocked - status:', debugStatus(), 'event:', { key: e.key, code: e.code });
        return;
      }
        // Debug log for key events
        console.log('Key event:', { key: e.key, code: e.code, keyCode: e.keyCode, ctrl: e.ctrlKey, shift: e.shiftKey, meta: e.metaKey });

        // Common PrintScreen detection (varies by browser/OS): check code and keyCode
        if (e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44) {
          console.log('Screenshot detected via PrintScreen key');
          await captureAndUploadScreenshot();
          return;
        }

        // Win+PrintScreen / Meta+PrintScreen combinations
        if ((e.code === 'PrintScreen' || e.keyCode === 44) && (e.metaKey || e.ctrlKey)) {
          console.log('Screenshot detected via PrintScreen + modifier');
          await captureAndUploadScreenshot();
          return;
        }

        // Snipping Tool shortcuts: Ctrl+Shift+S or Win+Shift+S (Meta represents Win on some browsers)
        if ((e.key === 's' || e.key === 'S') && e.shiftKey && (e.ctrlKey || e.metaKey)) {
          console.log('Screenshot detected via Snipping Tool shortcut');
          await captureAndUploadScreenshot();
          return;
        }

        // macOS: Cmd+Shift+3/4
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === '3' || e.key === '4')) {
          console.log('Screenshot detected via Mac shortcut');
          // Browser/OS may intercept the final key event; try reading clipboard shortly after
          setTimeout(() => tryReadClipboardImage(), 500);
          return;
        }
    };

    // Detect screenshot via clipboard (when user pastes after screenshot)
    const handlePaste = async (e) => {
      // Only detect screenshot if tab is visible and user is on /chats
      if (document.hidden) return;
      if (!isOnChatsRoute() || isNewChatOpen()) {
        console.log('Paste event ignored for screenshot detection - status:', debugStatus());
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const now = Date.now();
          if (now - lastCaptureTime.current < 2000) return;
          
          lastCaptureTime.current = now;
          console.log('Screenshot image found in clipboard, capturing...');
          await captureAndUploadScreenshot();
          break;
        }
      }
    };

    // Try to read images from the clipboard using the Async Clipboard API
    // Returns true if an image was found and handled.
    const tryReadClipboardImage = async () => {
      if (!onScreenshotDetected) return false;
      if (!navigator.clipboard || !navigator.clipboard.read) {
        return false;
      }

      // Avoid duplicate captures within short window
      const now = Date.now();
      if (now - lastCaptureTime.current < 2000) return false;
      if (isCapturing.current) return false;

      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type);
              let dimensions = null;
              try {
                if (typeof createImageBitmap === 'function') {
                  const bmp = await createImageBitmap(blob);
                  dimensions = { width: bmp.width, height: bmp.height };
                  try { bmp.close && bmp.close(); } catch (e) {}
                }
              } catch (e) {
                // ignore
              }

              // mark last capture time to prevent duplicates
              lastCaptureTime.current = Date.now();
              await onScreenshotDetected({ blob, dimensions, timestamp: new Date().toISOString() });
              return true;
            }
          }
        }
      } catch (err) {
        console.log('clipboard.read() failed or not permitted:', err);

        // On Windows Snip (Win+Shift+S) the OS may copy to clipboard while
        // the document is not focused; clipboard.read() then throws
        // NotAllowedError: Document is not focused. In that case, retry when
        // the window regains focus (user returns to the browser).
        try {
          const isDocFocusError = err && (err.name === 'NotAllowedError' || /Document is not focused/i.test(err.message || ''));
          if (isDocFocusError) {
            const retryOnFocus = async () => {
              // small delay to allow clipboard to be populated
              setTimeout(async () => {
                try {
                  const secondTry = await tryReadClipboardImage();
                  if (secondTry) {
                    console.log('clipboard.read() succeeded after focus');
                  }
                } catch (e2) {
                  // ignore
                }
              }, 300);
            };

            try {
              window.addEventListener('focus', retryOnFocus, { once: true });
              console.log('Registered focus listener to retry clipboard.read() when window regains focus');
            } catch (ee) {
              // ignore
            }
          }
        } catch (ee) {
          // ignore
        }
      }

      return false;
    };

    // Keyup handler to catch PrintScreen on key release and try clipboard read when modifiers released
    const handleScreenshotKeyUp = async (e) => {
      if (document.hidden) return;
      if (!isOnChatsRoute() || isNewChatOpen()) return;

      // PrintScreen key on keyup
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44) {
        console.log('PrintScreen keyup detected');
        const found = await tryReadClipboardImage();
        if (!found) {
          await captureAndUploadScreenshot();
        }
        return;
      }

      // When modifiers are released, try reading clipboard (some OSes copy on modifier+key)
      if (e.key === 'Meta' || e.key === 'Shift' || e.key === 'Control') {
        setTimeout(() => tryReadClipboardImage(), 400);
      }
    };

    const captureAndUploadScreenshot = async () => {
      if (isCapturing.current) return;
      
      try {
        isCapturing.current = true;

        // Double-check we're still on /chats and NewChat modal isn't open before capturing
        if (!isOnChatsRoute()) {
          console.log('Skipping capture: not on /chats route');
          return;
        }
        if (isNewChatOpen()) {
          console.log('Skipping capture: NewChat modal is open');
          return;
        }

        // Capture the messages area (main chat content)
        const messagesContainer = document.querySelector('.messages-container-capture') 
          || document.querySelector('.overflow-y-auto');
        
        if (!messagesContainer) {
          console.warn('Messages container not found for screenshot capture');
          return;
        }

        // Use html2canvas to capture the visible area
        const canvas = await html2canvas(messagesContainer, {
          backgroundColor: null,
          scale: 2, // Higher quality
          logging: false,
          useCORS: true,
          allowTaint: true
        });

        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
          if (!blob) {
            console.error('Failed to create blob from canvas');
            return;
          }

          const dimensions = {
            width: canvas.width,
            height: canvas.height
          };

          // Call the callback with the screenshot data
          if (onScreenshotDetected) {
            await onScreenshotDetected({
              blob,
              dimensions,
              timestamp: new Date().toISOString()
            });
          }
        }, 'image/png');

      } catch (error) {
        console.error('Error capturing screenshot:', error);
      } finally {
        setTimeout(() => {
          isCapturing.current = false;
        }, 1000);
      }
    };

    // Add event listeners
    // document.addEventListener('visibilitychange', handleVisibilityChange);
    // Use keydown because some browsers/platforms report PrintScreen on keydown
    document.addEventListener('keydown', handleScreenshotKey, true);
    document.addEventListener('keyup', handleScreenshotKeyUp, true);
    document.addEventListener('paste', handlePaste);

    // Cleanup
    return () => {
      // document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleScreenshotKey, true);
      document.removeEventListener('keyup', handleScreenshotKeyUp, true);
      document.removeEventListener('paste', handlePaste);
    };
  }, [chatId, userId, enabled, onScreenshotDetected]);

  return null;
};