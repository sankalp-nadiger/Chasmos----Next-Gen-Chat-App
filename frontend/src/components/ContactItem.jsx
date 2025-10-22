import React from "react";
import { MessageCircle } from "lucide-react";

// Utility to format timestamp nicely
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diff = (now - date) / 1000; // seconds

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const ContactItem = ({ contact, onSelect, effectiveTheme }) => {
  return (
    <div
      className={`flex items-center justify-between p-3 cursor-pointer border-b ${effectiveTheme.border || "border-gray-200"} hover:${effectiveTheme.hover || "bg-gray-100"} transition`}
      onClick={() => onSelect(contact)}
    >
      {/* Left: Avatar and info */}
      <div className="flex items-center space-x-3 min-w-0">
        <div className="relative">
          {contact.avatar ? (
            <img
              src={contact.avatar}
              alt={contact.name || contact.username}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
              {(contact.name || contact.username || "?").charAt(0)}
            </div>
          )}
          {contact.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <h3 className={`font-semibold truncate ${effectiveTheme.text || "text-gray-900"}`}>
              {contact.name || contact.username}
            </h3>
            <span className={`text-xs ${effectiveTheme.textSecondary || "text-gray-500"}`}>
              {formatTimestamp(contact.timestamp)}
            </span>
          </div>
          <p className={`text-sm truncate ${effectiveTheme.textSecondary || "text-gray-500"}`}>
            {contact.lastMessage || (contact.isTyping ? "Typing..." : "Say hi!")}
          </p>
        </div>
      </div>

      {/* Right: Chat icon / unread badge */}
      <div className="flex flex-col items-end ml-4 space-y-1">
        {contact.unreadCount > 0 && (
          <div className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {contact.unreadCount}
          </div>
        )}
        <div
          className={`w-10 h-10 rounded-full ${effectiveTheme.accent || "bg-blue-500"} flex items-center justify-center`}
        >
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
};

export default ContactItem;
