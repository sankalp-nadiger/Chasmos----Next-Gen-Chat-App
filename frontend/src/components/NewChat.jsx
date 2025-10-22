import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, X, MessageCircle, Clock } from "lucide-react";

// Helper to format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "Last seen recently";
  const date = new Date(timestamp);
  const now = new Date();
  const diff = (now - date) / 1000; // seconds

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;

  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const NewChat = ({ effectiveTheme = {}, onClose, onStartChat, existingContacts = [] }) => {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch users");

        const data = await res.json();
        const formattedContacts = data.map(u => ({
          id: u._id,
          name: u.email,
          avatar: u.avatar || null,
          isOnline: Math.random() < 0.5,
          timestamp: u.createdAt,
        }));
        setContacts(formattedContacts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredContacts = useMemo(() =>
    contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [contacts, searchTerm]
  );

  const otherUsers = filteredContacts.filter(c => !existingContacts.some(ec => ec.id === c.id));

  const handleStartChat = (contact) => {
    onStartChat(contact);
    onClose();
  };

  if (loading) return <div className="p-4">Loading users...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`fixed inset-0 ${effectiveTheme.primary || "bg-white"} flex flex-col h-screen w-screen z-50`}
    >
      {/* Header */}
      <div className={`${effectiveTheme.secondary || "bg-gray-100"} border-b ${effectiveTheme.border || "border-gray-300"} p-4`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className={`p-2 rounded-full hover:${effectiveTheme.hover || "bg-gray-200"} transition-colors`}
          >
            <X className={`w-5 h-5 ${effectiveTheme.text || "text-gray-900"}`} />
          </button>
          <div>
            <h2 className={`text-lg font-semibold ${effectiveTheme.text || "text-gray-900"}`}>New Chat</h2>
            <p className={`text-sm ${effectiveTheme.textSecondary || "text-gray-500"}`}>{filteredContacts.length} users available</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 flex-shrink-0">
        <div className={`relative ${effectiveTheme.searchBg || "bg-gray-100"} rounded-lg`}>
          <Search className={`absolute left-3 top-3 w-4 h-4 ${effectiveTheme.textSecondary || "text-gray-500"}`} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 bg-transparent ${effectiveTheme.text || "text-gray-900"} placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
          />
        </div>
      </div>

      {/* Body split into 2 panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel 40% */}
        <div className="w-2/5 border-r overflow-y-auto p-4">
          <h3 className={`font-medium ${effectiveTheme.text || 'text-gray-900'} mb-2`}>All Users</h3>
          {filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8">
              <MessageCircle className={`w-16 h-16 ${effectiveTheme.textSecondary || 'text-gray-400'} mb-4`} />
              <p className={`${effectiveTheme.text || 'text-gray-900'}`}>No users found</p>
            </div>
          ) : (
            filteredContacts.map(user => (
              <ContactItem key={user.id} contact={user} effectiveTheme={effectiveTheme} onClick={() => handleStartChat(user)} showLastSeen />
            ))
          )}
        </div>

        {/* Right Panel 60% */}
<div className="w-3/5 p-4">
  <h3 className={`font-medium ${effectiveTheme.text || 'text-gray-900'} mb-2`}>Other Users</h3>
  {otherUsers.length === 0 ? (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <MessageCircle className={`w-16 h-16 ${effectiveTheme.textSecondary || 'text-gray-400'} mb-4`} />
      <p className={`${effectiveTheme.text || 'text-gray-900'} text-center`}>All users are already in your contacts</p>
    </div>
  ) : (
    otherUsers.map(user => (
      <ContactItem
        key={user.id}
        contact={user}
        effectiveTheme={effectiveTheme}
        showLastSeen
        onClick={(contact) => handleStartChat(contact)} // Pass selected contact to start chat
      />
    ))
  )}
</div>
      </div>
    </motion.div>
  );
};

const ContactItem = ({ contact, effectiveTheme, onClick, showLastSeen }) => {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      className={`flex items-center justify-between p-4 cursor-pointer border-b ${effectiveTheme.border || 'border-gray-300'} hover:${effectiveTheme.hover || 'bg-gray-200'} transition-all duration-200`}
      onClick={onClick}
    >
      {/* Left: Avatar and Name */}
      <div className="flex items-center space-x-3 min-w-0">
        <div className="relative">
          {contact.avatar ? (
            <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
              {contact.name.charAt(0)}
            </div>
          )}
          {contact.isOnline && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />}
        </div>
       <div className="flex-1 min-w-0">
  <h3 className={`font-semibold ${effectiveTheme.text || 'text-gray-900'} truncate`}>{contact.name}</h3>
  {showLastSeen && (
    <span className={`text-xs ${contact.isOnline ? 'text-green-500' : effectiveTheme.textSecondary || 'text-gray-500'}`}>
      {contact.isOnline ? 'Online' : formatTimestamp(contact.timestamp)}
    </span>
  )}
</div>

      </div>

      {/* Right: Chat Icon */}
      <div className="flex-shrink-0 ml-4">
        <div className={`w-10 h-10 rounded-full ${effectiveTheme.accent || 'bg-blue-500'} flex items-center justify-center`}>
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default NewChat;
