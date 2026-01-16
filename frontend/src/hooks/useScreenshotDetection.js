import { useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

/**
 * Custom hook to detect screenshot events and capture the visible area
 * @param {Object} options - Configuration options
 * @param {string} options.chatId - Current chat ID
 * @param {string} options.userId - Current user ID
 * @param {Function} options.onScreenshotDetected - Callback when screenshot is detected
 * @param {boolean} options.enabled - Whether screenshot detection is enabled
 * @param {boolean} options.isPendingChat - Whether the current chat is a pending chat (not yet created in DB)
 */
export const useScreenshotDetection = ({ chatId, userId, onScreenshotDetected, enabled = true, isPendingChat = false }) => {
  const isCapturing = useRef(false);
  const lastCaptureTime = useRef(0);

  useEffect(() => {
    if (!enabled) {
      console.log('Screenshot detection disabled by flag:', { enabled, chatId, userId });
      return;
    }
    
    // Skip if this is a pending chat (not yet created in DB)
    if (isPendingChat) {
      console.log('Screenshot detection disabled for pending chat:', { chatId, isPendingChat });
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

    // Detect any modal/overlay/dialog that is visible on the page.
    // This covers NewChat and other dialogs (3rd-party libs, custom modals).
    const isAnyModalOpen = () => {
      try {
        // Check for standard modal selectors
        const selectors = ['[role="dialog"]', '.modal', '.dialog', '[data-modal]', '.ant-modal', '.MuiDialog-root'];
        const nodes = Array.from(document.querySelectorAll(selectors.join(',')));
        const hasStandardModal = nodes.some((n) => {
          if (!n) return false;
          const style = window.getComputedStyle(n);
          if (!style || style.display === 'none' || style.visibility === 'hidden' || n.offsetParent === null) return false;
          // If the modal is inside the messages container, ignore it (rare)
          const insideMessages = n.closest('.messages-container-capture, .overflow-y-auto');
          return !insideMessages;
        });
        if (hasStandardModal) return true;

        // Check for NewChat-style full-screen overlays (fixed inset-0 with high z-index)
        const allDivs = Array.from(document.querySelectorAll('div'));
        const hasFullScreenOverlay = allDivs.some((div) => {
          const classes = div.className || '';
          // NewChat has: fixed inset-0 z-50
          if (classes.includes('fixed') && classes.includes('inset-0') && classes.includes('z-50')) {
            const style = window.getComputedStyle(div);
            if (!style || style.display === 'none' || style.visibility === 'hidden') return false;
            return true;
          }
          return false;
        });
        return hasFullScreenOverlay;
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
      modalOpen: isAnyModalOpen(),
      documentHidden: document.hidden,
    });

    // Always register listeners when enabled; handlers will verify route/modal state.


    // Removed visibilitychange screenshot detection to avoid false positives (e.g., Alt+Tab)
    // const handleVisibilityChange = async () => {};

    // Detect screenshot via keyboard shortcut (Windows/Linux: PrtScr, Mac: Cmd+Shift+3/4)
    const handleScreenshotKey = async (e) => {
      // Only detect screenshot if tab is visible and user is on /chats
      if (document.hidden) return;
      if (!isOnChatsRoute() || isNewChatOpen() || isAnyModalOpen()) {
        console.log('Screenshot key pressed but detection blocked - status:', debugStatus(), 'event:', { key: e.key, code: e.code });
        return;
      }
      // Skip if only modifier keys are pressed (Shift, Ctrl, Meta, Alt) - we need an actual key
      const modifierKeys = ['Shift', 'Control', 'Meta', 'Alt', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'MetaLeft', 'MetaRight', 'AltLeft', 'AltRight'];
      if (modifierKeys.includes(e.key) || modifierKeys.includes(e.code)) {
        return;
      }
      // Debug log for ALL key events to help troubleshoot
      console.log('Key event:', { 
        key: e.key, 
        code: e.code, 
        keyCode: e.keyCode, 
        ctrl: e.ctrlKey, 
        shift: e.shiftKey, 
        meta: e.metaKey,
        type: e.type 
      });

      // Avoid duplicate captures in quick succession
      if (isCapturing.current) {
        console.log('Skipping: already capturing');
        return;
      }
      if (Date.now() - lastCaptureTime.current < 3000) {
        console.log('Skipping: too soon since last capture');
        return;
      }

      // Common PrintScreen detection (varies by browser/OS): check code and keyCode
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44) {
        console.log('Screenshot detected via PrintScreen key');
        lastCaptureTime.current = Date.now();
        await captureAndUploadScreenshot();
        return;
      }

      // Win+PrintScreen / Meta+PrintScreen combinations
      if ((e.code === 'PrintScreen' || e.keyCode === 44) && (e.metaKey || e.ctrlKey)) {
        console.log('Screenshot detected via PrintScreen + modifier');
        lastCaptureTime.current = Date.now();
        await captureAndUploadScreenshot();
        return;
      }

      // Snipping Tool shortcuts: Ctrl+Shift+S or Win+Shift+S (Meta represents Win on some browsers)
      // Only trigger when the 's' or 'S' key is actually pressed (not mouse clicks or other keys)
      if ((e.key === 's' || e.key === 'S') && e.shiftKey && (e.ctrlKey || e.metaKey)) {
        console.log('Screenshot detected via Snipping Tool shortcut (Win+Shift+S)');
        // Mark capture time IMMEDIATELY to prevent duplicates
        lastCaptureTime.current = Date.now();
        isCapturing.current = true;
        
        // For Win+Shift+S, Windows handles the screenshot to clipboard
        // Try reading clipboard after a short delay instead of capturing
        setTimeout(() => {
          tryReadClipboardImage().finally(() => {
            setTimeout(() => {
              isCapturing.current = false;
            }, 500);
          });
        }, 800);
        return;
      }

      // macOS: Cmd+Shift+3/4
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === '3' || e.key === '4')) {
        console.log('Screenshot detected via Mac shortcut');
        // Mark capture time IMMEDIATELY to prevent duplicates
        lastCaptureTime.current = Date.now();
        isCapturing.current = true;
        
        // Browser/OS may intercept the final key event; try reading clipboard shortly after
        setTimeout(() => {
          tryReadClipboardImage().finally(() => {
            setTimeout(() => {
              isCapturing.current = false;
            }, 500);
          });
        }, 500);
        return;
      }
    };

    // Handle window focus - check clipboard when window regains focus
    // This is essential for Win+Shift+S which Windows intercepts before browser sees it
    const handleWindowFocus = async () => {
      // Only check clipboard if user is on /chats and no modal is open
      if (document.hidden) return;
      if (!isOnChatsRoute() || isNewChatOpen() || isAnyModalOpen()) {
        console.log('Window focus ignored: not on chats or modal is open');
        return;
      }
      
      // Don't check if we just processed a screenshot (increased threshold to 3 seconds)
      const timeSinceLastCapture = Date.now() - lastCaptureTime.current;
      if (isCapturing.current || timeSinceLastCapture < 3000) {
        console.log('Window focus ignored: screenshot recently processed', { timeSinceLastCapture });
        return;
      }

      console.log('Window focused - checking clipboard for screenshots...');
      
      // Small delay to ensure clipboard is populated after Snipping Tool
      setTimeout(() => {
        // Double-check we haven't started capturing in the meantime
        if (!isCapturing.current && Date.now() - lastCaptureTime.current >= 3000) {
          tryReadClipboardImage();
        }
      }, 300);
    };

    // Detect screenshot via clipboard (when user pastes after screenshot)
    const handlePaste = async (e) => {
      // Only detect screenshot if tab is visible and user is on /chats
      if (document.hidden) return;
      if (!isOnChatsRoute() || isNewChatOpen() || isAnyModalOpen()) {
        console.log('Paste event ignored for screenshot detection - status:', debugStatus());
        return;
      }
      
      // Avoid processing if we just captured
      if (isCapturing.current || Date.now() - lastCaptureTime.current < 3000) {
        console.log('Paste event ignored: screenshot already being processed');
        return;
      }
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const now = Date.now();
          if (now - lastCaptureTime.current < 3000) return;

          // mark last capture time immediately to avoid duplicate handling
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
        console.log('Clipboard API not available');
        return false;
      }

      // Avoid duplicate captures within short window (increased to 3 seconds)
      const now = Date.now();
      const timeSinceLastCapture = now - lastCaptureTime.current;
      if (timeSinceLastCapture < 3000) {
        console.log('Skipping clipboard read: too soon since last capture', { timeSinceLastCapture });
        return false;
      }
      if (isCapturing.current) {
        console.log('Skipping clipboard read: already capturing');
        return false;
      }
      
      // Mark as capturing to prevent concurrent attempts
      isCapturing.current = true;
      console.log('Starting clipboard read...');

      // Do not attempt clipboard reads if not on chats or a modal is open
      if (!isOnChatsRoute() || isNewChatOpen() || isAnyModalOpen()) {
        console.log('Aborting clipboard read: not on chats or modal is open');
        isCapturing.current = false;
        return false;
      }

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

              console.log('Screenshot found in clipboard, processing...');
              // mark last capture time to prevent duplicates
              lastCaptureTime.current = Date.now();
              await onScreenshotDetected({ blob, dimensions, timestamp: new Date().toISOString() });
              isCapturing.current = false;
              return true;
            }
          }
        }
        console.log('No image found in clipboard');
      } catch (err) {
        console.log('clipboard.read() failed or not permitted:', err);
        isCapturing.current = false;

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

      isCapturing.current = false;
      return false;
    };

    // Keyup handler to catch PrintScreen on key release and try clipboard read when modifiers released
    const handleScreenshotKeyUp = async (e) => {
      if (document.hidden) return;
      if (!isOnChatsRoute() || isNewChatOpen() || isAnyModalOpen()) return;

      // Check debounce immediately to prevent duplicate processing
      if (isCapturing.current || Date.now() - lastCaptureTime.current < 3000) {
        console.log('Keyup ignored: already processing or too soon');
        return;
      }

      // PrintScreen key on keyup
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44) {
        console.log('PrintScreen keyup detected');
        // try clipboard first; if not present, fall back to capture
        const found = await tryReadClipboardImage();
        if (!found) {
          if (isCapturing.current) return;
          if (Date.now() - lastCaptureTime.current < 3000) return;
          lastCaptureTime.current = Date.now();
          await captureAndUploadScreenshot();
        }
        return;
      }

      // Don't process modifier releases - they can cause false triggers
      // The keydown handler already schedules clipboard reads when needed
    };

    const captureAndUploadScreenshot = async () => {
      if (isCapturing.current) {
        console.log('Skipping capture: already capturing');
        return;
      }
      const now = Date.now();
      if (now - lastCaptureTime.current < 3000) {
        console.log('Skipping capture: too soon since last capture (debounce)');
        return;
      }

      try {
        isCapturing.current = true;
        lastCaptureTime.current = Date.now();
        console.log('Starting screenshot capture...');

        // Double-check we're still on /chats and no modal/dialog is open before capturing
        if (!isOnChatsRoute()) {
          console.log('Skipping capture: not on /chats route');
          return;
        }
        if (isNewChatOpen() || isAnyModalOpen()) {
          console.log('Skipping capture: a modal is open');
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
    // Listen for window focus to detect Win+Shift+S (which Windows intercepts)
    window.addEventListener('focus', handleWindowFocus);

    // Cleanup
    return () => {
      // document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleScreenshotKey, true);
      document.removeEventListener('keyup', handleScreenshotKeyUp, true);
      document.removeEventListener('paste', handlePaste);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [chatId, userId, enabled, onScreenshotDetected, isPendingChat]);

  return null;
};