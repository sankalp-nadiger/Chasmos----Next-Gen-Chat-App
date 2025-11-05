/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Image, FileText, Camera, MapPin } from "lucide-react";


import chatReqIcon from "../assets/Chat-reuest.png";
import chatAcceptIcon from "../assets/chat-accepted.png";
import {
  Search,
  MoreVertical,
  Plus,
  Download,
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

// MessageBubble component definition (moved before MessagesArea)
const MessageBubble = React.memo(
  ({ message, isPinned, onPinToggle, effectiveTheme }) => {
    const isOwnMessage = message.sender === "me";

    const handlePinClick = useCallback(() => {
      onPinToggle(message.id);
    }, [message.id, onPinToggle]);

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
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
            isOwnMessage
              ? effectiveTheme.message?.sent || "bg-blue-500 text-white"
              : effectiveTheme.message?.received || "bg-gray-200 text-gray-800"
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

          {/* Pin button - shows on hover */}
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

          {message.type === "document" ? (
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className={`w-10 h-10 rounded-full ${
                  isOwnMessage ? "bg-blue-400" : "bg-gray-300"
                } flex items-center justify-center`}
                whileHover={{
                  rotate: 360,
                  transition: { duration: 0.8 },
                }}
              >
                <FileText className="w-5 h-5" />
              </motion.div>
              <div className="flex-1">
                <motion.p
                  className="font-medium"
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {message.content}
                </motion.p>
                {message.documentSize && (
                  <motion.p
                    className="text-sm opacity-75"
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {message.documentSize}
                  </motion.p>
                )}
              </div>
              <motion.div
                whileHover={{
                  scale: 1.2,
                  rotate: [0, -10, 10, 0],
                  transition: { duration: 0.3 },
                }}
                whileTap={{ scale: 0.9 }}
              >
                <Download className="w-5 h-5 cursor-pointer transition-transform" />
              </motion.div>
            </motion.div>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {message.content}
            </motion.p>
          )}

          <motion.div
            className="flex items-center justify-end mt-1 space-x-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-xs opacity-75">
              {formatMessageTime(message.timestamp)}
            </span>
            {isOwnMessage && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 400 }}
              >
                {message.isRead ? (
                  <motion.div
                    animate={{
                      color: ["#60A5FA", "#3B82F6", "#60A5FA"],
                      transition: { duration: 2, repeat: Infinity },
                    }}
                  >
                    <CheckCheck className="w-4 h-4 text-blue-400" />
                  </motion.div>
                ) : (
                  <Check className="w-4 h-4 opacity-75" />
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.isPinned === nextProps.isPinned &&
      prevProps.currentTheme === nextProps.currentTheme
    );
  }
); // Messages Area Component
const MessagesArea = ({
  filteredMessages,
  pinnedMessages,
  onPinMessage,
  effectiveTheme,
  isTyping,
  selectedContactId,
}) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [filteredMessages, isTyping]);

  // Auto-scroll to bottom when component mounts or contact changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [selectedContactId]);

  return (
    <div
      ref={messagesContainerRef}
      className="h-full overflow-y-auto p-4 space-y-4 scrollbar-hide relative"
    >
      {/* Messages Content */}
      <div className="relative z-10">
        <AnimatePresence mode="popLayout">
          {filteredMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isPinned={pinnedMessages[message.id] || false}
              onPinToggle={onPinMessage}
              effectiveTheme={effectiveTheme}
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
              className={`max-w-xs px-4 py-2 rounded-lg ${effectiveTheme.message?.received || "bg-gray-200 text-gray-800"}`}
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

        {/* Scroll target - always scroll to this element */}
        <div ref={messagesEndRef} />
      </div>
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
const [selectedDocument, setSelectedDocument] = useState({
  fileName: "MyDocument.pdf",
  messages: [],
});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
const [messageInput, setMessageInput] = useState("");
const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

const imageInputRef = useRef(null);
const attachmentMenuRef = useRef(null);

  // Ref for chat search container (click-outside functionality)
  const chatSearchRef = useRef(null);
  const threeDotsMenuRef = useRef(null);
  const floatingMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  // API Base URL from environment variable
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Fake data fallback (so UI doesn’t crash if API isn’t ready)
  // 🧠 Add this near top of ChattingPage component
  const [documentChats, setDocumentChats] = useState([
    {
      _id: "1",
      fileName: "Project_Proposal.docx",
      date: "Oct 28, 2025",
    },
    {
      _id: "2",
      fileName: "Research_Notes.pdf",
      date: "Oct 25, 2025",
    },
    {
      _id: "3",
      fileName: "Client_Meeting_Summary.txt",
      date: "Oct 20, 2025",
    },
    {
      _id: "4",
      fileName: "Final_Report.docx",
      date: "Oct 15, 2025",
    },
  ]);
 const fileInputRef = useRef(null); 
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
// Toggle attachment menu visibility
const toggleAttachmentMenu = () => {
  setShowAttachmentMenu((prev) => !prev);
};
const handleInputChange = (e) => {
  setMessageInput(e.target.value);
};
const handleKeyPress = (e) => {
  if (e.key === "Enter" && messageInput.trim()) {
    handleSendClick();
  }
};

// Handle sending message
const handleSendClick = () => {
  if (!messageInput.trim()) return;

  const newMsg = { sender: "user", text: messageInput };
  setSelectedDocument((prev) => ({
    ...prev,
    messages: [...(prev.messages || []), newMsg],
  }));

  setMessageInput("");
};

// Handle file uploads (document or image)
const handleFileUpload = (type) => {
  if (type === "document") {
    fileInputRef.current?.click();
  } else if (type === "image") {
    imageInputRef.current?.click();
  }
  setShowAttachmentMenu(false);
};

// When a file is selected
const handleFileChange = (e, type) => {
  const file = e.target.files[0];
  if (!file) return;

  const fileMsg = `${type === "image" ? "📷" : "📄"} ${file.name}`;
  setSelectedDocument((prev) => ({
    ...prev,
    messages: [...(prev.messages || []), { sender: "user", text: fileMsg }],
  }));
};

// Close attachment menu when clicking outside
useEffect(() => {
  const handleClickOutside = (event) => {
    if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) {
      setShowAttachmentMenu(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

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

        const formatted = data.map((chat) => {
          const otherUser = chat.participants.find(
            (p) => p._id !== data.loggedInUserId
          );
          return {
            id: otherUser._id,
            name: otherUser.email,
            avatar: otherUser.avatar,
            lastMessage: chat.lastMessage,
            timestamp: chat.timestamp,
            isOnline: otherUser.isOnline || false,
            unreadCount: chat.unreadCount || 0,
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

  // Handle sending message from the MessageInput component
  const handleSendMessageFromInput = useCallback(
    (messageText) => {
      if (!messageText.trim() || !selectedContact) return;

      const newMessage = {
        id: Date.now(),
        type: "text",
        content: messageText,
        sender: "me",
        timestamp: Date.now(),
        isRead: true,
      };

      // 1️⃣ Update messages
      setMessages((prevMessages) => ({
        ...prevMessages,
        [selectedContact.id]: [
          ...(prevMessages[selectedContact.id] || []),
          newMessage,
        ],
      }));

      // 2️⃣ Update recentChats
      setRecentChats((prevChats) => {
        const exists = prevChats.find((c) => c.id === selectedContact.id);
        if (exists) {
          return prevChats.map((c) =>
            c.id === selectedContact.id
              ? { ...c, lastMessage: messageText, timestamp: Date.now() }
              : c
          );
        } else {
          return [
            {
              id: selectedContact.id,
              name: selectedContact.name,
              avatar: selectedContact.avatar,
              isOnline: selectedContact.isOnline,
              lastMessage: messageText,
              timestamp: Date.now(),
              unreadCount: 0,
            },
            ...prevChats, // put new chat at top
          ];
        }
      });
    },
    [selectedContact]
  );

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
        >
          {/* Top Navigation Items */}
          <div className="flex flex-col space-y-4">
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
          <div className="flex flex-col space-y-4">
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
                  isMobileView ? "absolute z-20 w-full" : "w-1/3 min-w-80"
                } ${effectiveTheme.sidebar} flex flex-col backdrop-blur-sm`}
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

                    {/* User Menu */}
                    <div className="relative" ref={userMenuRef}>
                      <motion.button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-2 rounded-lg ${effectiveTheme.hover} ${effectiveTheme.textSecondary} hover:${effectiveTheme.text} transition-all duration-200`}
                        title="User Menu"
                      >
                        <MoreHorizontal className="w-5 h-5 transition-transform duration-200" />
                      </motion.button>

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {showUserMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={`absolute right-0 top-12 w-48 rounded-lg shadow-lg z-50 overflow-hidden ${currentTheme.secondary} border ${currentTheme.border}`}
                          >
                            {/* Dropdown Options */}
                            <div className={`py-2 relative z-10`}>
                              {/* Profile */}
                              <motion.button
                                whileHover={{ scale: 0.97 }}
                                className={`w-full px-4 py-3 text-left flex items-center space-x-3 ${currentTheme.hover} transition-colors duration-200`}
                                onClick={() => {
                                  setShowUserMenu(false);
                                  setShowProfile(true);
                                }}
                              >
                                <FaUser
                                  className="w-5 h-5"
                                  style={{ color: "#60A5FA" }}
                                />
                                <span
                                  className={`text-sm ${currentTheme.text}`}
                                >
                                  Profile
                                </span>
                              </motion.button>

                              {/* Settings */}
                              <motion.button
                                whileHover={{ scale: 0.97 }}
                                className={`w-full px-4 py-3 text-left flex items-center space-x-3 ${currentTheme.hover} transition-colors duration-200`}
                                onClick={() => {
                                  setShowUserMenu(false);
                                  setShowSettings(true);
                                }}
                              >
                                <FaCog
                                  className="w-5 h-5"
                                  style={{ color: "#3B82F6" }}
                                />
                                <span
                                  className={`text-sm ${currentTheme.text}`}
                                >
                                  Settings
                                </span>
                              </motion.button>

                              {/* Divider */}
                              <div
                                className={`my-2 h-px ${currentTheme.border}`}
                              ></div>

                              {/* Logout */}
                              <motion.button
                                whileHover={{ scale: 0.97 }}
                                className={`w-full px-4 py-3 text-left flex items-center space-x-3 ${currentTheme.hover} transition-colors duration-200 text-red-600 dark:text-red-400`}
                                onClick={() => {
                                  setShowUserMenu(false);
                                  onLogout();
                                }}
                              >
                                <FaSignOutAlt
                                  className="w-5 h-5"
                                  style={{ color: "#60A5FA" }}
                                />
                                <span className="text-sm">Logout</span>
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
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
                <div className="flex-1 flex flex-col">
                  {activeNavItem === "chats" ? (
                    <>
                      {/* 🔔 Alerts Section: Chat Requests & Accepted */}
                      <div>
                        {/* Chat Requests Dropdown */}
                        <div className="mb-2 rounded-md justify-between items-center px-2 py-1">
                          <button
                            onClick={() =>
                              setShowReceivedDropdown(!showReceivedDropdown)
                            }
                            className={`w-full flex justify-between items-center px-3 py-2 rounded-lg ${
                              effectiveTheme.hover ||
                              "hover:bg-blue-100 dark:hover:bg-blue-900"
                            } transition-colors text-blue-800 dark:text-blue-200 font-medium`}
                          >
                            <span className="flex items-center gap-2 text-gray-200">
                              <img
                                src={chatReqIcon}
                                alt="Chat Requests"
                                className="w-4 h-4"
                              />
                              Chat Requests Received (
                              {receivedChats?.length || 0})
                            </span>
                            {showReceivedDropdown ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>

                          {showReceivedDropdown && (
                            <div
                              className={`mt-2 p-2 space-y-2 max-h-44 overflow-y-auto`}
                            >
                              {receivedChats?.length > 0 ? (
                                receivedChats.map((req) => (
                                  <div
                                    key={req.id}
                                    className={`p-2 rounded cursor-pointer ${
                                      effectiveTheme.hover ||
                                      "hover:bg-gray-100 dark:hover:bg-gray-700"
                                    }`}
                                    onClick={() => setInvitePreview(req)}
                                  >
                                    <p className="font-medium truncate">
                                      {req.senderName}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">
                                      {req.inviteMessage}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <div
                                  className={`w-full flex items-center px-4 py-3 rounded-lg ${
                                    effectiveTheme.searchBg ||
                                    "bg-gray-100 dark:bg-gray-800"
                                  } text-gray-400 dark:text-gray-400`}
                                >
                                  No new requests
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Accepted Chats Dropdown */}
                        <div className="rounded-md justify-between items-center px-2 py-1">
                          <button
                            onClick={() =>
                              setShowAcceptedDropdown(!showAcceptedDropdown)
                            }
                            className={`w-full flex justify-between items-center px-3 py-2 rounded-lg ${
                              effectiveTheme.hover ||
                              "hover:bg-green-100 dark:hover:bg-green-900"
                            } transition-colors text-green-800 dark:text-green-200 font-medium`}
                          >
                            <span className="flex items-center gap-2 text-gray-200">
                              <img
                                src={chatAcceptIcon}
                                alt="Chat Requests"
                                className="w-4 h-4"
                              />
                              Chats Accepted ({acceptedChats?.length || 0})
                            </span>
                            {showAcceptedDropdown ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>

                          {showAcceptedDropdown && (
                            <div
                              className={`mt-2 p-2 space-y-2 max-h-44 overflow-y-auto`}
                            >
                              {acceptedChats?.length > 0 ? (
                                acceptedChats.map((chat) => (
                                  <div
                                    key={chat.id}
                                    className={`p-2 rounded cursor-pointer ${
                                      effectiveTheme.hover ||
                                      "hover:bg-gray-100 dark:hover:bg-gray-700"
                                    }`}
                                    onClick={() => setSelectedContact(chat)}
                                  >
                                    <p className="font-medium truncate">
                                      {chat.name}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">
                                      Click to open chat
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <div
                                  className={`w-full flex items-center px-4 py-3 rounded-lg ${
                                    effectiveTheme.searchBg ||
                                    "bg-gray-100 dark:bg-gray-800"
                                  } text-gray-400 dark:text-gray-400`}
                                >
                                  No accepted chats
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 🧭 Contacts List */}
                      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col p-4 space-y-4">
                        {recentChats.length > 0 && (
                          <div className="flex flex-col gap-2">
                            <h4 className="text-gray-600 dark:text-gray-300 font-semibold">
                              Recent Chats
                            </h4>
                            {recentChats.map((chat) => (
                              <ContactItem
                                key={chat.id}
                                contact={chat}
                                effectiveTheme={effectiveTheme}
                                onSelect={(c) => setSelectedContact(c)}
                              />
                            ))}
                          </div>
                        )}

                        {contacts.length > 0 && (
                          <div className="flex flex-col gap-2 mt-4">
                            <h4 className="text-gray-600 dark:text-gray-300 font-semibold">
                              Contacts
                            </h4>
                            {contacts.map((contact) => (
                              <ContactItem
                                key={contact.id}
                                contact={contact}
                                effectiveTheme={effectiveTheme}
                                onSelect={(c) => setSelectedContact(c)}
                              />
                            ))}
                          </div>
                        )}

                        {recentChats.length === 0 && contacts.length === 0 && (
                          <div className="text-center space-y-4 mt-10">
                            <p className="text-gray-500 dark:text-gray-400">
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

                      {/* Floating Add Button with Menu */}
                      <div className="relative">
                        {showFloatingMenu && (
                          <motion.div
                            ref={floatingMenuRef}
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className={`absolute ${
                              isMobileView
                                ? "bottom-20 right-6 fixed"
                                : "bottom-20 right-6"
                            } flex flex-col space-y-3 z-30`}
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
                          className={`absolute ${
                            isMobileView
                              ? "bottom-6 right-6 fixed"
                              : "bottom-6 right-6"
                          } w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-300 z-20 group`}
                          style={{
                            background: showFloatingMenu
                              ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                              : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                            boxShadow: showFloatingMenu
                              ? "0 8px 25px rgba(239, 68, 68, 0.3)"
                              : "0 8px 25px rgba(59, 130, 246, 0.3)",
                            border: "none",
                          }}
                          onClick={() => toggleFloatingMenu()}
                        >
                          <motion.div
                            whileHover={{
                              rotate: 360,
                              transition: { duration: 0.6 },
                            }}
                            animate={{ rotate: showFloatingMenu ? 45 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="relative"
                          >
                            {showFloatingMenu ? (
                              <X className="w-7 h-7 text-white" />
                            ) : (
                              <MessageSquare className="w-7 h-7 text-white" />
                            )}
                          </motion.div>
                          <motion.div
                            className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20"
                            animate={{ scale: [1, 1.5], opacity: [0, 0.2, 0] }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "easeOut",
                            }}
                          />
                        </motion.button>
                      </div>
                    </>
                  ) : activeNavItem === "documents" ? (
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      <h4 className="text-gray-600 dark:text-white-600 font-semibold">
                        Document History
                      </h4>
                      {documentChats?.length > 0 ? (
                        documentChats.map((doc) => (
                          <div
                            key={doc._id}
                            onClick={() => setSelectedDocument(doc)}
                            className={`p-3 rounded-lg cursor-pointer transition-all duration-200
    ${effectiveTheme.secondary || "bg-white dark:bg-[#1f1f1f]"} 
    border border-transparent 
    hover:bg-gray-100/80 dark:hover:bg-gray-800/60 
    active:scale-[0.98]`}
                          >
                            <div className="flex flex-col">
                              <p className="font-medium truncate  text-gray-400 dark:text-gray-300">
                                {doc.fileName}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-600 truncate mt-0.5">
                                {doc.date}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div
                          className={`w-full flex items-center justify-center px-4 py-3 rounded-lg ${
                            effectiveTheme.searchBg ||
                            "bg-gray-100 dark:bg-gray-800"
                          } text-gray-400 dark:text-gray-400`}
                        >
                          No document history found
                        </div>
                      )}
                    </div>
                  ) : null}
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
          ) : selectedDocument ? (
  <>
    {/* 📄 Document Chat Header */}
    <div
      className={`flex items-center justify-between px-4 py-3 border-b ${effectiveTheme.border} ${effectiveTheme.secondary}`}
    >
      <div>
        <h2 className={`font-semibold text-lg ${effectiveTheme.text}`}>
          {selectedDocument.fileName}
        </h2>
        <p className="text-sm text-gray-500">{selectedDocument.date}</p>
      </div>
      <button
        onClick={() => setSelectedDocument(null)}
        className="text-gray-400 hover:text-red-500 transition"
      >
        ✖
      </button>
    </div>

    {/* 💬 Document Chat Messages */}
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {selectedDocument.messages && selectedDocument.messages.length > 0 ? (
        selectedDocument.messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-4 py-2 rounded-2xl max-w-xs text-sm ${
                msg.sender === "user"
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-gray-400 py-10">
          Start chatting about this document
        </div>
      )}
    </div>

    {/* 📎 Document Chat Input (EXACT same design as your normal chat) */}
    <div className={`${effectiveTheme.secondary} p-4 relative border-t ${effectiveTheme.border}`}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
        onChange={(e) => handleFileChange(e, "document")}
        style={{ display: "none" }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, "image")}
        style={{ display: "none" }}
      />

      <div className="flex items-center space-x-3">
        {/* Attachment Menu */}
        <div className="relative" ref={attachmentMenuRef}>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.95 }}
          >
            <Paperclip
              className={`w-6 h-6 ${effectiveTheme.textSecondary} cursor-pointer hover:${effectiveTheme.text} transition-colors duration-200`}
              onClick={toggleAttachmentMenu}
            />
          </motion.div>

          <AnimatePresence>
            {showAttachmentMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={`absolute -top-20 left-0 ${effectiveTheme.secondary} border ${effectiveTheme.border} rounded-lg shadow-xl p-3 z-50`}
              >
                <div className="flex items-center space-x-4">
                  {/* Document Upload */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="cursor-pointer flex flex-col items-center space-y-2 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                    onClick={() => handleFileUpload("document")}
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <p className={`${effectiveTheme.text} text-xs font-medium`}>
                      Document
                    </p>
                  </motion.div>

                  {/* Image Upload */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="cursor-pointer flex flex-col items-center space-y-2 p-2 rounded-lg hover:bg-green-50 transition-colors"
                    onClick={() => handleFileUpload("image")}
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <Image className="w-5 h-5 text-white" />
                    </div>
                    <p className={`${effectiveTheme.text} text-xs font-medium`}>
                      Photo
                    </p>
                  </motion.div>

                  {/* Camera */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="cursor-pointer flex flex-col items-center space-y-2 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                    onClick={() => setShowAttachmentMenu(false)}
                  >
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <p className={`${effectiveTheme.text} text-xs font-medium`}>
                      Camera
                    </p>
                  </motion.div>

                  {/* Location */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="cursor-pointer flex flex-col items-center space-y-2 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    onClick={() => setShowAttachmentMenu(false)}
                  >
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <p className={`${effectiveTheme.text} text-xs font-medium`}>
                      Location
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Message input */}
        <div
          className={`flex-1 ${effectiveTheme.inputBg} rounded-lg px-4 py-2 flex items-center`}
        >
          <input
            type="text"
            placeholder={`Message ${selectedDocument.fileName}...`}
            value={messageInput}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className={`flex-1 bg-transparent ${effectiveTheme.text} placeholder-gray-400 focus:outline-none`}
          />
        </div>

        {/* Send button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSendClick}
          className={`${effectiveTheme.accent} p-2 rounded-full text-white hover:opacity-90 transition-opacity`}
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  </>
) :  <div className="flex-1 flex items-center justify-center p-4">
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
            </div>}
        </div>
      </div>
    </>
  );
};

export default ChattingPage;
