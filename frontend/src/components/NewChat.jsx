import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  X,
  MessageCircle,
  Clock,
} from "lucide-react";

const NewChat = ({ 
  contacts, 
  effectiveTheme, 
  onClose, 
  onStartChat,
  existingContacts = []
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter out documents and groups - only show individual contacts (people)
  const availableContacts = useMemo(() => {
    const filtered = contacts.filter(contact => 
      !contact.isDocument && 
      !contact.isGroup
    );
    return filtered;
  }, [contacts]);

  const filteredContacts = useMemo(() => 
    availableContacts.filter(contact => 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), 
    [availableContacts, searchTerm]
  );

  // Group contacts by online status
  const onlineContacts = filteredContacts.filter(contact => contact.isOnline);
  const offlineContacts = filteredContacts.filter(contact => !contact.isOnline);

  const handleStartChat = (contact) => {
    onStartChat(contact);
    onClose();
  };

  const formatLastSeen = (contact) => {
    if (contact.isOnline) return "Online";
    return contact.timestamp || "Last seen recently";
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`fixed inset-0 ${effectiveTheme.primary} flex flex-col h-screen w-screen z-50`}
    >
      {/* Header */}
      <div className={`${effectiveTheme.secondary} border-b ${effectiveTheme.border} p-4`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className={`p-2 rounded-full hover:${effectiveTheme.hover} transition-colors`}
          >
            <X className={`w-5 h-5 ${effectiveTheme.text}`} />
          </button>
          <div>
            <h2 className={`text-lg font-semibold ${effectiveTheme.text}`}>
              New Chat
            </h2>
            <p className={`text-sm ${effectiveTheme.textSecondary}`}>
              {filteredContacts.length} contacts available
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 flex-shrink-0">
        <div className={`relative ${effectiveTheme.searchBg} rounded-lg`}>
          <Search
            className={`absolute left-3 top-3 w-4 h-4 ${effectiveTheme.textSecondary}`}
          />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 bg-transparent ${effectiveTheme.text} placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
          />
        </div>
      </div>

      {/* Contacts List */}
      <div 
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{ 
          maxHeight: 'calc(100vh - 200px)',
          minHeight: '300px',
          scrollBehavior: 'smooth'
        }}
      >
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <MessageCircle className={`w-16 h-16 ${effectiveTheme.textSecondary} mb-4`} />
            <h3 className={`text-lg font-medium ${effectiveTheme.text} mb-2`}>
              No contacts found
            </h3>
            <p className={`text-sm ${effectiveTheme.textSecondary} text-center`}>
              {searchTerm 
                ? "Try adjusting your search terms"
                : `Total contacts: ${contacts.length}, Available: ${availableContacts.length}`
              }
            </p>
          </div>
        ) : (
          <>
            {/* Online Contacts */}
            {onlineContacts.length > 0 && (
              <div>
                <div className="px-4 py-2">
                  <h3 className={`text-sm font-medium ${effectiveTheme.textSecondary} uppercase tracking-wide`}>
                    Online ({onlineContacts.length})
                  </h3>
                </div>
                {onlineContacts.map((contact) => (
                  <ContactItem
                    key={contact.id}
                    contact={contact}
                    effectiveTheme={effectiveTheme}
                    onClick={() => handleStartChat(contact)}
                    showLastSeen={true}
                  />
                ))}
              </div>
            )}

            {/* Offline Contacts */}
            {offlineContacts.length > 0 && (
              <div>
                <div className="px-4 py-2">
                  <h3 className={`text-sm font-medium ${effectiveTheme.textSecondary} uppercase tracking-wide`}>
                    Recently Active ({offlineContacts.length})
                  </h3>
                </div>
                {offlineContacts.map((contact) => (
                  <ContactItem
                    key={contact.id}
                    contact={contact}
                    effectiveTheme={effectiveTheme}
                    onClick={() => handleStartChat(contact)}
                    showLastSeen={true}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

// Contact Item Component
const ContactItem = ({ contact, effectiveTheme, onClick, showLastSeen }) => {
  const formatLastSeen = (contact) => {
    if (contact.isOnline) return "Online";
    return contact.timestamp || "Last seen recently";
  };

  return (
    <motion.div
      whileHover={{ x: 4 }}
      className={`flex items-center space-x-3 p-4 cursor-pointer border-b ${effectiveTheme.border} hover:${effectiveTheme.hover} transition-all duration-200`}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="relative">
        {contact.avatar ? (
          <img
            src={contact.avatar}
            alt={contact.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
            {contact.name.charAt(0)}
          </div>
        )}
        {contact.isOnline && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Contact Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h3 className={`font-semibold ${effectiveTheme.text} truncate`}>
            {contact.name}
          </h3>
          {showLastSeen && (
            <div className="flex items-center space-x-1 ml-2">
              {!contact.isOnline && (
                <Clock className={`w-3 h-3 ${effectiveTheme.textSecondary}`} />
              )}
              <span className={`text-xs ${
                contact.isOnline ? 'text-green-500' : effectiveTheme.textSecondary
              }`}>
                {formatLastSeen(contact)}
              </span>
            </div>
          )}
        </div>
        {contact.lastMessage && (
          <p className={`text-sm ${effectiveTheme.textSecondary} truncate mt-1`}>
            {contact.lastMessage}
          </p>
        )}
      </div>

      {/* Chat Action */}
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-full ${effectiveTheme.accent} flex items-center justify-center`}>
          <MessageCircle className="w-4 h-4 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default NewChat;