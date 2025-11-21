/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { createPortal } from 'react-dom';
import { io } from "socket.io-client";

import { motion, AnimatePresence } from "framer-motion";
import chatReqIcon from "../assets/Chat-reuest.png";
import chatAcceptIcon from "../assets/chat-accepted.png";
import {
  Search,
  MoreVertical,
  Plus,
  FileText,
  Download,
  Eye,
  Check,
  CheckCheck,
  Pin,
  X,
  Archive,
  Trash2,
  Share2,
  Settings,
  MessageSquare,
  LogOut,
  Users,
  UserPlus,
  User,
  MoreHorizontal,
  MessageCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Globe,
  Folder,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import MessageInput from "./MessageInput";
import ContactItem from "./ContactItem";
import GroupCreation from "./GroupCreation";
import NewChat from "./NewChat";
import Profile from "./Profile";
import SettingsPage from "./Settings";
import { FaUser, FaCog, FaSignOutAlt } from "react-icons/fa";
import {
  mockContacts,
  mockMessages,
  formatMessageTime,
  searchContacts,
  generateAvatarFallback,
} from "../utils/mockData";
import DocumentChat from "./DocumentChat";
import NewDocumentUploader from "./NewDocumentUploader";
import DocumentChatWrapper from "./DocumentChat";

// Memoized Chat Header Component
const ChatHeader = React.memo(
  ({
    selectedContact,
    effectiveTheme,
    isMobileView,
    onBackToContacts,
    onToggleChatSearch,
    showChatSearch,
    chatSearchTerm,
    onChatSearchChange,
    chatSearchRef,
    onCloseChatSearch,
    pinnedMessages,
    onShowPinnedMessages,
  }) => {
    const pinnedCount = Object.values(pinnedMessages || {}).filter(
      Boolean
    ).length;
    return (
      <div className={`${effectiveTheme.secondary} relative`}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isMobileView && (
              <button
                onClick={onBackToContacts}
                className={`${effectiveTheme.text} hover:${effectiveTheme.accent} p-1 rounded`}
              >
                ←
              </button>
            )}

            <div className="relative">
              {selectedContact.isDocument ? (
                <div
                  className={`w-10 h-10 rounded-full ${effectiveTheme.accent} flex items-center justify-center`}
                >
                  <FileText className="w-5 h-5 text-white" />
                </div>
              ) : selectedContact.avatar ? (
                <img
                  src={selectedContact.avatar}
                  alt={selectedContact.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`w-10 h-10 rounded-full ${effectiveTheme.accent} flex items-center justify-center text-white font-semibold`}
                >
                  {generateAvatarFallback(selectedContact.name)}
                </div>
              )}

              {selectedContact.isOnline && !selectedContact.isDocument && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>

            <div>
              <h2 className={`font-semibold ${effectiveTheme.text}`}>
                {selectedContact.name}
              </h2>
              <p className={`text-sm ${effectiveTheme.textSecondary}`}>
                {selectedContact.isTyping
                  ? "typing..."
                  : selectedContact.isOnline && !selectedContact.isDocument
                    ? "Online"
                    : "Offline"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 relative">
            <Search
              className={`w-5 h-5 ${effectiveTheme.textSecondary} cursor-pointer hover:${effectiveTheme.text} transition-colors duration-200`}
              onClick={onToggleChatSearch}
            />

            {/* Search bar */}
            {showChatSearch && (
              <div
                ref={chatSearchRef}
                className={`absolute top-8 right-0 w-80 ${effectiveTheme.secondary} border ${effectiveTheme.border} rounded-lg shadow-xl p-3 z-50`}
              >
                <div className="flex items-center space-x-2">
                  <Search
                    className={`h-4 w-4 ${effectiveTheme.textSecondary}`}
                  />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    className={`flex-1 outline-none text-sm bg-transparent ${effectiveTheme.text} placeholder-gray-400`}
                    value={chatSearchTerm}
                    onChange={onChatSearchChange}
                    autoFocus
                  />
                  <X
                    className={`h-4 w-4 ${effectiveTheme.textSecondary} cursor-pointer hover:${effectiveTheme.text} transition-opacity`}
                    onClick={() => {
                      onCloseChatSearch();
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.selectedContact?.id === nextProps.selectedContact?.id &&
      prevProps.selectedContact?.isTyping ===
        nextProps.selectedContact?.isTyping &&
      prevProps.showChatSearch === nextProps.showChatSearch &&
      prevProps.chatSearchTerm === nextProps.chatSearchTerm &&
      JSON.stringify(prevProps.pinnedMessages) ===
        JSON.stringify(nextProps.pinnedMessages)
    );
  }
);

// MessageBubble component definition
const MessageBubble = React.memo(
  ({ message, isPinned, onPinToggle, effectiveTheme, currentUserId }) => {
    const sender = message.sender;
    const isOwnMessage = (() => {
      if (!sender) return false;
      if (sender === "me") return true;
      if (typeof sender === "string") return String(sender) === String(currentUserId);
      if (typeof sender === "object") return String(sender._id || sender.id) === String(currentUserId);
      return false;
    })();

    const handlePinClick = useCallback(() => {
      onPinToggle(message.id);
    }, [message.id, onPinToggle]);

    const messageText = message.content || '';
    const hasAttachments = message.attachments && message.attachments.length > 0;
    const isShortMessage = messageText.length < 30 && !hasAttachments;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            type: "spring",
            stiffness: 300,
            damping: 20,
          },
        }}
        whileHover={{ scale: 1.02 }}
        className={`flex mb-4 ${
          isOwnMessage ? "justify-end" : "justify-start"
        } group relative`}
      >
        <motion.div
          className={`${
            isShortMessage ? 'inline-flex flex-col' : 'max-w-xs lg:max-w-md'
          } px-4 ${
            // ✅ FIX: More padding for ticks - different for short/long messages
            isShortMessage 
              ? 'py-2' 
              : isOwnMessage 
                ? 'pt-2 pb-8 pr-4' 
                : 'py-2'
          } rounded-lg relative ${
            isOwnMessage
              ? `backdrop-blur-md bg-gradient-to-br from-purple-400/20 to-blue-400/20 border border-white/30 shadow-lg shadow-purple-500/10 text-white`
              : effectiveTheme.mode === 'dark'
                ? 'bg-blue-500/80 backdrop-blur-md text-white'
                : 'bg-white/90 backdrop-blur-md text-gray-800 border border-gray-200'
          } ${isPinned ? "ring-2 ring-yellow-400" : ""}`}
          whileHover={{
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            transition: { duration: 0.3 },
          }}
          animate={
            isPinned
              ? {
                  boxShadow: [
                    "0 0 0 0 rgba(251, 191, 36, 0.4)",
                    "0 0 0 10px rgba(251, 191, 36, 0)",
                  ],
                  transition: { duration: 1.5, repeat: Infinity },
                }
              : {}
          }
        >
          <AnimatePresence>
            {isPinned && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Pin className="w-4 h-4 absolute -top-2 -right-2 text-yellow-400 fill-current" />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{
              opacity: 1,
              scale: 1.1,
              rotate: [0, -10, 10, 0],
              transition: { duration: 0.4 },
            }}
            className={`absolute -top-2 ${
              isOwnMessage ? "-left-8" : "-right-8"
            } opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full bg-white shadow-lg`}
            onClick={handlePinClick}
          >
            <Pin
              className={`w-3 h-3 ${
                isPinned ? "text-yellow-400 fill-current" : "text-gray-500"
              } hover:text-yellow-400 transition-colors`}
            />
          </motion.button>

          {hasAttachments ? (
            <AttachmentRenderer
              message={message}
              isOwnMessage={isOwnMessage}
              effectiveTheme={effectiveTheme}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={isShortMessage ? 'flex items-end gap-2' : ''}
            >
              <span>{message.content}</span>
              
              {/* For short messages, show timestamp inline */}
              {isShortMessage && isOwnMessage && (
                <span className="text-xs opacity-75 text-white whitespace-nowrap flex items-center gap-1 ml-2 flex-shrink-0">
                  {formatMessageTime(message.timestamp)}
                  {message.isRead ? (
                    <CheckCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 opacity-75 flex-shrink-0" />
                  )}
                </span>
              )}
              {isShortMessage && !isOwnMessage && (
                <span className={`text-xs opacity-75 whitespace-nowrap ml-2 flex-shrink-0 ${
                  effectiveTheme.mode === 'dark' ? 'text-white' : 'text-gray-600'
                }`}>
                  {formatMessageTime(message.timestamp)}
                </span>
              )}
            </motion.div>
          )}

          {/* ✅ FIX: Timestamp at bottom with MORE space */}
          {!isShortMessage && (
            <motion.div
              className={`flex items-center justify-end space-x-1 mt-1 ${
                isOwnMessage ? 'absolute bottom-2 right-3' : 'mt-2'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span className={`text-xs opacity-75 ${isOwnMessage ? 'text-white' : effectiveTheme.mode === 'dark' ? 'text-white' : 'text-gray-600'}`}>
                {formatMessageTime(message.timestamp)}
              </span>
              {isOwnMessage && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 400 }}
                  className="flex-shrink-0"
                >
                  {message.isRead ? (
                    <CheckCheck className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Check className="w-4 h-4 opacity-75 text-white" />
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    );
  }
);

/* --------------------------------------------
   AttachmentRenderer Component
   Renders inline images (with lightbox), video player, and file download UI.
--------------------------------------------- */
const AttachmentRenderer = React.memo(({ message, isOwnMessage, effectiveTheme }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [zoomed, setZoomed] = useState(false);

  const handleDownload = async (e, url, filename) => {
    try {
      e && e.preventDefault();
      const resp = await fetch(url, { mode: 'cors' });
      if (!resp.ok) throw new Error('Network response not ok');
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (err) {
      console.error('Download failed, falling back to direct open', err);
      window.open(url, '_blank');
    }
  };

  const openLightbox = (src) => {
    setLightboxSrc(src);
    setLightboxOpen(true);
    setZoomed(false);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxSrc(null);
    setZoomed(false);
  };

  const stripTimestampPrefix = (filename) => {
    if (!filename) return '';
    let base = filename.split('/').pop();
    base = base.replace(/^\d+_+/, '');
    return base;
  };

 const renderAttachment = (att, idx) => {
    const url = att.fileUrl || att.url || att.publicUrl;
    const mime = att.mimeType || att.fileType || '';
    const rawName = att.fileName || (url ? url.split('/').pop() : `file-${idx}`);
    const name = stripTimestampPrefix(rawName);

    if (!url) return null;

    if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(url)) {
      return (
        <div key={idx} className="mb-2">
          <img
            src={url}
            alt={name}
            className="w-64 max-w-full rounded cursor-pointer object-cover"
            onClick={() => openLightbox(url)}
          />
        </div>
      );
    }

    if (mime.startsWith('video/') || /\.(mp4|webm|ogg)$/i.test(url)) {
      return (
        <div key={idx} className="mb-2">
          <video controls className="w-80 max-w-full rounded bg-black">
            <source src={url} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    const textColor = isOwnMessage 
      ? 'text-white' 
      : effectiveTheme.mode === 'dark' 
        ? 'text-white' 
        : 'text-gray-800';

    return (
      <div key={idx} className={`flex items-center justify-between ${isOwnMessage ? 'bg-white/10' : effectiveTheme.mode === 'dark' ? 'bg-black/20' : 'bg-gray-100/50'} backdrop-blur-sm p-2 rounded mb-2`}>
        <div className="flex items-center space-x-3 w-full">
          <div className={`w-10 h-10 ${isOwnMessage ? 'bg-white/20' : effectiveTheme.mode === 'dark' ? 'bg-white/10' : 'bg-gray-200'} rounded flex items-center justify-center flex-shrink-0`}>
            <FileText className={`w-5 h-5 ${textColor}`} />
          </div>

          <div className="relative w-full">
            <div className={`text-sm font-medium truncate pr-16 ${textColor}`}>{name}</div>
            {att.fileSize && (
              <div className={`text-xs ${textColor} opacity-70`}>{(att.fileSize / 1024).toFixed(1)} KB</div>
            )}

            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto">
              <div className="bg-white rounded-lg p-1 shadow-sm flex items-center space-x-1">
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  title="Open"
                  aria-label="Open attachment"
                  tabIndex={0}
                  className="relative flex items-center justify-center p-1 rounded hover:bg-gray-100 peer"
                >
                  <Eye className="w-4 h-4 text-gray-600" />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs bg-black text-white px-2 py-0.5 rounded opacity-0 peer-hover:opacity-100 transition-opacity z-50 pointer-events-none">Open</span>
                </a>

                <a
                  href={url}
                  onClick={(e) => handleDownload(e, url, name)}
                  title="Download"
                  aria-label={`Download ${name}`}
                  tabIndex={0}
                  className="relative flex items-center justify-center p-1 rounded hover:bg-gray-100 peer"
                >
                  <Download className="w-4 h-4 text-gray-600" />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs bg-black text-white px-2 py-0.5 rounded opacity-0 peer-hover:opacity-100 transition-opacity z-50 pointer-events-none">Download</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const textColor = isOwnMessage 
    ? 'text-white' 
    : effectiveTheme.mode === 'dark' 
      ? 'text-white' 
      : 'text-gray-800';

  return (
    <div>
      <div className="flex flex-col">
        {(message.attachments || []).map((att, idx) => renderAttachment(att, idx))}
      </div>
      
      {message.attachments && message.attachments.length > 0 ? (
        message.content ? (
          <div className={`mt-2 text-sm ${textColor}`}>{message.content}</div>
        ) : null
      ) : (
        message.content && <div className={`mb-2 ${textColor}`}>{message.content}</div>
      )}

      {lightboxOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-95" onClick={closeLightbox}>
          <div className="relative max-w-4xl max-h-full p-4" onClick={(e)=>e.stopPropagation()}>
            <img src={lightboxSrc} alt="preview" className={`max-h-[80vh] max-w-full ${zoomed ? 'scale-125' : 'scale-100'} transition-transform`} />
            <div className="flex items-center justify-between mt-2">
              <div className="space-x-2">
                <button onClick={() => setZoomed(z => !z)} className="bg-white px-3 py-1 rounded">{zoomed ? 'Reset' : 'Zoom'}</button>
                <button
                  onClick={(e) => handleDownload(e, lightboxSrc, (lightboxSrc || '').split('/').pop())}
                  title="Download image"
                  aria-label={`Download image`}
                  className="bg-white px-3 py-1 rounded"
                >
                  Download
                </button>
              </div>
              <button onClick={closeLightbox} className="bg-white px-3 py-1 rounded">Close</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
});

// Messages Area Component
const MessagesArea = ({
  filteredMessages,
  pinnedMessages,
  onPinMessage,
  effectiveTheme,
  isTyping,
  selectedContactId,
  currentUserId,
}) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const shouldAutoScrollRef = useRef(true); // ✅ Track if we should auto-scroll

  const scrollToBottom = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleScroll = (e) => {
    const element = e.target;
    const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 200;
    setShowScrollButton(!isNearBottom);
    
    // ✅ Only auto-scroll if user is near bottom
    shouldAutoScrollRef.current = isNearBottom;
  };

  // ✅ FIX: Only auto-scroll when NEW messages arrive AND user is at bottom
  useEffect(() => {
    if (shouldAutoScrollRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [filteredMessages, isTyping]);

  // ✅ Always scroll on contact change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
      shouldAutoScrollRef.current = true;
    }
  }, [selectedContactId]);

  return (
    <div className="relative h-full overflow-hidden">
      {/* Day mode diagonal comets */}
      {effectiveTheme.mode !== 'dark' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`day-comet-${i}`}
              className="absolute w-1 h-16 bg-gradient-to-b from-blue-300 via-purple-300 to-transparent rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                transform: `rotate(45deg)`,
              }}
              animate={{
                x: [0, 400],
                y: [0, 400],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 1.5,
                ease: "linear",
              }}
            />
          ))}
        </div>
      )}

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto p-4 space-y-4 relative"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: effectiveTheme.mode === 'dark' 
            ? '#667eea transparent' // Blue-purple for dark mode
            : '#8b5cf6 transparent' // Purple for light mode
        }}
      >
        <div className="relative z-10">
          <AnimatePresence mode="popLayout">
            {filteredMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isPinned={pinnedMessages[message.id] || false}
                onPinToggle={onPinMessage}
                effectiveTheme={effectiveTheme}
                currentUserId={currentUserId}
              />
            ))}
          </AnimatePresence>

          {isTyping[selectedContactId] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex justify-start"
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  effectiveTheme.mode === 'dark'
                    ? 'bg-blue-500/80 backdrop-blur-md text-white'
                    : 'bg-white/90 backdrop-blur-md text-gray-800 border border-gray-200'
                }`}
              >
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-current rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <div
                    className="w-2 h-2 bg-current rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Cosmic Scroll Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToBottom}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl cursor-pointer"
            style={{
              background: effectiveTheme.mode === 'dark'
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
              pointerEvents: 'auto',
            }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(139, 92, 246, 0.5)',
                  '0 0 40px rgba(139, 92, 246, 0.8)',
                  '0 0 20px rgba(139, 92, 246, 0.5)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                  fill="white"
                />
                <path
                  d="M12 6L13 10L17 11L13 12L12 16L11 12L7 11L11 10L12 6Z"
                  fill={effectiveTheme.mode === 'dark' ? '#fbbf24' : '#f59e0b'}
                />
              </svg>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

const ChattingPage = ({ onLogout }) => {
  const { currentTheme, setTheme, theme } = useTheme();

  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [chatSearchTerm, setChatSearchTerm] = useState("");
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState(mockMessages);
  const [isTyping, setIsTyping] = useState({});
  const [isMobileView, setIsMobileView] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [showThreeDotsMenu, setShowThreeDotsMenu] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState({});

  const [selectedDocument, setSelectedDocument] = useState(null);

  const [isNewDocumentChat, setIsNewDocumentChat] = useState(false);
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showGroupCreation, setShowGroupCreation] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState("chats"); // 'chats', 'groups', 'documents', 'community'
  const [recentChats, setRecentChats] = useState([]);
  const [receivedChats, setReceivedChats] = React.useState([]); // incoming chat requests
  const [acceptedChats, setAcceptedChats] = React.useState([]); // chats you accepted
  const [showReceivedDropdown, setShowReceivedDropdown] = useState(false);
  const [showAcceptedDropdown, setShowAcceptedDropdown] = useState(false);


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ref for chat search container (click-outside functionality)
  const chatSearchRef = useRef(null);
  const threeDotsMenuRef = useRef(null);
  const floatingMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  // API Base URL from environment variable
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Socket reference
  const socketRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);
  // Current user id (used for message alignment)
  const _localUser = JSON.parse(localStorage.getItem('chasmos_user_data') || '{}');
  const currentUserId = _localUser._id || _localUser.id || null;

  // Fetch both received and accepted requests
  // useEffect(() => {
  //   const fetchRequests = async () => {
  //     try {
  //       const token = localStorage.getItem("token");
  //       if (!token) {
  //         console.error("No token found — user might not be logged in.");
  //         return;
  //       }

  //       // 1️⃣ Fetch received chat requests
  //       const resReceived = await fetch(`${API_BASE_URL}/api/user/requests`, {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });
  //       const receivedData = await resReceived.json();
  //       console.log("Received Emails:", receivedData);
  //       const receivedEmails = Array.isArray(receivedData) ? receivedData : [];

  //       // 2️⃣ Fetch accepted chat requests
  //       const resAccepted = await fetch(
  //         `${API_BASE_URL}/api/user/requests/accepted`,
  //         {
  //           headers: { Authorization: `Bearer ${token}` },
  //         }
  //       );
  //       const acceptedData = await resAccepted.json();
  //       const acceptedEmails = Array.isArray(acceptedData) ? acceptedData : [];

  //       // 3️⃣ Helper: fetch user profiles by email
  //       const fetchUsersByEmails = async (emails) => {
  //         if (!Array.isArray(emails) || emails.length === 0) return [];
  //         const results = await Promise.all(
  //           emails.map(async (email) => {
  //             const res = await fetch(
  //               `${API_BASE_URL}/api/user?search=${email}`,
  //               {
  //                 headers: { Authorization: `Bearer ${token}` },
  //               }
  //             );
  //             const data = await res.json();
  //             return Array.isArray(data) ? data[0] : data; // handle array response
  //           })
  //         );
  //         return results.filter(Boolean);
  //       };

  //       // 4️⃣ Fetch both user lists
  //       const [receivedUsers, acceptedUsers] = await Promise.all([
  //         fetchUsersByEmails(receivedEmails),
  //         fetchUsersByEmails(acceptedEmails),
  //       ]);

  //       // 5️⃣ Update states
  //       setReceivedChats(receivedUsers);
  //       setAcceptedChats(acceptedUsers);
  //     } catch (err) {
  //       console.error("Error fetching chat requests:", err);
  //     }
  //   };

  //   fetchRequests();
  // }, []);
  useEffect(() => {
  let mounted = true;

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found — user might not be logged in.");
        return;
      }

      // 1️⃣ Fetch received + accepted requests
      const [resReceived, resAccepted] = await Promise.all([
        fetch(`${API_BASE_URL}/api/user/requests`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/user/requests/accepted`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const receivedData = (await resReceived.json()) || [];
      const acceptedData = (await resAccepted.json()) || [];

      console.log("✅ Received Chats:", receivedData);
      console.log("✅ Accepted Chats:", acceptedData);

      // 2️⃣ Normalize (in case backend returned strings)
      const normalizedReceived = receivedData.map((r) =>
        typeof r === "string" ? { email: r, message: "", date: null } : r
      );

      const normalizedAccepted = acceptedData.map((r) =>
        typeof r === "string" ? { email: r, message: "", date: null } : r
      );

      // Helper: fetch user profile
      const fetchProfile = async (email) => {
        try {
          const r = await fetch(
            `${API_BASE_URL}/api/user?search=${encodeURIComponent(email)}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!r.ok) return null;
          const data = await r.json();
          return Array.isArray(data) && data.length > 0 ? data[0] : null;
        } catch (err) {
          console.error("Error fetching profile for", email, err);
          return null;
        }
      };

      // 3️⃣ Fetch profiles in parallel
      const receivedProfiles = await Promise.all(
        normalizedReceived.map((r) => fetchProfile(r.email))
      );
      const acceptedProfiles = await Promise.all(
        normalizedAccepted.map((r) => fetchProfile(r.email))
      );

      // 4️⃣ Merge profile + message
      const mergeRequests = (requests, profiles) =>
        requests
          .map((req, i) => {
            const profile = profiles[i] || {};
            return {
              _id: profile._id || `${req.email}-req`,
              name: profile.name || req.email.split("@")[0],
              email: req.email,
              avatar:
                profile.avatar ||
                "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
              message: req.message || "",
              date: req.date,
            };
          })
          .filter(
            (v, i, arr) =>
              arr.findIndex(
                (x) => x.email.toLowerCase() === v.email.toLowerCase()
              ) === i
          );

      const finalReceived = mergeRequests(normalizedReceived, receivedProfiles);
      const finalAccepted = mergeRequests(normalizedAccepted, acceptedProfiles);

      console.log("Merged received chats:", finalReceived);
      console.log("Merged accepted chats:", finalAccepted);

      // ⭐ 5️⃣ FINAL MERGE FOR UI — this fixes your problem ⭐
      const finalMerged = [
        ...finalAccepted,
        ...finalReceived.filter(
          (r) => !finalAccepted.some((a) => a.email === r.email)
        ),
      ];

      console.log("🔥 FINAL MERGED FOR UI:", finalMerged);

      if (!mounted) return;

      // ⬇️ set ONLY ONE STATE (UI expects one list)
      setAcceptedChats(finalMerged);

      // (Optional) keep separate list too
      setReceivedChats(finalReceived);

    } catch (err) {
      console.error("Error fetching chat requests:", err);
    }
  };

  fetchRequests();

  return () => {
    mounted = false;
  };
}, []);



  //After chatting with accepted chats
  const handleOpenChat = (chat) => {
    // When opening a chat with a contact, ensure a chat exists on backend
    (async () => {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("chasmos_auth_token");
        if (!token) {
          console.error("No token found — cannot access chat");
          setSelectedContact(chat);
          return;
        }

        // Determine user id to open chat with
        const userId = chat._id || chat.id || chat.userId || chat.email;

        // Access or create chat on backend
        const res = await fetch(`${API_BASE_URL}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId }),
        });

        if (!res.ok) {
          console.error("Failed to access chat");
          setSelectedContact(chat);
          return;
        }

        console.debug("handleOpenChat: opening chat", { chat });

        const chatObj = await res.json();
        console.debug("handleOpenChat: chatObj response", { chatObj });

        // Normalize chat id to string so keys match when storing/fetching messages
        const normalizedChatId = String(chatObj._id || chatObj.chatId || chatObj.id);
        console.debug("handleOpenChat: normalizedChatId", { normalizedChatId });

        // Find the other participant for display
        const localUser = JSON.parse(localStorage.getItem('chasmos_user_data') || '{}');
        const otherUser = (chatObj.users || chatObj.participants || []).find(
          (u) => String(u._id) !== String(localUser._id)
        );

        const contactForUI = {
          id: normalizedChatId,
          chatId: normalizedChatId,
          name: otherUser?.name || chatObj.chatName || otherUser?.email || "Unknown",
          avatar: otherUser?.pic || otherUser?.avatar || otherUser?.avatar || "/default-avatar.png",
          participants: chatObj.users || chatObj.participants || [],
          isGroup: chatObj.isGroupChat || false,
        };

        setSelectedContact(contactForUI);
        console.debug("handleOpenChat: selectedContact set", { contactForUI });

        // Join socket room
        if (socketRef.current && socketRef.current.emit) {
          socketRef.current.emit("join chat", normalizedChatId);
        }

        // Fetch messages for this chat (use normalized id)
        const msgsUrl = `${API_BASE_URL}/api/message/${normalizedChatId}`;
        console.debug("handleOpenChat: fetching messages", { msgsUrl });
        const msgsRes = await fetch(msgsUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!msgsRes.ok) {
          console.warn("handleOpenChat: messages fetch failed", { status: msgsRes.status });
        } else {
          const msgs = await msgsRes.json();
          console.debug("handleOpenChat: raw messages response", { count: msgs.length, msgsSample: msgs.slice(0,3) });

          const formatted = msgs.map((m) => ({
            id: m._id,
            type: m.type || "text",
            content: m.content || m.text || "",
            sender: m.sender?._id || m.sender,
            timestamp: new Date(m.createdAt || m.createdAt || m.timestamp || Date.now()).getTime(),
            isRead: true,
            attachments: Array.isArray(m.attachments) ? m.attachments : [],
          }));

          console.debug("handleOpenChat: formatted messages", { formattedSample: formatted.slice(0,3) });

          setMessages((prev) => {
            const next = { ...prev, [normalizedChatId]: formatted };
            console.debug("handleOpenChat: setMessages updated for chat", { normalizedChatId, newCount: formatted.length });
            return next;
          });
        }
      } catch (err) {
        console.error("Error opening chat:", err);
        setSelectedContact(chat);
      }
    })();
  };

  //handle on clicking accept button
  // ✅ Accept Chat Request
  const fetchAcceptedChats = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    const res = await fetch(`${API_BASE_URL}/api/user/requests/accepted`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch accepted chats: ${errorText}`);
    }

    const acceptedData = await res.json();
    console.log("✅ Accepted Chats (raw):", acceptedData);

    if (!Array.isArray(acceptedData)) {
      setAcceptedChats([]);
      return;
    }

    // Normalize entire list
    const normalizedChats = acceptedData
      .filter(Boolean)
      .map((chat) => ({
        _id: chat._id || chat.email,
        email: chat.email || "",
        name: chat.name || chat.email?.split("@")[0] || "Unknown",
        avatar:
          chat.avatar ||
          "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
        message: chat.message || "",
        date: chat.date ? new Date(chat.date) : new Date(),
      }));

    console.log("🔹 Normalized Accepted Chats:", normalizedChats);

    setAcceptedChats(normalizedChats);
    setFilteredAcceptedChats(normalizedChats); // important
  } catch (err) {
    console.error("Error fetching accepted chats:", err);
    setAcceptedChats([]);
  }
};

const handleAcceptChat = async (senderEmail) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found.");

    const res = await fetch(`${API_BASE_URL}/api/user/request/accept`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ senderEmail }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    // Remove from received
    setReceivedChats((prev) =>
      prev.filter((c) => c.email !== senderEmail)
    );

    // Add to accepted instantly
    if (data.acceptedChat) {
      const normalized = {
        _id: data.acceptedChat._id || data.acceptedChat.email,
        email: data.acceptedChat.email,
        name:
          data.acceptedChat.name ||
          data.acceptedChat.email?.split("@")[0] ||
          "Unknown",
        avatar:
          data.acceptedChat.avatar ||
          "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
        message: data.acceptedChat.message || "",
        date: new Date(),
      };

      setFilteredAcceptedChats((prev) => [...prev, normalized]);
      setAcceptedChats((prev) => [...prev, normalized]);
    }

    console.log("✅ Chat accepted!");

    // sync with backend
    fetchAcceptedChats();
  } catch (error) {
    console.error("❌ Error accepting chat:", error);
  }
};

useEffect(() => {
  fetchAcceptedChats();
}, []);



  // ✅ Run once when the component mounts (and on mobile view change if needed)
  // useEffect(() => {
  //   fetchAcceptedChats();
  // }, [isMobileView]);

  // Fetch contacts from APi
  const handleContactSelect = useCallback(
    (contact) => {
      // Set selected contact
      setSelectedContact(contact);

      // Mark messages as read
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, unreadCount: 0 } : c))
      );

      // Close sidebar on mobile view
      if (isMobileView) {
        setShowSidebar(false);
      }
    },
    [isMobileView]
  );

  // Fetch recent chats
  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found.");

        const res = await fetch(`${API_BASE_URL}/api/chat/recent`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch recent chats");

        const data = await res.json();

        const localUser = JSON.parse(
          localStorage.getItem("chasmos_user_data") || "{}"
        );
        const loggedInUserId = localUser._id || localUser.id || null;

        const formatted = (Array.isArray(data) ? data : []).map((chat) => {
          // Backend may already provide an `otherUser` helper; prefer that.
          const otherUser =
            chat.otherUser ||
            (chat.participants &&
              chat.participants.find(
                (p) => String(p._id) !== String(loggedInUserId)
              )) ||
            (Array.isArray(chat.participants) ? chat.participants[0] : null);

          const otherId = otherUser?._id || otherUser?.id || null;
          const displayName =
            otherUser?.email || otherUser?.username || otherUser?.name || "Unknown";

          return {
            id: otherId,
            chatId: chat.chatId || chat._id,
            name: displayName,
            avatar: otherUser?.avatar || otherUser?.pic || null,
            lastMessage: chat.lastMessage || (chat.lastMessage && chat.lastMessage.text) || "",
            timestamp: chat.timestamp || chat.updatedAt,
            isOnline: otherUser?.isOnline || false,
            unreadCount:
              typeof chat.unreadCount === "number"
                ? chat.unreadCount
                : (chat.unreadCount && chat.unreadCount[loggedInUserId]) || 0,
          };
        });

        setRecentChats(formatted);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentChats();
  }, []);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowSidebar(true);
      } else {
        setShowSidebar(!selectedContact);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [selectedContact]);
  
  // Close chat search bar and three dots menu when switching chats
  useEffect(() => {
    setShowChatSearch(false);
    setShowThreeDotsMenu(false);
    setChatSearchTerm("");
  }, [selectedContact]);

  // Handle click outside chat search and three dots menu to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        chatSearchRef.current &&
        !chatSearchRef.current.contains(event.target) &&
        showChatSearch
      ) {
        setShowChatSearch(false);
        setChatSearchTerm("");
      }
      if (
        threeDotsMenuRef.current &&
        !threeDotsMenuRef.current.contains(event.target) &&
        showThreeDotsMenu
      ) {
        setShowThreeDotsMenu(false);
      }
      if (
        floatingMenuRef.current &&
        !floatingMenuRef.current.contains(event.target) &&
        showFloatingMenu
      ) {
        setShowFloatingMenu(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target) &&
        showUserMenu
      ) {
        setShowUserMenu(false);
      }
    };

    if (
      showChatSearch ||
      showThreeDotsMenu ||
      showFloatingMenu ||
      showUserMenu
    ) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showChatSearch, showThreeDotsMenu, showFloatingMenu, showUserMenu]);

  const filteredContacts = useMemo(() => {
    let filtered = searchContacts(contacts, searchTerm);

    // Filter by navigation item type
    switch (activeNavItem) {
      case "chats":
        filtered = filtered.filter(
          (contact) =>
            !contact.isGroup && !contact.isDocument && !contact.isCommunity
        );
        break;
      case "groups":
        filtered = filtered.filter((contact) => contact.isGroup);
        break;
      case "documents":
        filtered = filtered.filter((contact) => contact.isDocument);
        break;
      case "community":
        filtered = filtered.filter((contact) => contact.isCommunity);
        break;
      default:
        // Show all for default case
        break;
    }

    return filtered;
  }, [contacts, searchTerm, activeNavItem]);

  // Remove useMemo and calculate messages directly in render
  const getMessagesForContact = (contactId, searchTerm = "") => {
    if (!contactId) return [];

    // Get messages for the contact, default to empty array
    const contactMessages = messages[contactId] || [];

    // If no search term, return all messages sorted by timestamp
    if (!searchTerm.trim()) {
      return [...contactMessages].sort((a, b) => a.timestamp - b.timestamp);
    }

    // Filter messages by search term (case-insensitive)
    return contactMessages
      .filter((message) => {
        const text = message.text || message.content || "";
        return text.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => a.timestamp - b.timestamp); // Optional: sort filtered messages too
  };

  // Memoize input change handlers
  const handleSearchTermChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleChatSearchTermChange = useCallback((e) => {
    setChatSearchTerm(e.target.value);
  }, []);

  // Handle sending message from the MessageInput component-Updated
  const handleSendMessageFromInput = useCallback(
    (payload) => {
      // payload can be a string (text) or an object (server message or attachment payload)
      if (!payload || !selectedContact) return;

      // If payload is a server-created message object (has _id), append directly
      if (typeof payload === 'object' && (payload._id || payload.id || payload.createdAt)) {
        try {
          const chatId = payload.chat?._id || payload.chat || selectedContact.chatId || selectedContact.id || selectedContact._id;
          const formatted = {
            id: payload._id || payload.id || Date.now(),
            type: payload.type || 'file',
            content: payload.content || payload.text || '',
            sender: payload.sender?._id || payload.sender || 'me',
            timestamp: new Date(payload.createdAt || payload.createdAt || Date.now()).getTime(),
            isRead: true,
            attachments: payload.attachments || payload.files || [],
          };

          setMessages((prevMessages) => ({
            ...prevMessages,
            [chatId]: [...(prevMessages[chatId] || []), formatted],
          }));

          // emit socket event if available
          if (socketRef.current && socketRef.current.emit) {
            socketRef.current.emit('new message', payload);
          }

          // update recentChats
          setRecentChats((prevChats) => {
            const exists = prevChats.find((c) => c.id === chatId || c.chatId === chatId);
            if (exists) {
              return prevChats.map((c) => (c.id === chatId || c.chatId === chatId ? { ...c, lastMessage: payload.content || payload.text || '', timestamp: Date.now() } : c));
            } else {
              return [
                {
                  id: chatId,
                  chatId,
                  name: selectedContact.name,
                  avatar: selectedContact.avatar || '/default-avatar.png',
                  lastMessage: payload.content || payload.text || '',
                  timestamp: Date.now(),
                  unreadCount: 0,
                },
                ...prevChats,
              ];
            }
          });

          return;
        } catch (err) {
          console.error('Error appending server message payload', err);
          return;
        }
      }

      // If payload is an object with attachments but not a server message, send via API
      if (typeof payload === 'object' && payload.attachments) {
        (async () => {
          const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
          const chatId = selectedContact.chatId || selectedContact.id || selectedContact._id;
          if (!chatId || !token) {
            // local fallback
            const chatKey = chatId || selectedContact.email || selectedContact.id;
            const newMessage = {
              id: Date.now(),
              type: payload.type || 'file',
              content: payload.text || '',
              sender: 'me',
              timestamp: Date.now(),
              attachments: payload.attachments,
            };

            setMessages((prevMessages) => ({
              ...prevMessages,
              [chatKey]: [...(prevMessages[chatKey] || []), newMessage],
            }));
            // Update recentChats preview for local fallback: prefer text, else attachment filename
            setRecentChats((prevChats) => {
              const previewFromAttachments = (atts) => {
                if (!Array.isArray(atts) || atts.length === 0) return '';
                const a = atts[0];
                const possibleName = a.fileName || a.file_name || a.filename || a.name || a.url || a.fileUrl || '';
                if (typeof possibleName === 'string' && possibleName.length > 0) {
                  return possibleName.replace(/^[\d\-:.]+_/, '');
                }
                return 'Attachment';
              };

              return prevChats.map((c) => {
                if (c.id === chatKey || c.chatId === chatKey) {
                  const newLast = newMessage.content && newMessage.content.trim() ? newMessage.content : previewFromAttachments(newMessage.attachments);
                  return {
                    ...c,
                    lastMessage: newLast || 'Attachment',
                    timestamp: Date.now(),
                    hasAttachment: Array.isArray(newMessage.attachments) && newMessage.attachments.length > 0,
                    attachmentName: Array.isArray(newMessage.attachments) && newMessage.attachments[0]?.fileName ? newMessage.attachments[0].fileName.replace(/^[\d\-:.]+_/, '') : undefined,
                    attachmentMime: Array.isArray(newMessage.attachments) && (newMessage.attachments[0]?.mimeType || newMessage.attachments[0]?.fileType) ? (newMessage.attachments[0].mimeType || newMessage.attachments[0].fileType) : undefined,
                  };
                }
                return c;
              });
            });
            return;
          }

          try {
            const res = await fetch(`${API_BASE_URL}/api/message`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ content: payload.text || '', chatId, attachments: payload.attachments, type: payload.type }),
            });

            if (!res.ok) throw new Error('Failed to send message with attachments');

            const sent = await res.json();
            const formatted = {
              id: sent._id || sent.id || Date.now(),
              type: sent.type || payload.type || 'file',
              content: sent.content || sent.text || payload.text || '',
              sender: sent.sender?._id || sent.sender || 'me',
              timestamp: new Date(sent.createdAt || Date.now()).getTime(),
              isRead: true,
              attachments: sent.attachments || payload.attachments,
            };

            setMessages((prevMessages) => ({
              ...prevMessages,
              [chatId]: [...(prevMessages[chatId] || []), formatted],
            }));

            if (socketRef.current && socketRef.current.emit) {
              socketRef.current.emit('new message', sent);
            }

            // Compute preview: prefer text, else first attachment filename (stripped)
            const computePreview = (fmt) => {
              const text = (fmt.content || fmt.text || '').toString().trim();
              const atts = fmt.attachments || [];
              if (text.length > 0) {
                return atts.length > 0 ? `${text} 📎` : text;
              }
              if (atts.length > 0) {
                const a = atts[0];
                const name = a.fileName || a.file_name || a.filename || a.name || (a.fileUrl ? a.fileUrl.split('/').pop() : '') || '';
                const stripped = (name || '').replace(/^[\d\-:.]+_/, '');
                return stripped || 'Attachment';
              }
              return '';
            };

            const previewText = computePreview(formatted);

            setRecentChats((prevChats) => {
              const exists = prevChats.find((c) => c.id === chatId || c.chatId === chatId);
              if (exists) {
                return prevChats.map((c) =>
                  c.id === chatId || c.chatId === chatId
                    ? {
                        ...c,
                        lastMessage: previewText,
                        timestamp: Date.now(),
                        hasAttachment: Array.isArray(formatted.attachments) && formatted.attachments.length > 0,
                        attachmentName: Array.isArray(formatted.attachments) && formatted.attachments[0]?.fileName ? formatted.attachments[0].fileName.replace(/^[\d\-:.]+_/, '') : undefined,
                        attachmentMime: Array.isArray(formatted.attachments) && (formatted.attachments[0]?.mimeType || formatted.attachments[0]?.fileType) ? (formatted.attachments[0].mimeType || formatted.attachments[0].fileType) : undefined,
                      }
                    : c
                );
              } else {
                return [
                  {
                    id: chatId,
                    chatId,
                    name: selectedContact.name,
                    avatar: selectedContact.avatar || '/default-avatar.png',
                    lastMessage: previewText,
                    timestamp: Date.now(),
                    unreadCount: 0,
                    hasAttachment: Array.isArray(formatted.attachments) && formatted.attachments.length > 0,
                    attachmentName: Array.isArray(formatted.attachments) && formatted.attachments[0]?.fileName ? formatted.attachments[0].fileName.replace(/^[\d\-:.]+_/, '') : undefined,
                    attachmentMime: Array.isArray(formatted.attachments) && (formatted.attachments[0]?.mimeType || formatted.attachments[0]?.fileType) ? (formatted.attachments[0].mimeType || formatted.attachments[0].fileType) : undefined,
                  },
                  ...prevChats,
                ];
              }
            });
          } catch (err) {
            console.error('Error sending attachment message:', err);
          }
        })();

        return;
      }

      // Otherwise treat payload as text message string
      if (typeof payload === 'string') {
        const messageText = payload;
        if (!messageText.trim()) return;

        (async () => {
          const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
          const chatId = selectedContact.chatId || selectedContact.id || selectedContact._id;

          // If we don't have a chatId or token, fall back to local append
          if (!chatId || !token) {
            const chatKey = chatId || selectedContact.email || selectedContact.id;
            const newMessage = {
              id: Date.now(),
              type: 'text',
              content: messageText,
              sender: 'me',
              timestamp: Date.now(),
              isRead: true,
            };

            setMessages((prevMessages) => ({
              ...prevMessages,
              [chatKey]: [...(prevMessages[chatKey] || []), newMessage],
            }));

            return;
          }

          try {
            const res = await fetch(`${API_BASE_URL}/api/message`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ content: messageText, chatId }),
            });

            if (!res.ok) throw new Error('Failed to send message');

            const sent = await res.json();

            const formatted = {
              id: sent._id || sent.id || Date.now(),
              type: 'text',
              content: sent.content || sent.text || messageText,
              sender: sent.sender?._id || sent.sender || 'me',
              timestamp: new Date(sent.createdAt || Date.now()).getTime(),
              isRead: true,
            };

            setMessages((prevMessages) => ({
              ...prevMessages,
              [chatId]: [...(prevMessages[chatId] || []), formatted],
            }));

            // Emit socket event for realtime delivery
            if (socketRef.current && socketRef.current.emit) {
              socketRef.current.emit('new message', sent);
            }

            // Update recentChats
            setRecentChats((prevChats) => {
              const exists = prevChats.find((c) => c.id === chatId || c.chatId === chatId);
              if (exists) {
                return prevChats.map((c) => (c.id === chatId || c.chatId === chatId ? { ...c, lastMessage: messageText, timestamp: Date.now() } : c));
              } else {
                return [
                  {
                    id: chatId,
                    chatId,
                    name: selectedContact.name,
                    avatar: selectedContact.avatar || '/default-avatar.png',
                    lastMessage: messageText,
                    timestamp: Date.now(),
                    unreadCount: 0,
                  },
                  ...prevChats,
                ];
              }
            });
          } catch (err) {
            console.error('Error sending message:', err);
          }
        })();
      }
    },
    [selectedContact]
  );

  // Initialize socket connection once
  useEffect(() => {
    const initSocket = () => {
      try {
        const userData = JSON.parse(localStorage.getItem('chasmos_user_data') || '{}');
        socketRef.current = io(API_BASE_URL, {
          transports: ['websocket'],
          withCredentials: true,
        });

        socketRef.current.on('connect', () => {
          socketRef.current.emit('setup', userData);
          setSocketConnected(true);
        });

        socketRef.current.on('connected', () => setSocketConnected(true));

        socketRef.current.on('message recieved', (newMessage) => {
          try {
            const chatId = newMessage.chat?._id || newMessage.chat;
            const senderId = newMessage.sender?._id || newMessage.sender;
            const key = chatId || senderId;

            const attachments = Array.isArray(newMessage.attachments) ? newMessage.attachments : [];

            const inferredType = newMessage.type || (attachments.length ? (
              (attachments[0].mimeType && attachments[0].mimeType.startsWith('image/')) ? 'image' :
              (attachments[0].mimeType && attachments[0].mimeType.startsWith('video/')) ? 'video' : 'file'
            ) : 'text');

            const formatted = {
              id: newMessage._id || newMessage.id || Date.now(),
              type: inferredType,
              content: newMessage.content || newMessage.text || '',
              sender: newMessage.sender?._id || newMessage.sender,
              timestamp: new Date(newMessage.createdAt || Date.now()).getTime(),
              isRead: false,
              attachments: attachments,
            };

            setMessages((prev) => ({
              ...prev,
              [key]: [...(prev[key] || []), formatted],
            }));

            // update recentChats/unread when not currently selected
            setRecentChats((prev) => {
              const exists = prev.find((c) => c.chatId === key || c.id === key);
              if (exists) {
                return prev.map((c) => (c.chatId === key || c.id === key ? { ...c, lastMessage: formatted.content, unreadCount: (c.unreadCount || 0) + 1 } : c));
              }
              return prev;
            });
          } catch (err) {
            console.error('Error processing incoming socket message', err);
          }
        });
      } catch (err) {
        console.error('Socket init error', err);
      }
    };

    initSocket();

    return () => {
      try {
        if (socketRef.current) socketRef.current.disconnect();
      } catch (err) {}
    };
  }, [API_BASE_URL]);

  const handleBackToContacts = useCallback(() => {
    if (isMobileView) {
      setSelectedContact(null);
      setShowSidebar(true);
      setShowGroupCreation(false);
      setShowNewChat(false);
    }
  }, [isMobileView]);

  const toggleChatSearch = useCallback(() => {
    console.log("toggleChatSearch called, current state:", showChatSearch);
    setShowChatSearch(!showChatSearch);
    console.log("toggleChatSearch setting state to:", !showChatSearch);
  }, [showChatSearch]);

  const closeChatSearch = useCallback(() => {
    setShowChatSearch(false);
    setChatSearchTerm("");
  }, []);

  const toggleThreeDotsMenu = useCallback(() => {
    console.log(
      "toggleThreeDotsMenu called, current state:",
      showThreeDotsMenu
    );
    setShowThreeDotsMenu(!showThreeDotsMenu);
    // Close search if it's open
    if (showChatSearch) {
      setShowChatSearch(false);
    }
  }, [showThreeDotsMenu, showChatSearch]);

  const closeThreeDotsMenu = useCallback(() => {
    setShowThreeDotsMenu(false);
  }, []);

  const handlePinMessage = useCallback((messageId) => {
    setPinnedMessages((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  }, []);

  // Time-based cosmic overlay system
  const getTimeBasedCosmicTheme = useCallback(() => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      // Morning (5 AM - 12 PM): Light cosmic theme
      return {
        isNightMode: false,
        starColor: "rgba(251, 146, 60, 0.8)",
        period: "morning",
        themeOverride: null,
      };
    } else if (hour >= 12 && hour < 17) {
      // Day (12 PM - 5 PM): Bright theme
      return {
        isNightMode: false,
        starColor: "rgba(59, 130, 246, 0.6)",
        period: "day",
        themeOverride: null,
      };
    } else if (hour >= 17 && hour < 21) {
      // Evening (5 PM - 9 PM): Sunset theme
      return {
        isNightMode: false,
        starColor: "rgba(168, 85, 247, 0.8)",
        period: "evening",
        themeOverride: null,
      };
    } else {
      // Night (9 PM - 5 AM): Full night mode with overlays
      return {
        isNightMode: true,
        starColor: "rgba(255, 255, 255, 1)",
        period: "night",
        themeOverride: {
          primary: "bg-gray-900 text-white",
          sidebar: "bg-gray-900/95 border-r border-gray-700",
          secondary: "bg-gray-800",
          accent: "bg-blue-600",
          text: "text-white",
          textSecondary: "text-gray-300",
          border: "border-gray-600",
          hover: "hover:bg-gray-700",
          searchBg: "bg-gray-700/50",
          inputBg: "bg-gray-700",
          cardBg: "bg-gray-800",
          messageBg: "bg-gray-700",
          mode: "dark",
        },
      };
    }
  }, []);

  // Floating menu functions
  const toggleFloatingMenu = useCallback(() => {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;

    // Handle double click (less than 300ms between clicks)
    if (timeDiff < 300 && showFloatingMenu) {
      setShowFloatingMenu(false);
      setLastClickTime(0);
      return;
    }

    setShowFloatingMenu(!showFloatingMenu);
    setLastClickTime(currentTime);
  }, [showFloatingMenu, lastClickTime]);

  const closeFloatingMenu = useCallback(() => {
    setShowFloatingMenu(false);
  }, []);

  const handleCreateGroup = useCallback(() => {
    setShowGroupCreation(true);
    setShowFloatingMenu(false);
    if (isMobileView) {
      setShowSidebar(false);
    }
  }, [isMobileView]);

  const handleNewChat = useCallback(() => {
    setShowNewChat(true);
    setShowFloatingMenu(false);
    if (isMobileView) {
      setShowSidebar(false);
    }
  }, [isMobileView]);

  const handleInviteUser = useCallback(() => {
    console.log("Invite user clicked");
    setShowFloatingMenu(false);
  }, []);

  const handleCloseGroupCreation = useCallback(() => {
    setShowGroupCreation(false);
  }, []);

  const handleCloseNewChat = useCallback(() => {
    setShowNewChat(false);
  }, []);

  const handleCreateGroupComplete = useCallback((newGroup) => {
    // Add the new group to contacts
    setContacts((prev) => [newGroup, ...prev]);
    setShowGroupCreation(false);
    // Optionally select the new group
    setSelectedContact(newGroup);
  }, []);

  const handleStartNewChat = useCallback(
    (contact) => {
      setSelectedContact(contact);
      setShowNewChat(false);

      // Initialize messages array if it doesn't exist
      if (!messages[contact.id]) {
        setMessages((prev) => ({
          ...prev,
          [contact.id]: [],
        }));
      }
    },
    [messages]
  );

  // Ref for chat search container (click-outside functionality)

  // Fetch contacts from APi

  const [documentChats, setDocumentChats] = useState([]);
  // Filter accepted chats to exclude users already present in recentChats
  const filteredAcceptedChats = React.useMemo(() => {
  if (!Array.isArray(acceptedChats) || acceptedChats.length === 0) return [];
  if (!Array.isArray(recentChats) || recentChats.length === 0) return acceptedChats;

  const recentEmails = new Set(
    recentChats
      .map((r) => r.email || r.otherUser?.email)
      .filter(Boolean)
      .map((email) => email.toLowerCase())
  );

  return acceptedChats.filter((a) => {
    const email = (a.email || "").toLowerCase();
    return !recentEmails.has(email);
  });
}, [acceptedChats, recentChats]);


  const [isExpanded, setIsExpanded] = useState(true);

  // ✅ Create a new chat/document
  const handleNewChatdoc = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/document/new`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName: "Untitled Document" }),
      });

      if (!res.ok) throw new Error("Failed to create new chat");
      const newDoc = await res.json();

      setDocumentChats((prev) => [newDoc, ...prev]);
      setSelectedDocument(newDoc);
    } catch (error) {
      console.error("Error creating new document chat:", error);
    }
  };

  useEffect(() => {
    const fetchDocumentHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/document`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch document history");

        const data = await res.json();
        setDocumentChats(data);
      } catch (error) {
        console.error("Error fetching document history:", error);
      }
    };

    fetchDocumentHistory();
  }, []);

  // 🔹 Message input state
  const [messageInput, setMessageInput] = useState("");

  // 🔹 Theme object example (you can replace with your real theme)

  // 🔹 Function to send message (triggered by Enter key or Send button)
  const handleSendClick = useCallback(() => {
    if (!messageInput.trim() || !selectedDocument) return;

    // Here, send the message to your backend or append to chat array
    console.log(
      `📩 Sending message: "${messageInput}" for document:`,
      selectedDocument
    );

    // Clear input after sending
    setMessageInput("");
  }, [messageInput, selectedDocument]);

  // Fetch recent chats
  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found.");

        const res = await fetch(`${API_BASE_URL}/api/chat/recent`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch recent chats");

        const data = await res.json();

        const localUser = JSON.parse(
          localStorage.getItem("chasmos_user_data") || "{}"
        );
        const loggedInUserId = localUser._id || localUser.id || null;

        const formatted = (Array.isArray(data) ? data : []).map((chat) => {
          const otherUser =
            chat.otherUser ||
            (chat.participants &&
              chat.participants.find(
                (p) => String(p._id) !== String(loggedInUserId)
              )) ||
            (Array.isArray(chat.participants) ? chat.participants[0] : null);

          const otherId = otherUser?._id || otherUser?.id || null;
          const displayName =
            otherUser?.email || otherUser?.username || otherUser?.name || "Unknown";

          // Determine if lastMessage indicates attachments and extract preview text
          let preview = "";
          let hasAttachment = false;
          let attachmentMime = null;

          if (chat.lastMessage) {
            if (typeof chat.lastMessage === "string") {
              // backend may append a paperclip emoji for attachments
              hasAttachment = chat.lastMessage.includes("📎");
              preview = chat.lastMessage.replace(/📎/g, "").trim();
            } else if (typeof chat.lastMessage === "object") {
              const lm = chat.lastMessage;
              const text = (lm.content || lm.text || "").toString().trim();
              const atts = Array.isArray(lm.attachments) ? lm.attachments : [];
              hasAttachment = atts.length > 0;
              if (text) {
                preview = text.split(/\s+/).slice(0, 8).join(" ") + (hasAttachment ? " 📎" : "");
              } else if (hasAttachment) {
                const first = atts[0] || {};
                preview = first.fileName || first.file_name || first.filename || (first.fileUrl ? first.fileUrl.split('/').pop() : "Attachment");
                // strip paperclip or timestamp if present
                preview = preview.replace(/^[\d\-:.]+_/, "");
                attachmentMime = first.mimeType || first.type || null;
              }
            }
          }

          return {
            id: otherId,
            chatId: chat.chatId || chat._id,
            name: displayName,
            avatar: otherUser?.avatar || otherUser?.pic || null,
            lastMessage: preview || "",
            hasAttachment,
            attachmentMime,
            timestamp: chat.timestamp || chat.updatedAt,
            isOnline: otherUser?.isOnline || false,
            unreadCount:
              typeof chat.unreadCount === "number"
                ? chat.unreadCount
                : (chat.unreadCount && chat.unreadCount[loggedInUserId]) || 0,
          };
        });

        setRecentChats(formatted);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentChats();
  }, []);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowSidebar(true);
      } else {
        setShowSidebar(!selectedContact);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [selectedContact]);
  // Close chat search bar and three dots menu when switching chats
  useEffect(() => {
    setShowChatSearch(false);
    setShowThreeDotsMenu(false);
    setChatSearchTerm("");
  }, [selectedContact]);

  // Handle click outside chat search and three dots menu to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        chatSearchRef.current &&
        !chatSearchRef.current.contains(event.target) &&
        showChatSearch
      ) {
        setShowChatSearch(false);
        setChatSearchTerm("");
      }
      if (
        threeDotsMenuRef.current &&
        !threeDotsMenuRef.current.contains(event.target) &&
        showThreeDotsMenu
      ) {
        setShowThreeDotsMenu(false);
      }
      if (
        floatingMenuRef.current &&
        !floatingMenuRef.current.contains(event.target) &&
        showFloatingMenu
      ) {
        setShowFloatingMenu(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target) &&
        showUserMenu
      ) {
        setShowUserMenu(false);
      }
    };

    if (
      showChatSearch ||
      showThreeDotsMenu ||
      showFloatingMenu ||
      showUserMenu
    ) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showChatSearch, showThreeDotsMenu, showFloatingMenu, showUserMenu]);

  const [cosmicTheme, setCosmicTheme] = useState(() =>
    getTimeBasedCosmicTheme()
  );
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date().getHours());

  // Create effective theme that combines current theme with time-based overrides
  const effectiveTheme = cosmicTheme.themeOverride || currentTheme;

  // Update cosmic theme more frequently and check for hour changes
  useEffect(() => {
    const updateTheme = () => {
      const currentHour = new Date().getHours();
      const newTheme = getTimeBasedCosmicTheme();

      // Update if hour changed or theme period changed
      if (
        currentHour !== lastUpdateTime ||
        newTheme.period !== cosmicTheme.period
      ) {
        setCosmicTheme(newTheme);
        setLastUpdateTime(currentHour);
        console.log(
          `Cosmic theme updated to: ${newTheme.period} at hour ${currentHour}`
        );
      }
    };

    // Check every 10 seconds for immediate response
    const interval = setInterval(updateTheme, 10000);

    // Also update immediately
    updateTheme();

    return () => clearInterval(interval);
  }, [getTimeBasedCosmicTheme, lastUpdateTime, cosmicTheme.period]);

  // Add this useEffect near the top of ChattingPage component
