/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Download, FileText, File, Video, Music, Archive, Eye, X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MessageAttachment = ({ attachment, effectiveTheme }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!attachment) return null;

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (mimeType?.startsWith('audio/')) return <Music className="w-5 h-5" />;
    if (mimeType?.includes('pdf')) return <FileText className="w-5 h-5" />;
    if (mimeType?.includes('zip') || mimeType?.includes('rar')) return <Archive className="w-5 h-5" />;
    if (mimeType?.includes('word') || mimeType?.includes('document')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = attachment.fileUrl;
    link.download = attachment.fileName || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImage = attachment.mimeType?.startsWith('image/');
  const isVideo = attachment.mimeType?.startsWith('video/');
  const isPDF = attachment.mimeType?.includes('pdf');
  const isDocument = attachment.mimeType?.includes('word') || 
                     attachment.mimeType?.includes('document') || 
                     attachment.mimeType?.includes('sheet') ||
                     attachment.mimeType?.includes('presentation');

  // Images open by default (inline preview)
  if (isImage && !imageError) {
    return (
      <>
        <div className="max-w-xs cursor-pointer" onClick={() => setShowPreview(true)}>
          <img
            src={attachment.fileUrl}
            alt={attachment.fileName || 'Image'}
            className="rounded-lg w-full h-auto max-h-64 object-contain"
            onError={() => setImageError(true)}
          />
          {attachment.fileName && (
            <p className="text-xs opacity-75 mt-1 truncate">{attachment.fileName}</p>
          )}
        </div>

        {/* Full screen preview */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
              onClick={() => setShowPreview(false)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPreview(false);
                }}
                className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="absolute top-4 right-16 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2 transition-colors"
              >
                <Download className="w-6 h-6" />
              </button>
              <img
                src={attachment.fileUrl}
                alt={attachment.fileName || 'Image'}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Videos: preview thumbnail + option to view or download
  if (isVideo) {
    return (
      <>
        <div className="max-w-xs">
          <div className="relative cursor-pointer group" onClick={() => setShowPreview(true)}>
            <video
              src={attachment.fileUrl}
              className="rounded-lg w-full h-auto max-h-64 object-contain"
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all rounded-lg">
              <div className="bg-white bg-opacity-90 rounded-full p-3">
                <Play className="w-8 h-8 text-gray-800" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs opacity-75 truncate flex-1">{attachment.fileName || 'Video'}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="ml-2 text-xs opacity-75 hover:opacity-100 transition-opacity"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video player modal */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
              onClick={() => setShowPreview(false)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPreview(false);
                }}
                className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="absolute top-4 right-16 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2 transition-colors"
              >
                <Download className="w-6 h-6" />
              </button>
              <video
                src={attachment.fileUrl}
                className="max-w-full max-h-full object-contain"
                controls
                autoPlay
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // PDF and Documents: show file info with download button
  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg bg-opacity-10 max-w-xs">
      <div className={`w-12 h-12 ${effectiveTheme.accent} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
        {getFileIcon(attachment.mimeType)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-sm">
          {attachment.fileName || 'Document'}
        </p>
        {attachment.fileSize && (
          <p className="text-xs opacity-75">
            {formatFileSize(attachment.fileSize)}
          </p>
        )}
      </div>
      <button
        onClick={handleDownload}
        className="flex-shrink-0 p-2 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors"
        title="Download"
      >
        <Download className="w-5 h-5" />
      </button>
    </div>
  );
};

export default MessageAttachment;
