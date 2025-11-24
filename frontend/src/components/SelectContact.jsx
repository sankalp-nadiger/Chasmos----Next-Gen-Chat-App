/* eslint-disable no-unused-vars */
import React from "react";
import { Image, FileText, File, Video, Check } from "lucide-react";

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diff = (now - date) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const SelectContact = ({ contact, onSelect, selected, effectiveTheme }) => {
  const cleanText = (text) => {
    if (!text || typeof text !== "string") return "";
    return text.replace(/📎/g, "").replace(/🔗/g, "").trim();
  };

  const previewText = cleanText(contact.lastMessage || "Attachment");
  const hasAttachment = contact.hasAttachment || false;
  const attachmentMime = contact.attachmentMime || "";
  const iconColor = effectiveTheme.mode === "dark" ? "text-gray-400" : "text-gray-600";

  const contactId =
    contact.id ||
    contact._id ||
    contact.userId ||
    contact.contactId ||
    contact.googleId;

  return (
    <div
      onClick={() => onSelect(contactId)}
      className={`flex items-center justify-between p-3 cursor-pointer border-b ${effectiveTheme.border} transition rounded-lg 
        ${selected ? "bg-green-600" : "hover:bg-gray-500/20"}`}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {/* Avatar */}
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
        </div>

        {/* Name + Google badge + preview */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold truncate ${effectiveTheme.text}`}>
              {contact.name || contact.username}
            </h3>
            {contact.isGoogleContact && (
              <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                Google
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 min-w-0 mt-1">
            {hasAttachment && (
              <div className="flex-shrink-0">
                {(() => {
                  if (
                    attachmentMime.startsWith("image/") ||
                    /\.(png|jpe?g|gif|webp|bmp)$/i.test(previewText)
                  ) {
                    return <Image className={`w-4 h-4 ${iconColor}`} />;
                  }
                  if (
                    attachmentMime.startsWith("video/") ||
                    /\.(mp4|webm|ogg)$/i.test(previewText)
                  ) {
                    return <Video className={`w-4 h-4 ${iconColor}`} />;
                  }
                  if (attachmentMime.includes("pdf") || /\.pdf$/i.test(previewText)) {
                    return <FileText className={`w-4 h-4 ${iconColor}`} />;
                  }
                  return <File className={`w-4 h-4 ${iconColor}`} />;
                })()}
              </div>
            )}
            <p
              className={`text-sm truncate ${
                effectiveTheme.textSecondary || "text-gray-500"
              }`}
            >
              {previewText || (contact.isTyping ? "Typing..." : "Say hi!")}
            </p>
          </div>
        </div>
      </div>

      {/* WhatsApp-style selection bubble */}
      <div className="ml-3 flex-shrink-0">
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
            ${
              selected
                ? "bg-green-500 border-green-600 "
                : "border-gray-400 "
            }`}
        >
          {selected && <Check className="w-4 h-4" />}
        </div>
      </div>

      {/* (existing unread bubble — untouched) */}
      {/* DO NOT REMOVE — YOU SAID DO NOT TOUCH LOGIC */}
      {contact.unreadCount > 0 && (
        <div className="flex-shrink-0 ml-3">
          <div className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
            {contact.unreadCount > 9 ? "9+" : contact.unreadCount}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectContact;
