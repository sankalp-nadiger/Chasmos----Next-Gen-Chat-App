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
    if (!enabled || !chatId || !userId) {
      console.log('Screenshot detection disabled:', { enabled, chatId, userId });
      return;
    }

    const isOnChatsRoute = () => {
      try {
        const p = window.location.pathname || '';
        return p === '/chats' || p.startsWith('/chats/');
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

    if (!isOnChatsRoute() || isNewChatOpen()) {
      console.log('Screenshot detection not enabled - status:', debugStatus());
      return;
    }


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
      // PrintScreen (Win/Linux/Windows+PrtScr)
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        console.log('Screenshot detected via PrintScreen key');
        await captureAndUploadScreenshot();
        return;
      }
      // Win+PrintScreen (metaKey + PrintScreen)
      if ((e.key === 'PrintScreen' || e.keyCode === 44) && e.metaKey) {
        console.log('Screenshot detected via Win+PrintScreen');
        await captureAndUploadScreenshot();
        return;
      }
      // Ctrl+Shift+S (common for Snipping Tool)
      if ((e.key === 's' || e.key === 'S') && e.ctrlKey && e.shiftKey) {
        console.log('Screenshot detected via Ctrl+Shift+S');
        await captureAndUploadScreenshot();
        return;
      }
      // Win+Shift+S (Snipping Tool)
      if ((e.key === 's' || e.key === 'S') && e.shiftKey && e.metaKey) {
        console.log('Screenshot detected via Win+Shift+S');
        await captureAndUploadScreenshot();
        return;
      }
      // Mac: Cmd+Shift+3 or Cmd+Shift+4
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === '3' || e.key === '4')) {
        console.log('Screenshot detected via Mac shortcut');
        await captureAndUploadScreenshot();
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

    const captureAndUploadScreenshot = async () => {
      if (isCapturing.current) return;
      
      try {
        isCapturing.current = true;

        // Double-check we're still on /chats and NewChat modal isn't open before capturing
        if (!(window.location && (window.location.pathname === '/chats' || window.location.pathname.startsWith('/chats/')))) {
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
    // Only listen for keydown on PrintScreen and screenshot shortcuts, not all keys
    document.addEventListener('keyup', handleScreenshotKey, true);
    document.addEventListener('paste', handlePaste);

    // Cleanup
    return () => {
      // document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keyup', handleScreenshotKey, true);
      document.removeEventListener('paste', handlePaste);
    };
  }, [chatId, userId, enabled, onScreenshotDetected]);

  return null;
};
