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
  message, // optional single message object being forwarded
  messages, // optional array of messages when forwarding multiple
  setMessage // setter to allow editing/removing caption for single
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChats, setSelectedChats] = useState([]);
  const [localForwardContent, setLocalForwardContent] = useState((message && message.content) || '');
  const [detectedDuration, setDetectedDuration] = useState(null);
  const videoProbeRef = useRef(null);

  const multiForward = Array.isArray(messages) && messages.length > 0;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  // map of chatId -> features object fetched from server when missing locally
  const [groupFeaturesByChatId, setGroupFeaturesByChatId] = useState({});
  const [crunching, setCrunching] = useState(false);

  // Probe video metadata for duration when attachment URL changes and no duration present (only for single message preview)
  useEffect(() => {
    setDetectedDuration(null);
    if (!message || multiForward) return;

    const firstAttachment = Array.isArray(message.attachments) && message.attachments.length > 0 ? message.attachments[0] : null;
    if (!firstAttachment) return;

    const ft = firstAttachment.fileType || '';
    if (!ft.startsWith || !ft.startsWith('video/')) return;

    const existing = (
      firstAttachment.duration || firstAttachment.length || firstAttachment.fileDuration ||
      firstAttachment.durationSeconds || firstAttachment.duration_ms || firstAttachment.durationMs ||
      firstAttachment.duration_seconds || firstAttachment.durationStr || firstAttachment.duration_str ||
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

      const onError = () => {
        cleanup();
      };

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

  // Determine whether the forwarded content requires media or docs features
  const needs = useMemo(() => {
    const msgs = multiForward ? (Array.isArray(messages) ? messages : []) : (message ? [message] : []);
    let needMedia = false;
    let needDocs = false;

    for (const m of msgs) {
      if (!m) continue;
      const atts = Array.isArray(m.attachments) ? m.attachments : (m.attachments ? [m.attachments] : []);
      if (atts.length === 0) continue;

      for (const a of atts) {
        const ft = (a && (a.fileType || a.fileTypeString || a.mimeType || a.type)) || '';
        const t = String(ft || '').toLowerCase();
        if (t.startsWith('image/') || t.startsWith('video/') || t.startsWith('audio/')) {
          needMedia = true;
        } else {
          needDocs = true;
        }
      }
    }

    return { needMedia, needDocs };
  }, [message, messages, multiForward]);

  // When modal opens, fetch missing group features for group chats if backend hasn't provided them.
  useEffect(() => {
    let cancelled = false;
    if (!isOpen) return;

    // collect group chat ids that lack features info
    const groupsToFetch = (contacts || []).filter(c =>
      (c.isGroupChat || c.isGroup) &&
      !(c.features || (c.group && c.group.features) || (c.groupSettings && c.groupSettings.features))
    ).map(c => c.id || c._id || c.chatId).filter(Boolean);

    if (groupsToFetch.length === 0) {
      setCrunching(false);
      return;
    }

    setCrunching(true);

    (async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const promises = groupsToFetch.map(async (gid) => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/group/group/${encodeURIComponent(gid)}`, { headers });
            if (!res.ok) return { gid, features: null };
            const json = await res.json();
            // json may be the full group object or contain group property
            const groupObj = json && (json.group || json);
            const derived = (groupObj && (groupObj.features || groupObj.group && groupObj.group.features)) || groupObj.features || null;
            return { gid, features: derived };
          } catch (e) {
            return { gid, features: null };
          }
        });

        const results = await Promise.all(promises);
        if (cancelled) return;

        setGroupFeaturesByChatId(prev => {
          const copy = { ...(prev || {}) };
          for (const r of results) {
            if (r && r.gid) {
              copy[String(r.gid)] = r.features || {};
            }
          }
          return copy;
        });
      } catch (e) {
        // ignore
      } finally {
        if (!cancelled) setCrunching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Derive features for a chat/group object in a tolerant way (similar to GroupInfoModal)
  const deriveFeatures = (chat) => {
    const chatId = chat && (chat.id || chat._id || chat.chatId);
    const fetched = chatId ? groupFeaturesByChatId[String(chatId)] : null;
    const derivedFeaturesRaw = fetched || chat?.features || (chat?.group && chat.group.features) || (chat?.groupSettings && chat.groupSettings.features) || {};
    return {
      media: derivedFeaturesRaw.media !== false,
      gallery: derivedFeaturesRaw.gallery !== false,
      docs: derivedFeaturesRaw.docs !== false,
      polls: derivedFeaturesRaw.polls !== false,
    };
  };

  const isChatSelectable = (chat) => {
    const isGroup = chat.isGroupChat || chat.isGroup || false;
    if (!isGroup) return { allowed: true };

    const features = deriveFeatures(chat);
    if (needs.needMedia && !features.media) return { allowed: false, reason: 'media-disabled' };
    if (needs.needDocs && !features.docs) return { allowed: false, reason: 'docs-disabled' };

    return { allowed: true };
  };

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
      if (multiForward) {
        // For multi-message forward, pass the messages array directly to parent handler
        onForward(selectedChats, messages);
      } else {
        if (localForwardContent !== (message && message.content)) {
          try {
            setMessage && setMessage(prev => prev ? { ...prev, content: localForwardContent } : prev);
          } catch (e) {}
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

  const forwardBtnClass = selectedChats.length > 0
    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30'
    : `${effectiveTheme.secondary} ${effectiveTheme.textSecondary} cursor-not-allowed opacity-50`;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          {/* CosmosBg for day mode */}
          {effectiveTheme.mode !== 'dark' && (
            <div className="absolute inset-0 overflow-hidden">
              <CosmosBackground />
            </div>
          )}

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className={`${effectiveTheme.primary} rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col max-h-[80vh] relative z-10 ${effectiveTheme.mode !== 'dark' ? 'bg-white/90' : ''}`}
          >
            {/* Header */}
            <div className={`${effectiveTheme.secondary} p-4 flex items-center justify-between border-b ${effectiveTheme.border}`}>
              <h2 className={`text-xl font-semibold ${effectiveTheme.text}`}>
                {multiForward ? `Forward ${messages.length} message${messages.length > 1 ? 's' : ''}` : 'Forward Message'}
              </h2>
              <button
                onClick={onClose}
                className={`${effectiveTheme.textSecondary} hover:${effectiveTheme.text} transition-colors`}
              >
                <X size={24} />
              </button>
            </div>

            {message && (() => {
              const hasImageAttachment = Array.isArray(message.attachments) && message.attachments.some(a =>
                a && a.fileType && a.fileType.startsWith && a.fileType.startsWith('image/')
              );

              // Only show preview block when there's user text or an image attachment
              if (!(message.content || hasImageAttachment)) return null;

              const firstImage = hasImageAttachment ? message.attachments.find(a =>
                a && a.fileType && a.fileType.startsWith && a.fileType.startsWith('image/')
              ) : null;

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
                  att.duration || att.length || att.fileDuration || att.durationSeconds ||
                  att.duration_ms || att.durationMs || att.duration_seconds || att.durationStr ||
                  att.duration_str || att.fileDurationMs || att.lengthSeconds || att.time ||
                  att.video_length || att.videoDuration || att.video_duration ||
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
                <div className={`${effectiveTheme.secondary} p-3 border-b ${effectiveTheme.border} flex items-start space-x-3`}>
                  {/* Attachment thumbnail only for images; show icon for non-image when caption exists */}
                  <div className="flex-shrink-0">
                    {firstImage ? (
                      <img
                        src={firstImage.fileUrl || firstImage.file || firstImage.url}
                        alt="attachment"
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (firstAttachment && message.content) ? (
                      (() => {
                        const ft = firstAttachment.fileType || '';
                        if (ft.startsWith('video/')) {
                          return (
                            <div className="relative w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                              <Video size={20} className="text-white" />
                              {formatDuration(displayDuration) && (
                                <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[9px] px-1 rounded">
                                  {formatDuration(displayDuration)}
                                </div>
                              )}
                            </div>
                          );
                        }
                        // fallback to document icon
                        return (
                          <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                            <FileText size={20} className="text-white" />
                          </div>
                        );
                      })()
                    ) : null}
                  </div>

                  {message.content ? (
                    <div className="flex-1 flex items-start justify-between">
                      <p className={`${effectiveTheme.text} text-sm line-clamp-2 flex-1`}>
                        {localForwardContent || message.content}
                      </p>
                      {/* Only show X to remove caption when there are attachments or content */}
                      {(Array.isArray(message.attachments) && message.attachments.length > 0) && (
                        <button
                          onClick={() => {
                            try {
                              setMessage && setMessage(prev => prev ? { ...prev, content: '' } : prev);
                            } catch (e) {}
                            setLocalForwardContent('');
                          }}
                          className={`${effectiveTheme.textSecondary} ml-2 rounded-full p-1`}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className={`${effectiveTheme.textSecondary} text-sm italic flex-1`}>
                      {hasImageAttachment ? 'Photo' : (message.type === 'poll' ? 'Poll' : 'Forwarded message')}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Search Bar */}
            <div className={`${effectiveTheme.secondary} p-4 border-b ${effectiveTheme.border}`}>
              <div className={`flex items-center space-x-2 ${effectiveTheme.input} rounded-lg px-3 py-2`}>
                <Search size={20} className={effectiveTheme.textSecondary} />
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
            <div className="flex-1 overflow-y-auto">
              {crunching ? (
                <div className="flex flex-col items-center justify-center h-full space-y-2 p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className={`${effectiveTheme.textSecondary} text-sm`}>Crunching latest chats for you...</p>
                  <p className={`${effectiveTheme.textSecondary} text-xs`}>Checking which groups accept this content</p>
                </div>
              ) : (filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <Users size={48} className={effectiveTheme.textSecondary} />
                  <p className={`${effectiveTheme.textSecondary} mt-4`}>
                    {searchTerm ? 'No chats found' : 'No recent chats'}
                  </p>
                </div>
              ) : (
                filteredContacts.map((chat) => {
                  const chatId = chat.id || chat._id || chat.chatId;
                  const selected = isSelected(chat);
                  const isGroup = chat.isGroupChat || chat.isGroup || false;
                  const { allowed, reason } = isChatSelectable(chat);
                  const chatName = chat.name || chat.chatName || 'Unknown';
                  const chatAvatar = chat.avatar || chat.groupSettings?.avatar || chat.pic || null;

                  return (
                    <motion.div
                      key={chatId}
                      onClick={() => {
                        if (allowed) toggleChatSelection(chat);
                      }}
                      whileHover={{
                        backgroundColor: effectiveTheme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                      }}
                      className={`p-4 flex items-center space-x-3 transition-colors ${
                        selected ? (effectiveTheme.mode === 'dark' ? 'bg-blue-500/20' : 'bg-blue-50') : ''
                      } ${!allowed ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
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
                          <div className={`w-12 h-12 rounded-full ${effectiveTheme.secondary} flex items-center justify-center`}>
                            {isGroup ? (
                              <Users size={24} className={effectiveTheme.textSecondary} />
                            ) : (
                              <User size={24} className={effectiveTheme.textSecondary} />
                            )}
                          </div>
                        )}

                        {/* Selection Indicator */}
                        {selected && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium ${effectiveTheme.text} truncate`}>
                          {chatName}
                        </h3>

                        {isGroup && (
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className={`text-xs ${effectiveTheme.textSecondary}`}>
                              Group
                            </span>
                            {!allowed && reason === 'media-disabled' && (
                              <span className="text-xs text-red-500">
                                Media disabled
                              </span>
                            )}
                            {!allowed && reason === 'docs-disabled' && (
                              <span className="text-xs text-red-500">
                                Docs disabled
                              </span>
                            )}
                          </div>
                        )}

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
                            <p className={`text-sm ${effectiveTheme.textSecondary} truncate mt-0.5`}>
                              {lastMessageText}
                            </p>
                          ) : null;
                        })()}
                      </div>

                      {/* Checkbox */}
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selected ? 'bg-blue-500 border-blue-500' : `border-gray-400 ${effectiveTheme.secondary}`
                      }`}>
                        {selected && <Check size={16} className="text-white" />}
                      </div>
                    </motion.div>
                  );
                })
              ))}
            </div>

            {/* Footer */}
            <div className={`${effectiveTheme.secondary} p-4 border-t ${effectiveTheme.border} flex items-center justify-between`}>
              <span className={`text-sm ${effectiveTheme.textSecondary}`}>
                {selectedChats.length > 0
                  ? `${selectedChats.length} chat${selectedChats.length > 1 ? 's' : ''} selected`
                  : 'Select chats to forward'}
              </span>
              <button
                onClick={handleForward}
                disabled={selectedChats.length === 0}
                className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${forwardBtnClass}`}
              >
                <span>Forward</span>
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ForwardMessageModal;