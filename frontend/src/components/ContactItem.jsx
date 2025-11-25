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
    if (!text) return '';
    const s = typeof text === 'string' ? text : (text.content || text.text || '');
    return String(s).replace(/📎/g, '').replace(/🔗/g, '').trim();
  };

  const isEmail = (s) => typeof s === 'string' && /\S+@\S+\.\S+/.test(s);
  const capitalizeLocalPart = (email) => {
    if (!email || !isEmail(email)) return email || '';
    const local = email.split('@')[0];
    return local
      .replace(/[._\-]+/g, ' ')
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  // Prefer a real name over email-like strings
  const displayName = contact.name && !isEmail(contact.name)
    ? contact.name
    : contact.displayName && !isEmail(contact.displayName)
      ? contact.displayName
      : contact.username && !isEmail(contact.username)
        ? contact.username
        : contact.name && isEmail(contact.name)
          ? capitalizeLocalPart(contact.name)
          : contact.email
            ? capitalizeLocalPart(contact.email)
            : '?';

  // Last message may be a string or an object with content/attachments
  const lastMsgRaw = contact.lastMessage || null;
  const lastMsgText = cleanText(lastMsgRaw);

  // Normalize possible attachment sources (different backends use different keys)
  const attachments = [];
  if (contact.attachments && Array.isArray(contact.attachments) && contact.attachments.length) attachments.push(...contact.attachments);
  if (lastMsgRaw) {
    if (Array.isArray(lastMsgRaw.attachments) && lastMsgRaw.attachments.length) attachments.push(...lastMsgRaw.attachments);
    if (lastMsgRaw.attachment) attachments.push(lastMsgRaw.attachment);
    if (lastMsgRaw.fileUrl || lastMsgRaw.url) attachments.push({ fileUrl: lastMsgRaw.fileUrl || lastMsgRaw.url, fileName: lastMsgRaw.fileName || lastMsgRaw.name });
    if (lastMsgRaw.files && Array.isArray(lastMsgRaw.files) && lastMsgRaw.files.length) attachments.push(...lastMsgRaw.files);
  }

  const lastMsgHasAttachments = Boolean(contact.hasAttachment || attachments.length > 0);
  const primaryAttachment = attachments[0] || null;
  const attachmentMime = contact.attachmentMime || (primaryAttachment && (primaryAttachment.mimeType || primaryAttachment.type || '')) || '';
  const attachmentFileName = contact.attachmentFileName || (primaryAttachment && (primaryAttachment.fileName || primaryAttachment.name || primaryAttachment.fileUrl || primaryAttachment.url)) || '';

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
                {displayName}
              </h3>
            <span className={`text-xs flex-shrink-0 ${effectiveTheme.textSecondary || "text-gray-500"}`}>
              {formatTimestamp(contact.timestamp)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 min-w-0">
            {lastMsgHasAttachments && (
              <div className="flex-shrink-0">
                {(() => {
                  if (attachmentMime.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp)$/i.test(attachmentMime || attachmentFileName || lastMsgText)) {
                    return <Image className={`w-4 h-4 ${iconColor}`} />;
                  }
                  if (attachmentMime.startsWith("video/") || /\.(mp4|webm|ogg)$/i.test(attachmentMime || attachmentFileName || lastMsgText)) {
                    return <Video className={`w-4 h-4 ${iconColor}`} />;
                  }
                  if ((attachmentMime && attachmentMime.includes("pdf")) || /\.pdf$/i.test(attachmentMime || attachmentFileName || lastMsgText)) {
                    return <FileText className={`w-4 h-4 ${iconColor}`} />;
                  }
                  return <File className={`w-4 h-4 ${iconColor}`} />;
                })()}
              </div>
            )}

            <p className={`text-sm truncate ${effectiveTheme.textSecondary || "text-gray-500"}`}>
              {contact.isTyping ? (
                "Typing..."
              ) : (
                lastMsgHasAttachments ? (
                  lastMsgText ? `${lastMsgText}` : "Attachment"
                ) : (
                  lastMsgText || "Say Hi!"
                )
              )}
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