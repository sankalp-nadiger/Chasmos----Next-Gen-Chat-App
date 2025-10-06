import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MoreVertical,
  Plus,
  FileText,
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
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import MessageInput from "./MessageInput";
import ContactItem from "./ContactItem";
import {
  mockContacts,
  mockMessages,
  formatMessageTime,
  searchContacts,
  generateAvatarFallback,
} from "../utils/mockData";

// Memoized Chat Header Component
const ChatHeader = React.memo(({ 
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
  showThreeDotsMenu,
  onToggleThreeDotsMenu,
  threeDotsMenuRef,
  onCloseThreeDotsMenu,
  pinnedMessages,
  onShowPinnedMessages
}) => {
  const pinnedCount = Object.values(pinnedMessages || {}).filter(Boolean).length;
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
          <div className="relative">
            <MoreVertical
              className={`w-5 h-5 ${effectiveTheme.textSecondary} cursor-pointer hover:${effectiveTheme.text} transition-colors duration-200`}
              onClick={onToggleThreeDotsMenu}
            />
            
            {/* Three Dots Menu */}
            {showThreeDotsMenu && (
              <div
                ref={threeDotsMenuRef}
                className={`absolute top-8 right-0 w-56 ${effectiveTheme.secondary} border ${effectiveTheme.border} rounded-lg shadow-xl py-2 overflow-hidden`}
style={{ zIndex: 9999 }}
              >
                {/* Share Contact */}
                <div className={`px-4 py-2 ${effectiveTheme.hover} cursor-pointer flex items-center space-x-3 transition-colors`}>
                  <Share2 className={`h-4 w-4 ${effectiveTheme.textSecondary}`} />
                  <span className={`${effectiveTheme.text} text-sm`}>Share Contact</span>
                </div>

                {/* Archive Chat */}
                <div className={`px-4 py-2 ${effectiveTheme.hover} cursor-pointer flex items-center space-x-3 transition-colors`}>
                  <Archive className={`h-4 w-4 ${effectiveTheme.textSecondary}`} />
                  <span className={`${effectiveTheme.text} text-sm`}>Archive Chat</span>
                </div>

                {/* Chat Settings */}
                <div className={`px-4 py-2 ${effectiveTheme.hover} cursor-pointer flex items-center space-x-3 transition-colors`}>
                  <Settings className={`h-4 w-4 ${effectiveTheme.textSecondary}`} />
                  <span className={`${effectiveTheme.text} text-sm`}>Chat Settings</span>
                </div>

                {/* Divider */}
                <div className={`border-t ${effectiveTheme.border} my-2`}></div>

                {/* Delete Chat */}
                <div className="px-4 py-2 hover:bg-red-50 cursor-pointer flex items-center space-x-3 transition-colors">
                  <Trash2 className="h-4 w-4 text-red-500" />
                  <span className="text-red-500 text-sm">Delete Chat</span>
                </div>
              </div>
            )}
            
            {/* Search bar below three dots */}
            {showChatSearch && (
              <div
                ref={chatSearchRef}
                className={`absolute top-8 right-0 w-80 ${effectiveTheme.secondary} border ${effectiveTheme.border} rounded-lg shadow-xl p-3 z-50`}
              >
                <div className="flex items-center space-x-2">
                  <Search className={`h-4 w-4 ${effectiveTheme.textSecondary}`} />
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
                    onClick={()=>{onCloseChatSearch()}}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.selectedContact?.id === nextProps.selectedContact?.id &&
         prevProps.selectedContact?.isTyping === nextProps.selectedContact?.isTyping &&
         prevProps.showChatSearch === nextProps.showChatSearch &&
         prevProps.chatSearchTerm === nextProps.chatSearchTerm &&
         prevProps.showThreeDotsMenu === nextProps.showThreeDotsMenu &&
         JSON.stringify(prevProps.pinnedMessages) === JSON.stringify(nextProps.pinnedMessages);
});

// MessageBubble component definition (moved before MessagesArea)
const MessageBubble = React.memo(({ message, isPinned, onPinToggle, effectiveTheme }) => {
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
            ? effectiveTheme.message?.sent || 'bg-blue-500 text-white'
            : effectiveTheme.message?.received || 'bg-gray-200 text-gray-800'
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
              isPinned
                ? "text-yellow-400 fill-current"
                : "text-gray-500"
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
  }, (prevProps, nextProps) => {
    return prevProps.message.id === nextProps.message.id && 
           prevProps.isPinned === nextProps.isPinned &&
           prevProps.currentTheme === nextProps.currentTheme;
  });// Messages Area Component  
const MessagesArea = ({ 
  filteredMessages, 
  pinnedMessages, 
  onPinMessage, 
  effectiveTheme,
  isTyping,
  selectedContactId 
}) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredMessages, isTyping]);

  // Auto-scroll to bottom when component mounts or contact changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
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
              className={`max-w-xs px-4 py-2 rounded-lg ${effectiveTheme.message?.received || 'bg-gray-200 text-gray-800'}`}
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
  const { currentTheme } = useTheme();
  
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [chatSearchTerm, setChatSearchTerm] = useState("");
  const [contacts, setContacts] = useState(mockContacts);
  const [messages, setMessages] = useState(mockMessages);
  const [isTyping, setIsTyping] = useState({});
  const [isMobileView, setIsMobileView] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [showThreeDotsMenu, setShowThreeDotsMenu] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState({});

  // Ref for chat search container (click-outside functionality)
  const chatSearchRef = useRef(null);
  const threeDotsMenuRef = useRef(null);

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
      if (chatSearchRef.current && !chatSearchRef.current.contains(event.target) && showChatSearch) {
        setShowChatSearch(false);
        setChatSearchTerm("");
      }
      if (threeDotsMenuRef.current && !threeDotsMenuRef.current.contains(event.target) && showThreeDotsMenu) {
        setShowThreeDotsMenu(false);
      }
    };

    if (showChatSearch || showThreeDotsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showChatSearch, showThreeDotsMenu]);

  const filteredContacts = useMemo(
    () => searchContacts(contacts, searchTerm),
    [contacts, searchTerm]
  );

  // Remove useMemo and calculate messages directly in render
  const getMessagesForContact = (contactId, searchTerm = "") => {
    if (!contactId) return [];
    
    const contactMessages = messages[contactId] || [];
    
    if (!searchTerm.trim()) {
      return contactMessages;
    }
    
    return contactMessages.filter((message) => {
      const text = message.text || message.content || "";
      return text.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  // Memoize input change handlers
  const handleSearchTermChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleChatSearchTermChange = useCallback((e) => {
    setChatSearchTerm(e.target.value);
  }, []);

  // Handle sending message from the MessageInput component
  const handleSendMessageFromInput = useCallback((messageText) => {
    if (!messageText.trim() || !selectedContact) return;

    const newMessage = {
      id: Date.now(),
      type: "text",
      content: messageText,
      sender: "me",
      timestamp: new Date(),
      isRead: true,
    };

    setMessages((prev) => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), newMessage],
    }));

    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === selectedContact.id
          ? { ...contact, lastMessage: messageText, timestamp: "now" }
          : contact
      )
    );
  }, [selectedContact]);

  const handleContactSelect = useCallback(
    (contact) => {
      setSelectedContact(contact);
      // Mark messages as read when contact is selected
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, unreadCount: 0 } : c))
      );
      if (isMobileView) {
        setShowSidebar(false);
      }
    },
    [isMobileView]
  );

  const handleBackToContacts = useCallback(() => {
    if (isMobileView) {
      setSelectedContact(null);
      setShowSidebar(true);
    }
  }, [isMobileView]);

  const toggleChatSearch = useCallback(() => {
    console.log('toggleChatSearch called, current state:', showChatSearch);
    setShowChatSearch(!showChatSearch);
    console.log('toggleChatSearch setting state to:', !showChatSearch);
  }, [showChatSearch]);

  const closeChatSearch = useCallback(() => {
    setShowChatSearch(false);
    setChatSearchTerm("");
  }, []);

  const toggleThreeDotsMenu = useCallback(() => {
    console.log('toggleThreeDotsMenu called, current state:', showThreeDotsMenu);
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
        starColor: 'rgba(251, 146, 60, 0.8)',
        period: 'morning',
        themeOverride: null
      };
    } else if (hour >= 12 && hour < 17) {
      // Day (12 PM - 5 PM): Bright theme
      return {
        isNightMode: false,
        starColor: 'rgba(59, 130, 246, 0.6)',
        period: 'day',
        themeOverride: null
      };
    } else if (hour >= 17 && hour < 21) {
      // Evening (5 PM - 9 PM): Sunset theme
      return {
        isNightMode: false,
        starColor: 'rgba(168, 85, 247, 0.8)',
        period: 'evening',
        themeOverride: null
      };
    } else {
      // Night (9 PM - 5 AM): Full night mode with overlays
      return {
        isNightMode: true,
        starColor: 'rgba(255, 255, 255, 1)',
        period: 'night',
        themeOverride: {
          primary: 'bg-gray-900 text-white',
          sidebar: 'bg-gray-900/95 border-r border-gray-700',
          secondary: 'bg-gray-800',
          accent: 'bg-blue-600',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          border: 'border-gray-600',
          hover: 'hover:bg-gray-700',
          searchBg: 'bg-gray-700/50',
          inputBg: 'bg-gray-700',
          cardBg: 'bg-gray-800',
          messageBg: 'bg-gray-700',
          mode: 'dark'
        }
      };
    }
  }, []);

  const [cosmicTheme, setCosmicTheme] = useState(() => getTimeBasedCosmicTheme());
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date().getHours());

  // Create effective theme that combines current theme with time-based overrides
  const effectiveTheme = cosmicTheme.themeOverride || currentTheme;

  // Update cosmic theme more frequently and check for hour changes
  useEffect(() => {
    const updateTheme = () => {
      const currentHour = new Date().getHours();
      const newTheme = getTimeBasedCosmicTheme();
      
      // Update if hour changed or theme period changed
      if (currentHour !== lastUpdateTime || newTheme.period !== cosmicTheme.period) {
        setCosmicTheme(newTheme);
        setLastUpdateTime(currentHour);
        console.log(`Cosmic theme updated to: ${newTheme.period} at hour ${currentHour}`);
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
      
      <div className={`fixed inset-0 w-full h-full flex overflow-hidden transition-all duration-1000 ${
        cosmicTheme.isNightMode ? 'bg-black' : currentTheme.primary
      }`}>
        
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
                animation: 'cosmicShift 20s ease-in-out infinite'
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
                      boxShadow: `0 0 ${size * 2}px rgba(255, 255, 255, 0.8)`
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
                    boxShadow: '0 0 6px #ffffff, 0 0 12px #ffffff'
                  }}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Day time subtle cosmic background */}
        {!cosmicTheme.isNightMode && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
            {[...Array(20)].map((_, i) => {
              const size = Math.random() * 2 + 1;
              const left = Math.random() * 100;
              const top = Math.random() * 100;
              const delay = Math.random() * 3;
              
              return (
                <div
                  key={`day-star-${i}`}
                  style={{
                    position: 'absolute',
                    width: `${size}px`,
                    height: `${size}px`,
                    left: `${left}%`,
                    top: `${top}%`,
                    background: cosmicTheme.starColor,
                    borderRadius: '50%',
                    animation: `twinkle 3s ease-in-out infinite`,
                    animationDelay: `${delay}s`,
                    opacity: 0.4
                  }}
                />
              );
            })}
          </div>
        )}
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {showSidebar && (
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
                  <div className={`w-10 h-10 rounded-full ${effectiveTheme.accent} flex items-center justify-center`}>
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
                  <h1 className={`text-xl font-bold ${effectiveTheme.text}`} style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '2px' }}>
                    Chasmos
                  </h1>
                </div>
                
                {/* Logout Button */}
                <motion.button
                  onClick={onLogout}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-lg ${effectiveTheme.hover} ${effectiveTheme.textSecondary} hover:${effectiveTheme.text} hover:text-red-500 transition-all duration-200 group`}
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 transition-transform duration-200" />
                </motion.button>
              </div>

              <div className={`relative ${effectiveTheme.searchBg} rounded-lg`}>
                <Search
                  className={`absolute left-3 top-3 w-4 h-4 ${effectiveTheme.textSecondary}`}
                />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={handleSearchTermChange}
                  className={`w-full pl-10 pr-4 py-3 bg-transparent ${effectiveTheme.text} placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
                />
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {filteredContacts.map((contact) => (
                <ContactItem 
                  key={contact.id} 
                  contact={contact} 
                  isSelected={selectedContact?.id === contact.id}
                  onSelect={handleContactSelect}
                  effectiveTheme={effectiveTheme}
                />
              ))}
            </div>

            {/* Floating Add Button */}
            <motion.button
              whileHover={{ 
                scale: 1.1,
                rotate: [0, -10, 10, -10, 0],
                boxShadow: "0 10px 30px rgba(59, 130, 246, 0.4)"
              }}
              whileTap={{ 
                scale: 0.95,
                rotate: -5
              }}
              animate={{
                y: [0, -5, 0],
                transition: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              className={`absolute ${isMobileView ? 'bottom-6 right-6 fixed' : 'bottom-6 right-6'} w-16 h-16 ${effectiveTheme.accent} rounded-full flex items-center justify-center text-white transition-all duration-300 z-20 group`}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)'
              }}
              onClick={() => console.log("Add new chat")}
            >
              <motion.div
                whileHover={{
                  rotate: 360,
                  transition: { duration: 0.6 }
                }}
                className="relative"
              >
                <MessageSquare className="w-7 h-7 text-white" />
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
                  ease: "easeOut"
                }}
              />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div key={selectedContact?.id || 'no-contact'} className="flex-1 flex flex-col relative h-full overflow-hidden">
        {selectedContact ? (
          <>
            {/* Chat Header */}
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
              showThreeDotsMenu={showThreeDotsMenu}
              onToggleThreeDotsMenu={toggleThreeDotsMenu}
              threeDotsMenuRef={threeDotsMenuRef}
              onCloseThreeDotsMenu={closeThreeDotsMenu}
              pinnedMessages={pinnedMessages}
            />

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden relative">
              <MessagesArea
                key={selectedContact.id} 
                filteredMessages={getMessagesForContact(selectedContact.id, chatSearchTerm)}
                pinnedMessages={pinnedMessages}
                onPinMessage={handlePinMessage}
                effectiveTheme={effectiveTheme}
                isTyping={isTyping}
                selectedContactId={selectedContact.id}
              />
            </div>

            {/* Message Input */}
            <MessageInput
              onSendMessage={handleSendMessageFromInput}
              selectedContact={selectedContact}
              effectiveTheme={effectiveTheme}
            />
          </>
        ) : !isMobileView ? (
          /* Welcome Screen */
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
                style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '2px' }}
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
        ) : null}
      </div>
    </div>
    </>
  );
};

export default ChattingPage;
