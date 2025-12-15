import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, Send, Users, User } from 'lucide-react';
import CosmosBackground from './CosmosBg';

const ForwardMessageModal = ({ 
  isOpen, 
  onClose, 
  onForward, 
  contacts, 
  effectiveTheme,
  currentUserId 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChats, setSelectedChats] = useState([]);

  // Filter and sort contacts
  const filteredContacts = useMemo(() => {
    if (!contacts || contacts.length === 0) return [];
    
    const filtered = contacts.filter(contact => {
      // Exclude current user's own chat if any
      if (contact.id === currentUserId || contact._id === currentUserId) return false;
      
      const name = contact.name || contact.chatName || '';
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    // Sort by most recent
    return filtered.sort((a, b) => {
      const aTime = new Date(a.lastMessageTime || a.updatedAt || 0).getTime();
      const bTime = new Date(b.lastMessageTime || b.updatedAt || 0).getTime();
      return bTime - aTime;
    });
  }, [contacts, searchTerm, currentUserId]);

  const toggleChatSelection = (chat) => {
    setSelectedChats(prev => {
      const chatId = chat.chatId || chat._id || chat.id;
      const isSelected = prev.some(c => (c.chatId || c._id || c.id) === chatId);
      
      if (isSelected) {
        return prev.filter(c => (c.chatId || c._id || c.id) !== chatId);
      } else {
        return [...prev, chat];
      }
    });
  };

  const handleForward = () => {
    if (selectedChats.length > 0) {
      onForward(selectedChats);
      setSelectedChats([]);
      setSearchTerm('');
      onClose();
    }
  };

  const isSelected = (chat) => {
    const chatId = chat.chatId || chat._id || chat.id;
    return selectedChats.some(c => (c.chatId || c._id || c.id) === chatId);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* CosmosBg for day mode */}
          {effectiveTheme.mode !== 'dark' && (
            <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0">
              <CosmosBackground />
            </div>
          )}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={`${effectiveTheme.primary} rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col max-h-[80vh] relative z-10 ${effectiveTheme.mode !== 'dark' ? 'bg-white/90' : ''}`}
          >
            {/* Header */}
            <div className={`${effectiveTheme.secondary} p-4 flex items-center justify-between border-b ${effectiveTheme.border}`}>
              <h2 className={`text-xl font-semibold ${effectiveTheme.text}`}>
                Forward Message
              </h2>
              <button
                onClick={onClose}
                className={`${effectiveTheme.textSecondary} hover:${effectiveTheme.text} transition-colors p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className={`p-4 border-b ${effectiveTheme.border}`}>
              <div className={`flex items-center space-x-2 ${effectiveTheme.secondary} rounded-lg px-3 py-2 border ${effectiveTheme.border}`}>
                <Search className={`w-4 h-4 ${effectiveTheme.textSecondary}`} />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`flex-1 bg-transparent outline-none ${effectiveTheme.text} placeholder-gray-400`}
                  autoFocus
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {filteredContacts.length === 0 ? (
                <div className={`p-8 text-center ${effectiveTheme.textSecondary}`}>
                  {searchTerm ? 'No chats found' : 'No recent chats'}
                </div>
              ) : (
                filteredContacts.map((chat) => {
                  const chatId = chat.id || chat._id || chat.chatId;
                  const selected = isSelected(chat);
                  const isGroup = chat.isGroupChat || chat.isGroup || false;
                  const chatName = chat.name || chat.chatName || 'Unknown';
                  const chatAvatar = chat.avatar || chat.groupSettings?.avatar || chat.pic || null;

                  return (
                    <motion.div
                      key={chatId}
                      onClick={() => toggleChatSelection(chat)}
                      whileHover={{ backgroundColor: effectiveTheme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                      className={`p-4 flex items-center space-x-3 cursor-pointer transition-colors ${
                        selected ? (effectiveTheme.mode === 'dark' ? 'bg-blue-500/20' : 'bg-blue-50') : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {chatAvatar ? (
                          <img
                            src={chatAvatar}
                            alt={chatName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-full ${effectiveTheme.accent} flex items-center justify-center text-white font-semibold`}>
                            {isGroup ? (
                              <Users className="w-6 h-6" />
                            ) : (
                              <User className="w-6 h-6" />
                            )}
                          </div>
                        )}
                        
                        {/* Selection Indicator */}
                        <AnimatePresence>
                          {selected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1"
                            >
                              <Check className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className={`font-medium ${effectiveTheme.text} truncate`}>
                            {chatName}
                          </h3>
                          {isGroup && (
                            <span className={`text-xs ${effectiveTheme.textSecondary} flex items-center`}>
                              <Users className="w-3 h-3 mr-1" />
                              Group
                            </span>
                          )}
                        </div>
                        {(() => {
                          // Handle last message display with attachment support
                          let lastMessageText = '';
                          
                          if (chat.lastMessage) {
                            // If lastMessage is a string (from backend preview)
                            if (typeof chat.lastMessage === 'string') {
                              lastMessageText = chat.lastMessage;
                            }
                            // If lastMessage is an object with content
                            else if (chat.lastMessage.content) {
                              lastMessageText = chat.lastMessage.content;
                            }
                            // If message has attachments
                            else if (chat.lastMessage.attachments && chat.lastMessage.attachments.length > 0) {
                              const attachment = chat.lastMessage.attachments[0];
                              if (attachment.fileType?.startsWith('image/')) {
                                lastMessageText = '📷 Photo';
                              } else if (attachment.fileType?.startsWith('video/')) {
                                lastMessageText = '🎥 Video';
                              } else if (attachment.fileType?.startsWith('audio/')) {
                                lastMessageText = '🎵 Audio';
                              } else {
                                lastMessageText = `📎 ${attachment.fileName || 'File'}`;
                              }
                            }
                            // Fallback
                            else {
                              lastMessageText = 'Message';
                            }
                          }
                          // Check if hasAttachment flag is set
                          else if (chat.hasAttachment) {
                            lastMessageText = chat.attachmentFileName 
                              ? `📎 ${chat.attachmentFileName}` 
                              : '📎 Attachment';
                          }

                          return lastMessageText ? (
                            <p className={`text-sm ${effectiveTheme.textSecondary} truncate`}>
                              {lastMessageText}
                            </p>
                          ) : null;
                        })()}
                      </div>

                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selected 
                          ? 'bg-blue-500 border-blue-500' 
                          : `border-gray-300 dark:border-gray-600`
                      }`}>
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className={`${effectiveTheme.primary} p-4 border-t ${effectiveTheme.border} flex items-center justify-between flex-shrink-0`}>
              <span className={`text-sm ${effectiveTheme.textSecondary}`}>
                {selectedChats.length > 0 
                  ? `${selectedChats.length} chat${selectedChats.length > 1 ? 's' : ''} selected`
                  : 'Select chats to forward'}
              </span>
              <button
                onClick={handleForward}
                disabled={selectedChats.length === 0}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedChats.length > 0
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30'
                    : `${effectiveTheme.secondary} ${effectiveTheme.textSecondary} cursor-not-allowed opacity-50`
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Forward</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ForwardMessageModal;
