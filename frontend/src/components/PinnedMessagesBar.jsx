import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, X, ChevronRight } from 'lucide-react';

const PinnedMessagesBar = ({ pinnedMessages, onUnpin, onNavigateToMessage, effectiveTheme }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  // Filter out any null or invalid pinned messages
  const validPinnedMessages = React.useMemo(() => {
    return (pinnedMessages || []).filter(pinned => pinned && pinned.message);
  }, [pinnedMessages]);

  // Reset index if it's out of bounds after unpinning
  React.useEffect(() => {
    if (currentIndex >= validPinnedMessages.length && validPinnedMessages.length > 0) {
      setCurrentIndex(0);
    } else if (validPinnedMessages.length === 0) {
      setCurrentIndex(0);
    }
  }, [validPinnedMessages.length, currentIndex]);

  // Auto-rotate through pinned messages every 5 seconds
  React.useEffect(() => {
    if (validPinnedMessages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % validPinnedMessages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [validPinnedMessages.length]);

  if (!validPinnedMessages || validPinnedMessages.length === 0) {
    return null;
  }

  const currentPinned = validPinnedMessages[currentIndex];
  
  // Safety check: if currentPinned is undefined, don't render
  if (!currentPinned || !currentPinned.message) {
    return null;
  }
  
  const message = currentPinned.message;

  const handleNext = () => {
    if (validPinnedMessages.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % validPinnedMessages.length);
    }
  };

  const handlePrevious = () => {
    if (validPinnedMessages.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + validPinnedMessages.length) % validPinnedMessages.length);
    }
  };

  const getMessagePreview = (msg) => {
    if (!msg) return '';
    
    if (msg.content) {
      return msg.content.length > 60 ? msg.content.substring(0, 60) + '...' : msg.content;
    }
    
    if (msg.attachments && msg.attachments.length > 0) {
      const attachment = msg.attachments[0];
      if (attachment.fileType?.startsWith('image/')) return '📷 Photo';
      if (attachment.fileType?.startsWith('video/')) return '🎥 Video';
      if (attachment.fileType?.startsWith('audio/')) return '🎵 Audio';
      return `📎 ${attachment.fileName || 'File'}`;
    }
    
    return 'Message';
  };

  const getSenderName = (msg) => {
    if (!msg || !msg.sender) return 'Unknown';
    return msg.sender.name || msg.sender.email || 'User';
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={`${effectiveTheme.secondary} border-b ${effectiveTheme.border} overflow-hidden`}
      >
        <div className="relative">
          {/* Main content */}
          <motion.div
            key={currentIndex}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center px-4 py-2 gap-3 cursor-pointer transition-colors"
            style={{
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = effectiveTheme.mode === 'dark' ? 'rgba(31, 41, 55, 0.5)' : 'rgba(219, 234, 254, 1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onClick={() => onNavigateToMessage && onNavigateToMessage(message)}
          >
            {/* Pin icon */}
            <div className="flex-shrink-0">
              <Pin className={`w-4 h-4 ${effectiveTheme.accent} text-yellow-500 fill-current`} />
            </div>

            {/* Message preview */}
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-semibold ${effectiveTheme.text} mb-0.5`}>
                {getSenderName(message)}
              </div>
              <div className={`text-sm ${effectiveTheme.textSecondary} truncate`}>
                {getMessagePreview(message)}
              </div>
            </div>

            {/* Counter if multiple pinned messages */}
            {validPinnedMessages.length > 1 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevious();
                  }}
                  className={`p-1 rounded transition-colors ${effectiveTheme.text}`}
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = effectiveTheme.mode === 'dark' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(134, 239, 172, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  aria-label="Previous pinned message"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                
                <span className={`text-xs ${effectiveTheme.textSecondary} font-medium min-w-[2rem] text-center`}>
                  {currentIndex + 1}/{validPinnedMessages.length}
                </span>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className={`p-1 rounded transition-colors ${effectiveTheme.text}`}
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = effectiveTheme.mode === 'dark' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(134, 239, 172, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  aria-label="Next pinned message"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Unpin button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnpin && onUnpin(message._id || message.id);
              }}
              className={`flex-shrink-0 p-1 rounded-full transition-colors ${effectiveTheme.textSecondary}`}
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = effectiveTheme.mode === 'dark' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(134, 239, 172, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Unpin message"
              title="Unpin message"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Progress indicator for auto-rotation */}
          {validPinnedMessages.length > 1 && (
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 bg-blue-500"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 5, ease: 'linear' }}
              key={`progress-${currentIndex}`}
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PinnedMessagesBar;