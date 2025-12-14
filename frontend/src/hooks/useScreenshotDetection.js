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

    console.log('Screenshot detection enabled for chat:', chatId);

    // Removed visibilitychange screenshot detection to avoid false positives (e.g., Alt+Tab)
    // const handleVisibilityChange = async () => {};

    // Detect screenshot via keyboard shortcut (Windows/Linux: PrtScr, Mac: Cmd+Shift+3/4)
    const handleScreenshotKey = async (e) => {
      // Only detect screenshot if tab is visible
      if (document.hidden) return;
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
      // Only detect screenshot if tab is visible
      if (document.hidden) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const now = Date.now();
          if (now - lastCaptureTime.current < 2000) return;
          
          lastCaptureTime.current = now;
          await captureAndUploadScreenshot();
          break;
        }
      }
    };

    const captureAndUploadScreenshot = async () => {
      if (isCapturing.current) return;
      
      try {
        isCapturing.current = true;

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
