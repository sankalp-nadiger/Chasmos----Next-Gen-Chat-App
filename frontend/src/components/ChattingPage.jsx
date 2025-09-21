import React, { useState, useEffect, useMemo, useCallback } from "react";
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
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import MessageInput from "./MessageInput";
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
  currentTheme, 
  isMobileView, 
  onBackToContacts, 
  onToggleChatSearch 
}) => {
  return (
    <div
      className={`${currentTheme.secondary} p-4 flex items-center justify-between`}
    >
      <div className="flex items-center space-x-3">
        {isMobileView && (
          <button
            onClick={onBackToContacts}
            className={`${currentTheme.text} hover:${currentTheme.accent} p-1 rounded`}
          >
            ←
          </button>
        )}

        <div className="relative">
          {selectedContact.isDocument ? (
            <div
              className={`w-10 h-10 rounded-full ${currentTheme.accent} flex items-center justify-center`}
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
              className={`w-10 h-10 rounded-full ${currentTheme.accent} flex items-center justify-center text-white font-semibold`}
            >
              {generateAvatarFallback(selectedContact.name)}
            </div>
          )}

          {selectedContact.isOnline && !selectedContact.isDocument && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>

        <div>
          <h2 className={`font-semibold ${currentTheme.text}`}>
            {selectedContact.name}
          </h2>
          <p className={`text-sm ${currentTheme.textSecondary}`}>
            {selectedContact.isTyping
              ? "typing..."
              : selectedContact.isOnline && !selectedContact.isDocument
              ? "Online"
              : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <Search
          className={`w-5 h-5 ${currentTheme.textSecondary} cursor-pointer hover:${currentTheme.text} transition-colors duration-200`}
          onClick={onToggleChatSearch}
        />
        <MoreVertical
          className={`w-5 h-5 ${currentTheme.textSecondary} cursor-pointer hover:${currentTheme.text} transition-colors duration-200`}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.selectedContact?.id === nextProps.selectedContact?.id &&
         prevProps.selectedContact?.isTyping === nextProps.selectedContact?.isTyping;
});

// MessageBubble component definition (moved before MessagesArea)
const MessageBubble = React.memo(({ message, isPinned, onPinToggle }) => {
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
            ? "bg-blue-500 text-white"
            : "bg-gray-100 text-gray-900"
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
           prevProps.isPinned === nextProps.isPinned;
  });// Memoized Messages Area Component  
const MessagesArea = React.memo(({ 
  filteredMessages, 
  pinnedMessages, 
  onPinMessage, 
  currentTheme,
  isTyping,
  selectedContactId 
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
      <AnimatePresence mode="popLayout">
        {filteredMessages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            isPinned={pinnedMessages[message.id] || false}
            onPinToggle={onPinMessage}
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
            className={`max-w-xs px-4 py-2 rounded-lg ${currentTheme.message.received}`}
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
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.filteredMessages.length === nextProps.filteredMessages.length &&
         prevProps.selectedContactId === nextProps.selectedContactId;
});

const ChattingPage = () => {
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
  const [pinnedMessages, setPinnedMessages] = useState({});

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
  // Close chat search bar when switching chats
  useEffect(() => {
    setShowChatSearch(false);
    setChatSearchTerm("");
  }, [selectedContact]);

  const filteredContacts = useMemo(
    () => searchContacts(contacts, searchTerm),
    [contacts, searchTerm]
  );

  const filteredMessages = useMemo(() => {
    if (!selectedContact || !chatSearchTerm) {
      return messages[selectedContact?.id] || [];
    }
    const contactMessages = messages[selectedContact.id] || [];
    return contactMessages.filter((message) => {
      const text = message.text || message.content || "";
      return text.toLowerCase().includes(chatSearchTerm.toLowerCase());
    });
  }, [messages, selectedContact, chatSearchTerm]);

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
    setShowChatSearch(!showChatSearch);
  }, [showChatSearch]);

  const closeChatSearch = useCallback(() => {
    setShowChatSearch(false);
    setChatSearchTerm("");
  }, []);

  const handlePinMessage = useCallback((messageId) => {
    setPinnedMessages((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  }, []);

  const ContactItem = React.memo(({ contact, isSelected, onSelect }) => (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2, ease: "easeInOut" },
      }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center p-3 cursor-pointer transition-all duration-300 ${
        currentTheme.hover
      } ${
        isSelected
          ? currentTheme.accent + " text-white shadow-lg"
          : ""
      }`}
      onClick={() => onSelect(contact)}
    >
      <motion.div
        className="relative"
        whileHover={{ rotate: [0, -5, 5, 0], transition: { duration: 0.5 } }}
      >
        {contact.isDocument ? (
          <motion.div
            className={`w-12 h-12 rounded-full ${currentTheme.accent} flex items-center justify-center`}
            whileHover={{ rotateY: 180, transition: { duration: 0.6 } }}
          >
            <FileText className="w-6 h-6 text-white" />
          </motion.div>
        ) : contact.avatar ? (
          <motion.img
            src={contact.avatar}
            alt={contact.name}
            className="w-12 h-12 rounded-full object-cover"
            whileHover={{ scale: 1.1, transition: { duration: 0.3 } }}
          />
        ) : (
          <motion.div
            className={`w-12 h-12 rounded-full ${currentTheme.accent} flex items-center justify-center text-white font-semibold`}
            whileHover={{
              scale: 1.1,
              rotateY: 180,
              transition: { duration: 0.4 },
            }}
          >
            {generateAvatarFallback(contact.name)}
          </motion.div>
        )}

        {contact.isOnline && !contact.isDocument && (
          <motion.div
            className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </motion.div>

      <div className="ml-3 flex-1 min-w-0">
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h3
            className={`font-semibold truncate ${
              isSelected
                ? "text-white"
                : currentTheme.text
            }`}
          >
            {contact.name}
          </h3>
          <motion.span
            className={`text-xs ${
              isSelected
                ? "text-blue-100"
                : currentTheme.textSecondary
            }`}
            initial={{ x: 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {contact.timestamp}
          </motion.span>
        </motion.div>

        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <p
            className={`text-sm truncate ${
              contact.isTyping
                ? "text-green-500 italic"
                : isSelected
                ? "text-blue-100"
                : currentTheme.textSecondary
            }`}
          >
            {contact.isTyping ? (
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                typing...
              </motion.span>
            ) : (
              contact.lastMessage
            )}
          </p>

          {contact.unreadCount > 0 && (
            <motion.span
              className={`${currentTheme.accent} text-white text-xs rounded-full px-2 py-1 ml-2 min-w-[1.25rem] text-center`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              whileHover={{ scale: 1.1 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 25,
              }}
            >
              {contact.unreadCount}
            </motion.span>
          )}
        </motion.div>
      </div>
    </motion.div>
  ), (prevProps, nextProps) => {
    // Only re-render if contact data or selection state changes
    return prevProps.contact.id === nextProps.contact.id &&
           prevProps.isSelected === nextProps.isSelected &&
           prevProps.contact.lastMessage === nextProps.contact.lastMessage &&
           prevProps.contact.unreadCount === nextProps.contact.unreadCount &&
           prevProps.contact.isTyping === nextProps.contact.isTyping;
  });

  return (
    <div className={`h-screen flex ${currentTheme.primary}`}>
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
            } ${currentTheme.sidebar} flex flex-col backdrop-blur-sm`}
          >
            {/* Search Header */}
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-full ${currentTheme.accent} flex items-center justify-center`}
                >
                  <span className="text-white font-bold">C</span>
                </div>
                <h1 className={`text-xl font-bold ${currentTheme.text}`}>
                  Chasmos
                </h1>
              </div>

              <div className={`relative ${currentTheme.searchBg} rounded-lg`}>
                <Search
                  className={`absolute left-3 top-3 w-4 h-4 ${currentTheme.textSecondary}`}
                />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={handleSearchTermChange}
                  className={`w-full pl-10 pr-4 py-3 bg-transparent ${currentTheme.text} placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
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
                />
              ))}
            </div>

            {/* Floating Add Button */}
            <button
              className={`absolute ${isMobileView ? 'bottom-6 right-6 fixed' : 'bottom-6 right-6'} w-14 h-14 ${currentTheme.accent} rounded-full ${currentTheme.shadow} flex items-center justify-center text-white hover:opacity-90 transition-opacity z-20`}
              onClick={() => console.log("Add new chat")}
            >
              <span className="text-white text-2xl font-bold leading-none flex items-center justify-center">
                +
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <ChatHeader
              selectedContact={selectedContact}
              currentTheme={currentTheme}
              isMobileView={isMobileView}
              onBackToContacts={handleBackToContacts}
              onToggleChatSearch={toggleChatSearch}
            />

            {/* Chat Search Input */}
            <AnimatePresence>
              {showChatSearch && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="fixed left-1/2 top-6 z-30 w-[90vw] max-w-md -translate-x-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-3 flex items-center space-x-2"
                >
                  <Search className="w-5 h-5 text-gray-400 dark:text-gray-300" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={chatSearchTerm}
                    onChange={handleChatSearchTermChange}
                    className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none px-2"
                    autoFocus
                  />
                  {chatSearchTerm && (
                    <button
                      onClick={closeChatSearch}
                      className="text-gray-400 hover:text-gray-700 dark:hover:text-white text-xl px-2"
                    >
                      ×
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Area */}
            <MessagesArea
              filteredMessages={filteredMessages}
              pinnedMessages={pinnedMessages}
              onPinMessage={handlePinMessage}
              currentTheme={currentTheme}
              isTyping={isTyping}
              selectedContactId={selectedContact.id}
            />

            {/* Message Input */}
            <MessageInput
              onSendMessage={handleSendMessageFromInput}
              selectedContact={selectedContact}
              currentTheme={currentTheme}
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
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full ${currentTheme.accent} mx-auto mb-4 sm:mb-6 flex items-center justify-center`}
              >
                <span className="text-2xl sm:text-3xl text-white font-bold">
                  C
                </span>
              </motion.div>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className={`text-xl sm:text-2xl font-bold mb-2 ${currentTheme.text}`}
              >
                Welcome to Chasmos
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className={`text-sm sm:text-base ${currentTheme.textSecondary}`}
              >
                Select a conversation to start messaging
              </motion.p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ChattingPage;
