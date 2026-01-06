/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { toast } from "react-hot-toast";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { useScreenshotDetection } from "../hooks/useScreenshotDetection";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import chatReqIcon from "../assets/Chat-reuest.png";
import chatAcceptIcon from "../assets/chat-accepted.png";
import doubleCheckIcon from "../assets/double-check.svg";
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
  UserMinus,
  Copy,
  PinOff,
  Edit,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import blockService from "../utils/blockService";
import archiveService from "../utils/archiveService";
import BlockedUsers from "./BlockedUsers";
import ArchiveManager from "./ArchiveManager";
import MediaLinksDocsViewer from "./MediaLinksDocsViewer";
import { useTheme } from "../context/ThemeContext";
import Logo from "./Logo";
import MessageInput from "./MessageInput";
import ContactItem from "./ContactItem";
import NewChat from "./NewChat";
import Profile from "./Profile";
import SettingsPage from "./Settings";
import { FaUser, FaCog, FaSignOutAlt } from "react-icons/fa";
import {
  mockContacts,
  mockMessages,
  formatMessageTime,
  formatHoverDate,
  searchContacts,
  generateAvatarFallback,
} from "../utils/mockData";
import DocumentChat from "./DocumentChat";
import NewDocumentUploader from "./NewDocumentUploader";
import DocumentChatWrapper from "./DocumentChat";
import PollMessage from "./PollMessage";
import GroupCreation from "./GroupCreation";
import DateTag from "./DateTag";
import ForwardMessageModal from "./ForwardMessageModal";
import PinnedMessagesBar from "./PinnedMessagesBar";
import DeleteMessageModal from "./DeleteMessageModal";
import UserProfileModal from "./UserProfileModal";
import GroupInfoModal from "./GroupInfoModal";
import MessageNotificationContainer from "./MessageNotification";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

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
    onBlockUser,
    onUnblockUser,
    onArchiveChat,
    onUnarchiveChat,
    onDeleteChat,
    isBlocked,
    isArchived,
    onOpenUserProfile,
    onOpenGroupInfo,
    // New props passed from parent
    isOnline,
    groupOnlineCount,
    selectedHasLeftGroup,
  }) => {
    const [menuOpen, setMenuOpen] = React.useState(false);
    const menuRef = React.useRef(null);
    const avatarFallbackText =
      selectedContact?.chatName ||
      selectedContact?.name ||
      selectedContact?.username ||
      "U";
    React.useEffect(() => {
      const handler = (e) => {
        if (!menuRef.current) return;
        if (menuOpen && !menuRef.current.contains(e.target)) {
          setMenuOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [menuOpen]);

    return (
      <div className={`${effectiveTheme.secondary} relative`}>
        <div className="p-4 flex items-center justify-between">
          <div
            className={`flex items-center space-x-3 flex-1 ${selectedHasLeftGroup ? "cursor-default opacity-95" : "cursor-pointer hover:bg-white/5"} transition-colors rounded-lg -ml-2 pl-2 pr-4 py-1`}
            onClick={() => {
              console.log(
                "❌ Header clicked - selectedContact:",
                selectedContact
              );
              console.log("🔍 isDocument:", selectedContact.isDocument);
              console.log("🔍 isGroup:", selectedContact.isGroup);
              console.log("🔍 isGroupChat:", selectedContact.isGroupChat);
              console.log("🔍 isgroupchat:", selectedContact.isgroupchat);

              if (selectedContact.isDocument) return;
              const isGroup =
                selectedContact.isGroup ||
                selectedContact.isGroupChat ||
                selectedContact.isgroupchat;
              console.log("✅ isGroup calculated as:", isGroup);
              // If user has left the group, suppress header clicks for group info
              if (isGroup && selectedHasLeftGroup) {
                console.log(
                  "⛔ Header click suppressed: user not a member of this group"
                );
                return;
              }
              if (isGroup) {
                console.log("📋 Opening GroupInfoModal");
                onOpenGroupInfo(selectedContact);
              } else {
                console.log("👤 Opening UserProfileModal");
                onOpenUserProfile();
              }
            }}
          >
            {isMobileView && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBackToContacts();
                }}
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
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                  {avatarFallbackText.charAt(0)}
                </div>
              )}

              {(!selectedContact?.hasBlockedYou && !selectedHasLeftGroup && isOnline && !selectedContact.isDocument) && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
        <div>
          
              <div className="flex items-center gap-2">
                <h2 className={`font-semibold ${effectiveTheme.text}`}>{selectedContact.name}</h2>
                {isBlocked && (
                  <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${effectiveTheme.mode === 'dark' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-800'}`}>
                    Blocked
                  </span>
                )}
                {selectedContact?.unreadCount > 0 && (
                  <div className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-semibold">
                    {selectedContact.unreadCount > 99
                      ? "99+"
                      : selectedContact.unreadCount}
                  </div>
                )}
              </div>

             {!selectedContact?.hasBlockedYou && (
               <p className={`text-sm ${effectiveTheme.textSecondary}`}>
                 {selectedContact?.isTyping
                   ? "Typing..."
                   : (selectedContact.isGroup || selectedContact.isGroupChat || selectedContact.isgroupchat)
                   ? (selectedHasLeftGroup ? "" : `${groupOnlineCount || 0} online`)
                   : isOnline
                   ? "Online"
                   : "Offline"}
               </p>
             )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
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

            <div className="relative ml-0" ref={menuRef}>
              <button
                aria-label="Open chat menu"
                className={`p-2 rounded ${effectiveTheme.hover} ${effectiveTheme.text}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((s) => !s);
                }}
              >
                <MoreVertical className={`w-5 h-5 ${effectiveTheme.text}`} />
              </button>
              {menuOpen && (
                <div
                  className={`absolute right-0 top-10 w-44 ${effectiveTheme.secondary} border ${effectiveTheme.border} rounded shadow-lg z-50 overflow-hidden`}
                  style={
                    effectiveTheme.mode !== "dark" ? { background: "#fff" } : {}
                  }
                >
                  <ul className="divide-y relative z-10">
                    {!(
                      selectedContact?.isGroup ||
                      selectedContact?.isGroupChat ||
                      selectedContact?.isgroupchat
                    ) && (
                      <li>
                        {!isBlocked ? (
                          <button
                            className={`w-full text-left px-4 py-3 flex items-center gap-2 transition-all duration-200`}
                            style={{
                              color:
                                effectiveTheme.mode === "dark"
                                  ? "#e5e7eb"
                                  : "#000000",
                              backgroundColor: "transparent",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                effectiveTheme.mode === "dark"
                                  ? "#374151"
                                  : "#e5e7eb";
                              e.currentTarget.style.color =
                                effectiveTheme.mode === "dark"
                                  ? "#e5e7eb"
                                  : "#6b7280";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                              e.currentTarget.style.color =
                                effectiveTheme.mode === "dark"
                                  ? "#e5e7eb"
                                  : "#000000";
                            }}
                            onClick={() => {
                              onBlockUser && onBlockUser(selectedContact);
                              setMenuOpen(false);
                            }}
                          >
                            <UserMinus className="w-4 h-4" />
                            <span>Block User</span>
                          </button>
                        ) : (
                          <button
                            className={`w-full text-left px-4 py-3 flex items-center gap-2 transition-all duration-200`}
                            style={{
                              color:
                                effectiveTheme.mode === "dark"
                                  ? "#e5e7eb"
                                  : "#000000",
                              backgroundColor: "transparent",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                effectiveTheme.mode === "dark"
                                  ? "#374151"
                                  : "#e5e7eb";
                              e.currentTarget.style.color =
                                effectiveTheme.mode === "dark"
                                  ? "#e5e7eb"
                                  : "#6b7280";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                              e.currentTarget.style.color =
                                effectiveTheme.mode === "dark"
                                  ? "#e5e7eb"
                                  : "#000000";
                            }}
                            onClick={() => {
                              onUnblockUser && onUnblockUser(selectedContact);
                              setMenuOpen(false);
                            }}
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>Unblock User</span>
                          </button>
                        )}
                      </li>
                    )}
                    {selectedContact?.chatId && (
                      <li>
                        {!isArchived ? (
                          <button
                            className={`w-full text-left px-4 py-3 flex items-center gap-2 transition-all duration-200`}
                            style={{
                              color:
                                effectiveTheme.mode === "dark"
                                  ? "#e5e7eb"
                                  : "#000000",
                              backgroundColor: "transparent",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                effectiveTheme.mode === "dark"
                                  ? "#374151"
                                  : "#e5e7eb";
                              e.currentTarget.style.color =
                                effectiveTheme.mode === "dark"
                                  ? "#e5e7eb"
                                  : "#6b7280";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                              e.currentTarget.style.color =
                                effectiveTheme.mode === "dark"
                                  ? "#e5e7eb"
                                  : "#000000";
                            }}
                            onClick={() => {
                              onArchiveChat && onArchiveChat(selectedContact);
                              setMenuOpen(false);
                            }}
                          >
                            <Archive className="w-4 h-4" />
                            <span>Archive Chat</span>
                          </button>
                        ) : (
                          <button
                            className={`w-full text-left px-4 py-3 flex items-center gap-2 transition-all duration-200`}
                            style={{
                              color:
                                effectiveTheme.mode === "dark"
                                  ? "#e5e7eb"
                                  : "#000000",
                              backgroundColor: "transparent",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                effectiveTheme.mode === "dark"
                                  ? "#374151"
                                  : "#e5e7eb";
                              e.currentTarget.style.color =
                                effectiveTheme.mode === "dark"
                                  ? "#e5e7eb"
                                  : "#6b7280";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                              e.currentTarget.style.color =
                                effectiveTheme.mode === "dark"
                                  ? "#e5e7eb"
                                  : "#000000";
                            }}
                            onClick={() => {
                              onUnarchiveChat &&
                                onUnarchiveChat(selectedContact);
                              setMenuOpen(false);
                            }}
                          >
                            <Archive className="w-4 h-4" />
                            <span>Unarchive Chat</span>
                          </button>
                        )}
                      </li>
                    )}
                    {/* <li>
                          <button className={`w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-800 ${effectiveTheme.text}`} onClick={()=>{ navigator.clipboard?.writeText(selectedContact?.id || ''); setMenuOpen(false); }}>
                            <Copy className="w-4 h-4 opacity-80" />
                            <span>Copy Chat ID</span>
                          </button>
                    </li> */}
                    {selectedContact?.chatId && (
                      <li>
                        <button
                          className={`w-full text-left px-4 py-3 flex items-center gap-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900`}
                          onClick={() => {
                            onDeleteChat && onDeleteChat(selectedContact);
                            setMenuOpen(false);
                          }}
                        >
                          <Trash2 className="w-4 h-4 opacity-90" />
                          <span>Delete Chat</span>
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.selectedContact?.id === nextProps.selectedContact?.id &&
      prevProps.selectedContact?.name === nextProps.selectedContact?.name &&
      prevProps.selectedContact?.avatar === nextProps.selectedContact?.avatar &&
      prevProps.selectedContact?.isTyping ===
        nextProps.selectedContact?.isTyping &&
      prevProps.showChatSearch === nextProps.showChatSearch &&
      prevProps.chatSearchTerm === nextProps.chatSearchTerm &&
      JSON.stringify(prevProps.pinnedMessages) ===
        JSON.stringify(nextProps.pinnedMessages) &&
      prevProps.isBlocked === nextProps.isBlocked &&
      prevProps.isArchived === nextProps.isArchived &&
      prevProps.isOnline === nextProps.isOnline &&
      prevProps.groupOnlineCount === nextProps.groupOnlineCount &&
      prevProps.selectedHasLeftGroup === nextProps.selectedHasLeftGroup
    );
  }
);

// MessageBubble component definition
const MessageBubble = React.memo(
  ({
    message,
    isPinned,
    onPinToggle,
    onDeleteMessage,
    onStartForwardSelection,
    onToggleSelectForward,
    forwardSelectionActive,
    selectedForwards,
    onEditMessage,
    effectiveTheme,
    currentUserId,
    onHoverDateChange,
    onPollVote,
    onPollRemoveVote,
    onPollClose,
    replySelectionActive,
    selectedReplies,
    onStartReplySelection,
    onToggleSelectReply,
    allMessages,
    selectedContact,
    selectedHasLeftGroup,
  }) => {
    const sender = message.sender;
    const isOwnMessage = (() => {
      if (!sender) return false;
      if (sender === "me") return true;
      if (typeof sender === "string")
        return String(sender) === String(currentUserId);
      if (typeof sender === "object")
        return String(sender._id || sender.id) === String(currentUserId);
      return false;
    })();

    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(message.content || "");
    const editInputRef = useRef(null);
    const bubbleRef = useRef(null);
    const [overlayPos, setOverlayPos] = useState(null);
    const [avatarHover, setAvatarHover] = useState(false);

    const handlePinClick = useCallback(() => {
      onPinToggle(message.id);
    }, [message.id, onPinToggle]);

    const handleForwardClick = useCallback(() => {
      const id = message._id || message.id;
      if (forwardSelectionActive) {
        onToggleSelectForward && onToggleSelectForward(id);
      } else {
        onStartForwardSelection && onStartForwardSelection(id);
      }
    }, [
      message,
      onStartForwardSelection,
      onToggleSelectForward,
      forwardSelectionActive,
    ]);

    const handleEditClick = useCallback(() => {
      setIsEditing(true);
      setEditedText(message.content || "");
    }, [message.content]);

    const handleSaveEdit = useCallback(async () => {
      if (editedText.trim() && editedText !== message.content) {
        await onEditMessage(message, editedText.trim());
      }
      setIsEditing(false);
    }, [editedText, message, onEditMessage]);

    const handleCancelEdit = useCallback(() => {
      setIsEditing(false);
      setEditedText(message.content || "");
    }, [message.content]);

    useEffect(() => {
      if (isEditing && editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, [isEditing]);

    const messageText = message.content || "";
    const hasAttachments =
      message.attachments && message.attachments.length > 0;
    const isShortMessage = messageText.length < 30 && !hasAttachments;

    const msgId = message._id || message.id;
    const isForwardSelected =
      forwardSelectionActive &&
      Array.isArray(selectedForwards) &&
      selectedForwards.includes(msgId);

    const bubblePaddingClass = isShortMessage
      ? "py-2"
      : isOwnMessage
        ? `pt-2 ${hasAttachments ? "pb-12" : "pb-10"} pr-6`
        : hasAttachments
          ? "py-3"
          : "py-2";

    // Replies-to-this (other messages that replied to this message)
    const [showReplies, setShowReplies] = useState(false);
    const [repliesPage, setRepliesPage] = useState(0);
    const REPLIES_PER_PAGE = 1;

    const repliesToThis = useMemo(() => {
      const thisId = message._id || message.id;
      if (!thisId || !Array.isArray(allMessages)) return [];
      return allMessages.filter((m) => {
        if (!Array.isArray(m.repliedTo)) return false;
        return m.repliedTo.some((rt) => {
          const refId = rt && (rt._id || rt.id || rt);
          return String(refId) === String(thisId);
        });
      });
    }, [allMessages, message]);
    const repliesTotal = repliesToThis.length;
    const repliesTotalPages = Math.max(
      1,
      Math.ceil(repliesTotal / REPLIES_PER_PAGE)
    );

    // Normalize sender info for overlay display (handles string ids, nested objects, and legacy fields)
    const isGroupChat = Boolean(
      // prefer parent-selected contact flag when available
      (selectedContact &&
        (selectedContact.isGroup ||
          selectedContact.isGroupChat ||
          selectedContact.isgroupchat)) ||
        message.chat?.isGroupChat ||
        message.chat?.isGroup ||
        message.chat?.isgroupchat ||
        message.isGroup ||
        message.isgroupchat ||
        message.isGroupChat
    );

    const overlaySender = (() => {
      if (!sender) {
        // Try alternate fields often present on message objects
        if (message.senderName || message.sender_name || message.senderLabel) {
          return {
            name:
              message.senderName || message.sender_name || message.senderLabel,
            avatar:
              message.senderAvatar ||
              message.sender_avatar ||
              message.senderAvatarUrl ||
              message.senderAvatarURL ||
              null,
          };
        }
        if (message.createdBy) {
          return typeof message.createdBy === "object"
            ? message.createdBy
            : { id: message.createdBy, name: String(message.createdBy) };
        }
        return null;
      }
      if (typeof sender === "string") {
        return {
          id: sender,
          name: message.senderName || message.sender_label || sender,
        };
      }
      // sender is an object
      return sender;
    })();

    // Update overlay position when bubble or viewport changes
    useEffect(() => {
      if (
        !(!isOwnMessage && isGroupChat && overlaySender && bubbleRef.current)
      ) {
        setOverlayPos(null);
        return;
      }
      const update = () => {
        try {
          if (!bubbleRef.current) return;
          const r = bubbleRef.current.getBoundingClientRect();
          // Position the overlay so it hugs the bubble's bottom-left similar to the own-message overlay
          // left: slightly left of the bubble's left edge, top: slightly above the bubble bottom so it appears attached
          // use bubble's left and bottom as base; we'll apply the same translate offsets
          const left = Math.max(6, r.left);
          const top = Math.max(6, r.bottom);
          setOverlayPos({ left, top });
        } catch (e) {
          // ignore
        }
      };
      update();
      window.addEventListener("resize", update);
      window.addEventListener("scroll", update, true);
      return () => {
        window.removeEventListener("resize", update);
        window.removeEventListener("scroll", update, true);
      };
    }, [
      bubbleRef,
      isGroupChat,
      overlaySender,
      isOwnMessage,
      message._id,
      message.id,
    ]);

    const getReplyAuthorLabel = (ref) => {
      if (!ref) return "Unknown";
      const s = ref.sender;
      if (!s) return "Unknown";
      // sender may be an object or a string id
      if (typeof s === "string") {
        return String(s) === String(currentUserId)
          ? "You"
          : ref.senderName || "Unknown";
      }
      const sid = s._id || s.id || s;
      if (String(sid) === String(currentUserId)) return "You";
      return s.name || s.displayName || "Unknown";
    };

    return (
      <motion.div
        id={`message-${message._id || message.id}`}
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
        onMouseEnter={() => {
          try {
            const timeForHover = message.isScheduled
              ? message.scheduledFor
              : message.timestamp || message.scheduledFor || message.createdAt;
            onHoverDateChange &&
              onHoverDateChange(formatHoverDate(timeForHover));
          } catch (e) {
            // ignore
          }
        }}
        onMouseLeave={() => {
          /* keep auto-hide timer; do not clear immediately */
        }}
        className={`flex mb-4 ${
          isOwnMessage ? "justify-end" : "justify-start"
        } group relative`}
      >
        <div
          className={`flex items-center gap-2 ${isOwnMessage ? "flex-row-reverse" : ""}`}
        >
          {/* Reply selection checkbox */}
          {replySelectionActive && (
            <div
              className={`flex items-center ${isOwnMessage ? "ml-2" : "mr-2"}`}
            >
              <input
                type="checkbox"
                checked={selectedReplies?.includes(message._id || message.id)}
                onChange={() =>
                  onToggleSelectReply &&
                  onToggleSelectReply(message._id || message.id)
                }
                aria-label="Select message to reply"
              />
            </div>
          )}
          <motion.div
            ref={bubbleRef}
            className={`${
              isShortMessage ? "inline-flex flex-col" : "max-w-xs lg:max-w-md"
            } px-4 ${bubblePaddingClass} rounded-lg relative ${
              isOwnMessage
                ? `backdrop-blur-md bg-gradient-to-br from-purple-400/20 to-blue-400/20 border border-white/30 shadow-lg shadow-purple-500/10 text-white`
                : effectiveTheme.mode === "dark"
                  ? "backdrop-blur-xl bg-gradient-to-br from-blue-400/30 to-blue-600/25 border border-blue-300/30 shadow-lg shadow-blue-500/10 text-white"
                  : "bg-gradient-to-br from-blue-50 to-purple-50 backdrop-blur-md text-gray-800 border border-blue-200 shadow-sm"
            } ${isPinned ? "ring-2 ring-yellow-400" : ""} ${isForwardSelected ? (effectiveTheme.mode === "dark" ? "ring-2 ring-blue-400 bg-blue-700/20" : "ring-2 ring-blue-400 bg-blue-50") : ""}`}
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

            {isForwardSelected && (
              <div
                className={`absolute -top-2 right-2 z-30 flex items-center justify-center rounded-full p-1 ${effectiveTheme.mode === "dark" ? "bg-blue-500" : "bg-blue-600"}`}
                style={{ width: 22, height: 22 }}
              >
                <Check className="w-3 h-3 text-white" />
              </div>
            )}

            {/* Forwarded indicator */}
            {message.isForwarded && (
              <div
                className={`flex items-center space-x-1 mb-2 text-xs italic ${
                  effectiveTheme.mode === "dark"
                    ? "text-gray-400"
                    : "text-gray-600"
                }`}
              >
                <Share2 className="w-3 h-3" />
                <span>Forwarded</span>
              </div>
            )}

            {/* Replied-to preview(s) */}
            {message.repliedTo && message.repliedTo.length > 0 && (
              <div
                className="mb-1 p-2 rounded border-l-4 border-gray-300 bg-opacity-20"
                style={{
                  background:
                    effectiveTheme.mode === "dark"
                      ? "rgba(255,255,255,0.02)"
                      : "#fafafa",
                }}
              >
                {(message.repliedTo || []).slice(0, 3).map((ref) => (
                  <div
                    key={ref._id || ref.id}
                    className="text-xs mb-1 cursor-pointer truncate"
                    onClick={(e) => {
                      e.stopPropagation();
                      const el = document.getElementById(
                        `message-${ref._id || ref.id}`
                      );
                      if (el)
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                    }}
                  >
                    <div
                      className={`font-semibold ${effectiveTheme.mode === "dark" ? "text-white" : "text-gray-800"} text-[12px]`}
                    >
                      {getReplyAuthorLabel(ref)}
                    </div>
                    <div
                      className={`text-[11px] opacity-80 truncate ${effectiveTheme.mode === "dark" ? "text-gray-200" : "text-gray-600"}`}
                    >
                      {ref.content
                        ? ref.content.length > 80
                          ? ref.content.substring(0, 77) + "..."
                          : ref.content
                        : ref.attachments && ref.attachments.length
                          ? "Attachment"
                          : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Replies-to-this preview (other messages that replied to this message) */}
            {repliesTotal > 0 && (
              <div className={hasAttachments ? "mb-2" : "mt-0 mb-1"}>
                <div className="relative inline-flex items-center">
                  <svg
                    className="pointer-events-none absolute left-0 top-1/2 transform -translate-y-1/2 opacity-60 w-4 h-4 z-0 text-blue-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M9 14L4 9l5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <path
                      d="M20 20v-7a4 4 0 0 0-4-4H4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                  <button
                    className="text-xs text-blue-500 cursor-pointer select-none relative z-10 flex items-center gap-2 pl-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReplies((s) => !s);
                      setRepliesPage(0);
                    }}
                    role="button"
                    aria-expanded={showReplies}
                  >
                    {showReplies
                      ? `Hide ${repliesTotal} repl${repliesTotal > 1 ? "ies" : "y"}`
                      : `View ${repliesTotal} repl${repliesTotal > 1 ? "ies" : "y"}`}
                  </button>
                </div>

                {showReplies && (
                  <div
                    className={`mt-2 p-2 rounded border ${effectiveTheme.border} bg-opacity-10`}
                    style={{
                      background:
                        effectiveTheme.mode === "dark"
                          ? "rgba(255,255,255,0.02)"
                          : "#ffffff",
                    }}
                  >
                    {(repliesToThis || [])
                      .slice(
                        repliesPage * REPLIES_PER_PAGE,
                        (repliesPage + 1) * REPLIES_PER_PAGE
                      )
                      .map((r) => (
                        <div
                          key={r._id || r.id}
                          className="text-xs mb-2 cursor-pointer truncate"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            const el = document.getElementById(
                              `message-${r._id || r.id}`
                            );
                            if (el) {
                              try {
                                el.scrollIntoView({
                                  behavior: "smooth",
                                  block: "center",
                                });
                                const prev = el.style.boxShadow;
                                el.style.boxShadow =
                                  "0 0 0 3px rgba(250,204,21,0.6)";
                                setTimeout(() => {
                                  el.style.boxShadow = prev;
                                }, 2000);
                              } catch (e) {
                                // ignore
                              }
                            }
                          }}
                        >
                          <div
                            className={`font-semibold ${effectiveTheme.mode === "dark" ? "text-white" : "text-gray-800"} text-[12px]`}
                          >
                            {getReplyAuthorLabel(r)}
                          </div>
                          <div
                            className={`text-[11px] opacity-80 truncate ${effectiveTheme.mode === "dark" ? "text-gray-200" : "text-gray-600"}`}
                          >
                            {r.content
                              ? r.content.length > 80
                                ? r.content.substring(0, 77) + "..."
                                : r.content
                              : r.attachments && r.attachments.length
                                ? "Attachment"
                                : ""}
                          </div>
                        </div>
                      ))}

                    {/* Pagination controls */}
                    {repliesTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-2">
                        <button
                          className={`px-2 py-1 rounded ${effectiveTheme.mode === "dark" ? "bg-white/6 text-white/90" : "bg-gray-200 text-gray-800"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setRepliesPage((p) => Math.max(0, p - 1));
                          }}
                          disabled={repliesPage <= 0}
                        >
                          ‹
                        </button>
                        <div className="text-xs opacity-80">
                          {repliesPage + 1} / {repliesTotalPages}
                        </div>
                        <button
                          className={`px-2 py-1 rounded ${effectiveTheme.mode === "dark" ? "bg-white/6 text-white/90" : "bg-gray-200 text-gray-800"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setRepliesPage((p) =>
                              Math.min(repliesTotalPages - 1, p + 1)
                            );
                          }}
                          disabled={repliesPage >= repliesTotalPages - 1}
                        >
                          ›
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {hasAttachments ? (
              <AttachmentRenderer
                message={message}
                isOwnMessage={isOwnMessage}
                effectiveTheme={effectiveTheme}
              />
            ) : message.type === "poll" && message.poll ? (
              <PollMessage
                poll={message.poll}
                isOwnMessage={isOwnMessage}
                effectiveTheme={effectiveTheme}
                currentUserId={currentUserId}
                onVote={onPollVote}
                onRemoveVote={onPollRemoveVote}
                onClosePoll={onPollClose}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className={`${isShortMessage ? "flex items-end gap-2" : ""} ${!isOwnMessage && message.status !== "read" ? "text-blue-500 font-medium" : ""}`}
              >
                {isEditing ? (
                  <div className="w-full">
                    <textarea
                      ref={editInputRef}
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSaveEdit();
                        } else if (e.key === "Escape") {
                          handleCancelEdit();
                        }
                      }}
                      className={`w-full px-2 py-1 rounded border-2 ${
                        effectiveTheme.mode === "dark"
                          ? "bg-gray-800 border-blue-400 text-white"
                          : "bg-white border-blue-500 text-gray-900"
                      } focus:outline-none resize-none`}
                      rows={Math.min(Math.ceil(editedText.length / 40), 5)}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <span
                    className={
                      effectiveTheme.mode === "dark"
                        ? "text-white"
                        : "text-gray-900"
                    }
                  >
                    {message.content
                      .split(/(https?:\/\/[^\s]+)/g)
                      .map((part, index) => {
                        if (part.match(/^https?:\/\//)) {
                          return (
                            <a
                              key={index}
                              href={part}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`underline ${effectiveTheme.mode === "dark" ? "text-blue-300 hover:text-blue-200" : "text-blue-600 hover:text-blue-800"}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {part}
                            </a>
                          );
                        }

                        // Prefer server-provided mention metadata to highlight full display names (may include spaces)

                        // Get actual contact/member names for mention matching
                        const actualMemberNames = (() => {
                          // For group chats, get all member names
                          if (
                            selectedContact?.isGroup ||
                            selectedContact?.isGroupChat ||
                            selectedContact?.isgroupchat
                          ) {
                            const members =
                              selectedContact.members ||
                              selectedContact.participants ||
                              [];
                            return members
                              .map((m) => {
                                if (!m) return null;
                                if (typeof m === "string") return m;
                                return (
                                  m.name ||
                                  m.displayName ||
                                  m.fullName ||
                                  m.username ||
                                  m.label ||
                                  null
                                );
                              })
                              .filter(Boolean);
                          }
                          // For 1:1 chats, just use the contact's name
                          return [
                            selectedContact?.name ||
                              selectedContact?.displayName ||
                              selectedContact?.chatName,
                          ].filter(Boolean);
                        })();

                        // Combine with server-provided mentions
                        const mentionNames = Array.isArray(message.mentions)
                          ? message.mentions
                              .map((m) => {
                                if (!m) return null;
                                if (typeof m === "string") return m;
                                return (
                                  m.displayName ||
                                  m.name ||
                                  m.fullName ||
                                  m.username ||
                                  m.label ||
                                  null
                                );
                              })
                              .filter(Boolean)
                          : [];

                        const allValidNames = [
                          ...new Set([...actualMemberNames, ...mentionNames]),
                        ];

                        const escapeRegExp = (s) =>
                          String(s || "").replace(
                            /[.*+?^${}()|[\]\\]/g,
                            "\\$&"
                          );

                        if (allValidNames.length > 0) {
                          // Sort by length to prefer longest matches
                          const namesSorted = allValidNames.sort(
                            (a, b) => b.length - a.length
                          );

                          // Split by @ but keep the @ symbol
                          const tokens = part.split(/(@)/g);
                          let processedTokens = [];

                          for (let i = 0; i < tokens.length; i++) {
                            if (tokens[i] === "@" && i + 1 < tokens.length) {
                              // Found @, check the next token for a valid mention
                              const nextToken = tokens[i + 1];
                              const words = nextToken.split(/\s+/);
                              let matchedLength = 0;

                              // Try to match 2 words first, then 1 word
                              for (
                                let wordCount = Math.min(2, words.length);
                                wordCount > 0;
                                wordCount--
                              ) {
                                const testMention = words
                                  .slice(0, wordCount)
                                  .join(" ")
                                  .toLowerCase();

                                const isValid = namesSorted.some((name) => {
                                  const nameLower = name.toLowerCase();
                                  const nameParts = nameLower.split(/\s+/);
                                  const mentionParts = testMention.split(/\s+/);

                                  // Exact match
                                  if (nameLower === testMention) return true;

                                  // First name match
                                  if (
                                    nameParts[0] === mentionParts[0] &&
                                    mentionParts.length === 1
                                  )
                                    return true;

                                  // Initial match (e.g., "manasa d" matches "manasa patil")
                                  if (
                                    mentionParts.length === 2 &&
                                    nameParts.length === 2
                                  ) {
                                    return (
                                      nameParts[0] === mentionParts[0] &&
                                      nameParts[1].charAt(0) ===
                                        mentionParts[1].charAt(0)
                                    );
                                  }

                                  return false;
                                });

                                if (isValid) {
                                  matchedLength = wordCount;
                                  break;
                                }
                              }

                              if (matchedLength > 0) {
                                // Valid mention found
                                const mentionText = words
                                  .slice(0, matchedLength)
                                  .join(" ");
                                const remainingText = words
                                  .slice(matchedLength)
                                  .join(" ");

                                processedTokens.push({
                                  type: "mention",
                                  text: "@" + mentionText,
                                });

                                if (remainingText) {
                                  processedTokens.push({
                                    type: "text",
                                    text: " " + remainingText,
                                  });
                                }

                                i++; // Skip next token as we processed it
                              } else {
                                // Not a valid mention
                                processedTokens.push({
                                  type: "text",
                                  text: "@",
                                });
                                processedTokens.push({
                                  type: "text",
                                  text: nextToken,
                                });
                                i++; // Skip next token
                              }
                            } else if (tokens[i] !== "@") {
                              processedTokens.push({
                                type: "text",
                                text: tokens[i],
                              });
                            }
                          }

                          return (
                            <React.Fragment key={index}>
                              {processedTokens.map((item, idx2) => {
                                if (item.type === "mention") {
                                  return (
                                    <span
                                      key={`${index}-${idx2}`}
                                      style={{
                                        color: "#2563EB",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {item.text}
                                    </span>
                                  );
                                }
                                return (
                                  <React.Fragment key={`${index}-${idx2}`}>
                                    {item.text}
                                  </React.Fragment>
                                );
                              })}
                            </React.Fragment>
                          );
                        }

                        // No valid names available, render as plain text
                        return (
                          <React.Fragment key={index}>{part}</React.Fragment>
                        );
                      })}
                  </span>
                )}

                {/* For short messages, show timestamp inline */}
                {isShortMessage && isOwnMessage && (
                  <span
                    className={`text-xs opacity-75 whitespace-nowrap flex items-center gap-1 ml-2 flex-shrink-0 ${
                      effectiveTheme.mode === "dark"
                        ? "text-white"
                        : "text-gray-900"
                    }`}
                  >
                    {formatMessageTime(
                      message.isScheduled
                        ? message.scheduledFor
                        : message.timestamp
                    )}
                    {message.isEdited && (
                      <span className="text-[10px] italic opacity-60">
                        edited
                      </span>
                    )}
                    {message.status === "read" ? (
                      <img
                        src={doubleCheckIcon}
                        alt="read"
                        className="w-4 h-4 flex-shrink-0"
                        style={{
                          filter:
                            "invert(31%) sepia(83%) saturate(4514%) hue-rotate(184deg) brightness(92%) contrast(88%)",
                          marginBottom: "1px",
                        }}
                      />
                    ) : message.status === "delivered" ? (
                      <img
                        src={doubleCheckIcon}
                        alt="delivered"
                        className="w-4 h-4 opacity-80 flex-shrink-0"
                        style={
                          effectiveTheme.mode === "dark"
                            ? {
                                filter:
                                  "invert(70%) sepia(20%) saturate(600%) hue-rotate(190deg) brightness(90%)",
                                marginBottom: "1px",
                              }
                            : {
                                filter: "grayscale(100%) brightness(70%)",
                                marginBottom: "1px",
                              }
                        }
                      />
                    ) : (
                      <Check className="w-4 h-4 opacity-75 flex-shrink-0" />
                    )}
                  </span>
                )}
                {isShortMessage && !isOwnMessage && (
                  <span
                    className={`text-xs opacity-75 whitespace-nowrap ml-2 flex items-center gap-1 flex-shrink-0 ${
                      effectiveTheme.mode === "dark"
                        ? "text-white"
                        : "text-gray-900"
                    }`}
                  >
                    {formatMessageTime(
                      message.isScheduled
                        ? message.scheduledFor
                        : message.timestamp
                    )}
                    {message.isEdited && (
                      <span className="text-[10px] italic opacity-60">
                        edited
                      </span>
                    )}
                  </span>
                )}
              </motion.div>
            )}

            {/* ✅ FIX: Timestamp at bottom with MORE space */}
            {!isShortMessage && (
              <motion.div
                className={`flex items-center justify-end space-x-1 mt-1 ${
                  isOwnMessage ? "absolute bottom-2 right-2" : "mt-2"
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span
                  className={`text-xs opacity-75 flex items-center gap-1 ${
                    isOwnMessage
                      ? effectiveTheme.mode === "dark"
                        ? "text-white"
                        : "text-gray-900"
                      : effectiveTheme.mode === "dark"
                        ? "text-white"
                        : "text-gray-900"
                  }`}
                >
                  {formatMessageTime(
                    message.isScheduled
                      ? message.scheduledFor
                      : message.timestamp
                  )}
                  {message.isEdited && (
                    <span className="text-[10px] italic opacity-60">
                      edited
                    </span>
                  )}
                </span>
                {isOwnMessage && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 400 }}
                    className="flex-shrink-0 ml-1"
                  >
                    {message.status === "read" ? (
                      <img
                        src={doubleCheckIcon}
                        alt="read"
                        className="w-4 h-4"
                        style={{
                          filter:
                            "invert(31%) sepia(83%) saturate(4514%) hue-rotate(184deg) brightness(92%) contrast(88%)",
                          marginBottom: "1px",
                        }}
                      />
                    ) : message.status === "delivered" ? (
                      <img
                        src={doubleCheckIcon}
                        alt="delivered"
                        className="w-4 h-4 opacity-80"
                        style={
                          effectiveTheme.mode === "dark"
                            ? {
                                filter:
                                  "invert(70%) sepia(20%) saturate(600%) hue-rotate(190deg) brightness(90%)",
                                marginBottom: "1px",
                              }
                            : {
                                filter: "grayscale(100%) brightness(70%)",
                                marginBottom: "1px",
                              }
                        }
                      />
                    ) : (
                      <Check className="w-4 h-4 opacity-75 text-white" />
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
          {/* Inline sender overlay for group chats (replicates own-message overlay UI) */}
          {!isOwnMessage &&
            isGroupChat &&
            overlaySender &&
            String(
              overlaySender?.id || overlaySender?._id || overlaySender?.userId
            ) !== String(currentUserId) && (
              <div className="absolute left-0 bottom-0 transform translate-y-3 -translate-x-4 z-40 pointer-events-auto">
                <div
                  className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-md bg-gray-200 flex items-center justify-center text-sm font-medium text-white"
                  onMouseEnter={() => setAvatarHover(true)}
                  onMouseLeave={() => setAvatarHover(false)}
                >
                  {overlaySender.avatar ||
                  overlaySender.pic ||
                  overlaySender.avatarUrl ||
                  overlaySender.picUrl ? (
                    <img
                      src={
                        overlaySender.avatar ||
                        overlaySender.pic ||
                        overlaySender.avatarUrl ||
                        overlaySender.picUrl
                      }
                      alt={
                        overlaySender.name ||
                        overlaySender.displayName ||
                        overlaySender.username ||
                        "User"
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-blue-500 text-white">
                      {(
                        overlaySender.name ||
                        overlaySender.displayName ||
                        overlaySender.username ||
                        String(overlaySender.id || "U")
                      ).charAt(0)}
                    </div>
                  )}
                </div>
                {/* Name label shows only when hovering the avatar (avatarHover state) */}
                <div
                  className={`absolute left-9 bottom-0 -translate-y-4 transform transition-all duration-200 pointer-events-none ${avatarHover ? "opacity-100 translate-y-0" : "opacity-0"}`}
                >
                  <div
                    className="text-[10px] rounded-md px-2 py-1 shadow-lg whitespace-nowrap"
                    style={{
                      background:
                        effectiveTheme.mode === "dark"
                          ? "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(243,244,246,0.06))"
                          : "linear-gradient(135deg, rgba(17,24,39,0.9), rgba(79,70,229,0.85))",
                      color:
                        effectiveTheme.mode === "dark" ? "#FFF7E6" : "#ffffff",
                      backdropFilter: "blur(6px)",
                      boxShadow:
                        effectiveTheme.mode === "dark"
                          ? "0 6px 20px rgba(2,6,23,0.6)"
                          : "0 6px 20px rgba(14,18,48,0.35)",
                      textShadow:
                        effectiveTheme.mode === "dark"
                          ? "0 1px 0 rgba(255,255,255,0.6)"
                          : "0 1px 0 rgba(0,0,0,0.35)",
                    }}
                  >
                    {overlaySender.name ||
                      overlaySender.displayName ||
                      overlaySender.username ||
                      String(overlaySender.id || "User")}
                  </div>
                </div>
              </div>
            )}

          {/* Action buttons - show after message bubble */}
          {!isEditing && (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {/* Forward button: hide when message is a poll AND (it's a group chat OR the user left the group) */}
              {!(
                message.type === "poll" &&
                (isGroupChat || selectedHasLeftGroup)
              ) && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className={`p-1 rounded-full ${forwardSelectionActive && selectedForwards && selectedForwards.includes(message._id || message.id) ? "bg-blue-500 text-white" : "bg-white shadow-lg text-blue-600"}`}
                  onClick={handleForwardClick}
                  title="Forward message"
                >
                  <Share2 className="w-3 h-3" />
                </motion.button>
              )}

              {/* Pin button - hide if user has left the chat */}
              {!selectedHasLeftGroup && (
                <motion.button
                  whileHover={{
                    scale: 1.1,
                    rotate: [0, -10, 10, 0],
                    transition: { duration: 0.4 },
                  }}
                  className="p-1 rounded-full bg-white shadow-lg"
                  onClick={handlePinClick}
                  title={isPinned ? "Unpin message" : "Pin message"}
                >
                  <Pin
                    className={`w-3 h-3 ${
                      isPinned
                        ? "text-yellow-400 fill-current"
                        : "text-gray-500"
                    } hover:text-yellow-400 transition-colors`}
                  />
                </motion.button>
              )}

              {/* Delete button - only for own messages and only if user hasn't left */}
              {isOwnMessage && !selectedHasLeftGroup && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="p-1 rounded-full bg-white shadow-lg text-red-600"
                  onClick={() => onDeleteMessage && onDeleteMessage(message)}
                  title="Delete message"
                >
                  <Trash2 className="w-3 h-3" />
                </motion.button>
              )}

              {/* Reply button - hide if user left */}
              {!selectedHasLeftGroup && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="p-1 rounded-full bg-white shadow-lg text-blue-600"
                  onClick={() =>
                    onStartReplySelection &&
                    onStartReplySelection(message._id || message.id)
                  }
                  title="Reply to message"
                >
                  <MessageSquare className="w-3 h-3" />
                </motion.button>
              )}

              {/* Edit button - only for own text messages and only if user hasn't left */}
              {isOwnMessage &&
                !hasAttachments &&
                message.content &&
                !selectedHasLeftGroup && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="p-1 rounded-full bg-white shadow-lg text-green-600"
                    onClick={handleEditClick}
                    title="Edit message"
                  >
                    <Edit className="w-3 h-3" />
                  </motion.button>
                )}
            </div>
          )}
        </div>
      </motion.div>
    );
  }
);

/* --------------------------------------------
   AttachmentRenderer Component
   Renders inline images (with lightbox), video player, and file download UI.
--------------------------------------------- */
const AttachmentRenderer = React.memo(
  ({ message, isOwnMessage, effectiveTheme }) => {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const [zoomed, setZoomed] = useState(false);

    const handleDownload = async (e, url, filename) => {
      try {
        e && e.preventDefault();
        const resp = await fetch(url, { mode: "cors" });
        if (!resp.ok) throw new Error("Network response not ok");
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename || "download";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      } catch (err) {
        console.error("Download failed, falling back to direct open", err);
        window.open(url, "_blank");
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

    // Keyboard support
    useEffect(() => {
      if (!lightboxOpen) return;

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          closeLightbox();
        } else if (e.key === "z" || e.key === "Z") {
          setZoomed((z) => !z);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [lightboxOpen]);

    const stripTimestampPrefix = (filename) => {
      if (!filename) return "";
      let base = filename.split("/").pop();
      base = base.replace(/^\d+_+/, "");
      return base;
    };

    const renderAttachment = (att, idx) => {
      const url = att.fileUrl || att.url || att.publicUrl;
      const mime = att.mimeType || att.fileType || "";
      const rawName =
        att.fileName || (url ? url.split("/").pop() : `file-${idx}`);
      const name = stripTimestampPrefix(rawName);

      if (!url) return null;

      if (
        mime.startsWith("image/") ||
        /\.(png|jpe?g|gif|webp|bmp)$/i.test(url)
      ) {
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

      if (mime.startsWith("video/") || /\.(mp4|webm|ogg)$/i.test(url)) {
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
        ? "text-white"
        : effectiveTheme.mode === "dark"
          ? "text-white"
          : "text-gray-700";

      // Update the textColor logic for better contrast
      const fileNameColor = isOwnMessage
        ? effectiveTheme.mode === "dark"
          ? "text-white"
          : "text-gray-600" // Dark text for own messages in light mode
        : effectiveTheme.mode === "dark"
          ? "text-white"
          : "text-gray-600"; // Dark text for received messages in light mode

      const iconColor = isOwnMessage
        ? effectiveTheme.mode === "dark"
          ? "text-white"
          : "text-gray-700"
        : effectiveTheme.mode === "dark"
          ? "text-white"
          : "text-gray-700";

      return (
        <div
          key={idx}
          className={`flex items-center justify-between ${isOwnMessage ? "bg-white/10" : effectiveTheme.mode === "dark" ? "bg-black/20" : "bg-gray-100/50"} backdrop-blur-sm p-2 rounded mb-2`}
        >
          <div className="flex items-center space-x-3 w-full">
            <div
              className={`w-10 h-10 ${isOwnMessage ? "bg-white/20" : effectiveTheme.mode === "dark" ? "bg-white/10" : "bg-gray-200"} rounded flex items-center justify-center flex-shrink-0`}
            >
              <FileText className={`w-5 h-5 ${iconColor}`} />
            </div>

            <div className="relative w-full">
              <div
                className={`text-sm font-medium truncate pr-16 ${fileNameColor}`}
              >
                {name}
              </div>
              {att.fileSize && (
                <div className={`text-xs ${fileNameColor} opacity-70`}>
                  {(att.fileSize / 1024).toFixed(1)} KB
                </div>
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
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs bg-black text-white px-2 py-0.5 rounded opacity-0 peer-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                      Open
                    </span>
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
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs bg-black text-white px-2 py-0.5 rounded opacity-0 peer-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                      Download
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };

    const textColor = isOwnMessage
      ? "text-white"
      : effectiveTheme.mode === "dark"
        ? "text-white"
        : "text-gray-800";

    return (
      <div>
        <div className="flex flex-col">
          {(message.attachments || []).map((att, idx) =>
            renderAttachment(att, idx)
          )}
        </div>

        {message.attachments && message.attachments.length > 0 ? (
          message.content ? (
            <div
              className={`mt-2 text-sm ${
                effectiveTheme.mode === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {message.content
                .split(/(https?:\/\/[^\s]+)/g)
                .map((part, index) => {
                  if (part.match(/^https?:\/\//)) {
                    return (
                      <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`underline ${effectiveTheme.mode === "dark" ? "text-blue-300 hover:text-blue-200" : "text-blue-600 hover:text-blue-800"}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {part}
                      </a>
                    );
                  }
                  return part;
                })}
            </div>
          ) : null
        ) : (
          message.content && (
            <div
              className={`mb-2 ${
                effectiveTheme.mode === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {message.content}
            </div>
          )
        )}

        {lightboxOpen &&
          createPortal(
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-black/95 via-black/98 to-black/95 backdrop-blur-xl"
              onClick={closeLightbox}
            >
              {/* Ambient glow effect */}
              <div className="absolute inset-0 bg-gradient-radial from-blue-600/5 via-transparent to-transparent"></div>

              <div
                className="relative w-full h-full flex flex-col items-center justify-center p-6"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top bar with controls */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="absolute top-4 left-0 right-0 flex items-center justify-between px-6 z-10"
                >
                  {/* Image info */}
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <Eye className="w-4 h-4 text-white/70" />
                    <span className="text-white/90 text-sm font-medium">
                      Image Preview
                    </span>
                  </div>

                  {/* Close button */}
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeLightbox}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-3 rounded-full transition-all duration-200 shadow-lg border border-white/20"
                    title="Close (ESC)"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </motion.div>

                {/* Image container with enhanced effects */}
                <motion.div
                  initial={{ scale: 0.85, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="relative flex items-center justify-center max-w-7xl max-h-[80vh]"
                >
                  {/* Glow behind image */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-blue-500/5 blur-3xl scale-105 rounded-2xl"></div>

                  <motion.img
                    src={lightboxSrc}
                    alt="preview"
                    initial={{ filter: "blur(10px)" }}
                    animate={{ filter: "blur(0px)" }}
                    transition={{ duration: 0.3 }}
                    className={`relative max-h-[80vh] max-w-full object-contain rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] border border-white/10 ${
                      zoomed
                        ? "scale-150 cursor-zoom-out"
                        : "scale-100 cursor-zoom-in"
                    } transition-transform duration-500 ease-out`}
                    onClick={() => setZoomed((z) => !z)}
                    style={{
                      imageRendering: "high-quality",
                    }}
                  />
                </motion.div>

                {/* Enhanced action buttons with icons and labels */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                  className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-white/5 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-2xl border border-white/10"
                >
                  {/* Zoom button */}
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setZoomed((z) => !z)}
                    className={`group relative flex items-center gap-2 ${
                      zoomed
                        ? "bg-blue-700 hover:bg-blue-800"
                        : "bg-blue-600 hover:bg-blue-700"
                    } hover:shadow-lg text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-300`}
                    title={zoomed ? "Reset zoom (Z)" : "Zoom in (Z)"}
                  >
                    {zoomed ? (
                      <>
                        <ZoomOut className="w-5 h-5" />
                        <span className="hidden sm:inline">Reset</span>
                      </>
                    ) : (
                      <>
                        <ZoomIn className="w-5 h-5" />
                        <span className="hidden sm:inline">Zoom</span>
                      </>
                    )}
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Press Z
                    </div>
                  </motion.button>

                  {/* Divider */}
                  <div className="w-px h-8 bg-white/20"></div>

                  {/* Download button */}
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) =>
                      handleDownload(
                        e,
                        lightboxSrc,
                        (lightboxSrc || "").split("/").pop()
                      )
                    }
                    className="group relative flex items-center gap-2 bg-blue-500 hover:bg-blue-600 hover:shadow-lg text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-300"
                    title="Download image"
                  >
                    <Download className="w-5 h-5" />
                    <span className="hidden sm:inline">Download</span>
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Save to device
                    </div>
                  </motion.button>
                </motion.div>

                {/* Keyboard hints */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-4 text-white/40 text-xs"
                >
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-0.5 bg-white/10 rounded">ESC</kbd>{" "}
                    Close
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-0.5 bg-white/10 rounded">Z</kbd>{" "}
                    Zoom
                  </span>
                </motion.div>
              </div>
            </motion.div>,
            document.body
          )}
      </div>
    );
  }
);

// Messages Area Component
const MessagesArea = ({
  filteredMessages,
  pinnedMessages,
  onPinMessage,
  effectiveTheme,
  isTyping,
  selectedContactId,
  selectedContact,
  currentUserId,
  onDeleteMessage,
  onEditMessage,
  // Forward props
  forwardSelectionActive,
  selectedForwards,
  onStartForwardSelection,
  onToggleSelectForward,
  onClearForwardSelection,
  onHoverDateChange,
  manualScrollInProgress,
  onPollVote,
  onPollRemoveVote,
  onPollClose,
  selectedHasLeftGroup,
  // Reply props
  replySelectionActive,
  selectedReplies,
  onStartReplySelection,
  onToggleSelectReply,
  onClearReplySelection,
}) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const shouldAutoScrollRef = useRef(true); // ✅ Track if we should auto-scroll
  const scrollTimeoutRef = useRef(null); // Debounce scroll button visibility

  // Helper: format day label like WhatsApp (Today / Yesterday / date)
  const formatDayLabel = useCallback((ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    const today = new Date();

    const isSameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (isSameDay(d, today)) return "Today";
    if (isSameDay(d, yesterday)) return "Yesterday";

    // Use en-GB to ensure day/month/year ordering (dd/mm/yyyy)
    try {
      return d.toLocaleDateString('en-GB');
    } catch (e) {
      return d.toLocaleDateString();
    }
  }, []);

  // Inject date markers before the first message of each day
  const messagesWithDates = useMemo(() => {
    const out = [];
    let lastDayKey = null;
    (filteredMessages || []).forEach((m) => {
      const dt = new Date(m.timestamp || m.time || Date.now());
      const dayKey = `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`;
      if (dayKey !== lastDayKey) {
        out.push({
          _isDate: true,
          id: `date-${m.id || m.timestamp || Math.random()}`,
          timestamp: m.timestamp,
        });
        lastDayKey = dayKey;
      }
      out.push(m);
    });

    return out;
  }, [filteredMessages]);

  const scrollToBottom = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Hide the button immediately when clicked
    setShowScrollButton(false);

    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      // Set auto-scroll flag to true
      shouldAutoScrollRef.current = true;
    }
  };

  const handleScroll = (e) => {
    const element = e.target;
    const isNearBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight < 200;

    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Debounce the button visibility update
    scrollTimeoutRef.current = setTimeout(() => {
      setShowScrollButton(!isNearBottom);
    }, 150);

    // ✅ Only auto-scroll if user is near bottom
    shouldAutoScrollRef.current = isNearBottom;
  };

  // ✅ FIX: Only auto-scroll when NEW messages arrive AND user is at bottom
  useEffect(() => {
    if (
      shouldAutoScrollRef.current &&
      messagesEndRef.current &&
      !manualScrollInProgress?.current
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [filteredMessages, isTyping, manualScrollInProgress]);

  // ✅ Always scroll on contact change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
      shouldAutoScrollRef.current = true;
    }
  }, [selectedContactId]);

  return (
    <div className="relative h-full overflow-hidden">
      {/* Day time diagonal comets - Tail at top, Head at bottom (vertical) */}
      {effectiveTheme.mode !== "dark" && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`day-comet-${i}`}
              className="absolute w-0.5 h-20 rounded-full"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `-10%`,

                // ⭐ Gradient: transparent at top (tail) → solid at bottom (head)
                background: `
            linear-gradient(
              to bottom,
              transparent 0%,
              rgba(196,181,253,0.25) 30%,
              rgba(147,197,253,0.5) 70%,
              rgba(96,165,250,0.7) 100%
            )
          `,

                // ⭐ No rotation - moves straight down
                transform: "rotate(0deg)",
                filter: "blur(0.5px)", // Reduced blur
              }}
              animate={{
                y: [-100, window.innerHeight + 100],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 6 + Math.random() * 3, // Slower: 6-9 seconds
                repeat: Infinity,
                delay: i * 2.5,
                ease: "linear",
              }}
            />
          ))}
        </div>
      )}

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto p-4 space-y-4 relative messages-container-capture"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor:
            effectiveTheme.mode === "dark"
              ? "#667eea transparent" // Blue-purple for dark mode
              : "#8b5cf6 transparent", // Purple for light mode
        }}
      >
        <div className="relative z-10">
          <AnimatePresence mode="popLayout">
            {messagesWithDates.map((item) => {
              if (item && item._isDate) {
                return (
                  <div
                    key={item.id}
                    className="w-full flex justify-center mb-4"
                  >
                    <DateTag label={formatDayLabel(item.timestamp)} />
                  </div>
                );
              } else if (
                item &&
                (item.isSystemMessage || item.type === "system")
              ) {
                // System notification (block/unblock)
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full flex justify-center my-2"
                  >
                    <div
                      className={`px-4 py-2 rounded-lg text-sm text-center ${
                        effectiveTheme.mode === "dark"
                          ? "bg-gray-700/50 text-gray-300"
                          : "bg-gray-200/70 text-gray-700"
                      }`}
                    >
                      {item.content}
                    </div>
                  </motion.div>
                );
              } else if (
                item &&
                !item.isSystemMessage &&
                item.type !== "system"
              ) {
                // Regular user messages
                return (
                  <MessageBubble
                    key={item.id}
                    message={item}
                    isPinned={pinnedMessages[item.id] || false}
                    onPinToggle={onPinMessage}
                    onDeleteMessage={onDeleteMessage}
                    onStartForwardSelection={onStartForwardSelection}
                    onToggleSelectForward={onToggleSelectForward}
                    forwardSelectionActive={forwardSelectionActive}
                    selectedForwards={selectedForwards}
                    onEditMessage={onEditMessage}
                    effectiveTheme={effectiveTheme}
                    currentUserId={currentUserId}
                    onHoverDateChange={onHoverDateChange}
                    onPollVote={onPollVote}
                    onPollRemoveVote={onPollRemoveVote}
                    onPollClose={onPollClose}
                    // Reply props
                    allMessages={filteredMessages}
                    selectedContact={selectedContact}
                    selectedHasLeftGroup={selectedHasLeftGroup}
                    replySelectionActive={replySelectionActive}
                    selectedReplies={selectedReplies}
                    onStartReplySelection={onStartReplySelection}
                    onToggleSelectReply={onToggleSelectReply}
                    onClearReplySelection={onClearReplySelection}
                  />
                );
              }
              return null;
            })}
          </AnimatePresence>

          {isTyping[selectedContactId] &&
            (() => {
              const typingUser =
                typeof isTyping[selectedContactId] === "object"
                  ? isTyping[selectedContactId]
                  : null;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex justify-start"
                >
                  <div className="flex items-end space-x-3">
                    {typingUser && typingUser.avatar ? (
                      <img
                        src={typingUser.avatar}
                        alt={typingUser.name || "User"}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                        {typingUser && (typingUser.name || typingUser._id)
                          ? String(
                              (typingUser.name || typingUser._id).charAt(0)
                            ).toUpperCase()
                          : "U"}
                      </div>
                    )}

                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        effectiveTheme.mode === "dark"
                          ? "bg-blue-500/80 backdrop-blur-md text-white"
                          : "bg-white/90 backdrop-blur-md text-gray-800 border border-gray-200"
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
                  </div>
                </motion.div>
              );
            })()}

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
            className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-11 h-11 rounded-full flex items-center justify-center shadow-2xl cursor-pointer"
            style={{
              background:
                effectiveTheme.mode === "dark"
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  : "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)",
              pointerEvents: "auto",
            }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(139, 92, 246, 0.5)",
                  "0 0 40px rgba(139, 92, 246, 0.8)",
                  "0 0 20px rgba(139, 92, 246, 0.5)",
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
                width="24"
                height="24"
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
                  fill={effectiveTheme.mode === "dark" ? "#fbbf24" : "#f59e0b"}
                />
              </svg>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

const ChattingPage = ({ onLogout, activeSection = "chats" }) => {
  const { currentTheme, theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Normalize contact objects before selecting so downstream components
  // (like MessageInput) always receive `groupSettings` and `features`.
  const normalizeContact = (c) => {
    if (!c || typeof c !== "object") return c;
    const out = { ...c };
    // Prefer explicit groupSettings from chat, then linked group.features, then top-level features
    out.groupSettings = out.groupSettings || out.group || out.chat || {};
    // If group contains features, surface them consistently
    out.features =
      out.features ||
      (out.group && out.group.features) ||
      (out.groupSettings && out.groupSettings.features) ||
      {};
    // Ensure groupSettings.features exists
    out.groupSettings = {
      ...(out.groupSettings || {}),
      features: out.features,
    };
    return out;
  };

  // Listen for Google sync messages from the OAuth popup and react accordingly.
  React.useEffect(() => {
    const handler = (e) => {
      try {
        const d = e?.data;
        if (!d || (d.type !== "google_sync" && d.type !== "google_sync_token"))
          return;

        // If token message received, persist it and refresh contacts
        if (d.type === "google_sync_token" && d.token) {
          try {
            localStorage.setItem("token", d.token);
          } catch (err) {}
          // If app exposes refresh function, call it. Use custom event to trigger UI updates.
          // Navigate back to the calling route (or /chats) then reload so contacts appear
          const dest = d.origin || "/chats";
          try {
            navigate(dest);
          } catch (err) {}
          setTimeout(() => {
            try {
              window.location.reload();
            } catch (e) {}
          }, 350);
          window.dispatchEvent(
            new CustomEvent("chasmos:google-sync-success", {
              detail: { token: d.token },
            })
          );
        }

        if (d.type === "google_sync" && d.success) {
          // If token provided in the message, persist it
          if (d.token) {
            try {
              localStorage.setItem("token", d.token);
            } catch (err) {}
          }
          // Navigate to the calling route (or /chats) then reload to show synced contacts
          const destSuccess = d.origin || "/chats";
          try {
            navigate(destSuccess);
          } catch (err) {}
          setTimeout(() => {
            try {
              window.location.reload();
            } catch (e) {}
          }, 350);
          // request a UI refresh — other parts of the app can listen for this event
          window.dispatchEvent(
            new CustomEvent("chasmos:google-sync-success", {
              detail: { token: d.token },
            })
          );
        }
      } catch (err) {
        console.error("Message handler error", err);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [navigate]);

  const [searchTerm, setSearchTerm] = useState("");
  const [chatSearchTerm, setChatSearchTerm] = useState("");
  const [contacts, setContacts] = useState([]);
  const manualScrollInProgressRef = useRef(false);
  const [googleContacts, setGoogleContacts] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null); // current group for modal
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  // Reply selection state (allow multi-select replies)
  const [replySelectionActive, setReplySelectionActive] = useState(false);
  const [selectedReplies, setSelectedReplies] = useState([]);
  const [replySelectionHint, setReplySelectionHint] = useState(null);
  const replyHintTimerRef = useRef(null);

  const onStartReplySelection = useCallback((initialId) => {
    setReplySelectionActive(true);
    if (initialId) setSelectedReplies([initialId]);
  }, []);

  const onToggleSelectReply = useCallback((id) => {
    const MAX_REPLY_SELECTION = 3;
    setSelectedReplies((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= MAX_REPLY_SELECTION) {
        // show inline hint instead of alert
        setReplySelectionHint(
          `You can only select up to ${MAX_REPLY_SELECTION} messages to reply to.`
        );
        // clear previous timer
        if (replyHintTimerRef.current) clearTimeout(replyHintTimerRef.current);
        replyHintTimerRef.current = setTimeout(
          () => setReplySelectionHint(null),
          3500
        );
        return current;
      }
      return [...current, id];
    });
  }, []);

  useEffect(() => {
    return () => {
      if (replyHintTimerRef.current) clearTimeout(replyHintTimerRef.current);
    };
  }, []);

  const onClearReplySelection = useCallback(() => {
    setReplySelectionActive(false);
    setSelectedReplies([]);
  }, []);

  // Forward selection handlers
  const onStartForwardSelection = useCallback((initialId) => {
    setForwardSelectionActive(true);
    if (initialId) setSelectedForwards([initialId]);
  }, []);

  const onToggleSelectForward = useCallback((id) => {
    const MAX_FORWARD_SELECTION = 10;
    setSelectedForwards((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= MAX_FORWARD_SELECTION) {
        setForwardSelectionHint(
          `You can only select up to ${MAX_FORWARD_SELECTION} messages to forward.`
        );
        if (forwardHintTimerRef.current)
          clearTimeout(forwardHintTimerRef.current);
        forwardHintTimerRef.current = setTimeout(
          () => setForwardSelectionHint(null),
          3500
        );
        return current;
      }
      return [...current, id];
    });
  }, []);

  useEffect(() => {
    return () => {
      if (forwardHintTimerRef.current)
        clearTimeout(forwardHintTimerRef.current);
    };
  }, []);

  const onClearForwardSelection = useCallback(() => {
    setForwardSelectionActive(false);
    setSelectedForwards([]);
  }, []);

  // Clear any stale contacts on mount (helps when user account was deleted and re-created)
  useEffect(() => {
    setContacts([]);
    setGoogleContacts([]);
    try {
      localStorage.removeItem("googleContacts");
    } catch (e) {
      // ignore
    }
  }, []);
  const [messages, setMessages] = useState(mockMessages);
  const [isTyping, setIsTyping] = useState({});
  const [isMobileView, setIsMobileView] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [showThreeDotsMenu, setShowThreeDotsMenu] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState({});
  const [pinnedMessagesData, setPinnedMessagesData] = useState([]);

  const [selectedDocument, setSelectedDocument] = useState(null);

  const [isNewDocumentChat, setIsNewDocumentChat] = useState(false);
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const [showGroupCreation, setShowGroupCreation] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState(activeSection); // 'chats', 'groups', 'documents', 'community', 'profile', 'settings'
  const [selectedContact, setSelectedContact] = useState(null);

  // Forward message state (supports multiple messages)
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messagesToForward, setMessagesToForward] = useState([]);

  // Forward selection (multi-select) UI
  const [forwardSelectionActive, setForwardSelectionActive] = useState(false);
  const [selectedForwards, setSelectedForwards] = useState([]);
  const [forwardSelectionHint, setForwardSelectionHint] = useState(null);
  const forwardHintTimerRef = useRef(null);

  // Delete message state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  // --- Delete Chat Modal State ---
  const [showDeleteChatModal, setShowDeleteChatModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [keepMediaOnDelete, setKeepMediaOnDelete] = useState(false);

  // Confirm delete chat handler
  const confirmDeleteChat = async () => {
    if (chatToDelete) {
      await handleDeleteChat(chatToDelete, keepMediaOnDelete);
      setShowDeleteChatModal(false);
      setChatToDelete(null);
      setKeepMediaOnDelete(false);
    }
  };

  // User profile modal state
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [profileUserId, setProfileUserId] = useState(null);

  // Hovered message date label (single place below header)
  const [hoverDateLabel, setHoverDateLabel] = useState("");
  const hoverClearTimeoutRef = useRef(null);

  // In-app notifications state
  const [notifications, setNotifications] = useState([]);
  const notificationIdCounter = useRef(0);

  // Centralized hover handler: shows label and auto-clears after timeout
  const handleHoverDateChange = useCallback((label) => {
    // clear any existing timeout
    if (hoverClearTimeoutRef.current) {
      clearTimeout(hoverClearTimeoutRef.current);
      hoverClearTimeoutRef.current = null;
    }

    if (!label) {
      setHoverDateLabel("");
      return;
    }

    setHoverDateLabel(label);
    // auto-hide after 1800ms
    hoverClearTimeoutRef.current = setTimeout(() => {
      setHoverDateLabel("");
      hoverClearTimeoutRef.current = null;
    }, 1800);
  }, []);

  // Block / Archive UI state
  const [showBlockConfirmModal, setShowBlockConfirmModal] = useState(false);
  const [userToBlock, setUserToBlock] = useState(null);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [isBlockedState, setIsBlockedState] = useState(false);
  const [hasBlockedYouState, setHasBlockedYouState] = useState(false);
  const [isArchivedState, setIsArchivedState] = useState(false);
  const [archivedChatIds, setArchivedChatIds] = useState(new Set());
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Chat requests visibility settings
  const [showChatRequestsReceived, setShowChatRequestsReceived] = useState(
    () => {
      const saved = localStorage.getItem("showChatRequestsReceived");
      return saved !== null ? JSON.parse(saved) : false;
    }
  );
  const [showChatInvitesAccepted, setShowChatInvitesAccepted] = useState(() => {
    const saved = localStorage.getItem("showChatInvitesAccepted");
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem(
      "showChatRequestsReceived",
      JSON.stringify(showChatRequestsReceived)
    );
  }, [showChatRequestsReceived]);

  useEffect(() => {
    localStorage.setItem(
      "showChatInvitesAccepted",
      JSON.stringify(showChatInvitesAccepted)
    );
  }, [showChatInvitesAccepted]);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const moreMenuRef = useRef(null);
  // ------------------------------
  // 🔥 STATES
  // ------------------------------
  const [pinnedDocs, setPinnedDocs] = useState([]);

  // You already have theme from props
  // const { effectiveTheme } = props;
  const askDelete = async (documentId) => {
    const { isConfirmed } = await Swal.fire({
      title: "Delete Document?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#555",
      confirmButtonText: "Delete",
      background: effectiveTheme.secondary,
      color: effectiveTheme.toastText,
      width: 350, // smaller width
      padding: "1.5rem", // smaller padding
      customClass: {
        popup: "rounded-lg",
        title: "text-md font-semibold",
        confirmButton: "px-4 py-1 rounded-md",
        cancelButton: "px-4 py-1 rounded-md",
      },
    });

    if (isConfirmed) deleteDocument(documentId);
  };

  // ------------------------------
  // 🔥 FETCH ALL DOCUMENTS + SET PINNED
  // ------------------------------
  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/document`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ IMPORTANT
          },
        });

        if (!res.ok) throw new Error("Failed to fetch docs");

        const data = await res.json();

        if (!Array.isArray(data)) {
          console.error("❌ API returned non-array:", data);
          return;
        }

        // frontend expects fileName field
        setDocumentChats(data.filter((doc) => !doc.isPinned));
        setPinnedDocs(data.filter((doc) => doc.isPinned));
      } catch (err) {
        console.error("Failed to fetch documents:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const deleteDocument = async (documentId) => {
    try {
      const res = await fetch(`/api/document/${documentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete document");

      setDocumentChats((prev) => prev.filter((d) => d._id !== documentId));
      setPinnedDocs((prev) => prev.filter((d) => d._id !== documentId));

      if (selectedDocument && selectedDocument._id === documentId) {
        setSelectedDocument(null);
        setIsNewDocumentChat(true);
      }

      toast.success("Document deleted", {
        style: {
          background: "linear-gradient(135deg, #8b5cf6 0%, #60a5fa 100%)",
          color: "#fff",
          border: "1.5px solid #a78bfa",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
          backdropFilter: "blur(8px)",
          fontWeight: 600,
          letterSpacing: "0.01em",
        },
      });
    } catch (err) {
      toast.error("Delete failed", {
        style: {
          background: "linear-gradient(135deg, #f43f5e 0%, #fbbf24 100%)",
          color: "#fff",
          border: "1.5px solid #f43f5e",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.10)",
          backdropFilter: "blur(8px)",
          fontWeight: 600,
          letterSpacing: "0.01em",
        },
      });
    }
  };

  const togglePin = async (docId, isPinnedNow) => {
    try {
      const endpoint = isPinnedNow ? "unpin" : "pin";

      const res = await fetch(
        `${API_BASE_URL}/api/document/${docId}/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ IMPORTANT
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to toggle");

      // -------- UI UPDATE --------
      if (isPinnedNow) {
        // UNPIN
        const doc = pinnedDocs.find((d) => d._id === docId);

        setPinnedDocs((prev) => prev.filter((d) => d._id !== docId));
        if (doc) setDocumentChats((prev) => [doc, ...prev]);
      } else {
        // PIN
        const doc = documentChats.find((d) => d._id === docId);

        if (doc) {
          setPinnedDocs((prev) => [...prev, doc]);
        }

        setDocumentChats((prev) => prev.filter((d) => d._id !== docId));
      }
    } catch (err) {
      console.error("Pin error:", err);
    }
  };

  // Pin replace modal state
  const [showPinReplaceModal, setShowPinReplaceModal] = useState(false);
  const [pendingPinMessageId, setPendingPinMessageId] = useState(null);

  // Keep archivedChatIds in sync (reload when archive modal toggles)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await archiveService.getArchivedChats();
        if (!mounted) return;
        setArchivedChatIds(
          new Set(
            (data || []).map((c) =>
              String(c._id || c.id || (c.chat && c.chat._id) || "")
            )
          )
        );
      } catch (e) {
        // ignore
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [showArchiveModal]);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMoreMenu]);

  // Sync activeNavItem with activeSection prop (from URL)
  useEffect(() => {
    setActiveNavItem(activeSection);
    // Show sidebar for sections that need it (chats, groups, documents)
    if (["chats", "groups", "documents"].includes(activeSection)) {
      setShowSidebar(true);
    }
  }, [activeSection]);
  const [recentChats, setRecentChats] = useState([]);
  // Separate list used only for the Forward Message modal to avoid
  // mutating the main recent chats list when preparing forward targets.
  const [forwardRecentChats, setForwardRecentChats] = useState([]);

  // Track whether selected contact (group) has the current user removed/left
  const [selectedHasLeftGroup, setSelectedHasLeftGroup] = useState(false);
  const lastFetchedGroupIdRef = useRef(null);

  // Recompute when selectedContact ID changes (not the whole object to avoid loops)
  useEffect(() => {
    if (!selectedContact) {
      setSelectedHasLeftGroup(false);
      lastFetchedGroupIdRef.current = null;
      return;
    }
    
    const isGroup = Boolean(
      selectedContact.isGroup ||
        selectedContact.isGroupChat ||
        selectedContact.isgroupchat ||
        selectedContact.group ||
        selectedContact.chat?.isGroupChat
    );
    
    if (!isGroup) {
      setSelectedHasLeftGroup(false);
      lastFetchedGroupIdRef.current = null;
      return;
    }

    // Determine the groupId or chatId to query
    const groupId =
      selectedContact.group?._id ||
      selectedContact.groupId ||
      selectedContact.chatId ||
      selectedContact._id ||
      selectedContact.id;

    if (!groupId) {
      setSelectedHasLeftGroup(false);
      lastFetchedGroupIdRef.current = null;
      return;
    }

    // Only fetch if groupId has changed to prevent infinite loops
    const groupIdStr = String(groupId);
    if (lastFetchedGroupIdRef.current === groupIdStr) {
      return;
    }

    lastFetchedGroupIdRef.current = groupIdStr;

    // ALWAYS fetch from Group model to get authoritative participants list
    // The Chat model's users/participants may be out of sync when users leave
    (async () => {
      try {
        const _local = JSON.parse(
          localStorage.getItem("chasmos_user_data") || "{}"
        );
        const currentUserIdLocal =
          _local._id || _local.id || _local.userId || null;

        // Fetch authoritative Group document from backend
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("chasmos_auth_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const url = `${API_BASE_URL}/api/group/group/${encodeURIComponent(groupIdStr)}`;
        
        const res = await fetch(url, { headers });
        if (!res.ok) {
          console.warn("Failed to fetch group info, status:", res.status);
          setSelectedHasLeftGroup(false);
          return;
        }

        const data = await res.json();
        // API returns { success: true, ...groupData } or plain group object
        const group = data && data.success ? data : (data.participants ? data : null);
        
        if (!group || !group.participants) {
          console.warn("Group has no participants array");
          setSelectedHasLeftGroup(false);
          return;
        }

        // Check if current user is in Group.participants (authoritative source)
        const isMember = (group.participants || []).some((m) => {
          const uid = m && (m._id || m.id || m.userId || m);
          return uid && String(uid) === String(currentUserIdLocal);
        });

        setSelectedHasLeftGroup(!isMember);
        
        // Only update selectedContact if participants actually changed
        setSelectedContact((prev) => {
          if (!prev) return prev;
          
          // Check if participants are different
          const prevParticipants = prev.participants || [];
          const newParticipants = group.participants || [];
          
          const participantsChanged = 
            prevParticipants.length !== newParticipants.length ||
            !prevParticipants.every((p, i) => {
              const pId = String(p?._id || p?.id || p);
              const nId = String(newParticipants[i]?._id || newParticipants[i]?.id || newParticipants[i]);
              return pId === nId;
            });
          
          if (!participantsChanged) {
            return prev;
          }
          
          return { ...prev, participants: group.participants, group };
        });
      } catch (err) {
        console.error("selectedContact membership check failed", err);
        setSelectedHasLeftGroup(false);
      }
    })();
  }, [selectedContact?._id, selectedContact?.chatId, selectedContact?.groupId, selectedContact?.id]);

  // Helper function to compute hasLeftGroup for a chat
  const computeHasLeftGroup = useCallback((chat) => {
    const isGroup = Boolean(
      chat.isGroup ||
      chat.isGroupChat ||
      chat.isgroupchat ||
      chat.group ||
      chat.chat?.isGroupChat
    );

    if (!isGroup) {
      return false;
    }

    const members =
      chat.users ||
      chat.participants ||
      chat.group?.participants ||
      chat.group?.users ||
      chat.chat?.participants ||
      chat.chat?.users ||
      [];

    const _local = JSON.parse(localStorage.getItem("chasmos_user_data") || "{}");
    const currentUserIdLocal = _local._id || _local.id || _local.userId || null;

    const isMember = (members || []).some((m) => {
      const uid = m && (m._id || m.id || m.userId || m);
      return uid && String(uid) === String(currentUserIdLocal);
    });

    return !isMember;
  }, []);

  // Attempt to leave a group (calls backend then updates local state)
  const leaveGroupFromChat = async (contact, keepMedia = false) => {
    if (!contact) return;
    const groupId =
      (contact.group && (contact.group._id || contact.group.id)) ||
      contact.chatId ||
      contact._id ||
      contact.id;
    if (!groupId) return;
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("chasmos_auth_token");
      const res = await fetch(`${API_BASE_URL}/api/group/exit-group`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ groupId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to leave group");
      }
      const json = await res.json();
      // Update selectedContact locally to remove current user
      setSelectedContact((prev) => {
        if (!prev) return prev;
        const clone = { ...prev };
        const _local = JSON.parse(
          localStorage.getItem("chasmos_user_data") || "{}"
        );
        const removeId = String(_local._id || _local.id || "");
        const filterIds = (arr) =>
          Array.isArray(arr)
            ? arr.filter((a) => String(a._id || a || a.id) !== removeId)
            : arr;
        clone.users = filterIds(clone.users || clone.participants || []);
        clone.participants = clone.users;
        if (clone.admins) clone.admins = filterIds(clone.admins);
        return clone;
      });
      // After successfully leaving the group, perform soft-delete of the chat for this user
      try {
        const chatId =
          contact.chatId ||
          contact._id ||
          contact.id ||
          (contact.group && contact.group.chat) ||
          (contact.chat && contact.chat._id);
        if (chatId) {
          const deleteUrl = `${API_BASE_URL}/api/chat/${chatId}?keepMedia=${keepMedia ? "true" : "false"}`;
          const dres = await fetch(deleteUrl, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (dres.ok) {
            try {
              const dj = await dres.json();
              console.log("deleteChat result", dj);
            } catch (e) {}
          } else {
            // If chat already deleted or not found, ignore
            try {
              const dex = await dres.json().catch(() => ({}));
              console.warn("deleteChat response not ok", dex);
            } catch (e) {}
          }
        }
      } catch (e) {
        console.warn("Soft-delete chat after leaving failed", e);
      }

      setSelectedHasLeftGroup(true);
      toast.success("You have left the group");
    } catch (e) {
      console.error("Leave group failed", e);
      toast.error(e.message || "Failed to leave group");
    }
  };

  // When user clicks Delete Chat in menu, ensure group members cannot hard-delete the group chat
  const checkAndOpenDeleteChat = (contact) => {
    if (!contact) return;
    const isGroup = Boolean(
      contact.isGroup || contact.isGroupChat || contact.isgroupchat
    );
    if (!isGroup) {
      setChatToDelete(contact);
      setShowDeleteChatModal(true);
      return;
    }

    // Derive members from possible payload shapes (mirrors message input membership check)
    const members =
      contact.users ||
      contact.participants ||
      contact.group?.participants ||
      contact.group?.users ||
      contact.chat?.participants ||
      contact.chat?.users ||
      [];
    const _local = JSON.parse(
      localStorage.getItem("chasmos_user_data") || "{}"
    );
    const currentUserIdLocal = _local._id || _local.id || null;
    const isMember = (members || []).some((m) => {
      const uid = m && (m._id || m.id || m.userId || m);
      return uid && String(uid) === String(currentUserIdLocal);
    });

    // If current user is still a participant of the group, do not allow delete here.
    // Prompt a warning instructing them to leave the group first (no leave logic executed here).
    if (isMember) {
      Swal.fire({
        title: "Leave group first",
        html: `You must leave the group before you can delete it. Open Group Info and leave the group first.`,
        icon: "warning",
        confirmButtonText: "OK",
        background: effectiveTheme.secondary,
        color: effectiveTheme.toastText,
      });
      return;
    }

    // User already left the group: allow delete/keep options (soft-delete for this user)
    setChatToDelete(contact);
    setShowDeleteChatModal(true);
  };

  // Deduplicate recent chats by chatId/id to avoid duplicates
  // (occurs when a group is created via API and also arrives via sockets)
  useEffect(() => {
    if (!recentChats || recentChats.length < 2) return;
    try {
      const map = new Map();
      for (const c of recentChats) {
        const key = String(c.chatId || c.id || c._id || "");
        if (!key) continue;
        const existing = map.get(key);
        // prefer the entry with the newest timestamp
        if (!existing || (c.timestamp || 0) > (existing.timestamp || 0)) {
          map.set(key, c);
        }
      }
      const deduped = Array.from(map.values()).sort(
        (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
      );
      const compact = (arr) =>
        arr.map((r) => ({
          k: String(r.chatId || r.id || r._id || ""),
          t: r.timestamp || 0,
        }));
      if (
        JSON.stringify(compact(deduped)) !==
        JSON.stringify(compact(recentChats))
      ) {
        setRecentChats(deduped);
      }
    } catch (e) {
      // ignore
    }
  }, [recentChats]);
  const [receivedChats, setReceivedChats] = React.useState([]); // incoming chat requests
  const [acceptedChats, setAcceptedChats] = React.useState([]); // chats you accepted
  const [showReceivedDropdown, setShowReceivedDropdown] = useState(false);
  const [showAcceptedDropdown, setShowAcceptedDropdown] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

  // Ref for chat search container (click-outside functionality)
  const chatSearchRef = useRef(null);
  const threeDotsMenuRef = useRef(null);
  const floatingMenuRef = useRef(null);
  const floatingButtonRef = useRef(null);
  const userMenuRef = useRef(null);
  // API Base URL from environment variable

  // Load synced Google contacts (if any) and merge into contacts list
  useEffect(() => {
    let cancelled = false;
    const loadGoogleContacts = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/sync/google-contacts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        const googleContactsResp = Array.isArray(json.data) ? json.data : [];
        const formatted = googleContactsResp.map((c) => ({
          id: `google-${c.email || c.phone || c.name}`,
          name: c.name,
          email: c.email,
          avatar: c.avatar,
          isGoogleContact: true,
        }));
        if (!cancelled) {
          setGoogleContacts(formatted);
        }
      } catch (e) {
        // ignore
      }
    };
    loadGoogleContacts();
    return () => {
      cancelled = true;
    };
  }, []);

  // Delete chat handler (lifted here so it has access to state setters)
  const handleDeleteChat = async (contact, keepMedia = false) => {
    const chatId =
      contact?.id ||
      contact?._id ||
      selectedContact?.id ||
      selectedContact?._id;
    if (!chatId) return;
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("chasmos_auth_token");
      // include keepMedia flag as query param when provided
      const qs = keepMedia ? "?keepMedia=true" : "";
      const res = await fetch(`${API_BASE_URL}/api/chat/${chatId}${qs}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete chat");
      // update local state
      setRecentChats((prev) =>
        prev.filter(
          (c) =>
            String(c.id) !== String(chatId) &&
            String(c.chatId) !== String(chatId)
        )
      );
      setMessages((prev) => {
        const copy = { ...prev };
        delete copy[chatId];
        return copy;
      });
      if (socketRef.current?.emit)
        socketRef.current.emit("delete chat", { chatId });
      setSelectedContact(null);
    } catch (err) {
      console.error("Delete chat failed", err);
    }
  };

  // Delete message handler (lifted here so it has access to state setters)
  const handleDeleteMessage = (message) => {
    if (!message) return;
    setMessageToDelete(message);
    setShowDeleteModal(true);
  };

  const confirmDeleteMessage = async (deleteForEveryone) => {
    const message = messageToDelete;
    if (!message) return;
    const chatId = selectedContact?.id || selectedContact?._id;
    if (!chatId) return;
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("chasmos_auth_token");
      const messageId = message._id || message.id;
      if (!messageId) throw new Error("Message id not found");
      if (deleteForEveryone) {
        const res = await fetch(`${API_BASE_URL}/api/message/${messageId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to delete message for everyone");
        // remove message locally
        setMessages((prev) => {
          const existing = prev[chatId] || [];
          const newList = existing.filter(
            (m) => String(m.id || m._id) !== String(messageId)
          );
          const next = { ...prev, [chatId]: newList };

          // compute preview from last message
          const last = newList.length ? newList[newList.length - 1] : null;
          const preview = last
            ? last.content ||
              (last.attachments && last.attachments[0]?.fileName) ||
              ""
            : "";
          // update recentChats
          setRecentChats((rcPrev) =>
            rcPrev.map((c) =>
              String(c.id) === String(chatId) ||
              String(c.chatId) === String(chatId)
                ? { ...c, lastMessage: preview, timestamp: Date.now() }
                : c
            )
          );
          // update contacts preview
          setContacts((ctPrev) =>
            ctPrev.map((c) =>
              String(c.id) === String(chatId) ||
              String(c.chatId) === String(chatId)
                ? {
                    ...c,
                    lastMessage: preview,
                    hasAttachment: Boolean(
                      last &&
                        Array.isArray(last.attachments) &&
                        last.attachments.length
                    ),
                  }
                : c
            )
          );

          return next;
        });
        if (socketRef.current?.emit)
          socketRef.current.emit("delete message", {
            messageId,
            chatId,
            deleteForEveryone: true,
          });
      } else {
        const res = await fetch(
          `${API_BASE_URL}/api/message/${messageId}/delete-for-me`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) throw new Error("Failed to delete message for you");
        setMessages((prev) => {
          const existing = prev[chatId] || [];
          const newList = existing.filter(
            (m) => String(m.id || m._id) !== String(messageId)
          );
          const next = { ...prev, [chatId]: newList };

          const last = newList.length ? newList[newList.length - 1] : null;
          const preview = last
            ? last.content ||
              (last.attachments && last.attachments[0]?.fileName) ||
              ""
            : "";
          setRecentChats((rcPrev) =>
            rcPrev.map((c) =>
              String(c.id) === String(chatId) ||
              String(c.chatId) === String(chatId)
                ? { ...c, lastMessage: preview, timestamp: Date.now() }
                : c
            )
          );
          setContacts((ctPrev) =>
            ctPrev.map((c) =>
              String(c.id) === String(chatId) ||
              String(c.chatId) === String(chatId)
                ? {
                    ...c,
                    lastMessage: preview,
                    hasAttachment: Boolean(
                      last &&
                        Array.isArray(last.attachments) &&
                        last.attachments.length
                    ),
                  }
                : c
            )
          );

          return next;
        });
      }
    } catch (err) {
      console.error("Delete message failed", err);
    } finally {
      setShowDeleteModal(false);
      setMessageToDelete(null);
    }
  };

  // Edit message handler
  const handleEditMessage = async (message, newContent) => {
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("chasmos_auth_token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const messageId = message._id || message.id;
      const res = await fetch(`${API_BASE_URL}/api/message/${messageId}/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newContent }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to edit message");
      }

      const data = await res.json();
      const updatedMessage = data.updatedMessage;

      // Update the message in local state
      const chatId =
        message.chat?._id ||
        message.chat?.id ||
        message.chat ||
        selectedContact?.id;
      setMessages((prev) => {
        const existing = prev[chatId] || [];
        const updated = existing.map((m) =>
          String(m._id || m.id) === String(messageId)
            ? {
                ...m,
                content: updatedMessage.content,
                isEdited: true,
                editedAt: updatedMessage.editedAt,
              }
            : m
        );
        return { ...prev, [chatId]: updated };
      });

      // Emit socket event for real-time update
      if (socketRef.current?.emit) {
        socketRef.current.emit("edit message", {
          messageId,
          chatId,
          content: newContent,
          isEdited: true,
          editedAt: updatedMessage.editedAt,
        });
      }
    } catch (err) {
      console.error("Edit message failed", err);
      alert(err.message || "Failed to edit message");
    }
  };

  // Forward message handlers (supports forwarding multiple messages)
  // Fetch recent chats using the dedicated forward endpoint and normalize
  const fetchRecentChatsForForward = useCallback(async () => {
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("chasmos_auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/api/chat/recent/forward`, {
        headers,
      });
      if (!res.ok) throw new Error("Failed to fetch recent chats for forward");
      const json = await res.json();
      try {
        const _local = JSON.parse(
          localStorage.getItem("chasmos_user_data") || "{}"
        );
        const myId = String(_local._id || _local.id || _local.userId || "");
        const mapped = (Array.isArray(json) ? json : []).map((c) => {
          try {
            const participants = c.participants || c.users || [];
            if (
              !c.isGroupChat &&
              Array.isArray(participants) &&
              participants.length > 0
            ) {
              const other =
                participants.find((p) => {
                  const pid = p && (p._id || p.id || p.userId || p);
                  return pid && String(pid) !== myId;
                }) || participants[0];
              if (other) {
                const name =
                  other.name ||
                  other.email ||
                  other.username ||
                  other._id ||
                  c.name ||
                  c.chatName ||
                  "";
                const avatar =
                  other.avatar ||
                  other.image ||
                  other.avatarUrl ||
                  c.avatar ||
                  c.groupSettings?.avatar ||
                  "";
                return { ...c, name, avatar };
              }
            }
          } catch (e) {}
          return c;
        });
        setForwardRecentChats(mapped);
        return mapped;
      } catch (e) {
        console.warn("Normalization of recent chats failed", e);
        setForwardRecentChats(Array.isArray(json) ? json : []);
        return Array.isArray(json) ? json : [];
      }
    } catch (err) {
      console.warn("fetchRecentChatsForForward error", err);
      return [];
    }
  }, []);

  const handleForwardMessage = useCallback(
    async (message) => {
      // Fetch freshest recent chats tailored for forwarding before opening modal
      await fetchRecentChatsForForward();
      setMessagesToForward([message]);
      setShowForwardModal(true);
    },
    [fetchRecentChatsForForward]
  );

  const handleForwardToChats = async (selectedChats) => {
    if (
      !messagesToForward ||
      messagesToForward.length === 0 ||
      selectedChats.length === 0
    )
      return;

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("chasmos_auth_token");
      if (!token) {
        console.error("No token found");
        return;
      }

      // For each selected chat, forward each message sequentially
      for (const chat of selectedChats) {
        const chatId = chat.chatId || chat._id || chat.id;

        for (const msg of messagesToForward) {
          const forwardData = {
            chatId: chatId,
            content: msg.content || "",
            attachments: msg.attachments || [],
            type: msg.type || "text",
            isForwarded: true,
          };

          const res = await fetch(`${API_BASE_URL}/api/message/forward`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(forwardData),
          });

          if (!res.ok) {
            console.error(
              `Failed to forward message to ${chat.name || chat.chatName}`
            );
            continue;
          }

          const forwardedMessage = await res.json();

          // Emit socket event for real-time update
          if (socketRef.current?.emit) {
            lastSentAtRef.current = Date.now();
            socketRef.current.emit("new message", forwardedMessage);
            // suppression removed
          }

          // Update local messages state if the chat is already loaded
          setMessages((prev) => {
            const existing = prev[chatId] || [];
            return {
              ...prev,
              [chatId]: [...existing, forwardedMessage],
            };
          });
        }

        // After forwarding all messages to this `chat`, move/update it to the top of `recentChats`
        try {
          const chatIdStr = String(
            chat.chatId || chat._id || chat.id || chatId
          );
          setRecentChats((prev) => {
            // remove any existing instance of this chat
            const filtered = prev.filter(
              (c) => String(c.id || c.chatId || c._id) !== chatIdStr
            );

            // Create a lightweight preview for the recent chat entry
            const previewText =
              messagesToForward.length === 1
                ? messagesToForward[0].content || "Forwarded message"
                : `${messagesToForward.length} forwarded messages`;

            const updatedChat = {
              ...(chat || {}),
              lastMessage: previewText,
              timestamp: Date.now(),
            };

            return [updatedChat, ...filtered];
          });
        } catch (e) {
          console.error("Failed to update recentChats after forward", e);
        }
      }

      console.log(`Messages forwarded to ${selectedChats.length} chat(s)`);
    } catch (err) {
      console.error("Forward message failed", err);
    }
  };

  // Poll voting handlers
  const handlePollVote = useCallback(
    async (pollId, optionId) => {
      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("chasmos_auth_token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/poll/vote`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ pollId, optionId }),
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to vote on poll");
        }

        const data = await res.json();

        // Update local messages state
        const chatKey = selectedContact?.chatId || selectedContact?.id;
        if (chatKey && data.poll) {
          setMessages((prev) => {
            const chatMessages = prev[chatKey] || [];
            return {
              ...prev,
              [chatKey]: chatMessages.map((msg) =>
                msg.poll?._id === pollId || msg.poll === pollId
                  ? { ...msg, poll: data.poll }
                  : msg
              ),
            };
          });
        }

        // Emit socket event for real-time poll update
        if (socketRef.current?.emit) {
          socketRef.current.emit("poll voted", {
            pollId,
            poll: data.poll,
            chatId: selectedContact?.chatId || selectedContact?.id,
          });
        }
      } catch (err) {
        console.error("Poll vote failed:", err);
        alert(err.message || "Failed to vote on poll");
      }
    },
    [selectedContact?.chatId, selectedContact?.id]
  );

  const handlePollRemoveVote = useCallback(
    async (pollId, optionId) => {
      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("chasmos_auth_token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/poll/remove-vote`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ pollId, optionId }),
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to remove vote");
        }

        const data = await res.json();

        // Update local messages state
        const chatKey = selectedContact?.chatId || selectedContact?.id;
        if (chatKey && data.poll) {
          setMessages((prev) => {
            const chatMessages = prev[chatKey] || [];
            return {
              ...prev,
              [chatKey]: chatMessages.map((msg) =>
                msg.poll?._id === pollId || msg.poll === pollId
                  ? { ...msg, poll: data.poll }
                  : msg
              ),
            };
          });
        }

        // Emit socket event for real-time poll update
        if (socketRef.current?.emit) {
          socketRef.current.emit("poll remove vote", {
            pollId,
            poll: data.poll,
            chatId: selectedContact?.chatId || selectedContact?.id,
          });
        }
      } catch (err) {
        console.error("Poll remove vote failed:", err);
        alert(err.message || "Failed to remove vote");
      }
    },
    [selectedContact?.chatId, selectedContact?.id]
  );

  const handlePollClose = useCallback(
    async (pollId) => {
      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("chasmos_auth_token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/poll/${pollId}/close`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to close poll");
        }

        const data = await res.json();

        // Update local messages state
        const chatKey = selectedContact?.chatId || selectedContact?.id;
        if (chatKey && data.poll) {
          setMessages((prev) => {
            const chatMessages = prev[chatKey] || [];
            return {
              ...prev,
              [chatKey]: chatMessages.map((msg) =>
                msg.poll?._id === pollId || msg.poll === pollId
                  ? { ...msg, poll: data.poll }
                  : msg
              ),
            };
          });
        }

        // Emit socket event for real-time poll update
        if (socketRef.current?.emit) {
          socketRef.current.emit("poll closed", {
            pollId,
            poll: data.poll,
            chatId: selectedContact?.chatId || selectedContact?.id,
          });
        }
      } catch (err) {
        console.error("Poll close failed:", err);
        alert(err.message || "Failed to close poll");
      }
    },
    [selectedContact?.chatId, selectedContact?.id]
  );

  // Helper function to filter duplicate consecutive system messages
  const filterDuplicateSystemMessages = useCallback((messages) => {
    if (!Array.isArray(messages) || messages.length === 0) return messages;

    const filtered = [];
    const systemMessageLastIndex = new Map(); // Track the last occurrence index of each system message type

    // First pass: find the last occurrence of each system message type
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.isSystemMessage || msg.type === "system") {
        // Use content as the key (e.g., "You blocked this contact", "You unblocked this contact")
        systemMessageLastIndex.set(msg.content, i);
      }
    }

    // Second pass: only include the latest occurrence of each system message type
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.isSystemMessage || msg.type === "system") {
        // Only include this system message if it's the last occurrence of its type
        if (systemMessageLastIndex.get(msg.content) === i) {
          filtered.push(msg);
        }
      } else {
        // Include all non-system messages
        filtered.push(msg);
      }
    }

    return filtered;
  }, []);

  // Socket reference
  const socketRef = useRef(null);
  const lastSentAtRef = useRef(0);
  const [socketConnected, setSocketConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [groupOnlineCounts, setGroupOnlineCounts] = useState({});

  // Current user id (used for message alignment)
  const _localUser = JSON.parse(
    localStorage.getItem("chasmos_user_data") || "{}"
  );
  const currentUserId = _localUser._id || _localUser.id || null;

  // Keep recentChats and contacts in sync with presence info
  useEffect(() => {
    try {
      // update recentChats
      setRecentChats((prev) => {
        return (prev || []).map((c) => {
          const copy = { ...c };
          const isGroup = copy.isGroup || copy.isGroupChat || copy.isgroupchat;
          if (isGroup) {
            const members =
              copy.group?.participants ||
              copy.group?.users ||
              copy.users ||
              copy.participants ||
              [];
            // Prefer server-provided group online counts when available
            const chatIdKey = copy.chatId || copy._id || copy.id || "";
            let count = 0;
            if (
              groupOnlineCounts &&
              typeof groupOnlineCounts[String(chatIdKey)] !== "undefined"
            ) {
              const raw = Number(groupOnlineCounts[String(chatIdKey)] || 0);
              // server count may include this user's own connection — subtract 1
              count = Math.max(0, raw - 1);
            } else {
              count = (members || []).filter((m) => {
                const uid = m && (m._id || m.id || m);
                if (!uid) return false;
                if (String(uid) === String(currentUserId)) return false;
                return onlineUsers.has(String(uid));
              }).length;
            }
            copy.__computedGroupOnlineCount = count;
            copy.isOnline = count > 0;
          } else {
            const uid = copy.userId || copy._id || copy.id || copy.participantId || (copy.participants && copy.participants[0]?._id);
            const presence = uid ? onlineUsers.has(String(uid)) : Boolean(copy.isOnline);
            // If this chat's other user has blocked the current user, never show online
            if (copy.hasBlockedYou) {
              copy.isOnline = false;
            } else {
              copy.isOnline = presence;
            }
          }
          return copy;
        });
      });

      // update contacts list similarly
      setContacts((prev) => {
        return (prev || []).map((c) => {
          const copy = { ...c };
          const isGroup = copy.isGroup || copy.isGroupChat || copy.isgroupchat;
          if (isGroup) {
            const members =
              copy.group?.participants ||
              copy.group?.users ||
              copy.users ||
              copy.participants ||
              [];
            const chatIdKey = copy.chatId || copy._id || copy.id || "";
            let count = 0;
            if (
              groupOnlineCounts &&
              typeof groupOnlineCounts[String(chatIdKey)] !== "undefined"
            ) {
              const raw = Number(groupOnlineCounts[String(chatIdKey)] || 0);
              count = Math.max(0, raw - 1);
            } else {
              const membersArr = members || [];
              count = membersArr.filter((m) => {
                const uid = m && (m._id || m.id || m);
                if (!uid) return false;
                if (String(uid) === String(currentUserId)) return false;
                return onlineUsers && typeof onlineUsers.has === "function"
                  ? onlineUsers.has(String(uid))
                  : false;
              }).length;
            }
            copy.__computedGroupOnlineCount = count;
            copy.isOnline = count > 0;
          } else {
            const uid = copy.userId || copy._id || copy.id || copy.participantId || (copy.participants && copy.participants[0]?._id);
            const presence = uid ? onlineUsers.has(String(uid)) : Boolean(copy.isOnline);
            // Respect hasBlockedYou for contacts as well
            if (copy.hasBlockedYou) {
              copy.isOnline = false;
            } else {
              copy.isOnline = presence;
            }
          }
          return copy;
        });
      });
    } catch (e) {
      // ignore
    }
  }, [onlineUsers, currentUserId, groupOnlineCounts]);

  // Guarded recompute: when `recentChats` is first populated (or updated),
  // ensure presence flags reflect current `onlineUsers`. Only write back
  // when computed presence differs to avoid update loops.
  useEffect(() => {
    try {
      if (!Array.isArray(recentChats) || recentChats.length === 0) return;

      const recomputed = recentChats.map((c) => {
        const copy = { ...c };
        const isGroup =
          copy.isGroup ||
          copy.isGroupChat ||
          copy.isgroupchat ||
          (Array.isArray(copy.users) && copy.users.length > 0) ||
          (Array.isArray(copy.participants) && copy.participants.length > 0);
        if (isGroup) {
          const chatIdKey = copy.chatId || copy._id || copy.id || "";
          let count = 0;
          if (
            groupOnlineCounts &&
            typeof groupOnlineCounts[String(chatIdKey)] !== "undefined"
          ) {
            const raw = Number(groupOnlineCounts[String(chatIdKey)] || 0);
            count = Math.max(0, raw - 1);
          } else if (
            copy.group &&
            ((Array.isArray(copy.group.participants) &&
              copy.group.participants.length > 0) ||
              (Array.isArray(copy.group.users) && copy.group.users.length > 0))
          ) {
            const members = copy.group?.participants || copy.group?.users || [];
            count = (members || []).filter((m) => {
              const uid = m && (m._id || m.id || m);
              if (!uid) return false;
              if (String(uid) === String(currentUserId)) return false;
              return onlineUsers && typeof onlineUsers.has === "function"
                ? onlineUsers.has(String(uid))
                : false;
            }).length;
          } else {
            count = 0;
          }
          copy.__computedGroupOnlineCount = count;
          copy.isOnline = count > 0;
          // If this chat's other user has blocked the current user, always treat as offline
          if (copy.hasBlockedYou) {
            copy.isOnline = false;
          }
        } else {
          const candidateIds = [];
          if (copy.userId) candidateIds.push(String(copy.userId));
          if (copy.user_id) candidateIds.push(String(copy.user_id));
          if (copy._id) candidateIds.push(String(copy._id));
          if (copy.id) candidateIds.push(String(copy.id));
          if (copy.participantId) candidateIds.push(String(copy.participantId));
          if (copy.otherUser) {
            if (copy.otherUser.id) candidateIds.push(String(copy.otherUser.id));
            if (copy.otherUser._id)
              candidateIds.push(String(copy.otherUser._id));
          }
          if (Array.isArray(copy.participants) && copy.participants.length) {
            const p = copy.participants[0];
            if (p && (p._id || p.id)) candidateIds.push(String(p._id || p.id));
          }
          const uniq = Array.from(new Set(candidateIds.filter(Boolean)));
          const foundOnline = uniq.some((id) =>
            onlineUsers && typeof onlineUsers.has === "function"
              ? onlineUsers.has(String(id))
              : false
          );
          copy.isOnline = foundOnline || Boolean(copy.isOnline);
          // Respect block flag if present
          if (copy.hasBlockedYou) {
            copy.isOnline = false;
          }
        }
        return copy;
      });

      const oldCompact = recentChats.map((c) => ({
        id: String(c.chatId || c.id || c._id || ""),
        isOnline: Boolean(c.isOnline),
        count: Number(c.__computedGroupOnlineCount || 0),
      }));
      const newCompact = recomputed.map((c) => ({
        id: String(c.chatId || c.id || c._id || ""),
        isOnline: Boolean(c.isOnline),
        count: Number(c.__computedGroupOnlineCount || 0),
      }));
      if (JSON.stringify(oldCompact) !== JSON.stringify(newCompact)) {
        setRecentChats(recomputed);
      }
    } catch (e) {
      // non-fatal
    }
  }, [recentChats, onlineUsers, currentUserId, groupOnlineCounts]);

  // When selected contact changes, refresh block/archive status for that chat/user
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsBlockedState(false);
        setHasBlockedYouState(false);
        setIsArchivedState(false);

        if (!selectedContact) return;

        // determine user id and chat id
        const userId =
          selectedContact.userId ||
          selectedContact._id ||
          selectedContact.id ||
          selectedContact.participantId;
        const chatId = selectedContact.id || selectedContact._id;

        if (userId) {
          try {
            const status = await blockService.checkBlockStatus(userId);
            if (!mounted) return;
            // `isBlocked` means the current user has blocked the other user.
            // `hasBlockedYou` means the other user has blocked the current user.
            // Only mark `isBlockedState` when the current user has blocked the contact.
            setIsBlockedState(Boolean(status?.isBlocked));
            setHasBlockedYouState(Boolean(status?.hasBlockedYou));
          } catch (e) {
            // ignore errors
          }
        }

        if (chatId) {
          try {
            const astatus = await archiveService.checkChatArchiveStatus(chatId);
            if (!mounted) return;
            setIsArchivedState(Boolean(astatus?.isArchived));
          } catch (e) {
            // ignore errors
          }
        }
      } catch (err) {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedContact]);

  // Handlers for block / archive actions
  const handleBlockUser = async (contact) => {
    // Show confirmation modal instead of blocking immediately
    setUserToBlock(contact);
    setShowBlockConfirmModal(true);
  };

  const confirmBlockUser = async () => {
    if (!userToBlock) return;

    console.log(
      "🔍 Full userToBlock object:",
      JSON.stringify(userToBlock, null, 2)
    );

    // Get current user ID
    const currentUser = JSON.parse(
      localStorage.getItem("chasmos_user_data") || "{}"
    );
    const currentUserId = currentUser._id || currentUser.id;

    // Try to get the userId from the contact object
    let userId = userToBlock?.id;

    // If id matches chatId or if we have participants array, extract from participants
    if (
      userId === userToBlock?.chatId ||
      (!userId && userToBlock?.participants)
    ) {
      // Find the other user from participants array
      const otherUser = userToBlock.participants?.find(
        (p) => String(p._id) !== String(currentUserId)
      );
      userId = otherUser?._id;
      console.log("✅ Extracted userId from participants:", userId);
    }

    // Fallback to other fields
    if (!userId) {
      userId = userToBlock?.userId || userToBlock?._id;
    }

    console.log("🔍 Attempting to block user:", {
      extractedUserId: userId,
      contactId: userToBlock?.id,
      contactChatId: userToBlock?.chatId,
    });

    // If we still don't have userId and we have a chatId, fetch the chat
    if (!userId && userToBlock?.chatId) {
      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("chasmos_auth_token");
        const res = await fetch(
          `${API_BASE_URL}/api/chat/${userToBlock.chatId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          const chatData = await res.json();
          const currentUser = JSON.parse(
            localStorage.getItem("chasmos_user_data") || "{}"
          );
          const currentUserId = currentUser._id || currentUser.id;

          // Find the other user in the chat
          const otherUser = chatData.users?.find(
            (u) => String(u._id) !== String(currentUserId)
          );
          userId = otherUser?._id;
          console.log("✅ Found userId from chat:", userId);
        }
      } catch (chatErr) {
        console.error("Failed to fetch chat for user ID:", chatErr);
      }
    }

    if (!userId) {
      console.error("❌ No valid userId found");
      alert("Unable to identify user to block");
      setShowBlockConfirmModal(false);
      setUserToBlock(null);
      return;
    }

    try {
      await blockService.blockUser(userId);
      if (socketRef.current?.emit)
        socketRef.current.emit("block user", { userId });
      setIsBlockedState(true);
      setShowBlockedModal(true);
      setShowBlockConfirmModal(false);
      setUserToBlock(null);

      // Refresh messages to get the system message from backend
      if (selectedContact && selectedContact.chatId) {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("chasmos_auth_token");
        const msgsRes = await fetch(
          `${API_BASE_URL}/api/message/${selectedContact.chatId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (msgsRes.ok) {
          const msgs = await msgsRes.json();
          const formatted = msgs.map((m) => ({
            id: m._id,
            type: m.type || "text",
            content: m.content || m.text || "",
            sender: m.sender,
            // prefer backend-provided `timestamp` (normalized to scheduledFor when applicable)
            timestamp: new Date(
              m.timestamp || m.scheduledFor || m.createdAt || Date.now()
            ).getTime(),
            status: m.status || (m.isRead ? "read" : "sent"),
            attachments: Array.isArray(m.attachments) ? m.attachments : [],
            isSystemMessage: m.type === "system",
            isForwarded: m.isForwarded || false,
            isEdited: m.isEdited || false,
            reactions: m.reactions || [],
            starredBy: m.starredBy || [],
            poll: m.poll || null,
          }));

          // Filter duplicate consecutive system messages
          const filteredMessages = filterDuplicateSystemMessages(formatted);

          setMessages((prev) => ({
            ...prev,
            [selectedContact.chatId]: filteredMessages,
          }));
        }
      }
    } catch (err) {
      console.error("Block failed", err);
      alert(err.message || "Failed to block user");
      setIsBlockedState(false);
      setShowBlockConfirmModal(false);
      setUserToBlock(null);
    }
  };

  const handleUnblockUser = async (contact) => {
    const userId = contact?.userId || contact?._id || contact?.id;
    if (!userId) return;
    try {
      await blockService.unblockUser(userId);
      if (socketRef.current?.emit)
        socketRef.current.emit("unblock user", { userId });
      setIsBlockedState(false);

      // Refresh messages to get the system message from backend
      if (selectedContact && selectedContact.chatId) {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("chasmos_auth_token");
        const msgsRes = await fetch(
          `${API_BASE_URL}/api/message/${selectedContact.chatId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (msgsRes.ok) {
          const msgs = await msgsRes.json();
          const formatted = msgs.map((m) => ({
            id: m._id,
            type: m.type || "text",
            content: m.content || m.text || "",
            sender: m.sender,
            // prefer backend-provided `timestamp` (normalized to scheduledFor when applicable)
            timestamp: new Date(
              m.timestamp || m.scheduledFor || m.createdAt || Date.now()
            ).getTime(),
            status: m.status || (m.isRead ? "read" : "sent"),
            attachments: Array.isArray(m.attachments) ? m.attachments : [],
            isSystemMessage: m.type === "system",
            isForwarded: m.isForwarded || false,
            isEdited: m.isEdited || false,
            reactions: m.reactions || [],
            starredBy: m.starredBy || [],
            // preserve repliedTo details (backend may populate objects)
            repliedTo: Array.isArray(m.repliedTo)
              ? m.repliedTo.map((rt) => ({
                  _id: rt._id || rt.id,
                  id: rt._id || rt.id,
                  content: rt.content || rt.text || "",
                  // preserve the full sender object when backend populated it
                  sender: rt.sender,
                  attachments: Array.isArray(rt.attachments)
                    ? rt.attachments
                    : [],
                }))
              : [],
          }));

          // Filter duplicate consecutive system messages
          const filteredMessages = filterDuplicateSystemMessages(formatted);

          setMessages((prev) => ({
            ...prev,
            [selectedContact.chatId]: filteredMessages,
          }));
        }
      }
    } catch (err) {
      console.error("Unblock failed", err);
    }
  };

  const handleArchiveChat = async (contact) => {
    const chatId = contact?.chatId || contact?._id || contact?.id;
    if (!chatId) return;
    try {
      await archiveService.archiveChat(chatId);
      if (socketRef.current?.emit)
        socketRef.current.emit("archive chat", { chatId });
      setIsArchivedState(true);
      setArchivedChatIds((prev) => {
        const s = new Set(prev || []);
        s.add(String(chatId));
        return s;
      });

      // Remove from recent chats immediately
      setRecentChats((prev) =>
        prev.filter((c) => String(c.chatId || c._id) !== String(chatId))
      );

      // Clear selection if the archived chat was selected
      if (
        selectedContact &&
        (String(selectedContact.chatId) === String(chatId) ||
          String(selectedContact._id) === String(chatId))
      ) {
        setSelectedContact(null);
        if (isMobileView) {
          setShowSidebar(true);
        }
      }

      setShowArchiveModal(true);
    } catch (err) {
      console.error("Archive failed", err);
    }
  };

  const handleUnarchiveChat = async (contact) => {
    const chatId = contact?.chatId || contact?.id || contact?._id;
    if (!chatId) return;
    try {
      await archiveService.unarchiveChat(chatId);
      if (socketRef.current?.emit)
        socketRef.current.emit("unarchive chat", { chatId });
      setIsArchivedState(false);
      setArchivedChatIds((prev) => {
        const s = new Set(prev || []);
        s.delete(String(chatId));
        return s;
      });

      // Refresh recent chats to show the unarchived chat
      await refreshRecentChats();
    } catch (err) {
      console.error("Unarchive failed", err);
    }
  };

  const handleOpenChatFromArchive = (chat) => {
    // When opening an archived chat, load messages for that chat id and select it.
    (async () => {
      try {
        const normalizedChatId = String(chat._id || chat.id);

        // mark this chat as archived locally immediately so the header menu shows the correct action
        setIsArchivedState(true);
        setArchivedChatIds((prev) => {
          const s = new Set(prev || []);
          s.add(String(normalizedChatId));
          return s;
        });

        // Build a UI contact object from the archived chat
        const localUser = JSON.parse(
          localStorage.getItem("chasmos_user_data") || "{}"
        );
        const otherUser = (chat.users || chat.participants || []).find(
          (u) => String(u._id || u.id) !== String(localUser._id)
        );

        const contactForUI = {
          id: normalizedChatId,
          chatId: normalizedChatId,
          name: chat.name || otherUser?.name || "Chat",
          avatar: otherUser?.avatar || otherUser?.pic || null,
          participants: chat.users || chat.participants || [],
          isGroup: chat.isGroupChat || false,
        };

        console.log(
          "📝 Created contactForUI from archive:",
          contactForUI,
          "from chat:",
          chat
        );
        setSelectedContact(normalizeContact(contactForUI));

        // Join socket room for real-time updates
        if (socketRef.current && socketRef.current.emit) {
          socketRef.current.emit("join chat", normalizedChatId);
        }

        // Fetch messages for this chat
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("chasmos_auth_token");
        if (token) {
          const msgsUrl = `${API_BASE_URL}/api/message/${normalizedChatId}`;
          const msgsRes = await fetch(msgsUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (msgsRes.ok) {
            const msgs = await msgsRes.json();
            const formatted = msgs.map((m) => ({
              id: m._id,
              type: m.type || "text",
              content: m.content || m.text || "",
              sender: m.sender,
              // Prefer normalized `timestamp` from backend (uses scheduledFor when applicable)
              timestamp: new Date(
                m.timestamp || m.scheduledFor || m.createdAt || Date.now()
              ).getTime(),
              status: m.status || (m.isRead ? "read" : "sent"),
              attachments: Array.isArray(m.attachments) ? m.attachments : [],
              isSystemMessage: m.type === "system",
              isForwarded: m.isForwarded || false,
              isEdited: m.isEdited || false,
              reactions: m.reactions || [],
              starredBy: m.starredBy || [],
              poll: m.poll || null,
              repliedTo: Array.isArray(m.repliedTo)
                ? m.repliedTo.map((rt) => ({
                    _id: rt._id || rt.id,
                    id: rt._id || rt.id,
                    content: rt.content || rt.text || "",
                    sender: rt.sender,
                    attachments: Array.isArray(rt.attachments)
                      ? rt.attachments
                      : [],
                  }))
                : [],
            }));

            const filteredMessages = filterDuplicateSystemMessages(formatted);
            setMessages((prev) => ({
              ...prev,
              [normalizedChatId]: filteredMessages,
            }));
            try {
              const last = formatted.length
                ? formatted[formatted.length - 1]
                : null;
              if (last) {
                const preview =
                  last.content ||
                  (last.attachments && last.attachments[0]?.fileName) ||
                  "Attachment";
                updateRecentChat && updateRecentChat(normalizedChatId, preview);
                updateContactPreview &&
                  updateContactPreview(
                    normalizedChatId,
                    preview,
                    Boolean(last.attachments && last.attachments.length),
                    {
                      attachmentFileName:
                        last.attachments && last.attachments[0]?.fileName,
                      attachmentMime:
                        last.attachments && last.attachments[0]?.mimeType,
                    }
                  );
              }
            } catch (e) {}
          }
        }

        setShowArchiveModal(false);
      } catch (err) {
        console.error("Failed to open archived chat", err);
        // fallback: just close modal and set selected contact minimally
        setSelectedContact(
          normalizeContact({
            id: chat._id || chat.id,
            name: chat.name || "Chat",
          })
        );
        setShowArchiveModal(false);
      }
    })();
  };

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

        const finalReceived = mergeRequests(
          normalizedReceived,
          receivedProfiles
        );
        const finalAccepted = mergeRequests(
          normalizedAccepted,
          acceptedProfiles
        );

        console.log("Merged received chats:", finalReceived);
        console.log("Merged accepted chats:", finalAccepted);

        // Only set acceptedChats to accepted, and receivedChats to received
        if (!mounted) return;
        setAcceptedChats(finalAccepted);
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
    console.log('🎯 handleOpenChat called with chat:', chat);
    console.log('🔎 Checking fields:');
    console.log('   - chat.isGroup:', chat.isGroup);
    console.log('   - chat.isGroupChat:', chat.isGroupChat);
    console.log('   - chat.isgroupchat:', chat.isgroupchat);
    console.log('   - chat.name:', chat.name);
    console.log('   - chat.chatId:', chat.chatId);
    // Immediately set a minimal selectedContact with offline presence to avoid flash
    try {
      const earlyId = chat.chatId || chat._id || chat.id || chat.userId || chat.email || null;
      const earlyIsGroup = chat.isGroup || chat.isGroupChat || chat.isgroupchat || (chat.participants && chat.participants.length > 1) || false;
      if (earlyId) {
        const earlyContact = {
          id: String(earlyId),
          chatId: chat.chatId || null,
          name: chat.name || chat.email || '',
          avatar: chat.avatar || null,
          isGroup: earlyIsGroup,
          isOnline: false,
          hasLeftGroup: chat.hasLeftGroup || false,
        };
        setSelectedContact(normalizeContact(earlyContact));
        // Set selectedHasLeftGroup immediately to prevent flicker
        if (earlyIsGroup && chat.hasLeftGroup !== undefined) {
          setSelectedHasLeftGroup(chat.hasLeftGroup);
        } else if (!earlyIsGroup) {
          setSelectedHasLeftGroup(false);
        }
        // Also set recentChats/contact entries offline immediately to prevent sidebar flash
        // Preserve hasLeftGroup if it exists
        setRecentChats(prev => (prev || []).map(c => {
          if (String(c.chatId) === String(earlyId) || String(c.id) === String(earlyId) || String(c.userId) === String(earlyId)) {
            return { 
              ...c, 
              isOnline: false,
              hasLeftGroup: chat.hasLeftGroup !== undefined ? chat.hasLeftGroup : c.hasLeftGroup
            };
          }
          return c;
        }));
        setContacts(prev => (prev || []).map(c => {
          if (String(c.chatId) === String(earlyId) || String(c.id) === String(earlyId) || String(c.userId) === String(earlyId)) {
            return { ...c, isOnline: false };
          }
          return c;
        }));
      }
    } catch (e) {
      // ignore
    }
    // When opening a chat with a contact from accepted requests,
    // DO NOT create a chat automatically - just show the UI
    // Chat will be created when they send first message
    (async () => {
      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("chasmos_auth_token");
        if (!token) {
          console.error("No token found — cannot access chat");
          setSelectedContact(normalizeContact(chat));
          return;
        }

        // If this chat already has a chatId (from recentChats), open it directly
        if (chat.chatId) {
          console.log("Opening existing chat with chatId:", chat.chatId);

          const normalizedChatId = String(chat.chatId);

          // Set up the contact UI
          const isGroupResolved =
            chat.isGroup ||
            chat.isGroupChat ||
            chat.isgroupchat ||
            (chat.participants && chat.participants.length > 1) ||
            false;
          const contactForUI = {
            id: normalizedChatId,
            chatId: normalizedChatId,
            userId: chat.userId,
            name: chat.name,
            avatar: chat.avatar,
            participants: chat.participants || [],
            isGroup: isGroupResolved,
            // set presence flag immediately based on known onlineUsers set
            isOnline: (function () {
              try {
                const isGroup = chat.isGroup || chat.isGroupChat || false;
                if (isGroup) return false;
                const other =
                  chat.userId ||
                  chat.id ||
                  chat.participantId ||
                  (chat.participants && chat.participants[0]?._id);
                return other ? onlineUsers.has(String(other)) : false;
              } catch (e) {
                return false;
              }
            })(),
          };

          console.log('📝 Created contactForUI from existing chat:', contactForUI, 'from chat:', chat);
          try {
            if (!contactForUI.isGroup && contactForUI.userId) {
              const status = await blockService.checkBlockStatus(String(contactForUI.userId));
              contactForUI.hasBlockedYou = Boolean(status?.hasBlockedYou);
              if (contactForUI.hasBlockedYou) contactForUI.isOnline = false;
              
              // Update recentChats to preserve hasBlockedYou flag
              setRecentChats(prev => (prev || []).map(c => {
                if (String(c.chatId) === String(normalizedChatId) || String(c.id) === String(normalizedChatId)) {
                  return { ...c, hasBlockedYou: contactForUI.hasBlockedYou, isOnline: contactForUI.hasBlockedYou ? false : c.isOnline };
                }
                return c;
              }));
            }
            
            // Compute hasLeftGroup for groups
            if (contactForUI.isGroup) {
              const members =
                contactForUI.users ||
                contactForUI.participants ||
                chat.users ||
                chat.participants ||
                [];
              const _local = JSON.parse(localStorage.getItem("chasmos_user_data") || "{}");
              const currentUserIdLocal = _local._id || _local.id || _local.userId || null;
              const isMember = (members || []).some((m) => {
                const uid = m && (m._id || m.id || m.userId || m);
                return uid && String(uid) === String(currentUserIdLocal);
              });
              contactForUI.hasLeftGroup = !isMember;
              
              // Update recentChats to preserve hasLeftGroup flag and set selectedHasLeftGroup immediately
              setRecentChats(prev => (prev || []).map(c => {
                if (String(c.chatId) === String(normalizedChatId) || String(c.id) === String(normalizedChatId)) {
                  return { ...c, hasLeftGroup: contactForUI.hasLeftGroup };
                }
                return c;
              }));
              setSelectedHasLeftGroup(contactForUI.hasLeftGroup);
            } else {
              contactForUI.hasLeftGroup = false;
              setSelectedHasLeftGroup(false);
            }
          } catch (e) {
            contactForUI.hasBlockedYou = false;
            contactForUI.hasLeftGroup = false;
            setSelectedHasLeftGroup(false);
          }
          setSelectedContact(normalizeContact(contactForUI));

          // Clear unread count for this chat
          setRecentChats((prev) =>
            prev.map((c) =>
              c.chatId === normalizedChatId || c.id === normalizedChatId
                ? { ...c, unreadCount: 0 }
                : c
            )
          );

          // Join socket room
          if (socketRef.current && socketRef.current.emit) {
            socketRef.current.emit("join chat", normalizedChatId);
          }

          // Fetch messages for this chat
          const msgsUrl = `${API_BASE_URL}/api/message/${normalizedChatId}`;
          const msgsRes = await fetch(msgsUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (msgsRes.ok) {
            const msgs = await msgsRes.json();
            const formatted = msgs.map((m) => ({
              id: m._id,
              type: m.type || "text",
              content: m.content || m.text || "",
              sender: m.sender,
              timestamp: new Date(
                m.timestamp || m.scheduledFor || m.createdAt || Date.now()
              ).getTime(),
              status: m.status || (m.isRead ? "read" : "sent"),
              attachments: m.attachments || [],
              isForwarded: m.isForwarded || false,
              isEdited: m.isEdited || false,
              reactions: m.reactions || [],
              starredBy: m.starredBy || [],
              poll: m.poll || null,
              repliedTo: Array.isArray(m.repliedTo)
                ? m.repliedTo.map((rt) => ({
                    _id: rt._id || rt.id,
                    id: rt._id || rt.id,
                    content: rt.content || rt.text || "",
                    sender: rt.sender,
                    attachments: Array.isArray(rt.attachments)
                      ? rt.attachments
                      : [],
                  }))
                : [],
            }));

            setMessages((prev) => {
              const filtered = filterDuplicateSystemMessages(formatted);
              return { ...prev, [normalizedChatId]: filtered };
            });
          }

          return;
        }

        // Determine user id to open chat with (for new chats or accepted requests)
        const userId = chat.userId || chat._id || chat.id || chat.email;

        // Check if this is an accepted request (not an existing chat)
        const isAcceptedRequest = acceptedChats?.some(
          (accepted) => accepted.email === chat.email || accepted._id === userId
        );

        if (isAcceptedRequest) {
          // For accepted requests, just set up the UI WITHOUT creating a chat
          console.log(
            "Opening accepted request - chat will be created on first message"
          );

          const contactForUI = {
            id: userId,
            chatId: null, // No chat ID yet
            userId: userId,
            email: chat.email,
            name: chat.name || chat.email?.split("@")[0] || "Unknown",
            avatar: chat.avatar || "/default-avatar.png",
            participants: [],
            isGroup: false,
            isAcceptedRequest: true, // Flag to indicate this needs chat creation
          };

          try {
            if (contactForUI.userId) {
              const status = await blockService.checkBlockStatus(String(contactForUI.userId));
              contactForUI.hasBlockedYou = Boolean(status?.hasBlockedYou);
              if (contactForUI.hasBlockedYou) contactForUI.isOnline = false;
            }
          } catch (e) {
            contactForUI.hasBlockedYou = false;
          }
          setSelectedContact(normalizeContact(contactForUI));
          setMessages((prev) => ({ ...prev, [userId]: [] })); // Empty messages
          return;
        }

        // Always resolve the unique 1-on-1 chat between two users before fetching messages
        // Never use a user id as a chat id
        // Always POST to /api/chat with userId to get the chat, then fetch messages using the returned chat._id
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
          setSelectedContact(normalizeContact(chat));
          return;
        }

        const chatObj = await res.json();
        const normalizedChatId = String(
          chatObj._id || chatObj.chatId || chatObj.id
        );

        // Find the other participant for display
        const localUser = JSON.parse(
          localStorage.getItem("chasmos_user_data") || "{}"
        );
        const otherUser = (chatObj.users || chatObj.participants || []).find(
          (u) => String(u._id) !== String(localUser._id)
        );

        const contactForUI = {
          id: normalizedChatId,
          chatId: normalizedChatId,
          name:
            otherUser?.name ||
            chatObj.chatName ||
            otherUser?.email ||
            "Unknown",
          avatar:
            otherUser?.pic ||
            otherUser?.avatar ||
            otherUser?.avatar ||
            "/default-avatar.png",
          participants: chatObj.users || chatObj.participants || [],
          isGroup: chatObj.isGroupChat || false,
        };

        try {
          // annotate block status for 1:1 chats to avoid flashing online
          if (!contactForUI.isGroup && otherUser && (otherUser._id || otherUser.id)) {
            const status = await blockService.checkBlockStatus(String(otherUser._id || otherUser.id));
            contactForUI.hasBlockedYou = Boolean(status?.hasBlockedYou);
            if (contactForUI.hasBlockedYou) contactForUI.isOnline = false;
            
            // Update recentChats to preserve hasBlockedYou flag
            setRecentChats(prev => (prev || []).map(c => {
              if (String(c.chatId) === String(normalizedChatId) || String(c.id) === String(normalizedChatId)) {
                return { ...c, hasBlockedYou: contactForUI.hasBlockedYou, isOnline: contactForUI.hasBlockedYou ? false : c.isOnline };
              }
              return c;
            }));
          }
        } catch (e) {
          contactForUI.hasBlockedYou = false;
        }
        setSelectedContact(normalizeContact(contactForUI));

        // Clear unread count for this chat
        setRecentChats((prev) =>
          prev.map((c) =>
            c.chatId === normalizedChatId || c.id === normalizedChatId
              ? { ...c, unreadCount: 0 }
              : c
          )
        );

        // Join socket room
        if (socketRef.current && socketRef.current.emit) {
          socketRef.current.emit("join chat", normalizedChatId);
        }

        // Fetch messages for this chat (use normalized id)
        const msgsUrl = `${API_BASE_URL}/api/message/${normalizedChatId}`;
        const msgsRes = await fetch(msgsUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!msgsRes.ok) {
          console.warn("handleOpenChat: messages fetch failed", {
            status: msgsRes.status,
          });
        } else {
          const msgs = await msgsRes.json();
          const formatted = msgs.map((m) => ({
            id: m._id,
            type: m.type || "text",
            content: m.content || m.text || "",
            sender: m.sender,
            timestamp: new Date(
              m.timestamp || m.scheduledFor || m.createdAt || Date.now()
            ).getTime(),
            status: m.status || (m.isRead ? "read" : "sent"),
            attachments: Array.isArray(m.attachments) ? m.attachments : [],
            isSystemMessage: m.type === "system",
            isForwarded: m.isForwarded || false,
            isEdited: m.isEdited || false,
            reactions: m.reactions || [],
            starredBy: m.starredBy || [],
            poll: m.poll || null,
            repliedTo: Array.isArray(m.repliedTo)
              ? m.repliedTo.map((rt) => ({
                  _id: rt._id || rt.id,
                  id: rt._id || rt.id,
                  content: rt.content || rt.text || "",
                  sender: rt.sender,
                  attachments: Array.isArray(rt.attachments)
                    ? rt.attachments
                    : [],
                }))
              : [],
          }));
          const filteredFormatted = filterDuplicateSystemMessages(formatted);
          setMessages((prev) => {
            const next = { ...prev, [normalizedChatId]: filteredFormatted };
            try {
              // update recent/contact preview based on last message loaded from DB
              const last = formatted.length
                ? formatted[formatted.length - 1]
                : null;
              if (last) {
                const preview =
                  last.content ||
                  (last.attachments && last.attachments[0]?.fileName) ||
                  "Attachment";
                updateRecentChat && updateRecentChat(normalizedChatId, preview);
                updateContactPreview &&
                  updateContactPreview(
                    normalizedChatId,
                    preview,
                    Boolean(last.attachments && last.attachments.length),
                    {
                      attachmentFileName:
                        last.attachments && last.attachments[0]?.fileName,
                      attachmentMime:
                        last.attachments && last.attachments[0]?.mimeType,
                    }
                  );
              }
            } catch (e) {
              // ignore
            }
            return next;
          });
        }
      } catch (err) {
        console.error("Error opening chat:", err);
        setSelectedContact(normalizeContact(chat));
      }
    })();
  };

  //Group functions
  const [currentGroup, setCurrentGroup] = useState(null);

  // When a group is updated (from GroupInfoModal), reflect changes immediately
  useEffect(() => {
    if (!currentGroup) return;
    const chatId = currentGroup.chatId || currentGroup._id || currentGroup.id;
    const avatar = currentGroup.avatar || currentGroup.icon || (currentGroup.groupSettings && currentGroup.groupSettings.avatar) || '';
    const name = currentGroup.name || currentGroup.chatName || currentGroup.groupName || '';

    try {
      // Update recentChats entry directly to avoid overwriting lastMessage
      if (chatId) {
        setRecentChats(prev => Array.isArray(prev) ? prev.map(c => {
          const id = c.chatId || c.id || c._id;
          if (String(id) === String(chatId)) return { ...c, avatar, name };
          return c;
        }) : prev);
      }
    } catch (e) { console.warn('setRecentChats failed while syncing group avatar', e); }

    try {
      // Update contacts list so sidebar reflects new avatar
      setContacts(prev => (Array.isArray(prev) ? prev.map(c => {
        const id = c.chatId || c.id || c._id;
        if (String(id) === String(chatId)) return { ...c, avatar, name };
        return c;
      }) : prev));
    } catch (e) { /* ignore */ }

    try {
      // If currently open chat is this group, update header selectedContact
      if (selectedContact && String(selectedContact.chatId || selectedContact.id || selectedContact._id) === String(chatId)) {
        setSelectedContact(prev => ({ ...(prev||{}), avatar, name }));
      }
    } catch (e) { /* ignore */ }
  }, [currentGroup]);

const handleOpenGroupInfo = (group) => {
  if (!group || (!group.isGroup && !group.isGroupChat)) return;

    // Fetch full group details with all members
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("chasmos_auth_token");
    if (!token) return;

  const localeParam = (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) ? encodeURIComponent(navigator.language || navigator.userLanguage) : 'en-US';
  fetch(`${API_BASE_URL}/api/chat/group/${group.chatId || group.id}?locale=${localeParam}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(res => res.json())
    .then(fullGroupData => {
      const normalized = {
        ...fullGroupData,
        name: fullGroupData.name || fullGroupData.chatName || (fullGroupData.groupSettings && fullGroupData.groupSettings.name) || group.name || group.chatName || 'Group'
      };
      // Ensure formatted date is available on the frontend object
      if (!normalized.createdAtFormatted && (fullGroupData.createdAtFormatted || fullGroupData.createdAtIso || fullGroupData.createdAt)) {
        normalized.createdAtFormatted = fullGroupData.createdAtFormatted || fullGroupData.createdAtIso || fullGroupData.createdAt;
      }
      setCurrentGroup(normalized);
      setShowGroupInfoModal(true);
    })
    .catch(err => {
      console.error('Failed to fetch group details:', err);
      // Fallback: use the data we have
      const fallback = { ...group, name: group.name || group.chatName || (group.groupSettings && group.groupSettings.name) || 'Group' };
      setCurrentGroup(fallback);
      setShowGroupInfoModal(true);
    });
};

  // Listen for external requests to open a chat (e.g., from other modals)
  useEffect(() => {
    const handler = (ev) => {
      try {
        const detail = ev && ev.detail ? ev.detail : {};
        const chat = detail.chat || (detail.chatId ? { chatId: detail.chatId } : null);
        const tokenFromDetail = detail.token;
        if (!chat) return;
        // If a token was provided, persist it under chasmos_auth_token to be used by API calls
        if (tokenFromDetail) {
          try { localStorage.setItem('chasmos_auth_token', tokenFromDetail); } catch (e) {}
        } else {
          // Also ensure there's a fallback token available
          const t = localStorage.getItem('token');
          if (t && !localStorage.getItem('chasmos_auth_token')) {
            try { localStorage.setItem('chasmos_auth_token', t); } catch (e) {}
          }
        }

        try { handleOpenChat(chat); } catch (e) { console.warn('open-chat handler failed', e); }
        try { navigate('/chats'); } catch (e) {}
      } catch (e) {
        console.warn('chasmos:open-chat handler error', e);
      }
    };

    window.addEventListener('chasmos:open-chat', handler);
    return () => window.removeEventListener('chasmos:open-chat', handler);
  }, [navigate]);

  const handleCloseGroupInfo = () => {
    setShowGroupInfoModal(false);
    setCurrentGroup(null);
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
      const normalizedChats = acceptedData.filter(Boolean).map((chat) => ({
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
    } catch (err) {
      console.error("Error fetching accepted chats:", err);
      setAcceptedChats([]);
    }
  };

  // Accepts a chat request from a user (the contact is the user who sent the request)
  const handleAcceptChat = async (contact) => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !contact || !contact.email) {
        console.error("Missing token or contact info");
        return;
      }
      await fetch(`${API_BASE_URL}/api/user/request/accept`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ senderEmail: contact.email }),
      });

      // ✅ ONLY HERE
      fetchAcceptedChats && fetchAcceptedChats(); // populate Accepted
      fetchRequests && fetchRequests(); // remove from Received
    } catch (err) {
      console.error("Error accepting chat request:", err);
    }
  };

  const handleRejectChat = async (email) => {
    try {
      const token = localStorage.getItem("token");

      await fetch(`${API_BASE_URL}/api/user/request/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ senderEmail: email }),
      });

      // Remove immediately from UI
      setReceivedChats((prev) => prev.filter((req) => req.email !== email));
    } catch (err) {
      console.error("Reject failed", err);
    }
  };

  // Fetch pinned messages when chat is selected
  useEffect(() => {
    // Clear pinned messages immediately when contact changes
    setPinnedMessagesData([]);
    setPinnedMessages({});

    const fetchPinnedMessages = async () => {
      if (!selectedContact) {
        return;
      }

      const chatId = selectedContact.id || selectedContact._id;
      if (!chatId) return;

      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("chasmos_auth_token");
        if (!token) return;

        const res = await fetch(
          `${API_BASE_URL}/api/message/pinned/${chatId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          console.error("Failed to fetch pinned messages");
          return;
        }

        const data = await res.json();
        setPinnedMessagesData(data || []);

        // Update pinnedMessages state for UI
        const pinnedMap = {};
        (data || []).forEach((pinned) => {
          if (pinned.message) {
            const msgId = pinned.message._id || pinned.message.id;
            pinnedMap[msgId] = true;
          }
        });
        setPinnedMessages(pinnedMap);
      } catch (err) {
        console.error("Error fetching pinned messages:", err);
      }
    };

    fetchPinnedMessages();
  }, [selectedContact, API_BASE_URL]);

  // Function to refresh recent chats (can be called from anywhere)
  const refreshRecentChats = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found.");

      // Fetch archived chats to exclude them from the recent list
      let archived = [];
      let archivedChatIdsSet = new Set();
      try {
        archived = await archiveService.getArchivedChats();
        archived.forEach((archivedChat) => {
          const chatId =
            archivedChat._id ||
            archivedChat.id ||
            (archivedChat.chat && archivedChat.chat._id);
          if (chatId) archivedChatIdsSet.add(String(chatId));
        });
        setArchivedChatIds(archivedChatIdsSet);
      } catch (e) {
        archived = [];
      }

      const res = await fetch(`${API_BASE_URL}/api/chat/recent`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch recent chats");

      const data = await res.json();

      const localUser = JSON.parse(
        localStorage.getItem("chasmos_user_data") || "{}"
      );
      const loggedInUserId = localUser._id || localUser.id || null;

      const formatted = (Array.isArray(data) ? data : [])
        .map((chat) => {
          const otherUser =
            chat.otherUser ||
            (chat.participants &&
              chat.participants.find(
                (p) => String(p._id) !== String(loggedInUserId)
              )) ||
            (Array.isArray(chat.participants) ? chat.participants[0] : null);

          const otherId = otherUser?._id || otherUser?.id || null;
          const displayName =
            chat.isGroupChat && chat.chatName
              ? chat.chatName
              : otherUser?.name ||
                otherUser?.username ||
                otherUser?.email ||
                "Unknown";

          const rawLast = chat.lastMessage || "";
          const hasAttachmentFromMarker =
            typeof rawLast === "string" && /📎/.test(rawLast);
          const looksLikeAttachmentOnly =
            rawLast === "Attachment" ||
            /\.(png|jpe?g|gif|webp|bmp|mp4|pdf)$/i.test(rawLast);
          const hasAttachment = Boolean(
            chat.hasAttachment ||
              hasAttachmentFromMarker ||
              looksLikeAttachmentOnly ||
              (chat.lastMessage && chat.lastMessage.attachments?.length)
          );
          const attachmentFileName =
            hasAttachment && typeof rawLast === "string"
              ? rawLast.replace(/📎/g, "").trim() || ""
              : "";

          const chatIdValue = chat.chatId || chat._id;

          // Determine unreadCount but avoid showing unread when the last message was sent by current user and already read
          const lastMsgObj =
            chat.lastMessage && typeof chat.lastMessage === "object"
              ? chat.lastMessage
              : null;
          let computedUnread =
            typeof chat.unreadCount === "number"
              ? chat.unreadCount
              : chat.unreadCount?.[loggedInUserId] || 0;

          // Preserve original users/participants arrays from backend for hasLeftGroup computation
          const usersArray = chat.isGroupChat
            ? chat.users || chat.participants || []
            : null;

          return {
            id: chatIdValue,
            chatId: chatIdValue,
            userId: otherId,
            name: displayName,
            avatar: otherUser?.avatar || otherUser?.pic || null,
            lastMessage: rawLast || "",
            timestamp: chat.timestamp || chat.updatedAt,
            // Compute online status immediately using current onlineUsers set
            isOnline: otherId
              ? onlineUsers && typeof onlineUsers.has === "function"
                ? onlineUsers.has(String(otherId))
                : Boolean(otherUser?.isOnline)
              : false,
            unreadCount: computedUnread,
            hasAttachment,
            attachmentFileName,
            chatName: chat.chatName || chat.name || null,
            isGroupChat:
              chat.isGroupChat === true || chat.isGroupChat === "true",
            users: usersArray,
            participants: usersArray, // Also set participants for consistency
            admins: chat.isGroupChat ? chat.admins || [] : null,
            groupAdmin: chat.isGroupChat ? chat.groupAdmin || null : null,
            groupSettings: chat.isGroupChat ? chat.groupSettings || {} : null,
            mentionCount: chat.mentionCount || 0,
          };
        })
        .filter(Boolean);

    // Deduplicate by chatId
    // Before deduplication, check block status for each non-group chat so
    // we can hide online presence when the other user has blocked you.
    // Also compute hasLeftGroup for group chats BEFORE setting state.
    const _local = JSON.parse(localStorage.getItem("chasmos_user_data") || "{}");
    const currentUserIdLocal = _local._id || _local.id || _local.userId || null;
    
    const withBlockInfo = await Promise.all(formatted.map(async (chat) => {
      try {
        if (!chat.isGroupChat && chat.userId) {
          const status = await blockService.checkBlockStatus(String(chat.userId));
          chat.hasBlockedYou = Boolean(status?.hasBlockedYou);
          if (chat.hasBlockedYou) chat.isOnline = false;
        } else {
          chat.hasBlockedYou = false;
        }
        
        // Compute hasLeftGroup for group chats by fetching authoritative Group model participants
        if (chat.isGroupChat) {
          try {
            const groupId = chat.chatId || chat._id || chat.id;
            if (groupId) {
              const headers = token ? { Authorization: `Bearer ${token}` } : {};
              const url = `${API_BASE_URL}/api/group/group/${encodeURIComponent(groupId)}`;
              const groupRes = await fetch(url, { headers });
              
              if (groupRes.ok) {
                const groupData = await groupRes.json();
                const group = groupData && groupData.success ? groupData : (groupData.participants ? groupData : null);
                
                if (group && group.participants) {
                  // Use authoritative Group.participants for membership check
                  const isMember = (group.participants || []).some((m) => {
                    const uid = m && (m._id || m.id || m.userId || m);
                    return uid && String(uid) === String(currentUserIdLocal);
                  });
                  chat.hasLeftGroup = !isMember;
                  // Update the chat's participants with authoritative data
                  chat.participants = group.participants;
                  chat.users = group.participants;
                } else {
                  // Fallback to chat.users if group fetch failed
                  const members = chat.users || [];
                  const isMember = (members || []).some((m) => {
                    const uid = m && (m._id || m.id || m.userId || m);
                    return uid && String(uid) === String(currentUserIdLocal);
                  });
                  chat.hasLeftGroup = !isMember;
                }
              } else {
                // Fallback to chat.users if group fetch failed
                const members = chat.users || [];
                const isMember = (members || []).some((m) => {
                  const uid = m && (m._id || m.id || m.userId || m);
                  return uid && String(uid) === String(currentUserIdLocal);
                });
                chat.hasLeftGroup = !isMember;
              }
            } else {
              chat.hasLeftGroup = false;
            }
          } catch (fetchError) {
            // Fallback to chat.users if fetch fails
            const members = chat.users || [];
            const isMember = (members || []).some((m) => {
              const uid = m && (m._id || m.id || m.userId || m);
              return uid && String(uid) === String(currentUserIdLocal);
            });
            chat.hasLeftGroup = !isMember;
          }
        } else {
          chat.hasLeftGroup = false;
        }
      } catch (e) {
        // ignore errors and assume not blocked
        chat.hasBlockedYou = false;
        chat.hasLeftGroup = false;
      }
      return chat;
    }));

    const seen = new Map();
    withBlockInfo.forEach(chat => {
      const chatIdKey = String(chat.chatId);
      if (!seen.has(chatIdKey) || new Date(chat.timestamp) > new Date(seen.get(chatIdKey).timestamp)) {
        seen.set(chatIdKey, chat);
      }
    });
    const deduplicated = Array.from(seen.values());

      // Filter out archived chats
      const filtered = deduplicated.filter(
        (c) => !archivedChatIdsSet.has(String(c.chatId))
      );

      // --- MERGE WITH EXISTING STATE ---
      setRecentChats((prevChats) => {
        const prevMap = new Map(prevChats.map((c) => [String(c.chatId), c]));

        const merged = filtered.map((chat) => {
          const existing = prevMap.get(String(chat.chatId));
          return {
            ...chat,
            // Preserve existing avatar if backend returns null
            avatar: chat.avatar || existing?.avatar,
            unreadCount: chat.unreadCount ?? existing?.unreadCount ?? 0,
            isOnline: chat.isOnline ?? existing?.isOnline ?? false,
            // hasLeftGroup and hasBlockedYou already computed above
          };
        });

        // Sort by timestamp descending
        merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return merged;
      });
    } catch (err) {
      setError(err.message);
    }
  }, [API_BASE_URL, onlineUsers]);

  // Listen for forwarded messages from other UI (e.g., GroupInfoModal)
  useEffect(() => {
    const handler = async (ev) => {
      try {
        const detail = ev && ev.detail;
        const chatIds = Array.isArray(detail?.chatIds)
          ? detail.chatIds.map(String)
          : [];
        // Refresh recent chats list
        try {
          await refreshRecentChats();
        } catch (e) {
          console.warn("refreshRecentChats failed on forwarded event", e);
        }

        // If the currently open chat is one of the forwarded-to chats, reload its messages
        const currentChatId =
          selectedContact?.chatId ||
          selectedContact?.id ||
          selectedContact?._id;
        if (currentChatId && chatIds.includes(String(currentChatId))) {
          try {
            const token =
              localStorage.getItem("token") ||
              localStorage.getItem("chasmos_auth_token");
            const msgsRes = await fetch(
              `${API_BASE_URL}/api/message/${currentChatId}`,
              {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              }
            );
            if (msgsRes.ok) {
              const msgs = await msgsRes.json();
              const formatted = msgs.map((m) => ({
                id: m._id,
                type: m.type || "text",
                content: m.content || m.text || "",
                sender: m.sender,
                timestamp: new Date(
                  m.timestamp || m.scheduledFor || m.createdAt || Date.now()
                ).getTime(),
                status: m.status || (m.isRead ? "read" : "sent"),
                attachments: Array.isArray(m.attachments) ? m.attachments : [],
                isSystemMessage: m.type === "system",
                isForwarded: m.isForwarded || false,
                isEdited: m.isEdited || false,
                reactions: m.reactions || [],
                starredBy: m.starredBy || [],
                repliedTo: Array.isArray(m.repliedTo)
                  ? m.repliedTo.map((rt) => ({
                      _id: rt._id || rt.id,
                      id: rt._id || rt.id,
                      content: rt.content || rt.text || "",
                      sender: rt.sender,
                      attachments: Array.isArray(rt.attachments)
                        ? rt.attachments
                        : [],
                    }))
                  : [],
              }));

              const filteredMessages = filterDuplicateSystemMessages(formatted);
              setMessages((prev) => ({
                ...prev,
                [currentChatId]: filteredMessages,
              }));
            }
          } catch (e) {
            console.error("Failed to reload messages after forwarded event", e);
          }
        }
      } catch (err) {
        console.error("chasmos:forwarded handler error", err);
      }
    };

    window.addEventListener("chasmos:forwarded", handler);
    return () => window.removeEventListener("chasmos:forwarded", handler);
  }, [refreshRecentChats, selectedContact, API_BASE_URL]);

  // Listen for join events (user joined group via invite elsewhere)
  useEffect(() => {
    const handler = async (ev) => {
      try {
        const detail = ev && ev.detail;
        // Refresh recent chats so the joined group appears
        try {
          await refreshRecentChats();
        } catch (e) {
          console.warn("refreshRecentChats failed on joined-group event", e);
        }

        // If this group is currently open, reload its messages
        const group = detail?.group;
        const currentChatId =
          selectedContact?.chatId ||
          selectedContact?.id ||
          selectedContact?._id;
        if (
          group &&
          currentChatId &&
          (String(group.chat) === String(currentChatId) ||
            String(group._id) === String(currentChatId))
        ) {
          try {
            const token =
              localStorage.getItem("token") ||
              localStorage.getItem("chasmos_auth_token");
            const msgsRes = await fetch(
              `${API_BASE_URL}/api/message/${currentChatId}`,
              {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              }
            );
            if (msgsRes.ok) {
              const msgs = await msgsRes.json();
              const formatted = msgs.map((m) => ({
                id: m._id,
                type: m.type || "text",
                content: m.content || m.text || "",
                sender: m.sender,
                timestamp: new Date(
                  m.timestamp || m.scheduledFor || m.createdAt || Date.now()
                ).getTime(),
                status: m.status || (m.isRead ? "read" : "sent"),
                attachments: Array.isArray(m.attachments) ? m.attachments : [],
                isSystemMessage: m.type === "system",
                isForwarded: m.isForwarded || false,
                isEdited: m.isEdited || false,
                reactions: m.reactions || [],
                starredBy: m.starredBy || [],
                repliedTo: Array.isArray(m.repliedTo)
                  ? m.repliedTo.map((rt) => ({
                      _id: rt._id || rt.id,
                      id: rt._id || rt.id,
                      content: rt.content || rt.text || "",
                      sender: rt.sender,
                      attachments: Array.isArray(rt.attachments)
                        ? rt.attachments
                        : [],
                    }))
                  : [],
              }));

              const filteredMessages = filterDuplicateSystemMessages(formatted);
              setMessages((prev) => ({
                ...prev,
                [currentChatId]: filteredMessages,
              }));
            }
          } catch (e) {
            console.error(
              "Failed to reload messages after joined-group event",
              e
            );
          }
        }
      } catch (err) {
        console.error("joined-group handler error", err);
      }
    };

    window.addEventListener("chasmos:joined-group", handler);
    return () => window.removeEventListener("chasmos:joined-group", handler);
  }, [refreshRecentChats, selectedContact, API_BASE_URL]);

  // Listen for successful google sync events (dispatched from the oauth popup message handler)
  React.useEffect(() => {
    const onSync = (e) => {
      try {
        // optionally use token from detail
        const token = e?.detail?.token;
        if (token) localStorage.setItem("token", token);
        refreshRecentChats();
      } catch (err) {
        console.error("Error handling google-sync-success event", err);
      }
    };
    window.addEventListener("chasmos:google-sync-success", onSync);
    return () =>
      window.removeEventListener("chasmos:google-sync-success", onSync);
  }, [refreshRecentChats]);

  // Fetch recent chats on mount
  // Improved loading logic: hide spinner after both fetch and min time
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setMinLoadingComplete(false);

    let minLoadingDone = false;
    let chatsFetched = false;

    // Helper to hide loader if both are done
    const maybeHideLoader = () => {
      if (minLoadingDone && chatsFetched && mounted) {
        setLoading(false);
      }
    };

    // Minimum loading timer
    const minLoadingTimer = setTimeout(() => {
      minLoadingDone = true;
      setMinLoadingComplete(true);
      maybeHideLoader();
    }, 1000);

    // Fetch recent chats
    refreshRecentChats().finally(() => {
      chatsFetched = true;
      setDataFetched(true);
      maybeHideLoader();
    });

    return () => {
      mounted = false;
      clearTimeout(minLoadingTimer);
    };
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
        floatingButtonRef.current &&
        !floatingButtonRef.current.contains(event.target) &&
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
    // Start with recentChats as the base
    let filtered = [...recentChats];

    // Apply search term filter
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((contact) => {
        const name = (contact.name || "").toLowerCase();
        const lastMsg = (contact.lastMessage || "").toLowerCase();
        const match =
          name.includes(lowerSearch) || lastMsg.includes(lowerSearch);

        return match;
      });
    }

    // Filter by navigation item type
    switch (activeNavItem) {
      case "chats":
        filtered = filtered.filter((contact) => {
          const result =
            !contact.isGroup && !contact.isDocument && !contact.isCommunity;

          return result;
        });
        break;
      case "groups":
        filtered = filtered.filter((contact) => {
          const result = contact.isGroup || contact.isGroupChat;
          return result;
        });
        break;
      case "documents":
        filtered = filtered.filter((contact) => {
          const result = contact.isDocument;

          return result;
        });
        break;
      default:
        // Show all for default case
        break;
    }

    return filtered;
  }, [recentChats, searchTerm, activeNavItem]);

  // Remove useMemo and calculate messages directly in render
  const getMessagesForContact = (contactId, searchTerm = "") => {
    if (!contactId) return [];

    // Get messages for the contact, default to empty array
    const contactMessages = messages[contactId] || [];

    // If no search term, return all messages sorted by timestamp
    if (!searchTerm.trim()) {
      const sorted = [...contactMessages].sort(
        (a, b) => a.timestamp - b.timestamp
      );
      return filterDuplicateSystemMessages(sorted);
    }

    // Filter messages by search term (case-insensitive)
    const filtered = contactMessages
      .filter((message) => {
        const text = message.text || message.content || "";
        return text.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => a.timestamp - b.timestamp); // Optional: sort filtered messages too

    return filterDuplicateSystemMessages(filtered);
  };

  // Memoize input change handlers
  const handleSearchTermChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleChatSearchTermChange = useCallback((e) => {
    setChatSearchTerm(e.target.value);
  }, []);

  // Hoisted helpers so socket handlers and other callbacks can use them
  const updateRecentChat = useCallback(
    (chatId, preview, hasAttachment = false, meta = {}) => {
      setRecentChats((prev) => {
        if (archivedChatIds && archivedChatIds.has(String(chatId))) {
          return prev;
        }

      const providedTs = meta && (meta.timestamp || meta.timestamp === 0)
        ? (typeof meta.timestamp === 'number' ? meta.timestamp : new Date(meta.timestamp).getTime())
        : null;
      const useTs = providedTs || Date.now();

      const isSystem = meta && (meta.isSystem || meta.type === 'system' || meta.isSystemMessage);

      const exists = prev.find((c) => c.id === chatId || c.chatId === chatId || c.userId === chatId);
      if (exists) {
        // Update existing entry but DO NOT overwrite preview/timestamp/attachment for system messages
        // If meta indicates the update comes from the current user, do not apply sender metadata
        const metaIsFromMe = meta && (meta.userId && String(meta.userId) === String(currentUserId));

        const updated = Object.assign({}, exists, {
          ...(isSystem ? {} : { lastMessage: preview }),
          ...(isSystem ? {} : { timestamp: useTs }),
          ...(isSystem ? {} : { hasAttachment: !!hasAttachment }),
          ...(isSystem ? {} : (hasAttachment && meta.attachmentFileName ? { attachmentFileName: meta.attachmentFileName } : {})),
          ...(isSystem ? {} : (hasAttachment && meta.attachmentMime ? { attachmentMime: meta.attachmentMime } : {})),
          // Do NOT overwrite identifying metadata (name/avatar/userId) when this update comes from a system message
          // or when the metadata indicates the sender is the current user (prevents your profile replacing the contact)
          ...(!isSystem && !metaIsFromMe && meta.name ? { name: meta.name } : {}),
          ...(!isSystem && !metaIsFromMe && meta.avatar ? { avatar: meta.avatar } : {}),
          ...(!isSystem && !metaIsFromMe && meta.userId ? { userId: meta.userId } : {}),
        });

          // Compute hasLeftGroup for updated chat
          updated.hasLeftGroup = computeHasLeftGroup(updated);

          return [
            updated,
            ...prev.filter(
              (c) =>
                !(c.id === chatId || c.chatId === chatId || c.userId === chatId)
            ),
          ];
        }

        // New entry: show in list. For system-originated creation we still add the chat but avoid showing system preview text
        // For new entries, avoid using sender metadata when it's a system message or from current user
        const metaIsFromMeNew = meta && (meta.userId && String(meta.userId) === String(currentUserId));
        const newChat = Object.assign(
          {
            id: chatId,
            chatId,
            // associate a userId for one-to-one chats when provided so presence/status works
            userId: !isSystem && !metaIsFromMeNew ? (meta.userId || null) : (selectedContact?.userId || null),
            // Prefer explicit meta.name/meta.avatar when provided (server or message payload),
            // otherwise fall back to currently selected contact or a default.
            name: !isSystem && !metaIsFromMeNew ? (meta.name || selectedContact?.name || "") : (selectedContact?.name || ""),
            avatar: !isSystem && !metaIsFromMeNew ? (meta.avatar || selectedContact?.avatar || "/default-avatar.png") : (selectedContact?.avatar || "/default-avatar.png"),
            lastMessage: isSystem ? "" : preview,
            hasAttachment: isSystem ? false : !!hasAttachment,
            timestamp: isSystem ? useTs : useTs,
            unreadCount: 0,
          },
          !isSystem && hasAttachment && meta.attachmentFileName
            ? { attachmentFileName: meta.attachmentFileName }
            : {},
          !isSystem && hasAttachment && meta.attachmentMime
            ? { attachmentMime: meta.attachmentMime }
            : {}
        );
        
        // Compute hasLeftGroup for new chat
        newChat.hasLeftGroup = computeHasLeftGroup(newChat);
        
        return [
          newChat,
          ...prev,
        ];
      });
    },
    [archivedChatIds, selectedContact, computeHasLeftGroup, currentUserId]
  );

  const updateContactPreview = useCallback((chatId, preview, hasAttachment = false, meta = {}) => {
    const isSystem = meta && (meta.isSystem || meta.type === 'system' || meta.isSystemMessage);
    setContacts((prev) =>
      prev.map((c) => {
        if (String(c.id) !== String(chatId) && String(c.chatId) !== String(chatId)) return c;
        // Do not overwrite preview/attachment info for system messages
        if (isSystem) return c;
        const updated = { ...c, lastMessage: preview };
        if (hasAttachment) {
          updated.hasAttachment = true;
          if (meta.attachmentFileName) updated.attachmentFileName = meta.attachmentFileName;
          if (meta.attachmentMime) updated.attachmentMime = meta.attachmentMime;
        } else {
          updated.hasAttachment = false;
          delete updated.attachmentFileName;
          delete updated.attachmentMime;
          delete updated.attachments;
        }
        return updated;
      })
    );
  }, []);

  // Handle sending message from the MessageInput component-Updated
  // Updated handleSendMessageFromInput function
  const handleSendMessageFromInput = useCallback(
    (payload) => {
      if (!payload || !selectedContact) return;

      // If this is a pending chat (opened from accepted request or chat icon), do not use id as chatId until chat is created
      const getChatId = (payload) => {
        if (selectedContact?.isPendingChat && !selectedContact.chatId) {
          return null;
        }
        return (
          payload?.chat?._id ||
          payload?.chat ||
          selectedContact.chatId ||
          selectedContact.id ||
          selectedContact._id
        );
      };

      const appendMessage = (chatId, message) => {
        setMessages((prev) => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), message],
        }));
      };

      // Case 1: Server message object (already sent from backend)
      if (
        typeof payload === "object" &&
        (payload._id || payload.id || payload.createdAt)
      ) {
        // If this is a scheduled message (isScheduled true), do NOT append to UI immediately
        if (payload.isScheduled) {
          // Do not append to UI, wait for backend to emit when sent
          return;
        }
        try {
          const chatId = getChatId(payload);
          const formatted = {
            id: payload._id || payload.id || Date.now(),
            type: payload.type || "file",
            content: payload.content || payload.text || "",
            sender: payload.sender?._id || payload.sender || "me",
            timestamp: new Date(
              payload.timestamp ||
                payload.scheduledFor ||
                payload.createdAt ||
                Date.now()
            ).getTime(),
            status: payload.status || (payload.isRead ? "read" : "sent"),
            attachments: payload.attachments || payload.files || [],
            repliedTo: payload.repliedTo || [],
          };

          appendMessage(chatId, formatted);

          if (socketRef.current?.emit) {
            lastSentAtRef.current = Date.now();
            socketRef.current.emit("new message", payload);
            // suppression removed
          }

          const preview =
            formatted.content ||
            (formatted.attachments && formatted.attachments[0]?.fileName) ||
            "Attachment";
          // Prefer group metadata when payload contains chat/group info
          const isGroupPayload = !!(
            payload.chat &&
            (payload.chat.isGroupChat || payload.chat.isGroup)
          );
          const payloadGroupName =
            payload.chat &&
            (payload.chat.chatName ||
              payload.chat.name ||
              payload.chat.groupName);
          const payloadGroupAvatar =
            payload.chat &&
            ((payload.chat.groupSettings &&
              payload.chat.groupSettings.avatar) ||
              payload.chat.avatar ||
              payload.chat.pic);
          const payloadSenderName =
            payload.sender && typeof payload.sender === "object"
              ? payload.sender.name || payload.sender.username
              : undefined;
          const payloadSenderAvatar =
            payload.sender && typeof payload.sender === "object"
              ? payload.sender.avatar || payload.sender.pic
              : undefined;

          updateRecentChat(
            chatId,
            preview,
            Boolean(formatted.attachments && formatted.attachments.length),
            {
              attachmentFileName:
                formatted.attachments && formatted.attachments[0]?.fileName,
              attachmentMime:
                formatted.attachments && formatted.attachments[0]?.mimeType,
              // For group payloads only set the group's avatar — do not fall back to the sender avatar
              ...(isGroupPayload
                ? {
                    name: payloadGroupName || payloadSenderName,
                    ...(payloadGroupAvatar
                      ? { avatar: payloadGroupAvatar }
                      : {}),
                  }
                : { name: payloadSenderName, avatar: payloadSenderAvatar }),
            }
          );
          updateContactPreview(
            chatId,
            preview,
            Boolean(formatted.attachments && formatted.attachments.length),
            {
              attachmentFileName:
                formatted.attachments && formatted.attachments[0]?.fileName,
              attachmentMime:
                formatted.attachments && formatted.attachments[0]?.mimeType,
            }
          );
          return;
        } catch (err) {
          console.error("Error appending server message payload", err);
          return;
        }
      }

      // Case 1b: Text message payload as object (from MessageInput)
      if (typeof payload === "object" && payload.type === "text") {
        (async () => {
          const token =
            localStorage.getItem("token") ||
            localStorage.getItem("chasmos_auth_token");
          let chatId = getChatId(payload);
          let userId = payload.userId;

          const localMessage = {
            id: Date.now(),
            type: "text",
            content: payload.content,
            sender: "me",
            timestamp: Date.now(),
            status: "sent",
          };

          if (!token) {
            appendMessage(chatId, localMessage);
            return;
          }

          // If this is a pending/accepted chat without a chatId, create the chat first
          if (
            (selectedContact?.isPendingChat ||
              selectedContact?.isAcceptedRequest) &&
            !chatId &&
            userId
          ) {
            try {
              const createChatRes = await fetch(`${API_BASE_URL}/api/chat`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId }),
              });

              if (createChatRes.ok) {
                const chatObj = await createChatRes.json();
                chatId = String(chatObj._id || chatObj.id);
                setSelectedContact((prev) => ({
                  ...prev,
                  chatId: chatId,
                  id: chatId,
                  isPendingChat: false,
                  isAcceptedRequest: false,
                  participants: chatObj.users || chatObj.participants || [],
                }));
                console.log("Chat created for pending/accepted chat:", chatId);
              } else {
                console.error(
                  "Failed to create chat for pending/accepted chat"
                );
                return;
              }
            } catch (err) {
              console.error("Error creating chat:", err);
              return;
            }
          }

          if (!chatId) {
            appendMessage(chatId, localMessage);
            return;
          }

          try {
            const bodyObj = {
              content: payload.content,
              chatId,
              userId,
              repliedTo: selectedReplies || [],
            };
            if (
              payload.mentions &&
              Array.isArray(payload.mentions) &&
              payload.mentions.length
            ) {
              bodyObj.mentions = payload.mentions;
            }
            if (payload.isScheduled) {
              bodyObj.isScheduled = true;
              if (payload.scheduledFor)
                bodyObj.scheduledFor = payload.scheduledFor;
            }
            const res = await fetch(`${API_BASE_URL}/api/message`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(bodyObj),
            });

            if (!res.ok) throw new Error("Failed to send text message");

            const resJson = await res.json();
            // backend may return { message, chat } when it created a new 1-on-1 chat
            const sent = resJson && resJson.message ? resJson.message : resJson;

            // If backend created a new chat, adopt the chatId and move pending messages
            if (resJson && resJson.chat) {
              const newChat = resJson.chat;
              chatId = String(newChat._id || newChat.id || chatId);
              setSelectedContact((prev) => ({
                ...prev,
                chatId: chatId,
                id: chatId,
                isPendingChat: false,
                isAcceptedRequest: false,
                participants:
                  newChat.users ||
                  newChat.participants ||
                  prev?.participants ||
                  [],
              }));

              // If this poll message is scheduled, don't append now; cron will emit later
              if (sent && sent.isScheduled) {
                console.log(
                  "[send] scheduled poll message saved, will be delivered later:",
                  sent._id || sent.id
                );
                return;
              }

              setMessages((prev) => {
                const copy = { ...prev };
                const possibleKeys = [null, undefined, "null", "undefined", ""];
                possibleKeys.forEach((k) => {
                  if (copy[k]) {
                    if (!copy[chatId]) copy[chatId] = [];
                    copy[chatId] = [...copy[chatId], ...copy[k]];
                    delete copy[k];
                  }
                });
                return copy;
              });

              // Ensure recentChats entries reference the new chat id
              setRecentChats((prev) =>
                prev.map((c) => {
                  if (
                    !c.id ||
                    String(c.id) === String(selectedContact?.id) ||
                    String(c.chatId) === String(selectedContact?.chatId)
                  ) {
                    return { ...c, id: chatId, chatId };
                  }
                  return c;
                })
              );
            }

            // If this message is scheduled, do not append it to the UI now;
            // the backend cron will emit the message when it's due.
            if (sent && sent.isScheduled) {
              console.log(
                "[send] message scheduled on server, will be delivered later:",
                sent._id || sent.id
              );
              return;
            }

            const formatted = {
              id: sent._id || sent.id || Date.now(),
              type: "text",
              content: sent.content || sent.text || payload.content,
              sender: sent.sender?._id || sent.sender || "me",
              timestamp: new Date(
                sent.timestamp ||
                  sent.scheduledFor ||
                  sent.createdAt ||
                  Date.now()
              ).getTime(),
              status: sent.status || (sent.isRead ? "read" : "sent"),
              repliedTo:
                sent.repliedTo || selectedReplies || payload.repliedTo || [],
            };

            appendMessage(chatId, formatted);
            onClearReplySelection && onClearReplySelection();
            if (socketRef.current?.emit) {
              try {
                console.log("[SOCKET OUT] emit new message", {
                  chatId,
                  messageId: formatted.id,
                });
                lastSentAtRef.current = Date.now();
                socketRef.current.emit("new message", sent);
                // suppression removed
              } catch (e) {
                console.error("Error emitting new message", e);
              }
            }

            updateRecentChat(chatId, payload.content, false);
            updateContactPreview(chatId, payload.content, false);
          } catch (err) {
            console.error("Error sending text message:", err);
          }
        })();
        return;
      }

      // Case 2: Attachments message
      if (typeof payload === "object" && payload.attachments) {
        (async () => {
          const token =
            localStorage.getItem("token") ||
            localStorage.getItem("chasmos_auth_token");
          let chatId = getChatId(payload);

          const localMessage = {
            id: Date.now(),
            type: payload.type || "file",
            content: payload.text || "",
            sender: "me",
            timestamp: Date.now(),
            status: "sent",
            attachments: payload.attachments,
          };

          // Local fallback
          if (!token) {
            appendMessage(chatId, localMessage);
            updateRecentChat(
              chatId,
              localMessage.content || "Attachment",
              Boolean(
                localMessage.attachments && localMessage.attachments.length
              ),
              {
                attachmentFileName:
                  localMessage.attachments &&
                  localMessage.attachments[0]?.fileName,
                attachmentMime:
                  localMessage.attachments &&
                  localMessage.attachments[0]?.mimeType,
              }
            );
            return;
          }

          // If this is a pending chat (opened from accepted request or chat icon), create the chat first
          if (selectedContact?.isPendingChat && !chatId) {
            try {
              const userId =
                selectedContact.userId ||
                selectedContact._id ||
                selectedContact.email;
              const createChatRes = await fetch(`${API_BASE_URL}/api/chat`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId }),
              });

              if (createChatRes.ok) {
                const chatObj = await createChatRes.json();
                chatId = String(chatObj._id || chatObj.id);
                // Update the selected contact with the new chat ID and clear pending flag
                setSelectedContact((prev) => ({
                  ...prev,
                  chatId: chatId,
                  id: chatId,
                  isPendingChat: false,
                  participants: chatObj.users || chatObj.participants || [],
                }));
                console.log("Chat created for pending chat:", chatId);
              } else {
                console.error("Failed to create chat for pending chat");
                return;
              }
            } catch (err) {
              console.error("Error creating chat:", err);
              return;
            }
          }

          if (!chatId) {
            appendMessage(chatId, localMessage);
            updateRecentChat(
              chatId,
              localMessage.content || "Attachment",
              Boolean(
                localMessage.attachments && localMessage.attachments.length
              ),
              {
                attachmentFileName:
                  localMessage.attachments &&
                  localMessage.attachments[0]?.fileName,
                attachmentMime:
                  localMessage.attachments &&
                  localMessage.attachments[0]?.mimeType,
              }
            );
            return;
          }

          try {
            const bodyObj = {
              content: payload.text || "",
              chatId,
              attachments: payload.attachments,
              type: payload.type,
              repliedTo: selectedReplies || [],
            };
            if (
              payload.mentions &&
              Array.isArray(payload.mentions) &&
              payload.mentions.length
            ) {
              bodyObj.mentions = payload.mentions;
            }
            if (payload.isScheduled) {
              bodyObj.isScheduled = true;
              if (payload.scheduledFor)
                bodyObj.scheduledFor = payload.scheduledFor;
            }
            const res = await fetch(`${API_BASE_URL}/api/message`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(bodyObj),
            });

            if (!res.ok)
              throw new Error("Failed to send message with attachments");

            const resJson = await res.json();
            const sent = resJson && resJson.message ? resJson.message : resJson;

            if (resJson && resJson.chat) {
              const newChat = resJson.chat;
              chatId = String(newChat._id || newChat.id || chatId);
              setSelectedContact((prev) => ({
                ...prev,
                chatId: chatId,
                id: chatId,
                isPendingChat: false,
                participants:
                  newChat.users ||
                  newChat.participants ||
                  prev?.participants ||
                  [],
              }));

              setMessages((prev) => {
                const copy = { ...prev };
                const possibleKeys = [null, undefined, "null", "undefined", ""];
                possibleKeys.forEach((k) => {
                  if (copy[k]) {
                    if (!copy[chatId]) copy[chatId] = [];
                    copy[chatId] = [...copy[chatId], ...copy[k]];
                    delete copy[k];
                  }
                });
                return copy;
              });

              setRecentChats((prev) =>
                prev.map((c) => {
                  if (
                    !c.id ||
                    String(c.id) === String(selectedContact?.id) ||
                    String(c.chatId) === String(selectedContact?.chatId)
                  ) {
                    return { ...c, id: chatId, chatId };
                  }
                  return c;
                })
              );
            }

            // If this message is scheduled, do not append it to the UI now;
            // the backend cron will emit the message when it's due.
            if (sent && sent.isScheduled) {
              console.log(
                "[send] scheduled attachment message saved, will be delivered later:",
                sent._id || sent.id
              );
              return;
            }

            const formatted = {
              id: sent._id || sent.id || Date.now(),
              type: sent.type || payload.type || "file",
              content: sent.content || sent.text || payload.text || "",
              sender: sent.sender?._id || sent.sender || "me",
              timestamp: new Date(
                sent.timestamp ||
                  sent.scheduledFor ||
                  sent.createdAt ||
                  Date.now()
              ).getTime(),
              status: sent.status || (sent.isRead ? "read" : "sent"),
              attachments: sent.attachments || payload.attachments,
              repliedTo:
                sent.repliedTo || selectedReplies || payload.repliedTo || [],
            };

            appendMessage(chatId, formatted);
            onClearReplySelection && onClearReplySelection();

            if (socketRef.current?.emit) {
              lastSentAtRef.current = Date.now();
              socketRef.current.emit("new message", sent);
              // suppression removed
            }

            const preview =
              formatted.content ||
              (formatted.attachments && formatted.attachments[0]?.fileName) ||
              "Attachment";
            updateRecentChat(
              chatId,
              preview,
              Boolean(formatted.attachments && formatted.attachments.length),
              {
                attachmentFileName:
                  (formatted.attachments &&
                    formatted.attachments[0]?.fileName) ||
                  undefined,
                attachmentMime:
                  (formatted.attachments &&
                    formatted.attachments[0]?.mimeType) ||
                  undefined,
              }
            );
            updateContactPreview(
              chatId,
              preview,
              Boolean(formatted.attachments && formatted.attachments.length),
              {
                attachmentFileName:
                  (formatted.attachments &&
                    formatted.attachments[0]?.fileName) ||
                  undefined,
                attachmentMime:
                  (formatted.attachments &&
                    formatted.attachments[0]?.mimeType) ||
                  undefined,
              }
            );
          } catch (err) {
            console.error("Error sending attachment message:", err);
          }
        })();

        return;
      }

      // Case 3: Text message
      if (typeof payload === "string") {
        const messageText = payload.trim();
        if (!messageText) return;

        (async () => {
          const token =
            localStorage.getItem("token") ||
            localStorage.getItem("chasmos_auth_token");
          let chatId = getChatId(payload);

          const localMessage = {
            id: Date.now(),
            type: "text",
            content: messageText,
            sender: "me",
            timestamp: Date.now(),
            status: "sent",
          };

          if (!token) {
            appendMessage(chatId, localMessage);
            return;
          }

          // If this is an accepted request without a chat, create the chat first
          if (selectedContact?.isAcceptedRequest && !chatId) {
            try {
              const userId =
                selectedContact.userId ||
                selectedContact._id ||
                selectedContact.email;
              const createChatRes = await fetch(`${API_BASE_URL}/api/chat`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId }),
              });

              if (createChatRes.ok) {
                const chatObj = await createChatRes.json();
                chatId = String(chatObj._id || chatObj.id);

                // Update the selected contact with the new chat ID
                setSelectedContact((prev) => ({
                  ...prev,
                  chatId: chatId,
                  id: chatId,
                  isAcceptedRequest: false,
                  participants: chatObj.users || chatObj.participants || [],
                }));

                console.log("Chat created for accepted request:", chatId);
              } else {
                console.error("Failed to create chat for accepted request");
                return;
              }
            } catch (err) {
              console.error("Error creating chat:", err);
              return;
            }
          }

          if (!chatId) {
            appendMessage(chatId, localMessage);
            return;
          }

          try {
            const res = await fetch(`${API_BASE_URL}/api/message`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                content: messageText,
                chatId,
                repliedTo: selectedReplies || [],
              }),
            });

            if (!res.ok) throw new Error("Failed to send message");

            const resJson = await res.json();
            const sent = resJson && resJson.message ? resJson.message : resJson;

            if (resJson && resJson.chat) {
              const newChat = resJson.chat;
              chatId = String(newChat._id || newChat.id || chatId);
              setSelectedContact((prev) => ({
                ...prev,
                chatId: chatId,
                id: chatId,
                isAcceptedRequest: false,
                participants:
                  newChat.users ||
                  newChat.participants ||
                  prev?.participants ||
                  [],
              }));

              setMessages((prev) => {
                const copy = { ...prev };
                const possibleKeys = [null, undefined, "null", "undefined", ""];
                possibleKeys.forEach((k) => {
                  if (copy[k]) {
                    if (!copy[chatId]) copy[chatId] = [];
                    copy[chatId] = [...copy[chatId], ...copy[k]];
                    delete copy[k];
                  }
                });
                return copy;
              });

              setRecentChats((prev) =>
                prev.map((c) => {
                  if (
                    !c.id ||
                    String(c.id) === String(selectedContact?.id) ||
                    String(c.chatId) === String(selectedContact?.chatId)
                  ) {
                    return { ...c, id: chatId, chatId };
                  }
                  return c;
                })
              );
            }

            const formatted = {
              id: sent._id || sent.id || Date.now(),
              type: "text",
              content: sent.content || sent.text || messageText,
              sender: sent.sender?._id || sent.sender || "me",
              timestamp: new Date(
                sent.timestamp ||
                  sent.scheduledFor ||
                  sent.createdAt ||
                  Date.now()
              ).getTime(),
              status: sent.status || (sent.isRead ? "read" : "sent"),
              repliedTo: sent.repliedTo || selectedReplies || [],
            };

            appendMessage(chatId, formatted);
            onClearReplySelection && onClearReplySelection();
            if (socketRef.current?.emit) {
              lastSentAtRef.current = Date.now();
              socketRef.current.emit("new message", sent);
              // suppression removed
            }

            updateRecentChat(chatId, messageText, false);
            updateContactPreview(chatId, messageText, false);
          } catch (err) {
            console.error("Error sending message:", err);
          }
        })();
      }

      // Case 4: Poll message
      if (
        typeof payload === "object" &&
        payload.type === "poll" &&
        payload.pollId
      ) {
        (async () => {
          const token =
            localStorage.getItem("token") ||
            localStorage.getItem("chasmos_auth_token");
          let chatId = getChatId(payload);

          const localMessage = {
            id: Date.now(),
            type: "poll",
            content: payload.content || "📊 Poll",
            sender: "me",
            timestamp: Date.now(),
            status: "sent",
            poll: null, // Will be populated from server
          };

          if (!token) {
            appendMessage(chatId, localMessage);
            return;
          }

          if (!chatId) {
            appendMessage(chatId, localMessage);
            return;
          }

          try {
            // Create a message with poll reference
            const bodyObj = {
              content: payload.content || "📊 Poll",
              chatId,
              type: "poll",
              poll: payload.pollId,
            };
            if (
              payload.mentions &&
              Array.isArray(payload.mentions) &&
              payload.mentions.length
            ) {
              bodyObj.mentions = payload.mentions;
            }
            if (payload.isScheduled) {
              bodyObj.isScheduled = true;
              if (payload.scheduledFor)
                bodyObj.scheduledFor = payload.scheduledFor;
            }
            const res = await fetch(`${API_BASE_URL}/api/message`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(bodyObj),
            });

            if (!res.ok) throw new Error("Failed to send poll message");

            const sent = await res.json();

            // Fetch full poll details
            const pollRes = await fetch(
              `${API_BASE_URL}/api/poll/${payload.pollId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            let fullPoll = null;
            if (pollRes.ok) {
              fullPoll = await pollRes.json();
            }

            const formatted = {
              id: sent._id || sent.id || Date.now(),
              type: "poll",
              content: sent.content || payload.content || "📊 Poll",
              sender: sent.sender?._id || sent.sender || "me",
              timestamp: new Date(
                sent.timestamp ||
                  sent.scheduledFor ||
                  sent.createdAt ||
                  Date.now()
              ).getTime(),
              status: sent.status || (sent.isRead ? "read" : "sent"),
              poll: fullPoll,
              repliedTo:
                sent.repliedTo || selectedReplies || payload.repliedTo || [],
            };

            appendMessage(chatId, formatted);

            if (socketRef.current?.emit) {
              lastSentAtRef.current = Date.now();
              socketRef.current.emit("new message", sent);
              // suppression removed
            }

            updateRecentChat(chatId, payload.content || "📊 Poll", false);
            updateContactPreview(chatId, payload.content || "📊 Poll", false);
          } catch (err) {
            console.error("Error sending poll message:", err);
          }
        })();

        return;
      }
    },
    [selectedContact, selectedReplies, onClearReplySelection, archivedChatIds]
  );

  // Initialize socket connection once
  useEffect(() => {
    // Always disconnect previous socket to avoid duplicate listeners
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    const userData = JSON.parse(
      localStorage.getItem("chasmos_user_data") || "{}"
    );
    const savedToken =
      localStorage.getItem("token") || (userData && userData.token) || "";
    const socket = io(API_BASE_URL, {
      transports: ["websocket"],
      withCredentials: true,
      auth: { token: savedToken },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      try {
        console.log("[SOCKET OUT] connect -> emitting setup", {
          userData,
          socketId: socket.id,
          token: savedToken ? "***REDACTED***" : null,
        });
      } catch (e) {}
      socket.emit("setup", userData);
      setSocketConnected(true);
      console.log("[SOCKET] Connected to server", { id: socket.id });
    });

    socket.on("connected", (payload) => {
      try {
        console.log("[SOCKET IN] connected ack payload:", payload);
      } catch (e) {}
      setSocketConnected(true);
    });

    // initial online users list
    socket.on("online users", (arr) => {
      try {
        const s = new Set((arr || []).map((a) => String(a)));
        setOnlineUsers(s);

        // Immediately update presence flags on recent chats and contacts
        try {
          setRecentChats((prev) => {
            if (!prev) return prev;
            return prev.map((c) => {
              const copy = { ...c };
              const isGroup =
                copy.isGroup || copy.isGroupChat || copy.isgroupchat;
              if (isGroup) {
                const chatIdKey = copy.chatId || copy._id || copy.id || "";
                let count = 0;
                if (
                  groupOnlineCounts &&
                  typeof groupOnlineCounts[String(chatIdKey)] !== "undefined"
                ) {
                  const raw = Number(groupOnlineCounts[String(chatIdKey)] || 0);
                  count = Math.max(0, raw - 1);
                } else if (
                  copy.group &&
                  ((Array.isArray(copy.group.participants) &&
                    copy.group.participants.length > 0) ||
                    (Array.isArray(copy.group.users) &&
                      copy.group.users.length > 0))
                ) {
                  const members =
                    copy.group?.participants || copy.group?.users || [];
                  count = (members || []).filter((m) => {
                    const uid = m && (m._id || m.id || m);
                    if (!uid) return false;
                    if (String(uid) === String(currentUserId)) return false;
                    return s.has(String(uid));
                  }).length;
                } else {
                  // No authoritative group members available and no server count — treat as offline until authoritative data arrives
                  count = 0;
                }
                copy.__computedGroupOnlineCount = count;
                copy.isOnline = count > 0;
              } else {
                // Support multiple shapes: userId, otherUser, participants, participants[0]
                const candidateIds = [];
                if (copy.userId) candidateIds.push(String(copy.userId));
                if (copy.user_id) candidateIds.push(String(copy.user_id));
                if (copy._id) candidateIds.push(String(copy._id));
                if (copy.id) candidateIds.push(String(copy.id));
                if (copy.participantId)
                  candidateIds.push(String(copy.participantId));
                if (copy.otherUser) {
                  if (copy.otherUser.id)
                    candidateIds.push(String(copy.otherUser.id));
                  if (copy.otherUser._id)
                    candidateIds.push(String(copy.otherUser._id));
                }
                if (
                  Array.isArray(copy.participants) &&
                  copy.participants.length
                ) {
                  const p = copy.participants[0];
                  if (p && (p._id || p.id))
                    candidateIds.push(String(p._id || p.id));
                }
                // Deduplicate
                const uniq = Array.from(new Set(candidateIds.filter(Boolean)));
                const foundOnline = uniq.some((id) => s.has(String(id)));
                copy.isOnline = foundOnline || Boolean(copy.isOnline);
              }
              return copy;
            });
          });

          setContacts((prev) => {
            if (!prev) return prev;
            return prev.map((c) => {
              const copy = { ...c };
              const isGroup =
                copy.isGroup || copy.isGroupChat || copy.isgroupchat;
              if (isGroup) {
                const members =
                  copy.group?.participants ||
                  copy.group?.users ||
                  copy.users ||
                  copy.participants ||
                  [];
                const count = (members || []).filter((m) => {
                  const uid = m && (m._id || m.id || m);
                  if (!uid) return false;
                  if (String(uid) === String(currentUserId)) return false;
                  return s.has(String(uid));
                }).length;
                copy.__computedGroupOnlineCount = count;
                copy.isOnline = count > 0;
              } else {
                const candidateIds = [];
                if (copy.userId) candidateIds.push(String(copy.userId));
                if (copy.user_id) candidateIds.push(String(copy.user_id));
                if (copy._id) candidateIds.push(String(copy._id));
                if (copy.id) candidateIds.push(String(copy.id));
                if (copy.participantId)
                  candidateIds.push(String(copy.participantId));
                if (copy.otherUser) {
                  if (copy.otherUser.id)
                    candidateIds.push(String(copy.otherUser.id));
                  if (copy.otherUser._id)
                    candidateIds.push(String(copy.otherUser._id));
                }
                if (
                  Array.isArray(copy.participants) &&
                  copy.participants.length
                ) {
                  const p = copy.participants[0];
                  if (p && (p._id || p.id))
                    candidateIds.push(String(p._id || p.id));
                }
                const uniq = Array.from(new Set(candidateIds.filter(Boolean)));
                const foundOnline = uniq.some((id) => s.has(String(id)));
                copy.isOnline = foundOnline || Boolean(copy.isOnline);
              }
              return copy;
            });
          });
        } catch (e) {
          // non-fatal
        }
      } catch (e) {}
    });

    socket.on("user online", ({ userId }) => {
      try {
        setOnlineUsers((prev) => {
          const s = new Set(prev);
          s.add(String(userId));
          return s;
        });
      } catch (e) {}
    });

    socket.on("user offline", ({ userId }) => {
      try {
        setOnlineUsers((prev) => {
          const s = new Set(prev);
          s.delete(String(userId));
          return s;
        });
      } catch (e) {}
    });

    // Per-chat online counts emitted by server
    socket.on("group online count", ({ chatId, onlineCount }) => {
      try {
        if (!chatId) return;
        setGroupOnlineCounts((prev) => ({
          ...(prev || {}),
          [String(chatId)]: Number(onlineCount || 0),
        }));
      } catch (e) {
        console.error("Error handling group online count", e);
      }
    });

    // General debug: log any incoming socket events (helps diagnose missing listeners)
    if (socket.onAny) {
      socket.onAny((event, payload) => {
        console.log("[SOCKET ANY]", event, payload);
      });
    }

    // Listen for delivery/read updates from server
    socket.on("message-delivered", (payload) => {
      try {
        console.log("[SOCKET IN] message-delivered", payload);
        // Ignore delivery events that arrive immediately after we sent a message
        try {
          const now = Date.now();
          const delta = lastSentAtRef.current
            ? now - lastSentAtRef.current
            : null;
          // Only suppress very short-lived echoes from the server — reduce window
          if (lastSentAtRef.current && delta !== null && delta < 300) {
            console.log(
              "[SOCKET IN] Ignoring message-delivered due to very recent local send (delta ms):",
              delta
            );
            return;
          }
        } catch (e) {
          // continue if guard check fails
        }
        // Support two payload shapes:
        // 1) { messageId, chatId, deliveredBy, updatedDeliveredBy }
        // 2) { delivered: [ { messageId, deliveredBy, chatId? } ] }
        if (!payload) return;
        const handleMark = (msgEntry) => {
          const mid = String(
            msgEntry && (msgEntry.messageId || msgEntry.message_id || "")
          );
          const chatId = String(
            msgEntry && (msgEntry.chatId || payload.chatId || "")
          );
          // (suppression removed) continue processing delivered update
          if (!mid) return;
          const key = String(chatId || "");
          setMessages((prev) => {
            const copy = { ...(prev || {}) };
            // If expected chat bucket exists, try updating there first
            if (copy[key]) {
              let found = false;
              copy[key] = copy[key].map((m) => {
                const midCandidates = [m.id, m._id].map((x) =>
                  x === undefined || x === null ? "" : String(x)
                );
                const matches = midCandidates.includes(mid);
                if (!matches) return m;
                found = true;
                try {
                  // Use server-provided status if present, otherwise fallback to 'delivered'
                  const serverStatus =
                    (msgEntry && msgEntry.status) ||
                    (payload && payload.status) ||
                    "delivered";
                  return { ...m, status: serverStatus };
                } catch (e) {
                  return m;
                }
              });
              if (found) return copy;
            }

            // Fallback: scan all chats and update any message matching this id
            for (const k of Object.keys(copy)) {
              copy[k] = copy[k].map((m) => {
                const midCandidates = [m.id, m._id].map((x) =>
                  x === undefined || x === null ? "" : String(x)
                );
                const matches = midCandidates.includes(mid);
                if (!matches) return m;
                try {
                  const serverStatus =
                    (msgEntry && msgEntry.status) ||
                    (payload && payload.status) ||
                    "delivered";
                  return { ...m, status: serverStatus };
                } catch (e) {
                  return m;
                }
              });
            }
            return copy;
          });
        };

        if (Array.isArray(payload.delivered) && payload.delivered.length) {
          payload.delivered.forEach(handleMark);
          try {
            console.log(
              "[SOCKET IN] message-delivered applied delivered array count:",
              payload.delivered.length
            );
          } catch (e) {}
        } else if (payload.messageId) {
          handleMark(payload);
          try {
            console.log(
              "[SOCKET IN] message-delivered applied single messageId:",
              payload.messageId || payload.message_id
            );
          } catch (e) {}
        } else {
          try {
            console.log(
              "[SOCKET IN] message-delivered received unknown payload shape:",
              payload
            );
          } catch (e) {}
        }
      } catch (e) {
        console.error("Error handling message-delivered", e);
      }
    });

    socket.on("message-read", (payload) => {
      try {
        console.log("[SOCKET IN] message-read", payload);
        // Ignore message-read events that arrive immediately after we sent a message
        // This avoids server echoes that incorrectly mark local messages as read.
        try {
          const now = Date.now();
          const delta = lastSentAtRef.current
            ? now - lastSentAtRef.current
            : null;
          console.log(
            "[SOCKET IN] message-read received — lastSentDelta(ms):",
            delta,
            "payload:",
            payload
          );
          // Ignore message-read events that arrive very shortly after we sent a message
          // Only suppress very short-lived echoes from the server — reduce window
          if (lastSentAtRef.current && delta !== null && delta < 300) {
            console.log(
              "[SOCKET IN] Ignoring message-read due to very recent local send (delta ms):",
              delta
            );
            return;
          }
        } catch (e) {
          console.error(
            "Error checking lastSentAtRef in message-read handler",
            e
          );
        }
        const { chatId, updatedIds, reader } = payload || {};
        const key = String(chatId || (payload && payload.chatId) || "");
        // If we recently sent a message to this chat, ignore immediate read updates (likely echoes)
        // (suppression removed) continue processing read update
        setMessages((prev) => {
          const copy = { ...(prev || {}) };
          if (!copy[key]) return prev;
          const serverStatus = (payload && payload.status) || "read";

          if (Array.isArray(updatedIds) && updatedIds.length) {
            const updatedSet = new Set(
              (updatedIds || []).map((u) => String(u))
            );
            copy[key] = copy[key].map((m) => {
              const midCandidates = [m.id, m._id].map((x) =>
                x === undefined || x === null ? "" : String(x)
              );
              const matches = midCandidates.some((cid) => updatedSet.has(cid));
              if (!matches) return m;
              return { ...m, status: serverStatus };
            });
          } else if (reader) {
            // No explicit IDs provided: mark messages that are already delivered (or sent) as read,
            // but only for messages sent by the current user (so group reads don't flip other people's messages).
            copy[key] = copy[key].map((m) => {
              try {
                // Only upgrade messages that are not already 'read' and were sent by current user
                const msgSender =
                  m?.sender?._id || m?.sender || m?.sender?.id || null;
                if (!msgSender) return m;
                if (String(msgSender) !== String(currentUserId)) return m;
                if (m.status === "read") return m;
                if (m.status === "delivered" || m.status === "sent") {
                  return { ...m, status: serverStatus };
                }
                return m;
              } catch (e) {
                return m;
              }
            });
            try {
              console.log(
                "[SOCKET IN] message-read applied reader update for chat",
                key
              );
            } catch (e) {}
          } else {
            // Unknown payload shape: do not change messages
            return prev;
          }
          return copy;
        });
        try {
          console.log(
            "[SOCKET IN] message-read processed for chat",
            key,
            "updatedIds:",
            Array.isArray(updatedIds) ? updatedIds.length : "n/a",
            "reader:",
            Boolean(reader)
          );
        } catch (e) {}

        // If server indicates some messages reached full-read (updatedIds) or a reader is present,
        // clear recentChats unreadCount for that chat so UI doesn't show stale unread badges.
        try {
          if ((Array.isArray(updatedIds) && updatedIds.length) || reader) {
            setRecentChats((prev) =>
              (prev || []).map((c) => {
                const id = c.chatId || c.id || c._id;
                if (String(id) === String(key)) {
                  return { ...c, unreadCount: 0 };
                }
                return c;
              })
            );
          }
        } catch (e) {
          console.error(
            "Error clearing recentChats unreadCount after message-read",
            e
          );
        }
      } catch (e) {
        console.error("Error handling message-read", e);
      }
    });

    // Typing indicators (payload: { chatId, user: { _id, name, avatar } })
    socket.on("typing", (payload) => {
      try {
        console.log("[SOCKET] typing payload received (frontend):", payload);
        if (!payload) return;
        const chatId = payload.chatId || payload.room || payload.chat || null;
        const user = payload.user || null;
        if (!chatId) return;

        setIsTyping((prev) => ({
          ...(prev || {}),
          [String(chatId)]: user || true,
        }));

        setRecentChats((prev) => {
          if (!prev) return prev;
          return prev.map((c) => {
            const id = c.chatId || c._id || c.id;
            if (id && String(id) === String(chatId)) {
              return { ...c, isTyping: true, typingUser: user };
            }
            return c;
          });
        });
      } catch (e) {
        console.error("Error handling typing event", e);
      }
    });

    socket.on("stop typing", (payload) => {
      try {
        if (!payload) return;
        const chatId = payload.chatId || payload.room || payload.chat || null;
        if (!chatId) return;

        setIsTyping((prev) => {
          const copy = { ...(prev || {}) };
          delete copy[String(chatId)];
          return copy;
        });

        setRecentChats((prev) => {
          if (!prev) return prev;
          return prev.map((c) => {
            const id = c.chatId || c._id || c.id;
            if (id && String(id) === String(chatId)) {
              const copy = { ...c };
              copy.isTyping = false;
              delete copy.typingUser;
              return copy;
            }
            return c;
          });
        });
      } catch (e) {
        console.error("Error handling stop typing event", e);
      }
    });

    // When the current user was specifically added to an existing group
    socket.on("added to group", (group) => {
      try {
        if (!group) return;
        console.log(
          "[SOCKET] added to group event received",
          group && (group.chatId || group._id || group.id || group.chat)
        );

        // Simply append the received group/chat to contacts and recentChats
        const rawId = group.chatId || group.chat || group._id || group.id;
        let chatId = "";
        if (rawId) {
          if (typeof rawId === "string" || typeof rawId === "number")
            chatId = String(rawId).trim();
          else if (typeof rawId === "object")
            chatId = String(rawId._id || rawId.id || rawId.chatId || "").trim();
        }
        if (!chatId) {
          console.warn(
            "[SOCKET] added to group - computed chatId is empty, payload:",
            group
          );
          return;
        }
        console.log("[SOCKET] added to group - computed chatId:", chatId);

        const name = group.chatName || group.name || group.groupName || "Group";
        const avatar =
          (group.groupSettings && group.groupSettings.avatar) ||
          group.avatar ||
          group.icon ||
          "";
        const participants = group.participants || group.users || [];

        const contactEntry = {
          id: chatId,
          chatId,
          name,
          avatar,
          participants,
          isGroup: true,
          isGroupChat: true,
        };

        setContacts((prev) => {
          const list = prev || [];
          // Prepend then dedupe by chat id to avoid duplicates from concurrent events
          const merged = [contactEntry, ...list];
          const seen = new Set();
          const deduped = [];
          for (const it of merged) {
            const idStr = String(it?.chatId || it?.id || it?._id || "").trim();
            if (!idStr) continue;
            if (seen.has(idStr)) continue;
            seen.add(idStr);
            deduped.push(it);
          }
          try {
            console.log(
              "[SOCKET] added to group - contacts deduped count",
              deduped.length,
              "topId=",
              deduped[0] &&
                (deduped[0].chatId || deduped[0].id || deduped[0]._id)
            );
          } catch (e) {}
          return deduped;
        });

        setRecentChats((prev) => {
          const list = prev || [];
          const entry = {
            id: chatId,
            chatId,
            name,
            avatar,
            lastMessage: "",
            timestamp: Date.now(),
            isGroupChat: true,
            users: participants,
            participants,
          };
          const merged = [entry, ...list];
          const seen = new Set();
          const deduped = [];
          for (const it of merged) {
            const idStr = String(it?.chatId || it?.id || it?._id || "").trim();
            if (!idStr) continue;
            if (seen.has(idStr)) continue;
            seen.add(idStr);
            deduped.push(it);
          }
          try {
            console.log(
              "[SOCKET] added to group - recentChats deduped count",
              deduped.length,
              "topId=",
              deduped[0] &&
                (deduped[0].chatId || deduped[0].id || deduped[0]._id)
            );
          } catch (e) {}
          return deduped;
        });

        // Ensure messages map exists and join room
        setMessages((prev) => ({
          ...(prev || {}),
          [chatId]: prev?.[chatId] || [],
        }));
        try {
          if (socketRef.current && socketRef.current.emit)
            socketRef.current.emit("join chat", chatId);
        } catch (e) {}
      } catch (e) {
        console.error("Error handling added to group socket event", e);
      }
    });

    // Fallback event for when server skipped the main 'added to group' emit
    socket.on("addedtogroup2", (group) => {
      try {
        if (!group) return;
        const chatId = String(
          group.chatId ||
            group.chat ||
            group.groupId ||
            group._id ||
            group.id ||
            ""
        ).trim();
        if (!chatId) return;
        console.log("[SOCKET] addedtogroup2 received for chat", chatId);

        // Mark selected as not-left so MessageInput will render
        setSelectedHasLeftGroup(false);

        // If the selected contact is this chat, update its participants to include current user
        setSelectedContact((prev) => {
          try {
            if (!prev) return prev;
            const ids = [
              prev.chatId,
              prev.id,
              prev._id,
              prev.group && prev.group._id,
            ]
              .map((x) => (x ? String(x) : ""))
              .map((x) => x.trim());
            if (!ids.includes(chatId)) return prev;
            const members =
              prev.users ||
              prev.participants ||
              (prev.group && (prev.group.participants || prev.group.users)) ||
              (prev.chat && (prev.chat.participants || prev.chat.users)) ||
              [];
            const already = (members || []).some((m) => {
              const uid = m && (m._id || m.id || m);
              return uid && String(uid) === String(currentUserId);
            });
            if (already) return prev;
            const newMembers = [...(members || []), currentUserId];
            const out = { ...prev };
            if (prev.participants) out.participants = newMembers;
            else if (prev.users) out.users = newMembers;
            else if (out.group)
              out.group = { ...out.group, participants: newMembers };
            else if (out.chat)
              out.chat = { ...out.chat, participants: newMembers };
            else out.participants = newMembers;
            return out;
          } catch (e) {
            console.error("addedtogroup2: failed to update selectedContact", e);
            return prev;
          }
        });

        // Update recentChats and contacts to reflect new membership when possible
        try {
          setRecentChats((prev) =>
            (prev || []).map((c) =>
              String(c.chatId || c.id || c._id) === chatId
                ? {
                    ...c,
                    participants:
                      group.participants || group.users
                        ? group.participants || group.users
                        : (c.participants || []).concat(currentUserId),
                  }
                : c
            )
          );
          setContacts((prev) =>
            (prev || []).map((c) =>
              String(c.chatId || c.id || c._id) === chatId
                ? {
                    ...c,
                    participants:
                      group.participants || group.users
                        ? group.participants || group.users
                        : (c.participants || []).concat(currentUserId),
                  }
                : c
            )
          );
        } catch (e) {
          console.error(
            "addedtogroup2: failed to update recentChats/contacts",
            e
          );
        }

        // Ensure messages map exists and join room
        setMessages((prev) => ({
          ...(prev || {}),
          [chatId]: prev?.[chatId] || [],
        }));
        try {
          if (socketRef.current && socketRef.current.emit)
            socketRef.current.emit("join chat", chatId);
        } catch (e) {}
      } catch (e) {
        console.error("Error handling addedtogroup2", e);
      }
    });

    // When the current user was removed from a group (or left), update UI immediately
    socket.on("removed from group", (payload) => {
      try {
        if (!payload) return;
        const chatId = String(
          payload.chatId ||
            payload.chat ||
            payload.groupId ||
            payload._id ||
            payload.id ||
            ""
        ).trim();
        if (!chatId) return;
        console.log("[SOCKET] removed from group event received", {
          chatId,
          payload,
        });

        // If the selected contact is this chat, update its participants to remove current user
        const _local = JSON.parse(
          localStorage.getItem("chasmos_user_data") || "{}"
        );
        const currentUserIdLocal =
          _local._id || _local.id || _local.userId || null;

        setSelectedContact((prev) => {
          if (!prev) return prev;
          const ids = [prev.chatId, prev.id, prev._id]
            .map((x) => (x ? String(x) : ""))
            .map((x) => x.trim());
          if (!ids.includes(chatId)) return prev;
          const clone = { ...prev };
          const filterIds = (arr) =>
            Array.isArray(arr)
              ? arr.filter(
                  (a) =>
                    String(a && (a._id || a.id || a)) !==
                    String(currentUserIdLocal)
                )
              : arr;
          clone.users = filterIds(clone.users || clone.participants || []);
          clone.participants = clone.users;
          return clone;
        });

        // Mark selected as left so MessageInput is not shown
        setSelectedHasLeftGroup(true);

        // Update recentChats and contacts to reflect removal (update participants array)
        setRecentChats((prev) =>
          (prev || []).map((c) =>
            String(c.chatId || c.id || c._id) === chatId
              ? {
                  ...c,
                  participants:
                    payload.group && payload.group.participants
                      ? payload.group.participants
                      : (c.participants || []).filter(
                          (pid) => String(pid) !== String(currentUserIdLocal)
                        ),
                }
              : c
          )
        );
        setContacts((prev) =>
          (prev || []).map((c) =>
            String(c.chatId || c.id || c._id) === chatId
              ? {
                  ...c,
                  participants:
                    payload.group && payload.group.participants
                      ? payload.group.participants
                      : (c.participants || []).filter(
                          (pid) => String(pid) !== String(currentUserIdLocal)
                        ),
                }
              : c
          )
        );

        // Ensure messages map remains but don't allow sending (UI will hide MessageInput)
        setMessages((prev) => ({
          ...(prev || {}),
          [chatId]: prev?.[chatId] || [],
        }));
      } catch (e) {
        console.error("Error handling removed from group event", e);
      }
    });

    // When group info (name/avatar) is updated, sync to all UI components
    socket.on('group info updated', (payload) => {
      try {
        if (!payload) return;
        const chatId = String(payload.chatId || payload.groupId || '').trim();
        if (!chatId) return;
        console.log('[SOCKET] group info updated event received', payload);

        const { name, avatar } = payload;

        // Update recentChats
        setRecentChats(prev => (prev || []).map(c => {
          const id = String(c.chatId || c.id || c._id);
          if (id === chatId) {
            return { ...c, name: name || c.name, avatar: avatar || c.avatar };
          }
          return c;
        }));

        // Update contacts
        setContacts(prev => (prev || []).map(c => {
          const id = String(c.chatId || c.id || c._id);
          if (id === chatId) {
            return { ...c, name: name || c.name, avatar: avatar || c.avatar };
          }
          return c;
        }));

        // Update selectedContact if it's the current chat
        if (selectedContact && String(selectedContact.chatId || selectedContact.id || selectedContact._id) === chatId) {
          setSelectedContact(prev => ({ ...(prev || {}), name: name || prev?.name, avatar: avatar || prev?.avatar }));
        }

        // Update currentGroup if modal is open for this group
        if (currentGroup && String(currentGroup.chatId || currentGroup._id || currentGroup.id) === chatId) {
          setCurrentGroup(prev => ({ ...(prev || {}), name: name || prev?.name, avatar: avatar || prev?.avatar }));
        }
      } catch (e) {
        console.error('Error handling group info updated event', e);
      }
    });
    
    socket.on('message recieved', (newMessage) => {
      try {
        const chatId = newMessage.chat?._id || newMessage.chat;
        const senderId = newMessage.sender?._id || newMessage.sender;
        const isFromMe = String(senderId) === String(currentUserId);
        const key = String(chatId || senderId);
        const attachments = Array.isArray(newMessage.attachments)
          ? newMessage.attachments
          : [];
        const inferredType =
          newMessage.type ||
          (attachments.length
            ? attachments[0].mimeType &&
              attachments[0].mimeType.startsWith("image/")
              ? "image"
              : attachments[0].mimeType &&
                  attachments[0].mimeType.startsWith("video/")
                ? "video"
                : "file"
            : "text");
        const normalizeSender = (s) => {
          if (!s) return s;
          if (typeof s === "object") return s;
          return s; // leave string id as-is
        };

        const normalizedRepliedTo = (newMessage.repliedTo || []).map((r) => {
          if (!r) return r;
          // if replied item already has populated sender object, keep it
          if (r.sender && typeof r.sender === "object") return r;
          // otherwise keep the item as-is (server should populate when possible)
          return r;
        });

        const formatted = {
          id: newMessage._id || newMessage.id || Date.now(),
          type: inferredType,
          content: newMessage.content || newMessage.text || "",
          // preserve populated sender object when present (don't collapse to id)
          sender:
            newMessage.sender && typeof newMessage.sender === "object"
              ? newMessage.sender
              : newMessage.sender?._id || newMessage.sender,
          // prefer server-provided normalized timestamp, then scheduledFor, then createdAt
          timestamp: newMessage.timestamp
            ? new Date(newMessage.timestamp).getTime()
            : newMessage.scheduledFor
              ? new Date(newMessage.scheduledFor).getTime()
              : new Date(newMessage.createdAt || Date.now()).getTime(),
          // message status: prefer server-provided `status`, fallback to legacy `isRead`
          status: newMessage.status || (newMessage.isRead ? "read" : "sent"),
          attachments: attachments,
          isSystemMessage: newMessage.type === "system",
          poll: newMessage.poll || null,
          repliedTo: normalizedRepliedTo,
        };

        // Determine sender info for notifications
        const senderName =
          newMessage.sender && typeof newMessage.sender === "object"
            ? newMessage.sender.name || newMessage.sender.username || "Someone"
            : "Someone";

        const senderAvatar =
          newMessage.sender && typeof newMessage.sender === "object"
            ? newMessage.sender.pic || newMessage.sender.avatar
            : null;

        const messageText =
          formatted.content ||
          (formatted.attachments && formatted.attachments.length
            ? `📎 ${formatted.attachments[0]?.fileName || "Attachment"}`
            : "New message");

        // Check if message is for current open chat (robust match across possible id fields)
        const selectedIds = [];
        if (selectedContact) {
          if (selectedContact.id) selectedIds.push(String(selectedContact.id));
          if (selectedContact.chatId)
            selectedIds.push(String(selectedContact.chatId));
          if (selectedContact._id)
            selectedIds.push(String(selectedContact._id));
          if (selectedContact.groupId)
            selectedIds.push(String(selectedContact.groupId));
          if (selectedContact.group && selectedContact.group._id)
            selectedIds.push(String(selectedContact.group._id));
        }
        const messageChatIds = [];
        if (newMessage.chat) {
          if (typeof newMessage.chat === "string")
            messageChatIds.push(String(newMessage.chat));
          else if (newMessage.chat._id)
            messageChatIds.push(String(newMessage.chat._id));
          else if (newMessage.chat.id)
            messageChatIds.push(String(newMessage.chat.id));
        }
        // also include computed key for comparison
        if (key) messageChatIds.push(String(key));

        const isCurrentChat =
          selectedContact &&
          messageChatIds.some((id) => selectedIds.includes(id));

        console.log("🔍 Notification check:", {
          isCurrentChat,
          selectedContactId: selectedContact?.id,
          selectedContactChatId: selectedContact?.chatId,
          messageKey: key,
          willShowNotification: !isCurrentChat,
          isSystemMessage: newMessage.type === 'system'
        });

        // Show notifications when chat is not currently open (skip system messages)
        if (!isCurrentChat && newMessage.type !== 'system') {
          console.log('🧪 INSIDE !isCurrentChat block - notification code SHOULD run');
          
          // Check notification settings
          const notificationsEnabled = localStorage.getItem(
            "notificationsEnabled"
          );
          const soundEnabled = localStorage.getItem("soundEnabled");
          const showNotifications =
            notificationsEnabled === null ||
            JSON.parse(notificationsEnabled) === true;
          const playSound =
            soundEnabled === null || JSON.parse(soundEnabled) === true;

          console.log("Settings check:", { showNotifications, playSound });
          console.log("🧪 Notification API exists?", "Notification" in window);
          console.log(
            "🧪 Permission status:",
            typeof Notification !== "undefined"
              ? Notification.permission
              : "N/A"
          );

          const currentUnread =
            recentChats.find((c) => c.chatId === key || c.id === key)
              ?.unreadCount || 0;
          console.log("📢 Showing notifications:", {
            senderName,
            messageText,
            chatId: key,
            currentUnread,
            tabVisible: document.visibilityState,
            notificationSupport: "Notification" in window,
            permission:
              typeof Notification !== "undefined"
                ? Notification.permission
                : "N/A",
          });

          // Always show in-app notification if notifications are enabled
          if (showNotifications) {
            setNotifications((prev) => {
              // attempt to determine if this chatId refers to a group from recentChats
              const chatEntry = recentChats.find(
                (c) =>
                  String(c.chatId) === String(key) ||
                  String(c.id) === String(key)
              );
              // Prefer group/chat avatar (including groupSettings.avatar) if available, then recentChats avatar, then sender avatar
              const resolvedAvatar =
                (newMessage &&
                  newMessage.chat &&
                  ((newMessage.chat.groupSettings &&
                    newMessage.chat.groupSettings.avatar) ||
                    newMessage.chat.avatar ||
                    newMessage.chat.pic)) ||
                (chatEntry && (chatEntry.avatar || chatEntry.pic)) ||
                senderAvatar ||
                null;
              const newNotif = {
                id: `notif-${Date.now()}-${notificationIdCounter.current++}`,
                chatId: key,
                senderName,
                avatar: resolvedAvatar,
                // Prefer explicit chat metadata, fall back to recentChats lookup
                isGroup: !!(
                  (newMessage &&
                    newMessage.chat &&
                    (newMessage.chat.isGroupChat || newMessage.chat.isGroup)) ||
                  (chatEntry && (chatEntry.isGroup || chatEntry.isGroupChat))
                ),
                groupName:
                  (newMessage &&
                    newMessage.chat &&
                    (newMessage.chat.chatName || newMessage.chat.name)) ||
                  (chatEntry && (chatEntry.chatName || chatEntry.name)) ||
                  null,
                message: messageText,
                unreadCount: currentUnread + (isFromMe ? 0 : 1),
                timestamp: Date.now(),
              };
              console.log("✅ In-app notification created:", newNotif);
              return [...prev, newNotif];
            });
          }

          console.log(
            "After setNotifications - now testing browser notification"
          );

          // Only show browser notification if notifications are enabled in settings
          if (showNotifications) {
            // Browser notification
            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              try {
                const notification = new Notification(senderName, {
                  body: messageText,
                  icon: senderAvatar || "/icon.png",
                  tag: `chat-${key}`,
                  requireInteraction: false,
                  silent: !playSound, // Silent if sound is disabled
                });

                notification.onclick = (event) => {
                  event.preventDefault();
                  window.focus();
                  const chat = recentChats.find(
                    (c) =>
                      String(c.chatId) === String(key) ||
                      String(c.id) === String(key)
                  );
                  if (chat) {
                    handleOpenChat(chat);
                  }
                  notification.close();
                };
              } catch (error) {
                console.error("Error creating notification:", error);
              }
            }
          } else {
            console.log("Notifications disabled in settings");
          }
        }

        const populateRepliedFromServer = async (chatId, repliedArray) => {
          try {
            const token =
              localStorage.getItem("token") ||
              localStorage.getItem("chasmos_auth_token");
            if (!token) return repliedArray;
            const res = await fetch(`${API_BASE_URL}/api/message/${chatId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return repliedArray;
            const msgs = await res.json();
            const map = {};
            (msgs || []).forEach((m) => {
              map[String(m._id || m.id)] = m;
            });
            return repliedArray.map((r) => {
              const id = r && (r._id || r.id || r);
              const found = id ? map[String(id)] : null;
              if (found) {
                return {
                  _id: found._id || found.id,
                  id: found._id || found.id,
                  content: found.content || found.text || "",
                  sender:
                    found.sender || found.sender?._id
                      ? found.sender
                      : found.sender,
                  attachments: Array.isArray(found.attachments)
                    ? found.attachments
                    : [],
                };
              }
              return r;
            });
          } catch (e) {
            return repliedArray;
          }
        };

        // Choose a consistent key to append messages to the active chat when open
        const appendKey =
          isCurrentChat && selectedContact
            ? String(selectedContact.chatId || selectedContact.id || key)
            : key;

        // If any repliedTo item lacks populated sender object, try to backfill from server
        (async () => {
          let finalReplied = formatted.repliedTo || [];
          const needsFetch = finalReplied.some(
            (rt) => rt && (!rt.sender || typeof rt.sender === "string")
          );
          const chatIdForFetch =
            chatId || newMessage.chat?._id || newMessage.chat;
          if (needsFetch && chatIdForFetch) {
            const backfilled = await populateRepliedFromServer(
              chatIdForFetch,
              finalReplied
            );
            finalReplied = backfilled;
            // update formatted and then append
            formatted.repliedTo = finalReplied;
          }

          setMessages((prev) => {
            const existing = prev?.[appendKey] || [];
            const alreadyHas = existing.some(
              (m) => String(m.id || m._id) === String(formatted.id)
            );
            if (alreadyHas) {
              return prev;
            }
            const updatedMessages = [...existing, formatted];
            const filtered = filterDuplicateSystemMessages(updatedMessages);
            return {
              ...prev,
              [appendKey]: filtered,
            };
          });
        })();
        // end async population

        // continue without awaiting: setMessages will be called by async above

        const preview =
          formatted.content ||
          (formatted.attachments && formatted.attachments[0]?.fileName) ||
          "Attachment";
        const hasAttachment = Boolean(
          formatted.attachments && formatted.attachments.length
        );
        // Determine a userId to attach when this is a 1:1 chat (so the UI can compute presence)
        const metaUserId =
          !newMessage.chat || (newMessage.chat && !newMessage.chat.isGroupChat)
            ? senderId || undefined
            : undefined;

        // Prefer group chat metadata for group messages; otherwise prefer sender info
        const isGroupMsg = !!(
          newMessage.chat &&
          (newMessage.chat.isGroupChat || newMessage.chat.isGroup)
        );
        const groupName =
          newMessage.chat &&
          (newMessage.chat.chatName ||
            newMessage.chat.name ||
            newMessage.chat.groupName);
        const groupAvatar =
          newMessage.chat &&
          ((newMessage.chat.groupSettings &&
            newMessage.chat.groupSettings.avatar) ||
            newMessage.chat.avatar ||
            newMessage.chat.pic);
        const senderNameMeta =
          newMessage.sender && typeof newMessage.sender === "object"
            ? newMessage.sender.name || newMessage.sender.username
            : undefined;
        const senderAvatarMeta =
          newMessage.sender && typeof newMessage.sender === "object"
            ? newMessage.sender.avatar || newMessage.sender.pic
            : undefined;

        updateRecentChat(key, preview, hasAttachment, {
          attachmentFileName:
            formatted.attachments && formatted.attachments[0]?.fileName,
          attachmentMime:
            formatted.attachments && formatted.attachments[0]?.mimeType,
          timestamp: formatted.timestamp,
          isSystem: Boolean(
            formatted.isSystemMessage || formatted.type === "system"
          ),
          // For group messages prefer the group's name and only the group's avatar (no sender avatar fallback)
          ...(isGroupMsg
            ? {
                name: groupName || senderNameMeta,
                ...(groupAvatar ? { avatar: groupAvatar } : {}),
              }
            : { name: senderNameMeta, avatar: senderAvatarMeta }),
          userId: metaUserId,
        });

        // Emit delivered ack (recipient client's socket acknowledges receipt)
        try {
          if (!isFromMe && socketRef.current?.emit) {
            console.log("[SOCKET OUT] emit message-delivered", {
              messageId: newMessage._id || newMessage.id,
              chatId: key,
            });
            socketRef.current.emit("message-delivered", {
              messageId: newMessage._id || newMessage.id,
              chatId: key,
            });
          }
        } catch (e) {
          console.error("Error emitting message-delivered", e);
        }

        // Only increment unread count if this chat is not currently open and the message is not from me (skip system messages)
        if (!isCurrentChat) {
          if (!isFromMe && newMessage.type !== 'system') {
            setRecentChats((prev) => prev.map((c) => {
              if (!(c.chatId === key || c.id === key)) return c;
              const existing = c || {};
              const newUnread = (existing.unreadCount || 0) + 1;
              const providedMentionCount = (newMessage && (newMessage.mentionCount || newMessage.mentionsCount)) || null;
              return { ...existing, unreadCount: newUnread, ...(providedMentionCount !== null ? { mentionCount: providedMentionCount } : {}) };
            }));
          }
        } else {
          // If chat is currently open and this message is NOT from me, emit message-read
          if (!isFromMe) {
            // emit message-read so server and sender are notified
            try {
              if (socketRef.current?.emit) {
                console.log("[SOCKET OUT] emit message-read", { chatId: key });
                socketRef.current.emit("message-read", { chatId: key });
              }
            } catch (e) {
              console.error("Error emitting message-read", e);
            }
            // Status will be updated when backend sends message-read socket event
          }
        }
        updateContactPreview(key, preview, hasAttachment, {
          attachmentFileName:
            formatted.attachments && formatted.attachments[0]?.fileName,
          attachmentMime:
            formatted.attachments && formatted.attachments[0]?.mimeType,
        });
        try {
          updateContactPreview &&
            updateContactPreview(
              key,
              preview,
              Boolean(formatted.attachments && formatted.attachments.length),
              {
                attachmentFileName:
                  formatted.attachments && formatted.attachments[0]?.fileName,
                attachmentMime:
                  formatted.attachments && formatted.attachments[0]?.mimeType,
              }
            );
        } catch (e) {}
      } catch (err) {
        console.error("Error processing incoming socket message", err);
      }
    });

    // New group created elsewhere - add to UI immediately
    socket.on("group created", (group) => {
      try {
        console.log(
          "[SOCKET] group created event received",
          group && (group.chatId || group._id || group.id)
        );
        if (!group) return;
        const chatId = String(group.chatId || group._id || group.id);
        if (!chatId) return;

        const name =
          group.chatName || group.name || group.groupName || "New Group";
        const avatar =
          (group.groupSettings && group.groupSettings.avatar) ||
          group.avatar ||
          "";
        const participants = group.participants || group.users || [];

        const contactEntry = {
          id: chatId,
          chatId,
          name,
          avatar,
          participants,
          isGroup: true,
          isGroupChat: true,
        };

        setContacts((prev) => {
          if (
            (prev || []).some(
              (c) => String(c.chatId) === chatId || String(c.id) === chatId
            )
          )
            return prev;
          return [contactEntry, ...(prev || [])];
        });

        setRecentChats((prev) => {
          if (
            (prev || []).some(
              (c) => String(c.chatId) === chatId || String(c.id) === chatId
            )
          )
            return prev;
          const entry = {
            id: chatId,
            chatId,
            name,
            avatar,
            lastMessage: "",
            timestamp: Date.now(),
            isGroupChat: true,
            users: participants,
            participants,
          };
          return [entry, ...(prev || [])];
        });

        // Ensure messages map exists
        setMessages((prev) => ({
          ...(prev || {}),
          [chatId]: prev?.[chatId] || [],
        }));

        // Join socket room for the new chat so real-time updates arrive
        try {
          if (socketRef.current && socketRef.current.emit)
            socketRef.current.emit("join chat", chatId);
        } catch (e) {}
      } catch (e) {
        console.error("Error handling group created socket event", e);
      }
    });

    // When server notifies that a chat was deleted, remove it from lists and close if open
    socket.on("chat deleted", ({ chatId }) => {
      try {
        if (!chatId) return;
        const idStr = String(chatId);
        console.log("[SOCKET] chat deleted event received", idStr);

        // Remove from recentChats
        setRecentChats((prev) =>
          (prev || []).filter(
            (c) => String(c.chatId) !== idStr && String(c.id) !== idStr
          )
        );

        // Remove from contacts
        setContacts((prev) =>
          (prev || []).filter(
            (c) => String(c.chatId) !== idStr && String(c.id) !== idStr
          )
        );

        // Remove messages and selection
        setMessages((prev) => {
          if (!prev) return prev;
          const copy = { ...prev };
          delete copy[idStr];
          return copy;
        });

        // If currently open chat is the deleted one, close it
        if (
          selectedContact &&
          (String(selectedContact.chatId) === idStr ||
            String(selectedContact.id) === idStr ||
            String(selectedContact._id) === idStr)
        ) {
          setSelectedContact(null);
          if (isMobileView) setShowSidebar(true);
        }
      } catch (e) {
        console.error("Error handling chat deleted socket event", e);
      }
    });

    // Debug: log when client joins a chat room
    const origEmit = socket.emit.bind(socket);
    socket.emit = function (event, ...args) {
      try {
      } catch (e) {}
      return origEmit(event, ...args);
    };

    socket.on(
      "pin message",
      ({ chatId, pinnedMessages: updatedPinnedMessages }) => {
        try {
          const currentChatId = selectedContact?.id || selectedContact?._id;
          if (String(chatId) === String(currentChatId)) {
            setPinnedMessagesData(updatedPinnedMessages || []);
            const pinnedMap = {};
            (updatedPinnedMessages || []).forEach((pinned) => {
              if (pinned.message) {
                const msgId =
                  pinned.message._id || pinned.message.id || pinned.message;
                pinnedMap[msgId] = true;
              }
            });
            setPinnedMessages(pinnedMap);
          }
        } catch (err) {
          console.error("Error processing pin message event", err);
        }
      }
    );

    socket.on(
      "unpin message",
      ({ chatId, pinnedMessages: updatedPinnedMessages }) => {
        try {
          const currentChatId = selectedContact?.id || selectedContact?._id;
          if (String(chatId) === String(currentChatId)) {
            setPinnedMessagesData(updatedPinnedMessages || []);
            const pinnedMap = {};
            (updatedPinnedMessages || []).forEach((pinned) => {
              if (pinned.message) {
                const msgId =
                  pinned.message._id || pinned.message.id || pinned.message;
                pinnedMap[msgId] = true;
              }
            });
            setPinnedMessages(pinnedMap);
          }
        } catch (err) {
          console.error("Error processing unpin message event", err);
        }
      }
    );

    socket.on("poll voted", ({ pollId, poll: updatedPoll, chatId }) => {
      console.log("[SOCKET] poll voted event received:", {
        pollId,
        chatId,
        updatedPoll,
      });
      try {
        if (!chatId || !updatedPoll) return;
        const pollIdStr = String(pollId);
        setMessages((prev) => {
          const chatMessages = prev[chatId] || [];
          const updated = chatMessages.map((msg) => {
            if (!msg.poll) return msg;
            const msgPollId = String(msg.poll?._id || msg.poll);
            if (msgPollId === pollIdStr) {
              console.log("📊 Updating poll in message:", pollIdStr);
              return { ...msg, poll: updatedPoll };
            }
            return msg;
          });
          return {
            ...prev,
            [chatId]: updated,
          };
        });
      } catch (err) {
        console.error("Error processing poll voted event", err);
      }
    });

    socket.on("poll remove vote", ({ pollId, poll: updatedPoll, chatId }) => {
      console.log("[SOCKET] poll remove vote event received:", {
        pollId,
        chatId,
        updatedPoll,
      });
      try {
        if (!chatId || !updatedPoll) return;
        const pollIdStr = String(pollId);
        setMessages((prev) => {
          const chatMessages = prev[chatId] || [];
          const updated = chatMessages.map((msg) => {
            if (!msg.poll) return msg;
            const msgPollId = String(msg.poll?._id || msg.poll);
            if (msgPollId === pollIdStr) {
              console.log(
                "📊 Updating poll vote removal in message:",
                pollIdStr
              );
              return { ...msg, poll: updatedPoll };
            }
            return msg;
          });
          return {
            ...prev,
            [chatId]: updated,
          };
        });
      } catch (err) {
        console.error("Error processing poll remove vote event", err);
      }
    });

    socket.on("poll closed", ({ pollId, poll: updatedPoll, chatId }) => {
      console.log("[SOCKET] poll closed event received:", {
        pollId,
        chatId,
        updatedPoll,
      });
      try {
        if (!chatId || !updatedPoll) return;
        const pollIdStr = String(pollId);
        setMessages((prev) => {
          const chatMessages = prev[chatId] || [];
          const updated = chatMessages.map((msg) => {
            if (!msg.poll) return msg;
            const msgPollId = String(msg.poll?._id || msg.poll);
            if (msgPollId === pollIdStr) {
              console.log("📊 Updating poll closed status:", pollIdStr);
              return { ...msg, poll: updatedPoll };
            }
            return msg;
          });
          return {
            ...prev,
            [chatId]: updated,
          };
        });
      } catch (err) {
        console.error("Error processing poll closed event", err);
      }
    });

    return () => {
      try {
        if (socketRef.current) socketRef.current.disconnect();
      } catch (err) {}
    };
  }, [API_BASE_URL, selectedContact]);

  // Ensure presence flags on recent chats/contacts are recalculated whenever
  // the `onlineUsers` set or per-chat counts change. This handles the case
  // where the initial `online users` socket event arrives before the
  // recent chats REST response completes.
  useEffect(() => {
    try {
      if (!onlineUsers) return;

      setRecentChats((prev) => {
        if (!prev) return prev;
        return prev.map((c) => {
          const copy = { ...c };
          const isGroup =
            copy.isGroup ||
            copy.isGroupChat ||
            copy.isgroupchat ||
            (Array.isArray(copy.users) && copy.users.length > 0) ||
            (Array.isArray(copy.participants) && copy.participants.length > 0);
          if (isGroup) {
            const chatIdKey = copy.chatId || copy._id || copy.id || "";
            let count = 0;
            if (
              groupOnlineCounts &&
              typeof groupOnlineCounts[String(chatIdKey)] !== "undefined"
            ) {
              const raw = Number(groupOnlineCounts[String(chatIdKey)] || 0);
              count = Math.max(0, raw - 1);
            } else if (
              copy.group &&
              ((Array.isArray(copy.group.participants) &&
                copy.group.participants.length > 0) ||
                (Array.isArray(copy.group.users) &&
                  copy.group.users.length > 0))
            ) {
              const members =
                copy.group?.participants || copy.group?.users || [];
              count = (members || []).filter((m) => {
                const uid = m && (m._id || m.id || m);
                if (!uid) return false;
                if (String(uid) === String(currentUserId)) return false;
                return onlineUsers.has(String(uid));
              }).length;
            } else {
              count = 0;
            }
            copy.__computedGroupOnlineCount = count;
            copy.isOnline = count > 0;
          } else {
            const candidateIds = [];
            if (copy.userId) candidateIds.push(String(copy.userId));
            if (copy.user_id) candidateIds.push(String(copy.user_id));
            if (copy._id) candidateIds.push(String(copy._id));
            if (copy.id) candidateIds.push(String(copy.id));
            if (copy.participantId)
              candidateIds.push(String(copy.participantId));
            if (copy.otherUser) {
              if (copy.otherUser.id)
                candidateIds.push(String(copy.otherUser.id));
              if (copy.otherUser._id)
                candidateIds.push(String(copy.otherUser._id));
            }
            if (Array.isArray(copy.participants) && copy.participants.length) {
              const p = copy.participants[0];
              if (p && (p._id || p.id))
                candidateIds.push(String(p._id || p.id));
            }
            const uniq = Array.from(new Set(candidateIds.filter(Boolean)));
            const foundOnline = uniq.some((id) => onlineUsers.has(String(id)));
            copy.isOnline = foundOnline || Boolean(copy.isOnline);
          }
          return copy;
        });
      });

      setContacts((prev) => {
        if (!prev) return prev;
        return prev.map((c) => {
          const copy = { ...c };
          const isGroup =
            copy.isGroup ||
            copy.isGroupChat ||
            copy.isgroupchat ||
            (Array.isArray(copy.users) && copy.users.length > 0) ||
            (Array.isArray(copy.participants) && copy.participants.length > 0);
          if (isGroup) {
            const members =
              copy.group?.participants ||
              copy.group?.users ||
              copy.users ||
              copy.participants ||
              [];
            const count = (members || []).filter((m) => {
              const uid = m && (m._id || m.id || m);
              if (!uid) return false;
              if (String(uid) === String(currentUserId)) return false;
              return onlineUsers.has(String(uid));
            }).length;
            copy.__computedGroupOnlineCount = count;
            copy.isOnline = count > 0;
          } else {
            const candidateIds = [];
            if (copy.userId) candidateIds.push(String(copy.userId));
            if (copy.user_id) candidateIds.push(String(copy.user_id));
            if (copy._id) candidateIds.push(String(copy._id));
            if (copy.id) candidateIds.push(String(copy.id));
            if (copy.participantId)
              candidateIds.push(String(copy.participantId));
            if (copy.otherUser) {
              if (copy.otherUser.id)
                candidateIds.push(String(copy.otherUser.id));
              if (copy.otherUser._id)
                candidateIds.push(String(copy.otherUser._id));
            }
            if (Array.isArray(copy.participants) && copy.participants.length) {
              const p = copy.participants[0];
              if (p && (p._id || p.id))
                candidateIds.push(String(p._id || p.id));
            }
            const uniq = Array.from(new Set(candidateIds.filter(Boolean)));
            const foundOnline = uniq.some((id) => onlineUsers.has(String(id)));
            copy.isOnline = foundOnline || Boolean(copy.isOnline);
          }
          return copy;
        });
      });
    } catch (e) {
      // non-fatal
    }
  }, [onlineUsers, currentUserId]);
  // When user opens a conversation, emit message-read and mark local messages read
  useEffect(() => {
    try {
      if (!selectedContact) return;
      const chatId =
        selectedContact.chatId || selectedContact.id || selectedContact._id;
      if (!chatId) return;
      const isGroupChatOpen = Boolean(
        selectedContact.isGroup ||
          selectedContact.isGroupChat ||
          selectedContact.isgroupchat
      );
      
      // If we just sent a message very recently, don't mark previous messages as read
      try {
        const now = Date.now();
        const delta = lastSentAtRef.current
          ? now - lastSentAtRef.current
          : null;
        if (lastSentAtRef.current && delta !== null && delta < 3000) {
          console.log('[CHAT OPEN] Skipping auto-mark-as-read due to recent local send for', chatId);
          return;
        }
      } catch (e) {}
      if (socketRef.current?.emit) {
        try {
          console.log('[SOCKET OUT] emit message-read on open', { chatId, isGroupChat: isGroupChatOpen });
          socketRef.current.emit("message-read", { chatId });
        } catch (e) {
          console.error("Error emitting message-read on open", e);
        }
      }
      // Status will be updated when backend sends message-read socket event
    } catch (e) {
      console.error("Error emitting message-read on open", e);
    }
  }, [selectedContact]);

  const handleBackToContacts = useCallback(() => {
    if (isMobileView) {
      setSelectedContact(null);
      setShowSidebar(true);
      setShowGroupCreation(false);
      setShowNewChat(false);
    }
  }, [isMobileView]);

  const toggleChatSearch = useCallback(() => {
    //console.log("toggleChatSearch called, current state:", showChatSearch);
    setShowChatSearch(!showChatSearch);
    //console.log("toggleChatSearch setting state to:", !showChatSearch);
  }, [showChatSearch]);

  const closeChatSearch = useCallback(() => {
    setShowChatSearch(false);
    setChatSearchTerm("");
  }, []);

  const handlePinMessage = useCallback(
    async (messageId) => {
      const chatId = selectedContact?.id || selectedContact?._id;
      if (!chatId) return;

      const isPinned = pinnedMessages[messageId];

      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("chasmos_auth_token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const endpoint = isPinned ? "/api/message/unpin" : "/api/message/pin";
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ messageId, chatId }),
        });

        if (!res.ok) {
          const errorData = await res.json();

          // Check if it's the max pins error
          if (errorData.message?.includes("Maximum 3 messages")) {
            setPendingPinMessageId(messageId);
            setShowPinReplaceModal(true);
            return;
          }

          throw new Error(errorData.message || "Failed to pin/unpin message");
        }

        const data = await res.json();

        // Update local state
        setPinnedMessages((prev) => ({
          ...prev,
          [messageId]: !isPinned,
        }));

        // Update pinned messages data
        setPinnedMessagesData(data.pinnedMessages || []);

        // Emit socket event for real-time sync
        if (socketRef.current?.emit) {
          socketRef.current.emit(isPinned ? "unpin message" : "pin message", {
            messageId,
            chatId,
            pinnedMessages: data.pinnedMessages,
          });
        }
      } catch (err) {
        console.error("Pin/unpin message failed", err);
        alert(err.message || "Failed to pin/unpin message");
      }
    },
    [selectedContact, pinnedMessages, API_BASE_URL]
  );

  const handleUnpinFromBar = useCallback(
    async (messageId) => {
      await handlePinMessage(messageId);
    },
    [handlePinMessage]
  );

  // Screenshot detection handler
  const handleScreenshotDetected = useCallback(
    async ({ blob, dimensions, timestamp }) => {
      if (!selectedContact) {
        console.error("❌ [Screenshot] No selected contact");
        toast.error("No active chat to save screenshot", {
          style: {
            background: "linear-gradient(135deg, #f43f5e 0%, #fbbf24 100%)",
            color: "#fff",
            border: "1.5px solid #f43f5e",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.10)",
            backdropFilter: "blur(8px)",
            fontWeight: 600,
            letterSpacing: "0.01em",
          },
          position: "bottom-center",
        });
        return;
      }

      const chatId =
        selectedContact.chatId || selectedContact._id || selectedContact.id;

      // Show loading toast
      const loadingToast = toast.loading("Screenshot detected!", {
        position: "bottom-center",
        style: {
          background: "linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)",
          color: "#fff",
          border: "1.5px solid #6366f1",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.10)",
          backdropFilter: "blur(8px)",
          fontWeight: 600,
          letterSpacing: "0.01em",
        },
      });

      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("chasmos_auth_token");
        if (!token) {
          console.error("❌ [Screenshot] No token found");
          toast.error("Authentication required", {
            id: loadingToast,
            style: {
              background: "linear-gradient(135deg, #f43f5e 0%, #fbbf24 100%)",
              color: "#fff",
              border: "1.5px solid #f43f5e",
              boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.10)",
              backdropFilter: "blur(8px)",
              fontWeight: 600,
              letterSpacing: "0.01em",
            },
          });
          return;
        }

        // Create form data
        const formData = new FormData();
        const filename = `screenshot_${Date.now()}.png`;
        formData.append("screenshot", blob, filename);
        formData.append("chatId", chatId);
        formData.append("width", dimensions.width.toString());
        formData.append("height", dimensions.height.toString());

        console.log(
          "📡 [Screenshot] Sending to:",
          `${API_BASE_URL}/api/screenshot/upload`
        );
        console.log("📦 [Screenshot] FormData contents:", {
          filename,
          chatId,
          blobSize: blob.size,
          width: dimensions.width,
          height: dimensions.height,
        });

        // Upload screenshot
        const response = await fetch(`${API_BASE_URL}/api/screenshot/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type - let browser set it with boundary for FormData
          },
          body: formData,
        });

        console.log("📨 [Screenshot] Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            "❌ [Screenshot] Upload failed:",
            response.status,
            errorText
          );
          throw new Error(`Failed to upload screenshot: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ [Screenshot] Uploaded successfully:", data);

        // Success toast
        toast.success("Screenshot saved!", {
          id: loadingToast,
          duration: 3000,
          position: "bottom-center",
          style: {
            background: "linear-gradient(135deg, #8b5cf6 0%, #60a5fa 100%)",
            color: "#fff",
            border: "1.5px solid #a78bfa",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
            backdropFilter: "blur(8px)",
            fontWeight: 600,
            letterSpacing: "0.01em",
          },
        });

        // Add system message to chat
        if (data.systemMessage) {
          const formatted = {
            id: data.systemMessage._id || data.systemMessage.id,
            type: "system",
            content: data.systemMessage.content,
            sender: data.systemMessage.sender._id || data.systemMessage.sender,
            timestamp: new Date(
              data.systemMessage.timestamp || data.systemMessage.createdAt
            ).getTime(),
            isSystemMessage: true,
          };

          setMessages((prev) => ({
            ...prev,
            [chatId]: [...(prev[chatId] || []), formatted],
          }));

          // Emit socket event
          if (socketRef.current?.emit) {
            lastSentAtRef.current = Date.now();
            socketRef.current.emit("new message", data.systemMessage);
            // suppression removed
          }
        }
      } catch (error) {
        console.error("💥 [Screenshot] Error:", error);
        toast.error(`Failed to save screenshot: ${error.message}`, {
          position: "bottom-center",
          style: {
            background: "linear-gradient(135deg, #f43f5e 0%, #fbbf24 100%)",
            color: "#fff",
            border: "1.5px solid #f43f5e",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.10)",
            backdropFilter: "blur(8px)",
            fontWeight: 600,
            letterSpacing: "0.01em",
          },
        });
      }
    },
    [selectedContact, API_BASE_URL, setMessages, socketRef]
  );

  // Use screenshot detection hook
  useScreenshotDetection({
    chatId:
      selectedContact?.chatId || selectedContact?._id || selectedContact?.id,
    userId: currentUserId,
    onScreenshotDetected: handleScreenshotDetected,
    enabled: !selectedContact?.isDocument,
  });

  const handleReplaceOldestPin = useCallback(async () => {
    const chatId = selectedContact?.chatId || selectedContact?._id;
    if (!chatId || !pendingPinMessageId) return;

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("chasmos_auth_token");
      if (!token) {
        console.error("No token found");
        return;
      }

      // Find the oldest pinned message
      const oldestPinned = pinnedMessagesData.sort(
        (a, b) => new Date(a.pinnedAt) - new Date(b.pinnedAt)
      )[0];

      if (!oldestPinned || !oldestPinned.message) {
        throw new Error("Could not find oldest pinned message");
      }

      const oldestMessageId =
        oldestPinned.message._id || oldestPinned.message.id;

      // First, unpin the oldest message
      const unpinRes = await fetch(`${API_BASE_URL}/api/message/unpin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messageId: oldestMessageId, chatId }),
      });

      if (!unpinRes.ok) {
        throw new Error("Failed to unpin oldest message");
      }

      // Then, pin the new message
      const pinRes = await fetch(`${API_BASE_URL}/api/message/pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messageId: pendingPinMessageId, chatId }),
      });

      if (!pinRes.ok) {
        throw new Error("Failed to pin new message");
      }

      const data = await pinRes.json();

      // Update local state
      setPinnedMessages((prev) => ({
        ...prev,
        [oldestMessageId]: false,
        [pendingPinMessageId]: true,
      }));

      // Update pinned messages data
      setPinnedMessagesData(data.pinnedMessages || []);

      // Emit socket events for real-time sync
      if (socketRef.current?.emit) {
        socketRef.current.emit("unpin message", {
          messageId: oldestMessageId,
          chatId,
          pinnedMessages: data.pinnedMessages,
        });
        socketRef.current.emit("pin message", {
          messageId: pendingPinMessageId,
          chatId,
          pinnedMessages: data.pinnedMessages,
        });
      }

      // Close modal and reset state
      setShowPinReplaceModal(false);
      setPendingPinMessageId(null);
    } catch (err) {
      console.error("Replace pin failed", err);
      alert(err.message || "Failed to replace pinned message");
      setShowPinReplaceModal(false);
      setPendingPinMessageId(null);
    }
  }, [selectedContact, pendingPinMessageId, pinnedMessagesData, API_BASE_URL]);

  const handleNavigateToPinnedMessage = useCallback((messageOrId) => {
    // Scroll to the message in the chat
    // Handle both message object and messageId string
    const messageId =
      typeof messageOrId === "string"
        ? messageOrId
        : messageOrId?._id || messageOrId?.id;

    if (!messageId) {
      console.error("No message ID provided to handleNavigateToPinnedMessage");
      return;
    }

    console.log("Navigating to message:", messageId);

    // Disable auto-scroll during manual navigation
    manualScrollInProgressRef.current = true;

    const scrollToMessage = (attempts = 0) => {
      const messageElement = document.getElementById(`message-${messageId}`);

      if (messageElement) {
        console.log("Found message element, scrolling...");

        // Get the messages container
        const messagesContainer = messageElement.closest(".overflow-y-auto");

        if (messagesContainer) {
          // Calculate the offset from the top of the container
          const containerRect = messagesContainer.getBoundingClientRect();
          const messageRect = messageElement.getBoundingClientRect();
          const scrollTop = messagesContainer.scrollTop;
          const offsetTop = messageRect.top - containerRect.top + scrollTop;

          // Account for header and pinned messages bar (approximately 150px)
          const targetScroll = offsetTop - 150;

          messagesContainer.scrollTo({
            top: targetScroll,
            behavior: "smooth",
          });
        } else {
          // Fallback to scrollIntoView
          messageElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
        }

        // Highlight the message briefly
        messageElement.classList.add("highlight-message");
        setTimeout(() => {
          messageElement.classList.remove("highlight-message");
        }, 2000);

        // Re-enable auto-scroll after navigation completes (after smooth scroll animation)
        setTimeout(() => {
          manualScrollInProgressRef.current = false;
        }, 1000);
      } else if (attempts < 5) {
        console.log(
          `Message element not found yet, retrying... (attempt ${attempts + 1})`
        );
        // Retry after a short delay to allow DOM to update
        setTimeout(() => scrollToMessage(attempts + 1), 200);
      } else {
        console.warn(
          `Message element not found for ID after ${attempts} attempts: ${messageId}`
        );
        // Re-enable auto-scroll even if we fail to find the message
        manualScrollInProgressRef.current = false;
      }
    };

    scrollToMessage();
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
        themeOverride: {
          mode: "light",
        },
      };
    } else if (hour >= 12 && hour < 17) {
      // Day (12 PM - 5 PM): Bright theme
      return {
        isNightMode: false,
        starColor: "rgba(59, 130, 246, 0.6)",
        period: "day",
        themeOverride: {
          mode: "light",
        },
      };
    } else if (hour >= 17 && hour < 21) {
      // Evening (5 PM - 9 PM): Sunset theme with dark mode
      return {
        isNightMode: true,
        starColor: "rgba(168, 85, 247, 0.8)",
        period: "evening",
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
    setShowFloatingMenu((prev) => !prev);
  }, []);

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

  const handleInviteUser = useCallback(async () => {
    console.log("Invite user clicked");
    setShowFloatingMenu(false);

    const message =
      "Join Chasmos to enjoy the next-gen chat app and have a seamless experience of connecting with people worldwide. If you're a business then make your business visible allowing people to approach you.\n\nhttps://chasmos.netlify.app";

    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(message);
      } else {
        const el = document.createElement("textarea");
        el.value = message;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      console.log("Invite copied to clipboard");
    } catch (err) {
      console.error("Failed to copy invite message", err);
    }
  }, []);

  const handleCloseGroupCreation = useCallback(() => {
    setShowGroupCreation(false);
  }, []);

  const handleCloseNewChat = useCallback(() => {
    setShowNewChat(false);
  }, []);

  const handleCreateGroupComplete = useCallback((newGroup) => {
    // Normalize response: backend may return { chat, group } or a chat object directly
    const raw = newGroup && newGroup.chat ? newGroup.chat : newGroup;

    const chatId = String(
      raw?._id ||
        raw?.chatId ||
        newGroup?.chat?._id ||
        newGroup?._id ||
        raw?.id ||
        ""
    );
    const participants =
      raw?.participants ||
      raw?.users ||
      newGroup?.participants ||
      newGroup?.users ||
      [];

    // Prefer chat-level fields, then group wrapper fields, then fallbacks
    const name =
      raw?.chatName ||
      raw?.name ||
      (newGroup?.group && (newGroup.group.name || newGroup.group.groupName)) ||
      (raw?.groupSettings && raw.groupSettings.name) ||
      "New Group";
    const avatar =
      (raw?.groupSettings && raw.groupSettings.avatar) ||
      raw?.avatar ||
      raw?.icon ||
      (newGroup?.group && (newGroup.group.avatar || newGroup.group.icon)) ||
      "";

    const formatted = {
      ...raw,
      // keep original wrappers for debugging
      originalResponse: newGroup,
      isGroup: true,
      isGroupChat: true,
      chatId,
      id: chatId,
      _id: chatId || raw?._id,
      participants,
      users: participants,
      name,
      avatar,
      chat: raw,
    };

    // Add to contacts and recent chats so sidebar updates immediately
    setContacts((prev) => [formatted, ...(prev || [])]);

    setRecentChats((prev) => {
      const entry = {
        id: chatId,
        chatId,
        name,
        avatar,
        lastMessage: "",
        timestamp: Date.now(),
        isGroupChat: true,
        users: participants,
        participants,
      };
      return [entry, ...(prev || [])];
    });

    setShowGroupCreation(false);

    // Select the new group and ensure messages map exists
    setSelectedContact(normalizeContact(formatted));
    setMessages((prev) => ({
      ...(prev || {}),
      [chatId]: prev?.[chatId] || [],
    }));

    // Join socket room for real-time updates
    try {
      if (socketRef.current && socketRef.current.emit && chatId) {
        socketRef.current.emit("join chat", chatId);
      }
    } catch (e) {}
  }, []);

  const handleStartNewChat = useCallback(
    async (contact) => {
      setSelectedContact(normalizeContact(contact));
      setShowNewChat(false);

      // If contact has a chatId or id (existing chat), fetch messages
      const chatId = contact.chatId || contact.id;
      if (chatId && String(chatId).length === 24) {
        // Only fetch if not already loaded
        if (!messages[chatId] || messages[chatId].length === 0) {
          try {
            const token =
              localStorage.getItem("token") ||
              localStorage.getItem("chasmos_auth_token");
            if (token) {
              const msgsUrl = `${API_BASE_URL}/api/message/${chatId}`;
              const msgsRes = await fetch(msgsUrl, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (msgsRes.ok) {
                const msgs = await msgsRes.json();
                const formatted = msgs.map((m) => ({
                  id: m._id,
                  type: m.type || "text",
                  content: m.content || m.text || "",
                  sender: m.sender,
                  // prefer backend-provided `timestamp` (normalized to scheduledFor when applicable)
                  timestamp: new Date(
                    m.timestamp || m.scheduledFor || m.createdAt || Date.now()
                  ).getTime(),
                  status: m.status || (m.isRead ? "read" : "sent"),
                  attachments: Array.isArray(m.attachments)
                    ? m.attachments
                    : [],
                  isSystemMessage: m.type === "system",
                  isForwarded: m.isForwarded || false,
                  isEdited: m.isEdited || false,
                  reactions: m.reactions || [],
                  starredBy: m.starredBy || [],
                }));
                const filtered = filterDuplicateSystemMessages(formatted);
                setMessages((prev) => ({ ...prev, [chatId]: filtered }));
              } else {
                setMessages((prev) => ({ ...prev, [chatId]: [] }));
              }
            }
          } catch (err) {
            setMessages((prev) => ({ ...prev, [chatId]: [] }));
          }
        }
      } else {
        // For new/pending chats, just initialize empty messages
        if (!messages[contact.id]) {
          setMessages((prev) => ({
            ...prev,
            [contact.id]: [],
          }));
        }
      }
    },
    [messages]
  );

  // Ref for chat search container (click-outside functionality)

  // Fetch contacts from Api

  const [documentChats, setDocumentChats] = useState([]);
  // Filter accepted chats to exclude users already present in recentChats
  // Only show chats that the user has sent and have been accepted (not received requests, not merged)
  const filteredAcceptedChats = React.useMemo(() => {
    if (!Array.isArray(acceptedChats) || acceptedChats.length === 0) return [];
    if (!Array.isArray(recentChats) || recentChats.length === 0)
      return acceptedChats;

    // Create sets for both emails and IDs for comprehensive filtering
    const recentEmails = new Set(
      recentChats
        .map((r) => r.email || r.otherUser?.email)
        .filter(Boolean)
        .map((email) => email.toLowerCase())
    );

    const recentChatIds = new Set(
      recentChats
        .map((r) => r.id || r._id || r.chatId)
        .filter(Boolean)
        .map((id) => String(id))
    );

    const recentUserIds = new Set(
      recentChats
        .map((r) => r.userId || r.otherUser?._id)
        .filter(Boolean)
        .map((id) => String(id))
    );

    // Only show acceptedChats (not received), and not in recent chats
    return acceptedChats.filter((a) => {
      const email = (a.email || "").toLowerCase();
      const chatId = String(a.id || a._id || a.chatId || "");
      const userId = String(a.userId || a._id || "");
      return (
        !recentEmails.has(email) &&
        !recentChatIds.has(chatId) &&
        !recentUserIds.has(userId)
      );
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

        const formatted = (Array.isArray(data) ? data : [])
          .map((chat) => {
            const participants = chat.participants || [];

            let otherUser = chat.otherUser;
            if (!otherUser) {
              otherUser = participants.find(
                (p) => String(p._id || p.id) !== String(loggedInUserId)
              );
            }

            const allAreSelf =
              participants.length > 0 &&
              participants.every(
                (p) => String(p._id || p.id) === String(loggedInUserId)
              );
            if (allAreSelf) return null;

            const displayName =
              chat.isGroupChat && chat.chatName
                ? chat.chatName
                : otherUser?.username ||
                  otherUser?.name ||
                  (otherUser?.email
                    ? otherUser.email.split("@")[0]
                    : "Unknown");

            let preview = "";
            let hasAttachment = false;
            let attachmentMime = null;

            if (chat.lastMessage) {
              if (typeof chat.lastMessage === "string") {
                hasAttachment = chat.lastMessage.includes("📎");
                preview = chat.lastMessage.replace(/📎/g, "").trim();
              } else if (typeof chat.lastMessage === "object") {
                const lm = chat.lastMessage;
                const text = (lm.content || lm.text || "").toString().trim();
                const atts = Array.isArray(lm.attachments)
                  ? lm.attachments
                  : [];

                hasAttachment = atts.length > 0;

                if (text) {
                  preview =
                    text.split(/\s+/).slice(0, 8).join(" ") +
                    (hasAttachment ? " 📎" : "");
                } else if (hasAttachment) {
                  const first = atts[0] || {};
                  preview =
                    first.fileName ||
                    first.file_name ||
                    first.filename ||
                    (first.fileUrl
                      ? first.fileUrl.split("/").pop()
                      : "Attachment");

                  preview = preview.replace(/^[\d\-:.]+_/, "");
                  attachmentMime = first.mimeType || first.type || null;
                }
              }
            }

            const chatIdValue = chat.chatId || chat._id;

            // ✅🔥 FINAL AVATAR FIX (GROUP + DM)
            let avatar = null;

            if (chat.isGroupChat && chat.groupSettings?.avatar) {
              avatar = chat.groupSettings.avatar.startsWith("http")
                ? chat.groupSettings.avatar
                : `${API_BASE_URL}${chat.groupSettings.avatar}`;
            } else if (!chat.isGroupChat && otherUser?.avatar) {
              avatar = otherUser.avatar.startsWith("http")
                ? otherUser.avatar
                : `${API_BASE_URL}${otherUser.avatar}`;
            }

            return {
              id: chatIdValue,
              chatId: chatIdValue,
              userId: otherUser?._id || otherUser?.id || null,
              name: displayName,
              avatar, // 🔥 GUARANTEED VALUE OR NULL
              lastMessage: preview || "",
              hasAttachment,
              attachmentMime,
              timestamp: chat.timestamp || chat.updatedAt,
              isOnline: otherUser?.isOnline || false,
              isGroupChat:
                chat.isGroupChat === true || chat.isGroupChat === "true",
              unreadCount:
                typeof chat.unreadCount === "number"
                  ? chat.unreadCount
                  : (chat.unreadCount && chat.unreadCount[loggedInUserId]) || 0,
            };
          })
          .filter(Boolean);

        console.table(
          formatted.map((c) => ({
            name: c.name,
            avatar: c.avatar,
            isGroup: c.isGroupChat,
          }))
        );

        const seen = new Map();
        formatted.forEach((chat) => {
          const key = String(chat.chatId);
          if (
            !seen.has(key) ||
            new Date(chat.timestamp) > new Date(seen.get(key).timestamp)
          ) {
            seen.set(key, chat);
          }
        });

      const deduplicated = Array.from(seen.values());

      // Check block status for each chat
      const chatsWithBlockStatus = await Promise.all(
        deduplicated.map(async (chat) => {
          if (!chat.isGroupChat && chat.userId) {
            try {
              const status = await blockService.checkBlockStatus(String(chat.userId));
              return {
                ...chat,
                hasBlockedYou: Boolean(status?.hasBlockedYou),
                isOnline: status?.hasBlockedYou ? false : chat.isOnline,
              };
            } catch (e) {
              return { ...chat, hasBlockedYou: false };
            }
          }
          return { ...chat, hasBlockedYou: false };
        })
      );

      if (archivedChatIds && archivedChatIds.size > 0) {
        setRecentChats(
          chatsWithBlockStatus.filter(
            (c) => !archivedChatIds.has(String(c.chatId))
          )
        );
      } else {
        setRecentChats(chatsWithBlockStatus);
      }
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
        floatingButtonRef.current &&
        !floatingButtonRef.current.contains(event.target) &&
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

    if (effectiveTheme.mode === "dark" || cosmicTheme.isNightMode) {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }

    return () => {
      root.classList.remove("dark");
      root.removeAttribute("data-theme");
    };
  }, [effectiveTheme.mode, cosmicTheme.isNightMode]);

  return (
    <>
      {showDeleteChatModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          style={{
            backgroundColor:
              effectiveTheme.mode === "dark"
                ? "rgba(0,0,0,0.4)"
                : "rgba(255,255,255,0.85)",
          }}
        >
          <div
            className={`rounded-2xl shadow-2xl p-8 max-w-sm w-full relative border ${
              effectiveTheme.mode === "dark"
                ? `${effectiveTheme.secondary} ${effectiveTheme.border}`
                : "bg-gradient-to-br from-blue-50 to-purple-50 backdrop-blur-md border-blue-200 shadow-sm"
            }`}
          >
            <h2
              className={`text-xl font-bold mb-4 ${effectiveTheme.text} flex items-center gap-2`}
            >
              <Trash2 className="w-6 h-6 text-red-500" />
              Delete Chat
            </h2>
            {(() => {
              const c = chatToDelete;
              if (!c) return null;
              const isGroup = Boolean(
                c.isGroupChat || c.isgroupchat || c.isGroup || c.isGroupChat
              );
              const members = c.users || c.participants || [];
              const isMember = (members || []).some((m) => {
                const uid = m && (m._id || m.id || m);
                return uid && String(uid) === String(currentUserId);
              });

              if (isGroup && isMember) {
                return (
                  <p className={`mb-4 ${effectiveTheme.textSecondary}`}>
                    You are still a member of this group. You must leave the
                    group before you can delete it. Open Group Info and leave
                    the group first.
                  </p>
                );
              }

              // non-member (user left) or not a group
              return (
                <p className={`mb-4 ${effectiveTheme.textSecondary}`}>
                  This will clear out all messages for you in this chat, but the
                  chat and messages will still be available to other members.
                </p>
              );
            })()}

            {!(
              chatToDelete &&
              (chatToDelete.users || chatToDelete.participants || []).some(
                (m) => {
                  const uid = m && (m._id || m.id || m);
                  return uid && String(uid) === String(currentUserId);
                }
              )
            ) && (
              <div className="mb-4 flex items-center gap-3">
                <input
                  id="keepMedia"
                  type="checkbox"
                  checked={keepMediaOnDelete}
                  onChange={(e) => setKeepMediaOnDelete(e.target.checked)}
                />
                <label
                  htmlFor="keepMedia"
                  className={`${effectiveTheme.textSecondary}`}
                >
                  Keep attachments & screenshots from this chat in the media
                  gallery
                </label>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                onClick={() => {
                  setShowDeleteChatModal(false);
                  setChatToDelete(null);
                }}
              >
                Close
              </button>

              {!(
                chatToDelete &&
                (chatToDelete.users || chatToDelete.participants || []).some(
                  (m) => {
                    const uid = m && (m._id || m.id || m);
                    return uid && String(uid) === String(currentUserId);
                  }
                )
              ) && (
                <button
                  className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition"
                  onClick={confirmDeleteChat}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
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

      {/* Blocked users modal */}
      {/* Block confirmation modal */}
      {showBlockConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          style={{
            backgroundColor:
              effectiveTheme.mode === "dark"
                ? "rgba(0,0,0,0.4)"
                : "rgba(255,255,255,0.85)",
          }}
          onClick={() => {
            setShowBlockConfirmModal(false);
            setUserToBlock(null);
          }}
        >
          <div
            className={`rounded-2xl shadow-2xl p-8 max-w-sm w-full relative border ${
              effectiveTheme.mode === "dark"
                ? `${effectiveTheme.secondary} ${effectiveTheme.border}`
                : "bg-gradient-to-br from-blue-50 to-purple-50 backdrop-blur-md border-blue-200 shadow-sm"
            }`}
          >
            <h2
              className={`text-xl font-bold mb-4 ${effectiveTheme.text} flex items-center gap-2`}
            >
              <UserMinus className="w-6 h-6 text-red-500" />
              Block {userToBlock?.name || userToBlock?.chatName || "User"}?
            </h2>
            <p className={`${effectiveTheme.textSecondary} mb-6`}>
              This person won't be able to message. They won't know you blocked
              them.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                onClick={() => {
                  setShowBlockConfirmModal(false);
                  setUserToBlock(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition"
                onClick={confirmBlockUser}
              >
                Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pin Replace Modal */}
      {showPinReplaceModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => {
            setShowPinReplaceModal(false);
            setPendingPinMessageId(null);
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={`${effectiveTheme.secondary} rounded-lg shadow-2xl w-[90%] max-w-md overflow-hidden`}
          >
            {/* Header */}
            <div className="px-6 py-5">
              <h2 className={`text-xl font-semibold ${effectiveTheme.text}`}>
                Replace oldest pin?
              </h2>
              <p
                className={`${effectiveTheme.textSecondary} mt-3 text-sm leading-relaxed`}
              >
                Your new pin will replace the oldest one.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={handleReplaceOldestPin}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                Continue
              </button>
              <button
                onClick={() => {
                  setShowPinReplaceModal(false);
                  setPendingPinMessageId(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showBlockedModal && (
        <BlockedUsers
          onClose={() => setShowBlockedModal(false)}
          effectiveTheme={effectiveTheme}
          onUnblock={handleUnblockUser}
          selectedContact={selectedContact}
        />
      )}

      {/* Archive manager modal */}
      {showArchiveModal && (
        <ArchiveManager
          onClose={() => setShowArchiveModal(false)}
          effectiveTheme={effectiveTheme}
          onOpenChat={handleOpenChatFromArchive}
          onUnarchive={handleUnarchiveChat}
        />
      )}

      {/* Media, Links & Docs Viewer */}
      {showMediaViewer && (
        <MediaLinksDocsViewer
          onClose={() => setShowMediaViewer(false)}
          effectiveTheme={effectiveTheme}
          contacts={contacts}
          selectedContact={selectedContact}
        />
      )}

      {/* Forward message modal */}
      <ForwardMessageModal
        isOpen={showForwardModal}
        onClose={() => {
          setShowForwardModal(false);
          setMessagesToForward([]);
        }}
        onForward={handleForwardToChats}
        // Use the dedicated forward-only list when available so we don't
        // overwrite or disturb the main `recentChats` list used elsewhere.
        contacts={
          forwardRecentChats && forwardRecentChats.length > 0
            ? forwardRecentChats
            : recentChats
        }
        effectiveTheme={effectiveTheme}
        currentUserId={currentUserId}
        // Pass single message when only one, else pass messages array
        message={
          messagesToForward && messagesToForward.length === 1
            ? messagesToForward[0]
            : null
        }
        messages={
          messagesToForward && messagesToForward.length > 0
            ? messagesToForward
            : null
        }
        setMessage={(m) => {
          // update the single message content in messagesToForward if present
          if (!m) return;
          setMessagesToForward((prev) => {
            if (!prev || prev.length === 0) return prev;
            if (prev.length === 1) return [{ ...prev[0], ...m }];
            return prev;
          });
        }}
      />

      {/* Delete message modal */}
      <DeleteMessageModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setMessageToDelete(null);
        }}
        onConfirmDelete={confirmDeleteMessage}
        effectiveTheme={effectiveTheme}
      />

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
              onClick={() => navigate("/chats")}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                activeNavItem === "chats"
                  ? effectiveTheme.mode === "dark"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-blue-500 text-white shadow-lg"
                  : effectiveTheme.mode === "dark"
                    ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200"
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              }`}
              title="Chats"
            >
              <MessageCircle className="w-5 h-5" />
            </motion.button>

            {/* Groups */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/groups")}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                activeNavItem === "groups"
                  ? effectiveTheme.mode === "dark"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-blue-500 text-white shadow-lg"
                  : effectiveTheme.mode === "dark"
                    ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200"
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              }`}
              title="Groups"
            >
              <Users className="w-5 h-5" />
            </motion.button>

            {/* Documents */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/documents")}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                activeNavItem === "documents"
                  ? effectiveTheme.mode === "dark"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-blue-500 text-white shadow-lg"
                  : effectiveTheme.mode === "dark"
                    ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200"
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              }`}
              title="Documents"
            >
              <Folder className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Bottom Navigation Items */}
          <div className="flex flex-col space-y-4 items-center">
            {/* Profile */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/profile")}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                activeNavItem === "profile"
                  ? effectiveTheme.mode === "dark"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-blue-500 text-white shadow-lg"
                  : effectiveTheme.mode === "dark"
                    ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200"
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              }`}
              title="Profile"
            >
              <User className="w-5 h-5" />
            </motion.button>

            {/* Settings */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/settings")}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                activeNavItem === "settings"
                  ? effectiveTheme.mode === "dark"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-blue-500 text-white shadow-lg"
                  : effectiveTheme.mode === "dark"
                    ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200"
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              }`}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </motion.button>

            {/* Logout */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLogout}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                effectiveTheme.mode === "dark"
                  ? "hover:bg-red-900/30 text-red-400 hover:text-red-300"
                  : "hover:bg-red-50 text-red-500 hover:text-red-600"
              }`}
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Sidebar */}
        <AnimatePresence mode="wait">
          {showSidebar &&
            !(isMobileView && (showGroupCreation || showNewChat)) &&
            !["profile", "settings"].includes(activeSection) && (
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
                  isMobileView
                    ? "absolute z-20 w-full h-full"
                    : "w-1/3 min-w-80 h-full"
                } ${
                  effectiveTheme.mode === "dark" || theme === "dark"
                    ? "backdrop-blur-xl bg-gray-900/30 border-r border-white/10"
                    : "bg-white/95 backdrop-blur-xl border-r border-gray-200 shadow-lg"
                } flex flex-col overflow-hidden`}
              >
                {/* Search Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Logo
                        size="md"
                        showText={true}
                        textClassName={effectiveTheme.text}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        title="Open archived chats"
                        onClick={() => setShowArchiveModal(true)}
                        className={`p-2 rounded ${effectiveTheme.hover} ${effectiveTheme.text}`}
                      >
                        <Archive className="w-5 h-5" />
                      </button>
                      <div className="relative" ref={moreMenuRef}>
                        <button
                          title="More options"
                          onClick={() => setShowMoreMenu(!showMoreMenu)}
                          className={`p-2 rounded ${effectiveTheme.hover} ${effectiveTheme.text}`}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        <AnimatePresence>
                          {showMoreMenu && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className={`absolute right-0 mt-2 w-56 border ${effectiveTheme.border} rounded-lg shadow-xl z-50 overflow-hidden`}
                              style={
                                effectiveTheme.mode === "dark"
                                  ? {
                                      backgroundColor: "#232b36",
                                      boxShadow:
                                        "0 4px 32px 0 rgba(0,0,0,0.25)",
                                      backdropFilter: "none",
                                      WebkitBackdropFilter: "none",
                                    }
                                  : { backgroundColor: "#fff" }
                              }
                            >
                              <button
                                onClick={() => {
                                  setShowBlockedModal(true);
                                  setShowMoreMenu(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 ${effectiveTheme.hover} ${effectiveTheme.text} transition-colors`}
                              >
                                <UserMinus className="w-5 h-5" />
                                <span>Blocked Users</span>
                              </button>
                              <button
                                onClick={() => {
                                  setShowMediaViewer(true);
                                  setShowMoreMenu(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 ${effectiveTheme.hover} ${effectiveTheme.text} transition-colors`}
                              >
                                <FileText className="w-5 h-5" />
                                <span>Media, Links & Docs</span>
                              </button>

                              {/* Divider */}
                              <div
                                className={`border-t ${effectiveTheme.border} my-1`}
                              ></div>

                              {/* Checkbox for Chat Requests Received */}
                              <button
                                onClick={() =>
                                  setShowChatRequestsReceived(
                                    !showChatRequestsReceived
                                  )
                                }
                                className={`w-full flex items-center gap-3 px-4 py-3 ${effectiveTheme.hover} ${effectiveTheme.text} transition-colors`}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div
                                    className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                                      showChatRequestsReceived
                                        ? "bg-blue-500 border-blue-500"
                                        : `border-gray-400 ${effectiveTheme.mode === "dark" ? "border-gray-500" : "border-gray-300"}`
                                    }`}
                                  >
                                    {showChatRequestsReceived && (
                                      <svg
                                        className="w-3 h-3 text-white"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path d="M5 13l4 4L19 7"></path>
                                      </svg>
                                    )}
                                  </div>
                                  <span>Show Chat Requests Received</span>
                                </div>
                              </button>

                              {/* Checkbox for Chat Invites Accepted */}
                              <button
                                onClick={() =>
                                  setShowChatInvitesAccepted(
                                    !showChatInvitesAccepted
                                  )
                                }
                                className={`w-full flex items-center gap-3 px-4 py-3 ${effectiveTheme.hover} ${effectiveTheme.text} transition-colors`}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div
                                    className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                                      showChatInvitesAccepted
                                        ? "bg-blue-500 border-blue-500"
                                        : `border-gray-400 ${effectiveTheme.mode === "dark" ? "border-gray-500" : "border-gray-300"}`
                                    }`}
                                  >
                                    {showChatInvitesAccepted && (
                                      <svg
                                        className="w-3 h-3 text-white"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path d="M5 13l4 4L19 7"></path>
                                      </svg>
                                    )}
                                  </div>
                                  <span>Show Chat Invites Accepted</span>
                                </div>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
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
                            : "Search groups..."
                      }
                      value={searchTerm}
                      onChange={handleSearchTermChange}
                      className={`w-full pl-10 pr-4 py-3 bg-transparent ${effectiveTheme.text} placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
                    />
                  </div>
                </div>

                {/* Chat Sidebar Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Alerts Section: Chat Requests & Accepted - Hide for documents section */}
                  {activeSection !== "documents" &&
                    showChatRequestsReceived && (
                      <div className="flex-shrink-0">
                        {/* Chat Requests Dropdown */}
                        <div className="mb-2 rounded-md justify-between items-center px-2 py-1">
                          <button
                            onClick={() =>
                              setShowReceivedDropdown(!showReceivedDropdown)
                            }
                            className={`w-full flex justify-between items-center px-3 py-2 rounded-lg ${
                              effectiveTheme.mode === "dark"
                                ? "hover:bg-blue-900/30 text-blue-200"
                                : "hover:bg-blue-50 text-blue-800"
                            } transition-colors font-medium`}
                          >
                            <span className="flex items-center gap-2">
                              <img
                                src={chatReqIcon}
                                alt="Chat Requests"
                                className="w-4 h-4"
                              />
                              Chat Requests Received ({receivedChats.length})
                            </span>
                            {showReceivedDropdown ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>

                          <AnimatePresence>
                            {showReceivedDropdown && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                  duration: 0.3,
                                  ease: "easeInOut",
                                }}
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
                                  {receivedChats.length > 0 ? (
                                    receivedChats.map((req) => (
                                      <div
                                        key={req._id || req.email}
                                        className={`flex justify-between items-center p-2 rounded-md ${
                                          effectiveTheme.mode === "dark"
                                            ? "hover:bg-gray-700/50"
                                            : "hover:bg-gray-100"
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
                                            <p
                                              className={`font-medium truncate ${
                                                effectiveTheme.mode === "dark"
                                                  ? "text-gray-100"
                                                  : "text-gray-900"
                                              }`}
                                            >
                                              {req.name ||
                                                req.email?.split("@")[0] ||
                                                "Unknown User"}
                                            </p>
                                            {req.message ? (
                                              <p
                                                className={`text-sm truncate ${
                                                  effectiveTheme.mode === "dark"
                                                    ? "text-gray-400"
                                                    : "text-gray-600"
                                                }`}
                                              >
                                                "{req.message}"
                                              </p>
                                            ) : (
                                              <p className="text-sm text-gray-500 truncate">
                                                No message
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          {/* Reject */}
                                          <button
                                            onClick={() =>
                                              handleRejectChat(req.email)
                                            }
                                            className="
    px-3 py-1 text-xs rounded-md
    border border-red-500
    text-red-500
    hover:bg-red-600/20 hover:text-red-700
    active:bg-red-500/30
    transition-colors duration-200
  "
                                          >
                                            Reject
                                          </button>

                                          {/* Accept */}
                                          <button
                                            onClick={() =>
                                              handleAcceptChat(req)
                                            }
                                            className="px-3 py-1 text-xs rounded-md
      bg-green-600 text-white
      hover:bg-green-700 transition"
                                          >
                                            Accept
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div
                                      className={`w-full flex items-center px-4 py-3 rounded-lg ${
                                        effectiveTheme.mode === "dark"
                                          ? "bg-[#232e3e] text-gray-400"
                                          : "bg-gray-100 text-gray-500"
                                      }`}
                                    >
                                      No new requests
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                  {/* 🔹 Accepted Chats Dropdown */}
                  {activeSection !== "documents" && showChatInvitesAccepted && (
                    <div className="flex-shrink-0">
                      <div className="mb-2 rounded-md justify-between items-center px-2 py-1">
                        <button
                          onClick={() =>
                            setShowAcceptedDropdown(!showAcceptedDropdown)
                          }
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
                            Chat Invites Accepted (
                            {filteredAcceptedChats?.length || 0})
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
                                {filteredAcceptedChats &&
                                filteredAcceptedChats.length > 0 ? (
                                  filteredAcceptedChats.map((chat, index) => (
                                    <motion.div
                                      key={
                                        chat._id ||
                                        chat.email ||
                                        `accepted-${index}`
                                      }
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
                                            alt={
                                              chat.name || chat.email || "User"
                                            }
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
                                            {chat.name?.trim() &&
                                            chat.name !== "Unknown User"
                                              ? chat.name
                                              : chat.email?.split("@")[0] ||
                                                "Unknown User"}
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
                                      effectiveTheme.mode === "dark"
                                        ? "bg-[#232e3e] text-gray-400"
                                        : "bg-gray-100 text-gray-500"
                                    }`}
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
                  )}

                  {/* 🧭 Contacts/Documents List */}
                  <div
                    className="flex-1 overflow-y-auto p-4 space-y-4 sidebar-scroll"
                    style={{
                      scrollbarWidth: "thin",
                      scrollbarColor:
                        effectiveTheme.mode === "dark"
                          ? "#667eea transparent" // Blue-purple for dark mode
                          : "#8b5cf6 transparent", // Purple for light mode
                    }}
                  >
                    {activeSection === "documents" ? (
                      /* Documents List */
                      <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {/* Header with dropdown toggle */}
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setIsExpanded(!isExpanded)}
                          >
                            <h4
                              className={`font-semibold ${effectiveTheme.text}`}
                            >
                              Document History
                            </h4>

                            {isExpanded ? (
                              <ChevronUp
                                className={`w-5 h-5 ${effectiveTheme.textSecondary}`}
                              />
                            ) : (
                              <ChevronDown
                                className={`w-5 h-5 ${effectiveTheme.textSecondary}`}
                              />
                            )}
                          </div>

                          {/* Animated Dropdown */}
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-3 overflow-hidden"
                              >
                                {loading ? (
                                  <div
                                    className={`text-center py-4 ${effectiveTheme.textSecondary}`}
                                  >
                                    Loading...
                                  </div>
                                ) : (
                                  <>
                                    {/* 📌 PINNED DOCUMENTS */}
                                    {pinnedDocs.length > 0 && (
                                      <div className="space-y-3">
                                        <h4
                                          className={`text-sm font-semibold ${effectiveTheme.text}`}
                                        >
                                          📌 Pinned
                                        </h4>

                                        {pinnedDocs.map((doc) => (
                                          <motion.div
                                            key={doc._id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => {
                                              if (
                                                !selectedDocument ||
                                                selectedDocument._id !== doc._id
                                              ) {
                                                setSelectedDocument(doc);
                                                setIsNewDocumentChat(false);
                                              }
                                            }}
                                            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 
                        ${effectiveTheme.secondary} border ${effectiveTheme.border} hover:${effectiveTheme.hover}
                        flex justify-between items-center`}
                                          >
                                            {/* Text */}
                                            <div className="flex flex-col">
                                              <p
                                                className={`font-medium truncate ${effectiveTheme.text}`}
                                              >
                                                {doc.fileName ||
                                                  "Untitled Document"}
                                              </p>
                                              <p
                                                className={`text-xs truncate mt-0.5 ${effectiveTheme.textSecondary}`}
                                              >
                                                {doc.updatedAt
                                                  ? new Date(
                                                      doc.updatedAt
                                                    ).toLocaleString()
                                                  : "No date"}
                                              </p>
                                            </div>

                                            {/* PIN + DELETE icons */}
                                            <div className="flex space-x-2">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  togglePin(doc._id, true);
                                                }}
                                                className="p-2"
                                              >
                                                <PinOff className="w-5 h-5 text-yellow-500" />
                                              </button>

                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  deleteDocument(doc._id);
                                                }}
                                                className="p-2"
                                              >
                                                <Trash2 className="w-5 h-5 text-red-500" />
                                              </button>
                                            </div>
                                          </motion.div>
                                        ))}
                                      </div>
                                    )}

                                    {/* 🗂️ NORMAL UNPINNED DOCUMENTS */}
                                    <div className="space-y-2 mt-4">
                                      <h4
                                        className={`text-sm font-semibold ${effectiveTheme.text}`}
                                      >
                                        All Documents
                                      </h4>

                                      {documentChats
                                        .filter((d) => !d.isPinned)
                                        .map((doc) => (
                                          <motion.div
                                            key={doc._id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => {
                                              if (
                                                !selectedDocument ||
                                                selectedDocument._id !== doc._id
                                              ) {
                                                setSelectedDocument(doc);
                                                setIsNewDocumentChat(false);
                                              }
                                            }}
                                            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 
                        ${effectiveTheme.secondary} border ${effectiveTheme.border} hover:${effectiveTheme.hover}
                        flex justify-between items-center`}
                                          >
                                            <div className="flex flex-col">
                                              <p
                                                className={`font-medium truncate ${effectiveTheme.text}`}
                                              >
                                                {doc.fileName ||
                                                  "Untitled Document"}
                                              </p>
                                              <p
                                                className={`text-xs truncate mt-0.5 ${effectiveTheme.textSecondary}`}
                                              >
                                                {doc.updatedAt
                                                  ? new Date(
                                                      doc.updatedAt
                                                    ).toLocaleString()
                                                  : "No date available"}
                                              </p>
                                            </div>

                                            {/* PIN + DELETE icons */}
                                            <div className="flex space-x-2">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  togglePin(doc._id, false);
                                                }}
                                                className="p-2"
                                              >
                                                <Pin
                                                  className={`w-5 h-5 ${effectiveTheme.textSecondary}`}
                                                />
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  askDelete(doc._id); // instead of window.confirm
                                                }}
                                                className="p-2"
                                              >
                                                <Trash2 className="w-5 h-5 text-red-500" />
                                              </button>
                                            </div>
                                          </motion.div>
                                        ))}
                                    </div>
                                  </>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                          {/* 🆕 Floating New Chat Button */}
                          <div className="flex justify-center mt-8">
                            <motion.button
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              transition={{ type: "spring", stiffness: 220 }}
                              onClick={() => {
                                setSelectedDocument(null);
                                setIsNewDocumentChat(true);
                              }}
                              className={`flex items-center space-x-3 ${effectiveTheme.secondary} px-5 py-3 rounded-xl shadow-lg border ${effectiveTheme.border} hover:${effectiveTheme.hover} transition-all duration-200 group`}
                            >
                              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                                <MessageSquare className="w-5 h-5 text-white" />
                              </div>

        <span className={`font-semibold ${effectiveTheme.text}`}>
          New Chat
        </span>
      </motion.button>
    </div>
  </div>
</>




  ) : (
    /* Regular Chats and Contacts */
    <>
      {/* Show filtered results when searching, otherwise show recent chats and contacts */}
      {searchTerm.trim() ? (
        <>
              {filteredContacts.length > 0 ? (
            <div className="flex flex-col gap-2">
              {filteredContacts.map((contact) => (
                    <ContactItem
                      key={contact.id}
                      contact={contact}
                      computedIsOnline={(function() {
                        const base = typeof contact.__computedIsOnline !== 'undefined' ? contact.__computedIsOnline : contact.isOnline;
                        try {
                          if (selectedContact && String(selectedContact.chatId || selectedContact.id || selectedContact._id) === String(contact.chatId || contact.id || contact._id) && hasBlockedYouState) {
                            return false;
                          }
                        } catch (e) {}
                        return base;
                      })()}
                      effectiveTheme={effectiveTheme}
                      isSelected={String(selectedContact?.chatId || selectedContact?.id || selectedContact?._id) === String(contact.chatId || contact.id || contact._id)}
                      onSelect={(c) => handleOpenChat(c)}
                    />
              ))}
            </div>
          ) : (
            <div className="text-center space-y-4 mt-10">
              <p className={effectiveTheme.mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                No chats found matching "{searchTerm}"
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Filtered Chats/Groups List */}
          {(loading || !minLoadingComplete || !dataFetched) ? (
  <div className="flex flex-col items-center justify-center py-10">
    <svg
      className="animate-spin h-8 w-8 text-blue-500 mb-3"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      ></path>
    </svg>
    <span className={effectiveTheme.mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
      Loading chats...
    </span>
  </div>
) : (
  (() => {
    // Ensure every chat has an avatar before filtering
    const chatsWithAvatar = recentChats.map(chat => ({
      ...chat,
      avatar: chat.avatar,
    }));

                                let filtered = [];
                                if (activeNavItem === "chats") {
                                  filtered = chatsWithAvatar.filter(
                                    (c) => !c.isGroupChat
                                  );
                                } else if (activeNavItem === "groups") {
                                  filtered = chatsWithAvatar.filter(
                                    (c) => c.isGroupChat
                                  );
                                } else {
                                  filtered = chatsWithAvatar;
                                }

                                return (
                                  <div className="flex flex-col gap-2">
                                    <h4
                                      className={`font-semibold ${effectiveTheme.mode === "dark" ? "text-gray-300" : "text-gray-700"}`}
                                    >
                                      {activeNavItem === "groups"
                                        ? "Groups"
                                        : "Recent Chats"}
                                    </h4>

          {filtered.length > 0 ? (
          filtered.map(chat => (
            <ContactItem
              key={chat.chatId || chat.id}
              contact={chat}
              computedIsOnline={(function() {
                const base = typeof chat.__computedIsOnline !== 'undefined' ? chat.__computedIsOnline : chat.isOnline;
                try {
                  if (selectedContact && String(selectedContact.chatId || selectedContact.id || selectedContact._id) === String(chat.chatId || chat.id || chat._id) && hasBlockedYouState) {
                    return false;
                  }
                } catch (e) {}
                return base;
              })()}
              effectiveTheme={effectiveTheme}
              isSelected={String(selectedContact?.chatId || selectedContact?.id || selectedContact?._id) === String(chat.chatId || chat.id || chat._id)}
              onSelect={(c) => handleOpenChat(c)}
            />
          ))
        ) : (!loading && minLoadingComplete && dataFetched) ? (
          activeNavItem === 'groups' ? (
            <div className="mt-2 text-sm">
              <p className={effectiveTheme.mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                You're not in any group!
              </p>
            </div>
          ) : (
            <div className="mt-2 text-sm">
              <p className={effectiveTheme.mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                You don't have any active chat going on!
              </p>
            </div>
          )
        ) : null}
      </div>
    );
  })()
)}
        </>
      )}

                        {/* Empty State: Only show if loading is false and there are no chats or contacts */}
                        {!loading &&
                        minLoadingComplete &&
                        dataFetched &&
                        !searchTerm.trim() &&
                        recentChats.length === 0 &&
                        contacts.length === 0 ? (
                          <div className="text-center space-y-4 mt-10">
                            <p
                              className={
                                effectiveTheme.mode === "dark"
                                  ? "text-gray-400"
                                  : "text-gray-500"
                              }
                            >
                              Start chatting with Chasmos!
                            </p>
                            <button
                              onClick={() =>
                                activeNavItem === "groups"
                                  ? setShowGroupCreation(true)
                                  : setShowNewChat(true)
                              }
                              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                            >
                              {activeNavItem === "groups"
                                ? "Start creating group"
                                : "Start new chat"}
                            </button>
                          </div>
                        ) : null}
                      </>
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
                      transition={{ duration: 0.4 }}
                      className={`absolute ${isMobileView ? "bottom-20 right-6 fixed" : "bottom-20 right-6"} flex flex-col space-y-3 z-30`}
                    >
                      {/* Create Group */}
                      {/* <motion.button
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
                      </motion.button> */}
                      <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        onClick={handleCreateGroup}
                        className={`flex items-center space-x-3 ${effectiveTheme.mode === "dark" ? effectiveTheme.secondary : "bg-white"} px-4 py-3 rounded-lg shadow-lg border ${effectiveTheme.border} hover:${effectiveTheme.hover} transition-colors group`}
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
                        transition={{ delay: 0.25 }}
                        onClick={handleNewChat}
                        className={`flex items-center space-x-3 ${effectiveTheme.mode === "dark" ? effectiveTheme.secondary : "bg-white"} px-4 py-3 rounded-lg shadow-lg border ${effectiveTheme.border} hover:${effectiveTheme.hover} transition-colors group`}
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
                        transition={{ delay: 0.35 }}
                        onClick={handleInviteUser}
                        className={`flex items-center space-x-3 ${effectiveTheme.mode === "dark" ? effectiveTheme.secondary : "bg-white"} px-4 py-3 rounded-lg shadow-lg border ${effectiveTheme.border} hover:${effectiveTheme.hover} transition-colors group`}
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
                    ref={floatingButtonRef}
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
                    className={`absolute ${isMobileView ? "bottom-6 right-6 fixed" : "bottom-6 right-6"} w-14 h-14 rounded-full flex items-center justify-center text-white transition-all duration-300 z-20 group`}
                    style={{
                      background: showFloatingMenu
                        ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                        : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                      boxShadow: showFloatingMenu
                        ? "0 8px 25px rgba(239, 68, 68, 0.3)"
                        : "0 8px 25px rgba(59, 130, 246, 0.3)",
                      border: "none",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
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
                        <X className="w-6 h-6 text-white" />
                      ) : (
                        <MessageSquare className="w-6 h-6 text-white" />
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
          {activeSection === "profile" ? (
            <Profile
              effectiveTheme={effectiveTheme}
              onClose={() => navigate("/chats")}
            />
          ) : activeSection === "settings" ? (
            <SettingsPage
              effectiveTheme={effectiveTheme}
              onClose={() => navigate("/chats")}
              onProfileClick={() => navigate("/profile")}
            />
          ) : showGroupCreation ? (
            <GroupCreation
              contacts={contacts}
              effectiveTheme={effectiveTheme}
              onClose={handleCloseGroupCreation}
              onCreateGroup={handleCreateGroupComplete}
            />
          ) : showNewChat ? (
            <NewChat
              existingContacts={[...googleContacts, ...contacts]}
              effectiveTheme={effectiveTheme}
              onClose={handleCloseNewChat}
              onStartChat={handleStartNewChat}
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
          ) : activeSection === "documents" && !selectedDocument ? (
            // Documents section welcome screen
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-md w-full">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className={`w-24 h-24 rounded-full ${effectiveTheme.accent} mx-auto mb-6 flex items-center justify-center`}
                >
                  <FileText className="w-12 h-12 text-white" />
                </motion.div>
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className={`text-2xl font-bold mb-3 ${effectiveTheme.text}`}
                >
                  Document Chat
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className={`text-base ${effectiveTheme.textSecondary} mb-6`}
                >
                  Upload a document to start chatting with AI about its contents
                </motion.p>
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsNewDocumentChat(true)}
                  className={`px-6 py-3 ${effectiveTheme.accent} text-white rounded-lg font-medium transition-all flex items-center gap-2 mx-auto`}
                  style={{
                    background:
                      effectiveTheme.mode === "dark" ? "#667eea" : "#8b5cf6",
                  }}
                >
                  <Plus className="w-5 h-5" />
                  Upload Document
                </motion.button>
              </div>
            </div>
          ) : activeSection === "groups" && !selectedContact ? (
            // Groups section welcome screen
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-md w-full">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex justify-center mb-6"
                >
                  <Logo size="lg" showText={false} />
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
                  Select a group conversation to start messaging
                </motion.p>
              </div>
            </div>
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
              {/* compute online status for selected contact */}
              {
                (() => {
                  const isGroup = selectedContact.isGroup || selectedContact.isGroupChat || selectedContact.isgroupchat;
                  let __isOnline = false;
                  let __groupOnlineCount = 0;
                  if (isGroup) {
                    const members = selectedContact.group?.participants || selectedContact.group?.users || selectedContact.users || selectedContact.participants || [];
                    // Prefer server-provided group online count when available (fallback to local computation)
                    const chatIdKey = selectedContact.chatId || selectedContact._id || selectedContact.id || selectedContact.id;
                    if (groupOnlineCounts && (groupOnlineCounts[String(chatIdKey)] != null)) {
                      // server count includes this user's own connection — subtract 1
                      const raw = Number(groupOnlineCounts[String(chatIdKey)] || 0);
                      __groupOnlineCount = Math.max(0, raw - 1);
                    } else {
                      __groupOnlineCount = (members || []).filter(m => {
                        const uid = m && (m._id || m.id || m);
                        if (!uid) return false;
                        if (String(uid) === String(currentUserId)) return false;
                        return onlineUsers.has(String(uid));
                      }).length;
                    }
                  } else {
                    const contactUserId = selectedContact.userId || selectedContact._id || selectedContact.id || selectedContact.participantId;
                    __isOnline = contactUserId ? onlineUsers.has(String(contactUserId)) : Boolean(selectedContact.isOnline);
                  }
                  // If the other user has blocked the current user, hide their online status
                  if (hasBlockedYouState) {
                    __isOnline = false;
                  }
                  // attach computed to object so we can pass through props
                  selectedContact.__computedIsOnline = __isOnline;
                  selectedContact.__computedGroupOnlineCount = __groupOnlineCount;
                  return null;
                })()
              }
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
                onBlockUser={handleBlockUser}
                onUnblockUser={handleUnblockUser}
                onArchiveChat={handleArchiveChat}
                onUnarchiveChat={handleUnarchiveChat}
                onDeleteChat={checkAndOpenDeleteChat}
                isBlocked={isBlockedState}
                isArchived={isArchivedState}
                setShowDeleteChatModal={setShowDeleteChatModal}
                setChatToDelete={setChatToDelete}
                isOnline={selectedContact.__computedIsOnline}
                groupOnlineCount={selectedContact.__computedGroupOnlineCount}
                onOpenGroupInfo={handleOpenGroupInfo}
                onOpenUserProfile={() => {
                  console.log(
                    "🔔 onOpenUserProfile called with selectedContact:",
                    selectedContact
                  );
                  // Get current user from localStorage
                  const currentUser = JSON.parse(
                    localStorage.getItem("chasmos_user_data") || "{}"
                  );
                  const currentUserId = currentUser._id || currentUser.id;

                  // Try to get userId from selectedContact first (most direct)
                  let userIdToShow = selectedContact.userId;

                  // If not found, try to find from participants array
                  if (
                    !userIdToShow &&
                    selectedContact.participants?.length > 0
                  ) {
                    const otherUser = selectedContact.participants.find(
                      (p) => String(p._id || p.id) !== String(currentUserId)
                    );
                    userIdToShow = otherUser?._id || otherUser?.id;
                  }

                  console.log(
                    "👤 Opening user profile with userId:",
                    userIdToShow
                  );

                  if (userIdToShow) {
                    setProfileUserId(userIdToShow);
                    setShowUserProfileModal(true);
                  }
                }}
                selectedHasLeftGroup={selectedHasLeftGroup}
              />

              {showGroupInfoModal && currentGroup && (
                <>
                  {console.log("Rendering modal for:", currentGroup)}
                  {showGroupInfoModal && currentGroup && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
                      <GroupInfoModal
                        open={showGroupInfoModal}
                        onClose={handleCloseGroupInfo}
                        group={currentGroup}
                        currentUserId={(() => {
                          try {
                            return (
                              JSON.parse(
                                localStorage.getItem("chasmos_user_data") ||
                                  "{}"
                              )._id ||
                              JSON.parse(
                                localStorage.getItem("chasmos_user_data") ||
                                  "{}"
                              ).id ||
                              null
                            );
                          } catch (e) {
                            return null;
                          }
                        })()}
                        onUpdateGroup={(updated) => setCurrentGroup(updated)}
                        onDeleteGroup={(groupId) => {
                          console.log("Group deleted:", groupId);
                          setShowGroupInfoModal(false);
                          setCurrentGroup(null);
                        }}
                        effectiveTheme={effectiveTheme}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Pinned Messages Bar */}
              <PinnedMessagesBar
                pinnedMessages={pinnedMessagesData}
                onUnpin={handleUnpinFromBar}
                onNavigateToMessage={handleNavigateToPinnedMessage}
                effectiveTheme={effectiveTheme}
              />

              <div className="flex-1 overflow-hidden relative">
                {/* User Profile Modal - Positioned here to overlay messages */}
                <UserProfileModal
                  isOpen={showUserProfileModal}
                  onClose={() => setShowUserProfileModal(false)}
                  userId={profileUserId}
                  effectiveTheme={effectiveTheme}
                  onNavigateToMessage={handleNavigateToPinnedMessage}
                />

                {/* Hovered message date (overlay, does not affect layout) */}
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
                  <AnimatePresence>
                    {hoverDateLabel && (
                      <motion.div
                        key={hoverDateLabel}
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className={`text-xs px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm border ${effectiveTheme.border} ${effectiveTheme.mode === "dark" ? "bg-gradient-to-r from-purple-600/60 to-blue-600/60 text-white" : "bg-gradient-to-r from-blue-400/60 to-indigo-400/60 text-white"}`}
                      >
                        {hoverDateLabel}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <MessagesArea
                  key={selectedContact.id}
                  filteredMessages={getMessagesForContact(
                    selectedContact.id,
                    chatSearchTerm
                  )}
                  selectedContact={selectedContact}
                  selectedHasLeftGroup={selectedHasLeftGroup}
                  pinnedMessages={pinnedMessages}
                  onPinMessage={handlePinMessage}
                  onHoverDateChange={handleHoverDateChange}
                  effectiveTheme={effectiveTheme}
                  isTyping={isTyping}
                  selectedContactId={selectedContact.id}
                  currentUserId={currentUserId}
                  onDeleteMessage={handleDeleteMessage}
                  onStartForwardSelection={onStartForwardSelection}
                  onEditMessage={handleEditMessage}
                  manualScrollInProgress={manualScrollInProgressRef}
                  onPollVote={handlePollVote}
                  onPollRemoveVote={handlePollRemoveVote}
                  onPollClose={handlePollClose}
                  // Reply props
                  // Reply props
                  replySelectionActive={replySelectionActive}
                  selectedReplies={selectedReplies}
                  onStartReplySelection={onStartReplySelection}
                  onToggleSelectReply={onToggleSelectReply}
                  onClearReplySelection={onClearReplySelection}
                  // Forward props
                  forwardSelectionActive={forwardSelectionActive}
                  selectedForwards={selectedForwards}
                  onToggleSelectForward={onToggleSelectForward}
                  onClearForwardSelection={onClearForwardSelection}
                />
              </div>
              {forwardSelectionActive ? (
                <div
                  className={`p-2 border-t border-b flex items-center justify-between space-x-4 ${effectiveTheme.mode === "dark" ? "bg-gradient-to-r from-black/30 to-white/2" : "bg-gradient-to-r from-white to-gray-50"}`}
                  style={{
                    background:
                      effectiveTheme.mode === "dark"
                        ? "linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))"
                        : "linear-gradient(90deg, rgba(0,0,0,0.02), rgba(0,0,0,0.01))",
                    borderColor: effectiveTheme.border
                      ? effectiveTheme.border.replace("border-", "")
                      : undefined,
                  }}
                >
                  <div className={`text-sm ${effectiveTheme.text}`}>
                    Forwarding{" "}
                    <strong className={`${effectiveTheme.text}`}>
                      {selectedForwards?.length || 0}
                    </strong>{" "}
                    message{selectedForwards?.length > 1 ? "s" : ""}
                  </div>
                  <div className="flex items-center space-x-2">
                    {forwardSelectionHint && (
                      <div className="mr-4 text-sm text-red-500" role="status">
                        {forwardSelectionHint}
                      </div>
                    )}
                    <button
                      className={`text-sm px-3 py-1 rounded ${effectiveTheme.mode === "dark" ? "bg-white/6 text-white/90" : "bg-gray-200 text-gray-800"}`}
                      onClick={() =>
                        onClearForwardSelection && onClearForwardSelection()
                      }
                    >
                      Cancel
                    </button>
                    <button
                      className={`text-sm px-3 py-1 rounded bg-blue-500 text-white`}
                      onClick={async () => {
                        // Fetch freshest recent chats for forwarding, then open modal
                        try {
                          await fetchRecentChatsForForward();
                        } catch (e) {
                          console.warn(
                            "Failed to prefetch recent chats for forward",
                            e
                          );
                        }
                        // Build messages array from selected ids and open modal without preview
                        const all =
                          getMessagesForContact(
                            selectedContact.id,
                            chatSearchTerm
                          ) || [];
                        const msgs = all.filter((m) =>
                          selectedForwards.includes(m._id || m.id)
                        );
                        setMessagesToForward(msgs);
                        setShowForwardModal(true);
                        onClearForwardSelection && onClearForwardSelection();
                      }}
                    >
                      Forward
                    </button>
                  </div>
                </div>
              ) : (
                replySelectionActive && (
                  <div
                    className={`p-2 border-t border-b flex items-center justify-between space-x-4 ${effectiveTheme.mode === "dark" ? "bg-gradient-to-r from-black/30 to-white/2" : "bg-gradient-to-r from-white to-gray-50"}`}
                    style={{
                      background:
                        effectiveTheme.mode === "dark"
                          ? "linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))"
                          : "linear-gradient(90deg, rgba(0,0,0,0.02), rgba(0,0,0,0.01))",
                      borderColor: effectiveTheme.border
                        ? effectiveTheme.border.replace("border-", "")
                        : undefined,
                    }}
                  >
                    <div className={`text-sm ${effectiveTheme.text}`}>
                      Replying to{" "}
                      <strong className={`${effectiveTheme.text}`}>
                        {selectedReplies?.length || 0}
                      </strong>{" "}
                      message{selectedReplies?.length > 1 ? "s" : ""}
                    </div>
                    <div className="flex items-center space-x-2">
                      {replySelectionHint && (
                        <div
                          className="mr-4 text-sm text-red-500"
                          role="status"
                        >
                          {replySelectionHint}
                        </div>
                      )}
                      <button
                        className={`text-sm px-3 py-1 rounded ${effectiveTheme.mode === "dark" ? "bg-white/6 text-white/90" : "bg-gray-200 text-gray-800"}`}
                        onClick={() =>
                          onClearReplySelection && onClearReplySelection()
                        }
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )
              )}

              {(() => {
                // Use selectedHasLeftGroup state - don't recalculate here
                const isGroupChatFlag =
                  selectedContact?.isGroup ||
                  selectedContact?.isGroupChat ||
                  false;
                const canSendMessages = !isGroupChatFlag || !selectedHasLeftGroup;
                
                if (canSendMessages) {
                  return (
                    <MessageInput
                      onSendMessage={(payload) => {
                        // Helper to get correct chatId and userId for message sending
                        let chatId =
                          selectedContact?.chatId || selectedContact?._id;
                        let userId = null;
                        // For new 1-on-1 chats, pass userId (other participant)
                        if (
                          !chatId &&
                          selectedContact &&
                          !selectedContact.isGroup
                        ) {
                          // Prefer userId, then id, then fallback to _id (but not self)
                          if (
                            selectedContact.userId &&
                            selectedContact.userId !== currentUserId
                          ) {
                            userId = selectedContact.userId;
                          } else if (
                            selectedContact.id &&
                            selectedContact.id !== currentUserId
                          ) {
                            userId = selectedContact.id;
                          } else if (
                            selectedContact._id &&
                            selectedContact._id !== currentUserId
                          ) {
                            userId = selectedContact._id;
                          } else if (
                            selectedContact.participants &&
                            Array.isArray(selectedContact.participants)
                          ) {
                            // Fallback: find the participant that is not the current user
                            const other = selectedContact.participants.find(
                              (pid) => pid !== currentUserId
                            );
                            if (other) userId = other;
                          }
                        }
                        // Log for debugging
                        console.log(
                          "[MessageInput->onSendMessage] chatId:",
                          chatId,
                          "userId:",
                          userId,
                          "selectedContact:",
                          selectedContact,
                          "selectedReplies:",
                          selectedReplies
                        );
                        handleSendMessageFromInput({
                          ...payload,
                          chatId,
                          userId,
                          repliedTo: selectedReplies || [],
                        });
                      }}
                      selectedContact={selectedContact}
                      selectedReplies={selectedReplies}
                      effectiveTheme={effectiveTheme}
                      isGroupChat={
                        selectedContact?.isGroup ||
                        selectedContact?.isGroupChat ||
                        false
                      }
                      socket={socketRef.current}
                      currentUser={_localUser}
                    />
                  );
                }
                return (
                  <div className="p-4 border-t text-center text-sm text-yellow-700 bg-yellow-50">
                    You're no longer part of this group.
                  </div>
                );
              })()}
            </>
          ) : !isMobileView ? (
            // CASE 4: Empty welcome screen
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-sm w-full">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex justify-center mb-6"
                >
                  <Logo size="lg" showText={false} />
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

      {/* Message Notification Container */}
      <MessageNotificationContainer
        notifications={notifications}
        onClose={(notifId) => {
          setNotifications((prev) => prev.filter((n) => n.id !== notifId));
        }}
        onReply={async (chatId, replyText) => {
          try {
            // Send quick reply
            const token =
              localStorage.getItem("token") ||
              localStorage.getItem("chasmos_auth_token");
            if (!token) return;

            const payload = {
              content: replyText,
              chatId: chatId,
            };

            const res = await fetch(`${API_BASE_URL}/api/message`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(payload),
            });

            if (res.ok) {
              const sentMsg = await res.json();
              const messageObj =
                sentMsg && sentMsg.message ? sentMsg.message : sentMsg;

              // Compute preview text and attachment flag
              const preview =
                messageObj?.content ||
                (messageObj?.attachments &&
                  messageObj.attachments[0]?.fileName) ||
                "Attachment";
              const hasAttachment = Boolean(
                messageObj?.attachments && messageObj.attachments.length
              );

              // Update recent chats preview so UI lists show the quick-reply text immediately
              try {
                updateRecentChat &&
                  updateRecentChat(chatId, preview, hasAttachment, {
                    timestamp:
                      messageObj &&
                      (messageObj.timestamp || messageObj.createdAt)
                        ? new Date(
                            messageObj.timestamp || messageObj.createdAt
                          ).getTime()
                        : Date.now(),
                    ...(messageObj?.chat &&
                    (messageObj.chat.isGroupChat || messageObj.chat.isGroup)
                      ? {
                          name:
                            messageObj.chat.chatName || messageObj.chat.name,
                        }
                      : {}),
                  });
              } catch (e) {
                console.warn("updateRecentChat failed", e);
              }

              try {
                updateContactPreview &&
                  updateContactPreview(chatId, preview, hasAttachment, {
                    attachmentFileName:
                      messageObj?.attachments &&
                      messageObj.attachments[0]?.fileName,
                    attachmentMime:
                      messageObj?.attachments &&
                      messageObj.attachments[0]?.mimeType,
                  });
              } catch (e) {
                console.warn("updateContactPreview failed", e);
              }

              // Clear unread count for this chat
              setRecentChats((prev) =>
                prev.map((c) =>
                  String(c.chatId) === String(chatId) ||
                  String(c.id) === String(chatId)
                    ? { ...c, unreadCount: 0 }
                    : c
                )
              );

              // If this chat is currently open, append the message into messages state
              setMessages((prev) => {
                try {
                  const formatted = {
                    id: messageObj._id || messageObj.id || Date.now(),
                    type: messageObj.type || "text",
                    content: messageObj.content || messageObj.text || preview,
                    sender:
                      messageObj.sender?._id ||
                      messageObj.sender ||
                      currentUserId ||
                      "me",
                    timestamp: new Date(
                      messageObj.timestamp || messageObj.createdAt || Date.now()
                    ).getTime(),
                    status: messageObj.status || "sent",
                    attachments: messageObj.attachments || [],
                  };
                  const copy = { ...prev };
                  if (!copy[chatId]) copy[chatId] = [];
                  copy[chatId] = [...copy[chatId], formatted];

                  // Record last sent time and emit socket event so other participants receive the new message in real-time
                  try {
                    lastSentAtRef.current = Date.now();
                  } catch (e) {}
                  try {
                    if (socketRef.current?.emit) {
                      socketRef.current.emit("new message", messageObj);
                    }
                  } catch (e) {
                    console.warn("Socket emit failed", e);
                  }

                  return copy;
                } catch (e) {
                  return prev;
                }
              });

              // Notify server that this chat's messages are read (so other participants see read-for-all)
              try {
                if (socketRef.current?.emit) {
                  socketRef.current.emit("message-read", { chatId });
                }
              } catch (e) {
                console.warn("Emit message-read failed", e);
              }
              // Status will be updated when backend sends message-read socket event

              toast.success("Reply sent!");
            }
          } catch (error) {
            console.error("Error sending quick reply:", error);
            toast.error("Failed to send reply");
          }
        }}
        onOpen={async (notification) => {
          // If this notification refers to a group (only if isGroup is explicitly true), open the group chat then navigate to groups page
          try {
            if (notification && notification.isGroup === true) {
              // Try to find the chat entry in recentChats
              const chatEntry = recentChats.find(
                (c) =>
                  String(c.chatId) === String(notification.chatId) ||
                  String(c.id) === String(notification.chatId) ||
                  String(c._id) === String(notification.chatId)
              );

              const token =
                localStorage.getItem("token") ||
                localStorage.getItem("chasmos_auth_token");
              let chatToOpen = null;

              // Prefer recentChats entry when available
              if (chatEntry) {
                // ensure group flag is present (sometimes recent entry is missing it)
                chatEntry.isGroup =
                  chatEntry.isGroup ||
                  chatEntry.isGroupChat ||
                  (chatEntry.participants &&
                    chatEntry.participants.length > 1) ||
                  true;
                chatToOpen = chatEntry;
              } else if (token) {
                try {
                  const resp = await fetch(
                    `${API_BASE_URL}/api/chat/${notification.chatId}`,
                    {
                      headers: { Authorization: `Bearer ${token}` },
                    }
                  );
                  if (resp.ok) {
                    const chatData = await resp.json();
                    const normalizedChatId = String(
                      chatData._id ||
                        chatData.chatId ||
                        chatData.id ||
                        notification.chatId
                    );
                    chatToOpen = {
                      id: normalizedChatId,
                      chatId: normalizedChatId,
                      name:
                        chatData.chatName ||
                        chatData.name ||
                        notification.groupName ||
                        notification.senderName,
                      avatar:
                        chatData.avatar ||
                        chatData.pic ||
                        notification.avatar ||
                        null,
                      participants:
                        chatData.participants || chatData.users || [],
                      isGroup: chatData.isGroupChat || chatData.isGroup || true,
                    };
                  }
                } catch (e) {
                  console.warn(
                    "Failed to fetch group chat details for notification",
                    e
                  );
                }
              }

              // Fallback minimal object if fetch/lookup didn't produce a full object
              if (!chatToOpen) {
                const normalizedChatId = String(
                  notification.chatId || notification.chatId || Date.now()
                );
                chatToOpen = {
                  id: normalizedChatId,
                  chatId: normalizedChatId,
                  name: notification.groupName || notification.senderName,
                  avatar: notification.avatar || null,
                  participants: [],
                  isGroup: true,
                };
              }

              try {
                await handleOpenChat(chatToOpen);
              } catch (e) {
                console.warn("handleOpenChat failed for group notification", e);
              }
              try {
                navigate("/groups");
              } catch (e) {
                /* ignore navigation errors */
              }
              setNotifications((prev) =>
                prev.filter((n) => n.id !== notification.id)
              );
              return;
            }
          } catch (e) {
            // ignore unexpected errors
          }

          // Otherwise, open the chat when notification is clicked
          const chat = recentChats.find(
            (c) =>
              String(c.chatId) === String(notification.chatId) ||
              String(c.id) === String(notification.chatId)
          );
          if (chat) {
            handleOpenChat(chat);
          }
          // Remove this notification
          setNotifications((prev) =>
            prev.filter((n) => n.id !== notification.id)
          );
        }}
      />
    </>
  );
};

export default ChattingPage;