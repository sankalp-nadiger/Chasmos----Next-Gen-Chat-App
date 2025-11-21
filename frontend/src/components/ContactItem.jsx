import React from "react";
import { Image, FileText, File, Video } from "lucide-react";

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
  const cleanText = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/📎/g, '').replace(/🔗/g, '').trim();
  };

  const previewText = cleanText(contact.lastMessage || 'Attachment');
  const hasAttachment = contact.hasAttachment || false;
  const attachmentMime = contact.attachmentMime || '';

  // ✅ Dynamic icon color based on theme
  const iconColor = effectiveTheme.mode === 'dark' ? 'text-gray-400' : 'text-gray-600';

  return (
    <div
      className={`flex items-center justify-between p-3 cursor-pointer border-b ${effectiveTheme.border || "border-gray-200"} hover:${effectiveTheme.hover || "bg-gray-100"} transition`}
      onClick={() => onSelect(contact)}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="relative flex-shrink-0">
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
          <div className="flex items-center justify-between gap-2">
            <h3 className={`font-semibold truncate ${effectiveTheme.text || "text-gray-900"}`}>
              {contact.name || contact.username}
            </h3>
            <span className={`text-xs flex-shrink-0 ${effectiveTheme.textSecondary || "text-gray-500"}`}>
              {formatTimestamp(contact.timestamp)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 min-w-0">
            {hasAttachment && (
              <div className="flex-shrink-0">
                {(() => {
                  if (attachmentMime.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp)$/i.test(previewText)) {
                    return <Image className={`w-4 h-4 ${iconColor}`} />;
                  }
                  if (attachmentMime.startsWith("video/") || /\.(mp4|webm|ogg)$/i.test(previewText)) {
                    return <Video className={`w-4 h-4 ${iconColor}`} />;
                  }
                  if (attachmentMime.includes("pdf") || /\.pdf$/i.test(previewText)) {
                    return <FileText className={`w-4 h-4 ${iconColor}`} />;
                  }
                  return <File className={`w-4 h-4 ${iconColor}`} />;
                })()}
              </div>
            )}
            <p className={`text-sm truncate ${effectiveTheme.textSecondary || "text-gray-500"}`}>
              {previewText || (contact.isTyping ? "Typing..." : "Say hi!")}
            </p>
          </div>
        </div>
      </div>

      {contact.unreadCount > 0 && (
        <div className="flex-shrink-0 ml-3">
          <div className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
            {contact.unreadCount > 9 ? '9+' : contact.unreadCount}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactItem;