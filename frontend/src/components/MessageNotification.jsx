import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import Logo from './Logo';
import { useNavigate } from 'react-router-dom';

const MessageNotification = ({ notification, onClose, onReply, onOpen }) => {
  const [replyText, setReplyText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    
    // Play a subtle notification sound (optional) - only if sound is enabled
    const soundEnabled = localStorage.getItem('soundEnabled');
    const playSound = soundEnabled === null || JSON.parse(soundEnabled) === true;
    
    if (playSound) {
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKnn77RgGwU7k9n0y3knBSp+zPLaizsKGGS46+mnVRQMRp/h8bllHAU2jdXzzn0pBSh6yPDajjwLGGG26OyqWBUIQ5zg8LxpHwU2jNT0z3snBSh5x+/bkD0LGF+z5+yrWRYKQ5vf8L5sIAU5j9b0zHooBC')
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore if autoplay is blocked
      } catch (e) {
        // Ignore sound errors
      }
    }
    
    // Auto-dismiss after 10 seconds if not interacted with
    const timer = setTimeout(() => {
      onClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onClose, notification]);

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    try {
      // Delegate sending to parent container to avoid duplicate network/socket calls
      onReply && onReply(notification?.chatId || null, replyText.trim());
    } catch (e) {
      console.warn('onReply callback failed', e);
    }
    setReplyText('');
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -100, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -100, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-96 bg-[#1f1f1f] rounded-xl shadow-2xl overflow-hidden border border-gray-700"
      style={{ maxWidth: 'calc(100vw - 2rem)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-700/30 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="flex items-center gap-2">
          <div className="scale-75">
            <Logo size="sm" showText={false} />
          </div>
          <span className="text-white font-medium text-sm">Chasmos</span>
        </div>
        
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div
        className="px-4 py-3 cursor-pointer hover:bg-white/5 transition"
        onClick={() => {
          // normalize avatar: treat empty/"null"/"undefined" as missing
          const normalizeAvatar = (a) => {
            if (!a && a !== 0) return undefined; // null, undefined, empty string -> undefined
            if (typeof a === 'string') {
              const v = a.trim();
              if (!v) return undefined;
              if (v.toLowerCase() === 'null' || v.toLowerCase() === 'undefined') return undefined;
              return v;
            }
            return a;
          };

          // If group message, navigate to /groups and close notification
          // Only treat as group if isGroup is explicitly true
          if (notification && notification.isGroup === true) {
            const displayName = notification.groupName || notification.senderName || 'Group';
            const cleanedAvatar = normalizeAvatar(notification.avatar);
            const payload = { ...notification, openedGroup: true, senderName: displayName, avatar: cleanedAvatar };
            try {
              navigate('/groups');
            } catch (e) {}
            try { onOpen && onOpen(payload); } catch (e) {}
            try { onClose && onClose(); } catch (e) {}
            return;
          }

          // default: open chat (sanitize avatar before forwarding)
          try { onOpen && onOpen({ ...notification, avatar: normalizeAvatar(notification.avatar) }); } catch (e) {}
          try { onClose && onClose(); } catch (e) {}
        }}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          {notification.avatar ? (
            <img
              src={notification.avatar}
              alt={notification.senderName}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {notification.senderName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}

          {/* Message Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-base mb-1">
              {notification.isGroup ? (notification.groupName || notification.senderName) : (notification.senderName || 'Someone')}
            </h3>
            <p className="text-gray-300 text-sm line-clamp-2 break-words">
              {notification.message}
            </p>
          </div>
        </div>

        {/* Unread count badge */}
        {notification.unreadCount > 1 && (
          <div className="mt-3 flex items-center gap-2 text-gray-400 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <span>{notification.unreadCount} unread message{notification.unreadCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Quick Reply Section */}
      <div className="px-4 py-3 border-t border-gray-700 bg-[#2a2a2a]">
        <div className="mb-2">
          <span className="text-xs text-gray-400 font-medium">REPLY</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a reply..."
            className="flex-1 bg-[#3a3a3a] text-white placeholder-gray-500 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm border border-gray-600 transition-all"
          />
          <button
            onClick={handleSendReply}
            disabled={!replyText.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
            title="Send reply"
          >
            <Send className="w-4 h-4" />
            <span className="text-sm">Send</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const MessageNotificationContainer = ({ notifications, onClose, onReply, onOpen }) => { 
  return (
    <div className="fixed top-0 right-0 z-[9999] pointer-events-none">
      <AnimatePresence mode="sync">
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            style={{ 
              marginTop: `${1 + index * 12}rem`,
              marginRight: '1rem',
              pointerEvents: 'auto'
            }}
            className="mb-2"
          >
            <MessageNotification
              notification={notification}
              onClose={() => onClose(notification.id)}
              onReply={onReply}
              onOpen={() => onOpen(notification)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MessageNotificationContainer;
export { MessageNotification };
