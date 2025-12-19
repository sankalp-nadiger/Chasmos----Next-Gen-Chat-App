import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, Send, Users, User, Video, FileText } from 'lucide-react';
import CosmosBackground from './CosmosBg';

const ForwardMessageModal = ({ 
  isOpen, 
  onClose, 
  onForward, 
  contacts, 
  effectiveTheme,
  currentUserId,
  message, // optional message object being forwarded
  setMessage // setter to allow editing/removing caption
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChats, setSelectedChats] = useState([]);
  const [localForwardContent, setLocalForwardContent] = useState((message && message.content) || '');
  const [detectedDuration, setDetectedDuration] = useState(null);
  const videoProbeRef = useRef(null);

  // Probe video metadata for duration when attachment URL changes and no duration present
  useEffect(() => {
    setDetectedDuration(null);
    if (!message) return;
    const firstAttachment = Array.isArray(message.attachments) && message.attachments.length > 0 ? message.attachments[0] : null;
    if (!firstAttachment) return;
    const ft = firstAttachment.fileType || '';
    if (!ft.startsWith || !ft.startsWith('video/')) return;
    const existing = (
      firstAttachment.duration || firstAttachment.length || firstAttachment.fileDuration || firstAttachment.durationSeconds ||
      firstAttachment.duration_ms || firstAttachment.durationMs || firstAttachment.duration_seconds || firstAttachment.durationStr || firstAttachment.duration_str ||
      (firstAttachment.meta && (firstAttachment.meta.duration || firstAttachment.meta.length || firstAttachment.meta.durationSeconds))
    );
    if (existing) return;

    // create a detached video element to read metadata
    try {
      const v = document.createElement('video');
      videoProbeRef.current = v;
      v.preload = 'metadata';
      v.crossOrigin = 'anonymous';
      const src = firstAttachment.fileUrl || firstAttachment.file || firstAttachment.url || firstAttachment.fileUrl;
      if (!src) return;
      const onLoaded = () => {
        try {
          const dur = Math.floor(v.duration || 0);
          if (!isNaN(dur) && dur > 0) setDetectedDuration(dur);
        } catch (e) {}
        cleanup();
      };
      const onError = () => { cleanup(); };
      const cleanup = () => {
        try {
          v.removeEventListener('loadedmetadata', onLoaded);
          v.removeEventListener('error', onError);
          v.src = '';
          if (videoProbeRef.current === v) videoProbeRef.current = null;
        } catch (e) {}
      };
      v.addEventListener('loadedmetadata', onLoaded);
      v.addEventListener('error', onError);
      v.src = src;
    } catch (e) {}

    return () => {
      try {
        if (videoProbeRef.current) {
          videoProbeRef.current.src = '';
          videoProbeRef.current = null;
        }
      } catch (e) {}
    };
  }, [message && (Array.isArray(message.attachments) && message.attachments.length > 0 ? (message.attachments[0].fileUrl || message.attachments[0].file || message.attachments[0].url) : null)]);

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
      // If message was edited/cleared via modal, ensure parent message state updated
      if (localForwardContent !== (message && message.content)) {
        try { setMessage && setMessage(prev => prev ? { ...prev, content: localForwardContent } : prev); } catch (e) {}
      }
      // Build optional forward payload (include content and attachments when present)
      if (message) {
        const payload = {
          content: localForwardContent || '',
          attachments: Array.isArray(message.attachments) ? message.attachments : (message.attachments ? [message.attachments] : []),
          type: message.type || 'file',
        };
        onForward(selectedChats, payload);
      } else {
        onForward(selectedChats);
      }
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
                className={`${effectiveTheme.textSecondary} transition-colors p-1 rounded-full hover:bg-red-500 hover:text-white dark:hover:bg-red-600`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message Preview (when forwarding a message) */}
            {message && (() => {
              const hasImageAttachment = Array.isArray(message.attachments) && message.attachments.some(a => a && a.fileType && a.fileType.startsWith && a.fileType.startsWith('image/'));
              // Only show preview block when there's user text or an image attachment
              if (!(message.content || hasImageAttachment)) return null;

              const firstImage = hasImageAttachment ? message.attachments.find(a => a && a.fileType && a.fileType.startsWith && a.fileType.startsWith('image/')) : null;
              const firstAttachment = Array.isArray(message.attachments) && message.attachments.length > 0 ? message.attachments[0] : null;

            
              const formatDuration = (val) => {
                if (val === null || val === undefined || val === '') return null;
                // If already in mm:ss or h:mm:ss form
                if (typeof val === 'string') {
                  const s = val.trim();
                  // ISO 8601 duration like PT1M13S
                  const isoMatch = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/i.exec(s);
                  if (isoMatch) {
                    const h = Number(isoMatch[1] || 0);
                    const m = Number(isoMatch[2] || 0);
                    const sec = Number(isoMatch[3] || 0);
                    const total = h * 3600 + m * 60 + Math.round(sec);
                    return formatDuration(total);
                  }
                  // If already mm:ss or h:mm:ss keep as-is (validate)
                  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) return s;
                  // If numeric string in seconds or milliseconds
                  const asNum = Number(s);
                  if (!isNaN(asNum)) return formatDuration(asNum);
                  // If trailing 's' like '13s' or '1m13s'
                  const humanMatch = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i.exec(s);
                  if (humanMatch && (humanMatch[1] || humanMatch[2] || humanMatch[3])) {
                    const h = Number(humanMatch[1] || 0);
                    const m = Number(humanMatch[2] || 0);
                    const sec = Number(humanMatch[3] || 0);
                    const total = h * 3600 + m * 60 + sec;
                    return formatDuration(total);
                  }
                  return null;
                }

                // Numeric value
                let seconds = Number(val);
                if (isNaN(seconds)) return null;
                // Convert milliseconds to seconds if value is large
                if (seconds > 10000) seconds = Math.round(seconds / 1000);
                seconds = Math.max(0, Math.floor(seconds));
                const h = Math.floor(seconds / 3600);
                const m = Math.floor((seconds % 3600) / 60);
                const s = seconds % 60;
                if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
              };

              const getAttachmentDuration = (att) => {
                if (!att) return null;
                const cand = (
                  att.duration ||
                  att.length ||
                  att.fileDuration ||
                  att.durationSeconds ||
                  att.duration_ms ||
                  att.durationMs ||
                  att.duration_seconds ||
                  att.durationStr ||
                  att.duration_str ||
                  att.fileDurationMs ||
                  att.lengthSeconds ||
                  att.time ||
                  att.video_length ||
                  att.videoDuration ||
                  att.video_duration ||
                  (att.meta && (att.meta.duration || att.meta.length || att.meta.durationSeconds || att.meta.videoDuration)) ||
                  (att.file && (att.file.duration || att.file.durationMs || (att.file.metadata && att.file.metadata.duration))) ||
                  (att.info && att.info.duration) ||
                  (att.metadata && att.metadata.duration) ||
                  null
                );
                return cand;
              };

              const firstAttachmentDuration = getAttachmentDuration(firstAttachment);
              const displayDuration = firstAttachmentDuration || detectedDuration;

              return (
                <div className={`p-3 border-b ${effectiveTheme.border} flex items-start space-x-3 ${effectiveTheme.secondary}`}>
                  {/* Attachment thumbnail only for images; show icon for non-image when caption exists */}
                  <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center">
                    {firstImage ? (
                      <img src={firstImage.fileUrl || firstImage.file || ''} alt="attachment" className="w-14 h-14 rounded-md object-cover" />
                    ) : (firstAttachment && message.content) ? (
                      (() => {
                        const ft = firstAttachment.fileType || '';
                                if (ft.startsWith('video/')) {
                          return (
                            <div className={`w-14 h-14 rounded-md flex flex-col items-center justify-center text-sm ${effectiveTheme.secondary}`} style={{minWidth: 56, minHeight: 56}}>
                              <Video className={`w-6 h-6 ${effectiveTheme.text}`} />
                              {formatDuration(displayDuration) && (
                                <div className={`text-[10px] mt-1 ${effectiveTheme.textSecondary}`}>{formatDuration(displayDuration)}</div>
                              )}
                            </div>
                          );
                        }
                        // fallback to document icon
                        return (
                          <div className={`w-14 h-14 rounded-md flex items-center justify-center ${effectiveTheme.secondary}`} style={{minWidth:56, minHeight:56}}>
                            <FileText className={`w-6 h-6 ${effectiveTheme.text}`} />
                          </div>
                        );
                      })()
                    ) : null}
                  </div>
                  <div className="flex-1 text-sm">
                    {message.content ? (
                      <div className="flex items-start justify-between">
                        <div className={`text-sm ${effectiveTheme.text} mr-2 break-words`}>{localForwardContent || message.content}</div>
                        {/* Only show X to remove caption when there are attachments or content */}
                        {(Array.isArray(message.attachments) && message.attachments.length > 0) && (
                          <button onClick={() => {
                            try { setMessage && setMessage(prev => prev ? { ...prev, content: '' } : prev); } catch (e) {}
                            setLocalForwardContent('');
                          }} className={`${effectiveTheme.textSecondary} ml-2 rounded-full p-1`}>
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className={`text-sm ${effectiveTheme.textSecondary}`}>{hasImageAttachment ? 'Photo' : (message.type === 'poll' ? 'Poll' : 'Forwarded message')}</div>
                    )}
                  </div>
                </div>
              );
            })()}

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
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${isGroup ? 'bg-gray-200 text-gray-700' : `${effectiveTheme.accent} text-white`}`}>
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
