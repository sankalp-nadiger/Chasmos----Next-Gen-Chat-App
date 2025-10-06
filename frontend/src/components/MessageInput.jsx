import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Paperclip, Image, FileText, Camera, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MessageInput = React.memo(({ 
  onSendMessage, 
  selectedContact,
  effectiveTheme 
}) => {
  // Move messageInput state to this component to isolate re-renders
  const [messageInput, setMessageInput] = useState("");
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const attachmentMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const handleInputChange = useCallback((e) => {
    setMessageInput(e.target.value);
  }, []);

  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter" && messageInput.trim() && selectedContact) {
      onSendMessage(messageInput);
      setMessageInput(""); // Clear input after sending
    }
  }, [messageInput, selectedContact, onSendMessage]);

  const handleSendClick = useCallback(() => {
    if (messageInput.trim() && selectedContact) {
      onSendMessage(messageInput);
      setMessageInput(""); // Clear input after sending
    }
  }, [messageInput, selectedContact, onSendMessage]);

  const toggleAttachmentMenu = useCallback(() => {
    setShowAttachmentMenu(!showAttachmentMenu);
  }, [showAttachmentMenu]);

  const handleFileUpload = useCallback((type) => {
    if (type === 'document') {
      fileInputRef.current?.click();
    } else if (type === 'image') {
      imageInputRef.current?.click();
    }
    setShowAttachmentMenu(false);
  }, []);

  const handleFileChange = useCallback((e, type) => {
    const file = e.target.files[0];
    if (file) {
      // Here you would typically handle file upload
      // For now, just send a message indicating the file
      const fileMessage = `${type === 'image' ? '📷' : '📄'} ${file.name}`;
      onSendMessage(fileMessage);
    }
  }, [onSendMessage]);

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) {
        setShowAttachmentMenu(false);
      }
    };

    if (showAttachmentMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAttachmentMenu]);

  return (
    <div className={`${effectiveTheme.secondary} p-4 relative`}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
        onChange={(e) => handleFileChange(e, 'document')}
        style={{ display: 'none' }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, 'image')}
        style={{ display: 'none' }}
      />

      <div className="flex items-center space-x-3">
        {/* Attachment Menu */}
        <div className="relative" ref={attachmentMenuRef}>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.95 }}
          >
            <Paperclip
              className={`w-6 h-6 ${effectiveTheme.textSecondary} cursor-pointer hover:${effectiveTheme.text} transition-colors duration-200`}
              onClick={toggleAttachmentMenu}
            />
          </motion.div>

          {/* Attachment Options Menu */}
          <AnimatePresence>
            {showAttachmentMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={`absolute -top-20 left-0 ${effectiveTheme.secondary} border ${effectiveTheme.border} rounded-lg shadow-xl p-3 z-50`}
              >
                <div className="flex items-center space-x-4">
                  {/* Document Upload */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="cursor-pointer flex flex-col items-center space-y-2 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                    onClick={() => handleFileUpload('document')}
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <p className={`${effectiveTheme.text} text-xs font-medium`}>Document</p>
                  </motion.div>

                  {/* Image Upload */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="cursor-pointer flex flex-col items-center space-y-2 p-2 rounded-lg hover:bg-green-50 transition-colors"
                    onClick={() => handleFileUpload('image')}
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <Image className="w-5 h-5 text-white" />
                    </div>
                    <p className={`${effectiveTheme.text} text-xs font-medium`}>Photo</p>
                  </motion.div>

                  {/* Camera */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="cursor-pointer flex flex-col items-center space-y-2 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                    onClick={() => {
                      setShowAttachmentMenu(false);
                    }}
                  >
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <p className={`${effectiveTheme.text} text-xs font-medium`}>Camera</p>
                  </motion.div>

                  {/* Location */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="cursor-pointer flex flex-col items-center space-y-2 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    onClick={() => {
                      setShowAttachmentMenu(false);
                    }}
                  >
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <p className={`${effectiveTheme.text} text-xs font-medium`}>Location</p>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={`flex-1 ${effectiveTheme.inputBg} rounded-lg px-4 py-2 flex items-center`}>
          <input
            type="text"
            placeholder="Type a message..."
            value={messageInput}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className={`flex-1 bg-transparent ${effectiveTheme.text} placeholder-gray-400 focus:outline-none`}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSendClick}
          className={`${effectiveTheme.accent} p-2 rounded-full text-white hover:opacity-90 transition-opacity`}
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if selectedContact changes
  return prevProps.selectedContact?.id === nextProps.selectedContact?.id;
});

export default MessageInput;