useEffect(() => {
  const root = document.documentElement;
  
  if (effectiveTheme.mode === 'dark' || cosmicTheme.isNightMode) {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }
  
  return () => {
    root.classList.remove('dark');
    root.removeAttribute('data-theme');
  };
}, [effectiveTheme.mode, cosmicTheme.isNightMode]);

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700&family=Exo+2:wght@400;500;600;700&display=swap');
          
          body, html {
            margin: 0 !important;
            padding: 0 !important;
            height: 100vh !important;
            overflow: hidden !important;
          }
          
          #root {
            height: 100vh !important;
            width: 100vw !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          
          @keyframes cosmicShift {
            0%, 100% { transform: rotate(0deg) scale(1); }
            25% { transform: rotate(1deg) scale(1.02); }
            50% { transform: rotate(0deg) scale(1.05); }
            75% { transform: rotate(-1deg) scale(1.02); }
          }
          
          @keyframes shootingStar {
            0% {
              transform: translateX(-100px) translateY(-100px) scale(0);
              opacity: 0;
            }
            10% {
              opacity: 1;
              transform: translateX(-50px) translateY(-50px) scale(1);
            }
            90% {
              opacity: 1;
              transform: translateX(300px) translateY(300px) scale(1);
            }
            100% {
              opacity: 0;
              transform: translateX(400px) translateY(400px) scale(0);
            }
          }
        `}
      </style>

      <div
        className={`fixed inset-0 w-full h-full flex overflow-hidden transition-all duration-1000 ${
          cosmicTheme.isNightMode ? "bg-black" : currentTheme.primary
        }`}
      >
        {/* Night Mode Cosmic Overlay */}
        {cosmicTheme.isNightMode && (
          <div className="absolute inset-0 overflow-hidden">
            {/* Animated space background */}
            <div
              className="absolute inset-0 opacity-80"
              style={{
                background: `
                  radial-gradient(circle at 20% 50%, rgba(29, 78, 216, 0.3) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.3) 0%, transparent 50%),
                  radial-gradient(circle at 40% 80%, rgba(168, 85, 247, 0.2) 0%, transparent 50%),
                  linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(17, 24, 39, 0.8) 50%, rgba(0, 0, 0, 0.9) 100%)
                `,
                animation: "cosmicShift 20s ease-in-out infinite",
              }}
            />

            {/* Twinkling stars layer */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(100)].map((_, i) => {
                const size = Math.random() * 3 + 1;
                const left = Math.random() * 100;
                const top = Math.random() * 100;
                const delay = Math.random() * 5;
                const duration = 2 + Math.random() * 3;

                return (
                  <div
                    key={`night-star-${i}`}
                    className="absolute rounded-full bg-white"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      left: `${left}%`,
                      top: `${top}%`,
                      animation: `twinkle ${duration}s ease-in-out infinite`,
                      animationDelay: `${delay}s`,
                      boxShadow: `0 0 ${size * 2}px rgba(255, 255, 255, 0.8)`,
                    }}
                  />
                );
              })}
            </div>

            {/* Shooting stars */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(3)].map((_, i) => (
                <div
                  key={`shooting-star-${i}`}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `shootingStar 8s linear infinite`,
                    animationDelay: `${i * 3}s`,
                    boxShadow: "0 0 6px #ffffff, 0 0 12px #ffffff",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Day time subtle cosmic background */}
        {!cosmicTheme.isNightMode && (
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ zIndex: 0 }}
          >
            {[...Array(20)].map((_, i) => {
              const size = Math.random() * 2 + 1;
              const left = Math.random() * 100;
              const top = Math.random() * 100;
              const delay = Math.random() * 3;

              return (
                <div
                  key={`day-star-${i}`}
                  style={{
                    position: "absolute",
                    width: `${size}px`,
                    height: `${size}px`,
                    left: `${left}%`,
                    top: `${top}%`,
                    background: cosmicTheme.starColor,
                    borderRadius: "50%",
                    animation: `twinkle 3s ease-in-out infinite`,
                    animationDelay: `${delay}s`,
                    opacity: 0.4,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Vertical Navigation Bar */}
        <div
          className={`w-16 z-50 ${effectiveTheme.secondary} border-r ${effectiveTheme.border} flex flex-col justify-between py-4`}
          style={{ borderRightWidth: "1px" }}
        >
          {/* Top Navigation Items */}
          <div className="flex flex-col space-y-4 items-center">
            {/* Single Chats */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveNavItem("chats")}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                activeNavItem === "chats"
                  ? `${effectiveTheme.accent} text-white shadow-lg`
                  : `${effectiveTheme.hover} ${effectiveTheme.textSecondary} hover:${effectiveTheme.text}`
              }`}
              title="Chats"
            >
              <MessageCircle className="w-5 h-5" />
            </motion.button>

            {/* Groups */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveNavItem("groups")}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                activeNavItem === "groups"
                  ? `${effectiveTheme.accent} text-white shadow-lg`
                  : `${effectiveTheme.hover} ${effectiveTheme.textSecondary} hover:${effectiveTheme.text}`
              }`}
              title="Groups"
            >
              <Users className="w-5 h-5" />
            </motion.button>

            {/* Documents */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveNavItem("documents")}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                activeNavItem === "documents"
                  ? `${effectiveTheme.accent} text-white shadow-lg`
                  : `${effectiveTheme.hover} ${effectiveTheme.textSecondary} hover:${effectiveTheme.text}`
              }`}
              title="Documents"
            >
              <Folder className="w-5 h-5" />
            </motion.button>

            {/* Community */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveNavItem("community")}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                activeNavItem === "community"
                  ? `${effectiveTheme.accent} text-white shadow-lg`
                  : `${effectiveTheme.hover} ${effectiveTheme.textSecondary} hover:${effectiveTheme.text}`
              }`}
              title="Community"
            >
              <Globe className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Bottom Navigation Items */}
          <div className="flex flex-col space-y-4 items-center">
            {/* Profile */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowProfile(true)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${effectiveTheme.hover} ${effectiveTheme.textSecondary} hover:${effectiveTheme.text}`}
              title="Profile"
            >
              <User className="w-5 h-5" />
            </motion.button>

            {/* Settings */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(true)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${effectiveTheme.hover} ${effectiveTheme.textSecondary} hover:${effectiveTheme.text}`}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </motion.button>

            {/* Logout */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLogout}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 hover:text-red-600`}
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Sidebar */}
        <AnimatePresence mode="wait">
          {showSidebar &&
            !(isMobileView && (showGroupCreation || showNewChat)) && (
              <motion.div
  initial={{ x: isMobileView ? -300 : -100, opacity: 0 }}
  animate={{
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      opacity: { duration: 0.3 },
    },
  }}
  exit={{
    x: isMobileView ? -300 : -100,
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  }}
  className={`${
    isMobileView ? "absolute z-20 w-full h-full" : "w-1/3 min-w-80 h-full"
  } ${
    effectiveTheme.mode === 'dark'
      ? 'backdrop-blur-xl bg-gray-900/30 border-r border-white/10'
      : 'bg-white/95 backdrop-blur-xl border-r border-gray-200 shadow-lg'
  } flex flex-col overflow-hidden`}
>
                {/* Search Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full ${effectiveTheme.accent} flex items-center justify-center`}
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            fill="currentColor"
                            className="text-blue-500"
                          />
                          <path
                            d="M17.5 15.5C17.25 15.25 16.8125 15.0625 16.375 14.875C15.9375 14.6875 15.5625 14.5 15.0625 14.1875C14.5625 13.875 14.1875 13.625 13.8125 13.3125C13.4375 13 13.0625 12.5625 12.75 12.0625C12.5 11.5625 12.25 11.0625 12 10.5625C11.75 10.0625 11.5 9.5625 11.25 9.0625C11 8.5625 10.75 8.125 10.5 7.625C10.25 7.125 10 6.625 9.75 6.125C9.5 5.625 9.25 5.1875 9 4.6875C8.75 4.1875 8.5 3.75 8.25 3.25C8 2.75 7.75 2.25 7.5 1.75C7.25 1.25 7 0.75 6.75 0.25C6.5 0.25 6.25 0.5 6 0.75C5.75 1 5.5 1.25 5.25 1.5C5 1.75 4.75 2 4.5 2.25C4.25 2.5 4 2.75 3.75 3C3.5 3.25 3.25 3.5 3 3.75C2.75 4 2.5 4.25 2.25 4.5C2 4.75 1.75 5 1.5 5.25C1.25 5.5 1 5.75 0.75 6C0.5 6.25 0.25 6.5 0.25 6.75L0.25 6.75Z"
                            fill="white"
                          />
                        </svg>
                      </div>
                      <h1
                        className={`text-xl font-bold ${effectiveTheme.text}`}
                        style={{
                          fontFamily: "'Orbitron', sans-serif",
                          letterSpacing: "2px",
                        }}
                      >
                        Chasmos
                      </h1>
                    </div>
                  </div>

                  <div
                    className={`relative ${effectiveTheme.searchBg} rounded-lg`}
                  >
                    <Search
                      className={`absolute left-3 top-3 w-4 h-4 ${effectiveTheme.textSecondary}`}
                    />
                    <input
                      type="text"
                      placeholder={
                        activeNavItem === "chats"
                          ? "Search conversations..."
                          : activeNavItem === "documents"
                            ? "Search documents..."
                            : "Search..."
                      }
                      value={searchTerm}
                      onChange={handleSearchTermChange}
                      className={`w-full pl-10 pr-4 py-3 bg-transparent ${effectiveTheme.text} placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
                    />
                  </div>
                </div>

                {/* Chat Sidebar Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
  {/* Alerts Section: Chat Requests & Accepted */}
  <div className="flex-shrink-0">
    {/* Chat Requests Dropdown */}
    <div className="mb-2 rounded-md justify-between items-center px-2 py-1">
      <button
        onClick={() => setShowReceivedDropdown(!showReceivedDropdown)}
        className={`w-full flex justify-between items-center px-3 py-2 rounded-lg ${
          effectiveTheme.mode === 'dark'
            ? 'hover:bg-blue-900/30 text-blue-200'
            : 'hover:bg-blue-50 text-blue-800'
        } transition-colors font-medium`}
      >
        <span className="flex items-center gap-2">
          <img src={chatReqIcon} alt="Chat Requests" className="w-4 h-4" />
          Chat Requests Received ({receivedChats.length})
        </span>
        {showReceivedDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

<AnimatePresence>
                      {showReceivedDropdown && (
                        <motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: "auto", opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
  transition={{ duration: 0.3, ease: "easeInOut" }}
  className="overflow-hidden"
>
  <div 
    className="mt-2 p-2 space-y-2 max-h-56 overflow-y-auto"
    style={{
      scrollbarWidth: 'thin',
      scrollbarColor: effectiveTheme.mode === 'dark' 
        ? '#667eea transparent'
        : '#8b5cf6 transparent'
    }}
  >
                          {receivedChats.length > 0 ? (
                            receivedChats.map((req) => (
                              <div
  key={req._id || req.email}
  className={`flex justify-between items-center p-2 rounded-md ${
    effectiveTheme.mode === 'dark'
      ? 'hover:bg-gray-700/50'
      : 'hover:bg-gray-100'
  } transition-colors`}
>
  <div className="flex items-center gap-3 flex-1">
    <img
      src={
        req.avatar ||
        "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
      }
      alt={req.name || "User"}
      className="w-10 h-10 rounded-full object-cover"
    />
    <div>
      <p className={`font-medium truncate ${
        effectiveTheme.mode === 'dark' ? 'text-gray-100' : 'text-gray-900'
      }`}>
        {req.name || req.email?.split("@")[0] || "Unknown User"}
      </p>
      {req.message ? (
        <p className={`text-sm truncate ${
          effectiveTheme.mode === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          "{req.message}"
        </p>
      ) : (
        <p className="text-sm text-gray-500 truncate">
          No message
        </p>
      )}
    </div>
  </div>
  <button
    onClick={() => handleAcceptChat(req.email)}
    className="px-3 py-1 text-xs rounded-md bg-green-600 text-white hover:bg-green-700 transition"
  >
    Accept
  </button>
</div>

                            ))
                          ) : (
                            <div
                              className={`w-full flex items-center px-4 py-3 rounded-lg ${
                                effectiveTheme.searchBg
                                  ? effectiveTheme.searchBg
                                  : "bg-gray-100 dark:bg-gray-800"
                              } text-gray-400`}
                            >
                              No new requests
                            </div>
                          )}
                        </div>
                        </motion.div>
                      )}
</AnimatePresence>
                    </div>

                    {/* 🔹 Accepted Chats Dropdown */}
                    <div className="rounded-md justify-between items-center px-2 py-1">
  <button
    onClick={() => setShowAcceptedDropdown(!showAcceptedDropdown)}
    className={`w-full flex justify-between items-center px-3 py-2 rounded-lg ${
      effectiveTheme.mode === "dark"
        ? "hover:bg-green-900/30 text-green-200"
        : "hover:bg-green-50 text-green-800"
    } transition-colors font-medium`}
  >
    <span className="flex items-center gap-2">
      <img
        src={chatAcceptIcon}
        alt="Chats Accepted"
        className="w-4 h-4"
      />
      Chat Invites Accepted ({filteredAcceptedChats?.length || 0})
    </span>
    {showAcceptedDropdown ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )}
  </button>

  <AnimatePresence>
    {showAcceptedDropdown && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div
          className="mt-2 p-2 space-y-2 max-h-56 overflow-y-auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor:
              effectiveTheme.mode === "dark"
                ? "#667eea transparent"
                : "#8b5cf6 transparent",
          }}
        >
          {filteredAcceptedChats && filteredAcceptedChats.length > 0 ? (
            filteredAcceptedChats.map((chat, index) => (
              <motion.div
                key={chat._id || chat.email || `accepted-${index}`}
                whileHover={{ scale: 0.98 }}
                className={`flex justify-between items-center p-2 rounded-md ${
                  effectiveTheme.mode === "dark"
                    ? "hover:bg-gray-700/50"
                    : "hover:bg-gray-100"
                } transition-colors`}
              >
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        chat.avatar ||
                        "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
                      }
                      alt={chat.name || chat.email || "User"}
                      className="w-11 h-11 rounded-full object-cover border border-gray-500 shadow-md"
                    />
                  </div>

                  <div className="overflow-hidden">
                    <p
                      className={`font-medium truncate ${
                        effectiveTheme.mode === "dark"
                          ? "text-gray-100"
                          : "text-gray-900"
                      }`}
                    >
                      {chat.name?.trim() && chat.name !== "Unknown User"
                        ? chat.name
                        : chat.email?.split("@")[0] || "Unknown User"}
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 0.95 }}
                  onClick={() => handleOpenChat(chat)}
                  className="flex-shrink-0 ml-3 w-9 h-9 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 transition"
                  title="Open Chat"
                >
                  <MessageCircle className="w-5 h-5 text-white" />
                </motion.button>
              </motion.div>
            ))
          ) : (
            <div
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg ${
                effectiveTheme.searchBg
                  ? effectiveTheme.searchBg
                  : "bg-gray-100 dark:bg-gray-800"
              } text-gray-400`}
            >
              No new accepted invites yet
            </div>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</div>

                  </div>

                  {/* 🧭 Contacts List */}
               <div 
  className="flex-1 overflow-y-auto p-4 space-y-4 sidebar-scroll"
  style={{
    scrollbarWidth: 'thin',
    scrollbarColor: effectiveTheme.mode === 'dark' 
      ? '#667eea transparent' // Blue-purple for dark mode
      : '#8b5cf6 transparent' // Purple for light mode
  }}
>
  {/* Recent Chats */}
  {recentChats.length > 0 && (
    <div className="flex flex-col gap-2">
      <h4 className={`font-semibold ${effectiveTheme.mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
        Recent Chats
      </h4>
      {recentChats.map((chat) => (
        <ContactItem
          key={chat.id}
          contact={chat}
          effectiveTheme={effectiveTheme}
          onSelect={(c) => handleOpenChat(c)}
        />
      ))}
    </div>
  )}

  {/* All Contacts */}
  {contacts.length > 0 && (
    <div className="flex flex-col gap-2 mt-4">
      <h4 className={`font-semibold ${effectiveTheme.mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
        Contacts
      </h4>
      {contacts.map((contact) => (
        <ContactItem
          key={contact.id}
          contact={contact}
          effectiveTheme={effectiveTheme}
          onSelect={(c) => handleOpenChat(c)}
        />
      ))}
    </div>
  )}

  {/* Empty State */}
  {recentChats.length === 0 && contacts.length === 0 && (
    <div className="text-center space-y-4 mt-10">
      <p className={effectiveTheme.mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
        Start chatting with Chasmos!
      </p>
      <button
        onClick={() => setShowNewChat(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        New Chat
      </button>
    </div>
  )}
</div>
                </div>

                {/* Floating Add Button with Menu */}
                <div className="relative">
                  {/* Floating Action Menu */}
                  {showFloatingMenu && (
                    <motion.div
                      ref={floatingMenuRef}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 20 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute ${isMobileView ? "bottom-20 right-6 fixed" : "bottom-20 right-6"} flex flex-col space-y-3 z-30`}
                    >
                      {/* Create Group */}
                      <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        onClick={handleCreateGroup}
                        className={`flex items-center space-x-3 ${effectiveTheme.secondary} px-4 py-3 rounded-lg shadow-lg border ${effectiveTheme.border} hover:${effectiveTheme.hover} transition-colors group`}
                      >
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <span
                          className={`${effectiveTheme.text} font-medium whitespace-nowrap`}
                        >
                          Create a group
                        </span>
                      </motion.button>

                      {/* New Chat */}
                      <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        onClick={handleNewChat}
                        className={`flex items-center space-x-3 ${effectiveTheme.secondary} px-4 py-3 rounded-lg shadow-lg border ${effectiveTheme.border} hover:${effectiveTheme.hover} transition-colors group`}
                      >
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <span
                          className={`${effectiveTheme.text} font-medium whitespace-nowrap`}
                        >
                          New chat
                        </span>
                      </motion.button>

                      {/* Invite User */}
                      <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        onClick={handleInviteUser}
                        className={`flex items-center space-x-3 ${effectiveTheme.secondary} px-4 py-3 rounded-lg shadow-lg border ${effectiveTheme.border} hover:${effectiveTheme.hover} transition-colors group`}
                      >
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                          <UserPlus className="w-5 h-5 text-white" />
                        </div>
                        <span
                          className={`${effectiveTheme.text} font-medium whitespace-nowrap`}
                        >
                          Invite new user
                        </span>
                      </motion.button>
                    </motion.div>
                  )}

                  {/* Main Floating Button */}
                  <motion.button
                    whileHover={{
                      scale: 1.1,
                      rotate: [0, -10, 10, -10, 0],
                      boxShadow: "0 10px 30px rgba(59, 130, 246, 0.4)",
                    }}
                    whileTap={{
                      scale: 0.95,
                      rotate: -5,
                    }}
                    animate={{
                      y: [0, -5, 0],
                      transition: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }}
                    className={`absolute ${isMobileView ? "bottom-6 right-6 fixed" : "bottom-6 right-6"} w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-300 z-20 group`}
                    style={{
                      background: showFloatingMenu
                        ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                        : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                      boxShadow: showFloatingMenu
                        ? "0 8px 25px rgba(239, 68, 68, 0.3)"
                        : "0 8px 25px rgba(59, 130, 246, 0.3)",
                      border: "none",
                    }}
                    onClick={() => {
                      toggleFloatingMenu();
                    }}
                  >
                    <motion.div
                      whileHover={{
                        rotate: 360,
                        transition: { duration: 0.6 },
                      }}
                      animate={{
                        rotate: showFloatingMenu ? 45 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      {showFloatingMenu ? (
                        <X className="w-7 h-7 text-white" />
                      ) : (
                        <MessageSquare className="w-7 h-7 text-white" />
                      )}
                    </motion.div>

                    {/* Ripple effect on hover */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20"
                      animate={{
                        scale: [1, 1.5],
                        opacity: [0, 0.2, 0],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                    />
                  </motion.button>
                </div>
              </motion.div>
            )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div
          key={selectedContact?.id || selectedDocument?._id || "no-contact"}
          className="flex-1 flex flex-col relative h-full overflow-hidden"
        >
          {showGroupCreation ? (
            <GroupCreation
              contacts={contacts}
              effectiveTheme={effectiveTheme}
              onClose={handleCloseGroupCreation}
              onCreateGroup={handleCreateGroupComplete}
            />
          ) : showNewChat ? (
            <NewChat
              contacts={contacts}
              effectiveTheme={effectiveTheme}
              onClose={handleCloseNewChat}
              onStartChat={handleStartNewChat}
            />
          ) : showProfile ? (
            <Profile
              effectiveTheme={effectiveTheme}
              onClose={() => setShowProfile(false)}
            />
          ) : showSettings ? (
            <SettingsPage
              effectiveTheme={effectiveTheme}
              onClose={() => setShowSettings(false)}
            />
          ) : isNewDocumentChat ? (
            <NewDocumentUploader
              onUploadComplete={(doc) => {
                setSelectedDocument(doc);
                setIsNewDocumentChat(false);
              }}
              onCancel={() => setIsNewDocumentChat(false)}
              effectiveTheme={effectiveTheme}
            />
          ) : selectedDocument ? (
            <DocumentChatWrapper
              key={selectedDocument._id}
              selectedDocument={selectedDocument}
              setSelectedDocument={setSelectedDocument}
              effectiveTheme={effectiveTheme}
            />
          ) : selectedContact ? (
            // CASE 3: Normal person/group chat
            <>
              <ChatHeader
                selectedContact={selectedContact}
                effectiveTheme={effectiveTheme}
                isMobileView={isMobileView}
                onBackToContacts={handleBackToContacts}
                onToggleChatSearch={toggleChatSearch}
                showChatSearch={showChatSearch}
                chatSearchTerm={chatSearchTerm}
                onChatSearchChange={handleChatSearchTermChange}
                chatSearchRef={chatSearchRef}
                onCloseChatSearch={closeChatSearch}
                pinnedMessages={pinnedMessages}
              />
              <div className="flex-1 overflow-hidden relative">
                <MessagesArea
                  key={selectedContact.id}
                  filteredMessages={getMessagesForContact(
                    selectedContact.id,
                    chatSearchTerm
                  )}
                  pinnedMessages={pinnedMessages}
                  onPinMessage={handlePinMessage}
                  effectiveTheme={effectiveTheme}
                  isTyping={isTyping}
                  selectedContactId={selectedContact.id}
                  currentUserId={currentUserId}
                />
              </div>
              <MessageInput
                    onSendMessage={handleSendMessageFromInput}
                selectedContact={selectedContact}
                effectiveTheme={effectiveTheme}
              />
            </>
          ) : !isMobileView ? (
            // CASE 4: Empty welcome screen
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-sm w-full">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full ${effectiveTheme.accent} mx-auto mb-4 sm:mb-6 flex items-center justify-center`}
                >
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-12 h-12 sm:w-14 sm:h-14"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="currentColor"
                      className="text-blue-500"
                    />
                    <path
                      d="M17.5 15.5C17.25 15.25 16.8125 15.0625 16.375 14.875C15.9375 14.6875 15.5625 14.5 15.0625 14.1875C14.5625 13.875 14.1875 13.625 13.8125 13.3125C13.4375 13 13.0625 12.5625 12.75 12.0625C12.5 11.5625 12.25 11.0625 12 10.5625C11.75 10.0625 11.5 9.5625 11.25 9.0625C11 8.5625 10.75 8.125 10.5 7.625C10.25 7.125 10 6.625 9.75 6.125C9.5 5.625 9.25 5.1875 9 4.6875C8.75 4.1875 8.5 3.75 8.25 3.25C8 2.75 7.75 2.25 7.5 1.75C7.25 1.25 7 0.75 6.75 0.25C6.5 0.25 6.25 0.5 6 0.75C5.75 1 5.5 1.25 5.25 1.5C5 1.75 4.75 2 4.5 2.25C4.25 2.5 4 2.75 3.75 3C3.5 3.25 3.25 3.5 3 3.75C2.75 4 2.5 4.25 2.25 4.5C2 4.75 1.75 5 1.5 5.25C1.25 5.5 1 5.75 0.75 6C0.5 6.25 0.25 6.5 0.25 6.75L0.25 6.75Z"
                      fill="white"
                    />
                  </svg>
                </motion.div>
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className={`text-xl sm:text-2xl font-bold mb-2 ${effectiveTheme.text}`}
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    letterSpacing: "2px",
                  }}
                >
                  Welcome to Chasmos
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className={`text-sm sm:text-base ${effectiveTheme.textSecondary}`}
                >
                  Select a conversation to start messaging
                </motion.p>
              </div>
            </div>
          ) : // CASE 5: Default null (mobile or undefined)
          null}
        </div>
      </div>
    </>
  );
};

export default ChattingPage;
