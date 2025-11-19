import React, { useState } from 'react';
import { X, Download, FileText, File, Video, Music, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AttachmentPreview = ({ attachment, onRemove, effectiveTheme }) => {
  const [imageError, setImageError] = useState(false);

  if (!attachment) return null;

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('video/')) return <Video className="w-6 h-6" />;
    if (mimeType?.startsWith('audio/')) return <Music className="w-6 h-6" />;
    if (mimeType?.includes('pdf')) return <FileText className="w-6 h-6" />;
    if (mimeType?.includes('zip') || mimeType?.includes('rar')) return <Archive className="w-6 h-6" />;
    return <File className="w-6 h-6" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isImage = attachment.mimeType?.startsWith('image/');
  const isVideo = attachment.mimeType?.startsWith('video/');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`relative ${effectiveTheme.secondary} border ${effectiveTheme.border} rounded-lg p-3 mb-3`}
    >
      {/* Remove button */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Preview content */}
      <div className="flex items-center space-x-3">
        {isImage && !imageError ? (
          <img
            src={attachment.fileUrl}
            alt={attachment.fileName || 'Attachment'}
            className="w-16 h-16 object-cover rounded"
            onError={() => setImageError(true)}
          />
        ) : isVideo ? (
          <video
            src={attachment.fileUrl}
            className="w-16 h-16 object-cover rounded"
            muted
          />
        ) : (
          <div className={`w-16 h-16 ${effectiveTheme.accent} rounded flex items-center justify-center text-white`}>
            {getFileIcon(attachment.mimeType)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className={`${effectiveTheme.text} font-medium truncate text-sm`}>
            {attachment.fileName || 'Unnamed file'}
          </p>
          {attachment.fileSize && (
            <p className={`${effectiveTheme.textSecondary} text-xs`}>
              {formatFileSize(attachment.fileSize)}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AttachmentPreview;
