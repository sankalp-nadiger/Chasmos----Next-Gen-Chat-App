/* eslint-disable no-unused-vars */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Paperclip, Image, FileText, Camera, MapPin, X, Clock, Calendar, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CosmosBg from './CosmosBg';
import PollCreationModal from './PollCreationModal';

const MessageInput = React.memo(({ 
  onSendMessage, 
  selectedContact,
  effectiveTheme,
  isGroupChat = false
}) => {
  const [messageInput, setMessageInput] = useState("");
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [creatingPoll, setCreatingPoll] = useState(false);
  const attachmentMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleCreatePoll = useCallback(async (pollData) => {
    try {
      setCreatingPoll(true);
      const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
      const chatId = selectedContact?.chatId || selectedContact?.id || selectedContact?._id;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/poll/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...pollData,
          chatId
        }),
      });

      if (!response.ok) throw new Error('Failed to create poll');
      
      const result = await response.json();
      
      // Send poll message
      onSendMessage({
        content: `📊 Poll: ${pollData.question}`,
        type: 'poll',
        chatId,
        pollId: result.poll._id,
      });

      setShowPollModal(false);
    } catch (err) {
      console.error('Poll creation error:', err);
      alert('Failed to create poll. Please try again.');
    } finally {
      setCreatingPoll(false);
    }
  }, [selectedContact, onSendMessage]);

  const handleInputChange = useCallback((e) => {
    setMessageInput(e.target.value);
  }, []);

  const handleSendClick = useCallback(async (isScheduled = false) => {
    if (uploading) return;

    // Always build a payload object for onSendMessage
    let chatId = selectedContact?.chatId || selectedContact?.id || selectedContact?._id;
    let userId = null;
    if (!chatId && selectedContact && !selectedContact.isGroup) {
      // Prefer userId, then id, then fallback to _id (but not self)
      if (selectedContact.userId && selectedContact.userId !== selectedContact.currentUserId) {
        userId = selectedContact.userId;
      } else if (selectedContact.id && selectedContact.id !== selectedContact.currentUserId) {
        userId = selectedContact.id;
      } else if (selectedContact._id && selectedContact._id !== selectedContact.currentUserId) {
        userId = selectedContact._id;
      } else if (selectedContact.participants && Array.isArray(selectedContact.participants)) {
        const other = selectedContact.participants.find(pid => pid !== selectedContact.currentUserId);
        if (other) userId = other;
      }
    }

    // If pending attachment exists, upload it with caption and let backend create message
    if (pendingAttachment && selectedContact) {
      try {
        setUploading(true);
        const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
        const form = new FormData();
        form.append('file', pendingAttachment.file);
        if (chatId) form.append('chatId', chatId);
        if (userId) form.append('userId', userId);
        if (messageInput && messageInput.trim()) form.append('content', messageInput.trim());
        if (isScheduled && scheduledDate && scheduledTime) {
          const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
          form.append('scheduledFor', scheduledDateTime.toISOString());
          form.append('isScheduled', 'true');
        }
        const uploadRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        });
        if (!uploadRes.ok) throw new Error('Upload failed');
        const data = await uploadRes.json();
        if (data.message) {
          if (!isScheduled) onSendMessage(data.message);
        } else if (data.attachment) {
          const payload = {
            content: messageInput || '',
            attachments: [data.attachment._id],
            type: pendingAttachment.type === 'image' ? 'image' : 'file',
            chatId,
            userId,
          };
          if (isScheduled && scheduledDate && scheduledTime) {
            const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
            payload.isScheduled = true;
            payload.scheduledFor = scheduledDateTime.toISOString();
          }
          if (!isScheduled) onSendMessage(payload);
        }
      } catch (err) {
        console.error('Upload + send error', err);
      } finally {
        setUploading(false);
        setPendingAttachment(null);
        setMessageInput('');
        setScheduledDate('');
        setScheduledTime('');
        setShowScheduleModal(false);
      }
      return;
    }

    // For plain text messages
    if (messageInput.trim() && selectedContact) {
      const payload = {
        content: messageInput.trim(),
        type: 'text',
        chatId,
        userId,
      };
      if (isScheduled && scheduledDate && scheduledTime) {
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        payload.isScheduled = true;
        payload.scheduledFor = scheduledDateTime.toISOString();
      }
      onSendMessage(payload);
      setMessageInput("");
      setScheduledDate('');
      setScheduledTime('');
      setShowScheduleModal(false);
    }
  }, [messageInput, selectedContact, onSendMessage, pendingAttachment, uploading, scheduledDate, scheduledTime]);

  const handleScheduleClick = useCallback(() => {
    if (!messageInput.trim() && !pendingAttachment) {
      return;
    }
    setShowScheduleModal(true);
  }, [messageInput, pendingAttachment]);

  const handleScheduleSend = useCallback(() => {
    if (!scheduledDate || !scheduledTime) {
      alert('Please select both date and time');
      return;
    }
    
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledDateTime <= new Date()) {
      alert('Scheduled time must be in the future');
      return;
    }
    
    handleSendClick(true);
  }, [scheduledDate, scheduledTime, handleSendClick]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendClick();
    }
  }, [handleSendClick]);
  
  const toggleAttachmentMenu = useCallback(() => {
    setShowAttachmentMenu(!showAttachmentMenu);
  }, [showAttachmentMenu]);

  const handleFileUpload = useCallback((type) => {
    if (type === 'document') {
      fileInputRef.current?.click();
    } else if (type === 'image') {
      imageInputRef.current?.click();
    } else if (type === 'video') {
      videoInputRef.current?.click();
    }
    setShowAttachmentMenu(false);
  }, []);

  const handleFileChange = useCallback((e, type) => {
    const file = e.target.files[0];
    if (file) {
      const preview = (type === 'image' || type === 'video') ? URL.createObjectURL(file) : null;
      setPendingAttachment({ file, type, preview, name: file.name, size: file.size });
    }
    e.target.value = null;
  }, []);

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
        capture="environment"
        onChange={(e) => handleFileChange(e, 'image')}
        style={{ display: 'none' }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        capture="camcorder"
        onChange={(e) => handleFileChange(e, 'video')}
        style={{ display: 'none' }}
      />

      <div className="flex items-center space-x-3">
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

          <AnimatePresence>
            {showAttachmentMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={`absolute -top-20 left-0 border ${effectiveTheme.border} rounded-lg shadow-xl p-3 z-50 overflow-hidden backdrop-blur-md`}
                style={{
                  background: effectiveTheme.mode === 'dark'
                    ? 'rgba(31, 41, 55, 0.95)'
                    : 'rgba(255, 255, 255, 0.98)',
                  minWidth: '370px',
                  boxShadow: effectiveTheme.mode === 'dark'
                    ? '0 10px 40px rgba(0, 0, 0, 0.5)'
                    : '0 10px 40px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
                  <CosmosBg />
                </div>
                <div className="flex items-center space-x-4 relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`cursor-pointer flex flex-col items-center space-y-2 p-2 rounded-lg transition-colors ${effectiveTheme.mode === 'dark' ? 'hover:bg-blue-500 hover:bg-opacity-10' : 'hover:bg-blue-100'}`}
                    onClick={() => handleFileUpload('document')}
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <p className={`${effectiveTheme.text} text-xs font-medium`}>Document</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`cursor-pointer flex flex-col items-center space-y-2 p-2 rounded-lg transition-colors ${effectiveTheme.mode === 'dark' ? 'hover:bg-green-500 hover:bg-opacity-10' : 'hover:bg-green-100'}`}
                    onClick={() => handleFileUpload('image')}
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <Image className="w-5 h-5 text-white" />
                    </div>
                    <p className={`${effectiveTheme.text} text-xs font-medium`}>Photo</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`cursor-pointer flex flex-col items-center space-y-2 p-2 rounded-lg transition-colors ${effectiveTheme.mode === 'dark' ? 'hover:bg-yellow-500 hover:bg-opacity-10' : 'hover:bg-yellow-100'}`}
                    onClick={() => handleFileUpload('video')}
                  >
                    <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <p className={`${effectiveTheme.text} text-xs font-medium`}>Video</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`cursor-pointer flex flex-col items-center space-y-2 p-2 rounded-lg transition-colors ${effectiveTheme.mode === 'dark' ? 'hover:bg-purple-500 hover:bg-opacity-10' : 'hover:bg-purple-100'}`}
                    onClick={() => {
                      imageInputRef.current?.click();
                      setShowAttachmentMenu(false);
                    }}
                  >
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <p className={`${effectiveTheme.text} text-xs font-medium`}>Camera</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`cursor-pointer flex flex-col items-center space-y-2 p-2 rounded-lg transition-colors ${effectiveTheme.mode === 'dark' ? 'hover:bg-red-500 hover:bg-opacity-10' : 'hover:bg-red-100'}`}
                    onClick={() => {
                      setShowAttachmentMenu(false);
                    }}
                  >
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <p className={`${effectiveTheme.text} text-xs font-medium`}>Location</p>
                  </motion.div>

                  {isGroupChat && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`cursor-pointer flex flex-col items-center space-y-2 p-2 rounded-lg transition-colors ${effectiveTheme.mode === 'dark' ? 'hover:bg-cyan-500 hover:bg-opacity-10' : 'hover:bg-cyan-100'}`}
                      onClick={() => {
                        setShowPollModal(true);
                        setShowAttachmentMenu(false);
                      }}
                    >
                      <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <p className={`${effectiveTheme.text} text-xs font-medium`}>Poll</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={`flex-1 ${effectiveTheme.inputBg} rounded-lg px-4 py-2 flex items-center`}> 
          <div className="flex-1">
            {pendingAttachment && (
              <div className="mb-2 flex items-start space-x-3 relative">
                <div className="relative">
                  {pendingAttachment.preview ? (
                    pendingAttachment.type === 'image' ? (
                      <img src={pendingAttachment.preview} alt="preview" className="w-20 h-20 object-cover rounded" />
                    ) : pendingAttachment.type === 'video' ? (
                      <video src={pendingAttachment.preview} className="w-32 h-20 object-cover rounded" controls />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-sm">
                        <FileText className="w-6 h-6" />
                      </div>
                    )
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-sm">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}
                  <button
                    className="absolute top-1 right-1 z-20 bg-white bg-opacity-80 rounded-full p-1 hover:bg-opacity-100 shadow"
                    style={{ lineHeight: 0 }}
                    onClick={() => { setPendingAttachment(null); setMessageInput(''); }}
                    tabIndex={0}
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="text-sm font-medium text-gray-800">{pendingAttachment.name}</div>
                  </div>
                  <div className="text-xs text-gray-500">{(pendingAttachment.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
            )}

            <input
              type="text"
              placeholder="Type a message..."
              value={messageInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className={`w-full bg-transparent ${effectiveTheme.text} placeholder-gray-400 focus:outline-none`}
            />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleScheduleClick}
          className={`${effectiveTheme.secondary} p-2 rounded-full ${effectiveTheme.text} hover:opacity-80 transition-opacity`}
          title="Schedule message"
        >
          <Clock className="w-5 h-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSendClick(false)}
          className={`${effectiveTheme.accent} p-2 rounded-full hover:opacity-90 transition-opacity`}
        >
          <Send
            className="w-5 h-5"
            style={{ color: effectiveTheme.mode === 'dark' ? '#fff' : '#1f2937' }}
          />
        </motion.button>
      </div>

      <AnimatePresence>
        {showScheduleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
            style={{ background: 'rgba(0, 0, 0, 0.4)' }}
            onClick={() => setShowScheduleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative rounded-3xl max-w-lg w-full mx-4 shadow-2xl overflow-hidden"
              style={{
                background: effectiveTheme.mode === 'dark' 
                  ? 'rgba(17, 24, 39, 0.95)' 
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: effectiveTheme.mode === 'dark' 
                  ? '1px solid rgba(139, 92, 246, 0.2)' 
                  : '1px solid rgba(139, 92, 246, 0.1)',
              }}
            >
              <div className="absolute inset-0 opacity-30 pointer-events-none">
                <CosmosBg />
              </div>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowScheduleModal(false)}
                className="absolute top-2 right-2 z-50 p-3 rounded-full transition-all duration-200 cursor-pointer"
                style={{
                  background: effectiveTheme.mode === 'dark' 
                    ? 'rgba(139, 92, 246, 0.25)' 
                    : 'rgba(139, 92, 246, 0.13)',
                  pointerEvents: 'auto',
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.12)',
                }}
                tabIndex={0}
                aria-label="Close schedule modal"
              >
                <X className="w-5 h-5" style={{ color: effectiveTheme.mode === 'dark' ? '#a78bfa' : '#8b5cf6' }} />
              </motion.button>

              <div className="relative z-10 p-8">
                <div className="flex items-center gap-4 mb-6">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="p-3 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                    }}
                  >
                    <Clock className="w-7 h-7 text-white" />
                  </motion.div>
                  <div>
                    <h3 
                      className="text-2xl font-bold mb-1"
                      style={{ 
                        color: effectiveTheme.mode === 'dark' ? '#ffffff' : '#1f2937',
                        fontFamily: "'Inter', 'Segoe UI', sans-serif",
                        letterSpacing: '-0.02em'
                      }}
                    >
                      Schedule Message
                    </h3>
                    <p 
                      className="text-sm"
                      style={{ 
                        color: effectiveTheme.mode === 'dark' ? '#9ca3af' : '#6b7280',
                        fontFamily: "'Inter', 'Segoe UI', sans-serif",
                      }}
                    >
                      Set a time for your message to be sent
                    </p>
                  </div>
                </div>
                
                <div className="space-y-5">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label 
                      className="flex items-center gap-2 text-sm font-semibold mb-3"
                      style={{ 
                        color: effectiveTheme.mode === 'dark' ? '#e5e7eb' : '#374151',
                        fontFamily: "'Inter', 'Segoe UI', sans-serif",
                      }}
                    >
                      <Calendar className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                      Select Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-5 py-3.5 rounded-xl transition-all duration-200 outline-none"
                        style={{
                          background: effectiveTheme.mode === 'dark' 
                            ? 'rgba(31, 41, 55, 0.8)' 
                            : 'rgba(249, 250, 251, 0.9)',
                          border: effectiveTheme.mode === 'dark'
                            ? '2px solid rgba(139, 92, 246, 0.2)'
                            : '2px solid rgba(139, 92, 246, 0.15)',
                          color: effectiveTheme.mode === 'dark' ? '#f3f4f6' : '#1f2937',
                          fontFamily: "'Inter', 'Segoe UI', sans-serif",
                          fontSize: '15px',
                          fontWeight: '500',
                          boxShadow: effectiveTheme.mode === 'dark'
                            ? '0 4px 12px rgba(0, 0, 0, 0.1)'
                            : '0 2px 8px rgba(139, 92, 246, 0.05)',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#8b5cf6';
                          e.target.style.boxShadow = effectiveTheme.mode === 'dark'
                            ? '0 0 0 4px rgba(139, 92, 246, 0.1)'
                            : '0 0 0 4px rgba(139, 92, 246, 0.08)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = effectiveTheme.mode === 'dark'
                            ? 'rgba(139, 92, 246, 0.2)'
                            : 'rgba(139, 92, 246, 0.15)';
                          e.target.style.boxShadow = effectiveTheme.mode === 'dark'
                            ? '0 4px 12px rgba(0, 0, 0, 0.1)'
                            : '0 2px 8px rgba(139, 92, 246, 0.05)';
                        }}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label 
                      className="flex items-center gap-2 text-sm font-semibold mb-3"
                      style={{ 
                        color: effectiveTheme.mode === 'dark' ? '#e5e7eb' : '#374151',
                        fontFamily: "'Inter', 'Segoe UI', sans-serif",
                      }}
                    >
                      <Clock className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                      Select Time
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full px-5 py-3.5 rounded-xl transition-all duration-200 outline-none"
                        style={{
                          background: effectiveTheme.mode === 'dark' 
                            ? 'rgba(31, 41, 55, 0.8)' 
                            : 'rgba(249, 250, 251, 0.9)',
                          border: effectiveTheme.mode === 'dark'
                            ? '2px solid rgba(139, 92, 246, 0.2)'
                            : '2px solid rgba(139, 92, 246, 0.15)',
                          color: effectiveTheme.mode === 'dark' ? '#f3f4f6' : '#1f2937',
                          fontFamily: "'Inter', 'Segoe UI', sans-serif",
                          fontSize: '15px',
                          fontWeight: '500',
                          boxShadow: effectiveTheme.mode === 'dark'
                            ? '0 4px 12px rgba(0, 0, 0, 0.1)'
                            : '0 2px 8px rgba(139, 92, 246, 0.05)',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#8b5cf6';
                          e.target.style.boxShadow = effectiveTheme.mode === 'dark'
                            ? '0 0 0 4px rgba(139, 92, 246, 0.1)'
                            : '0 0 0 4px rgba(139, 92, 246, 0.08)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = effectiveTheme.mode === 'dark'
                            ? 'rgba(139, 92, 246, 0.2)'
                            : 'rgba(139, 92, 246, 0.15)';
                          e.target.style.boxShadow = effectiveTheme.mode === 'dark'
                            ? '0 4px 12px rgba(0, 0, 0, 0.1)'
                            : '0 2px 8px rgba(139, 92, 246, 0.05)';
                        }}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="p-4 rounded-xl"
                    style={{
                      background: effectiveTheme.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)'
                        : 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
                      border: effectiveTheme.mode === 'dark'
                        ? '1px solid rgba(139, 92, 246, 0.2)'
                        : '1px solid rgba(139, 92, 246, 0.15)',
                    }}
                  >
                    <p 
                      className="text-sm font-medium mb-2"
                      style={{ 
                        color: effectiveTheme.mode === 'dark' ? '#d1d5db' : '#4b5563',
                        fontFamily: "'Inter', 'Segoe UI', sans-serif",
                      }}
                    >
                      📝 Message Preview
                    </p>
                    <p 
                      className="text-sm mb-2"
                      style={{ 
                        color: effectiveTheme.mode === 'dark' ? '#9ca3af' : '#6b7280',
                        fontFamily: "'Inter', 'Segoe UI', sans-serif",
                      }}
                    >
                      {messageInput || '(with attachment)'}
                    </p>
                    {scheduledDate && scheduledTime && (
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mt-3 pt-3 flex items-center gap-2"
                        style={{ 
                          borderTop: effectiveTheme.mode === 'dark' 
                            ? '1px solid rgba(139, 92, 246, 0.2)' 
                            : '1px solid rgba(139, 92, 246, 0.15)',
                        }}
                      >
                        <div className="p-1.5 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
                          <Clock className="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
                        </div>
                        <p 
                          className="text-xs font-semibold"
                          style={{ 
                            color: effectiveTheme.mode === 'dark' ? '#a78bfa' : '#8b5cf6',
                            fontFamily: "'Inter', 'Segoe UI', sans-serif",
                          }}
                        >
                          Scheduled for: {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                </div>

                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex gap-3 mt-8"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 px-5 py-3.5 rounded-xl font-semibold transition-all duration-200"
                    style={{
                      background: effectiveTheme.mode === 'dark' 
                        ? 'rgba(75, 85, 99, 0.4)' 
                        : 'rgba(243, 244, 246, 0.8)',
                      color: effectiveTheme.mode === 'dark' ? '#d1d5db' : '#4b5563',
                      fontFamily: "'Inter', 'Segoe UI', sans-serif",
                      border: effectiveTheme.mode === 'dark'
                        ? '1px solid rgba(75, 85, 99, 0.4)'
                        : '1px solid rgba(209, 213, 219, 0.6)',
                    }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: '0 12px 24px rgba(139, 92, 246, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleScheduleSend}
                    className="flex-1 px-5 py-3.5 rounded-xl font-semibold text-white transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                      fontFamily: "'Inter', 'Segoe UI', sans-serif",
                      boxShadow: '0 8px 16px rgba(139, 92, 246, 0.25)',
                    }}
                  >
                    Schedule Send
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PollCreationModal 
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        onCreatePoll={handleCreatePoll}
        effectiveTheme={effectiveTheme}
        isLoading={creatingPoll}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Re-render if selectedContact changes or the send handler changes
  return (
    prevProps.selectedContact?.id === nextProps.selectedContact?.id &&
    prevProps.onSendMessage === nextProps.onSendMessage
  );
});

export default MessageInput; 