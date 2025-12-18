/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Mail, 
  Phone, 
  User, 
  Image as ImageIcon, 
  FileText, 
  Link as LinkIcon,
  Download,
  ChevronRight,
  Calendar
} from 'lucide-react';
import axios from 'axios';
import CosmosBg from './CosmosBg';

const UserProfileModal = ({ isOpen, onClose, userId, effectiveTheme, onNavigateToMessage }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [links, setLinks] = useState([]);
  const [activeTab, setActiveTab] = useState('media');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
      fetchMediaAndDocs();
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      console.log('Fetching user profile for userId:', userId);
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/profile/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setUserDetails(response.data);
      console.log('User profile fetched successfully:', response.data);
    } catch (error) {
      console.error('Error fetching user details:', error);
      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
        
        // If 404, the userId might actually be a chatId - try to resolve it
        if (error.response.status === 404) {
          console.log('User not found - checking if userId is actually a chatId');
          try {
            await fetchUserFromChat(userId);
          } catch (chatError) {
            console.error('Failed to resolve user from chat:', chatError);
          }
        }
      } else if (error.request) {
        console.error('Network error - no response received');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserFromChat = async (possibleChatId) => {
    try {
      const token = localStorage.getItem('token');
      const currentUser = JSON.parse(localStorage.getItem('chasmos_user_data') || '{}');
      const currentUserId = currentUser._id || currentUser.id;
      
      // Try to fetch chat details
      const chatResponse = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/chat/recent`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Find the chat matching the possibleChatId
      const chat = chatResponse.data.find(c => 
        String(c._id) === String(possibleChatId) || String(c.chatId) === String(possibleChatId)
      );
      
      if (chat && chat.participants) {
        // Find the other user
        const otherUser = chat.participants.find(
          p => String(p._id || p.id) !== String(currentUserId)
        );
        
        if (otherUser) {
          console.log('Resolved userId from chat:', otherUser._id);
          // Fetch the user profile with the correct userId
          const userResponse = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/profile/${otherUser._id}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          setUserDetails(userResponse.data);
        }
      }
    } catch (error) {
      console.error('Error resolving user from chat:', error);
      throw error;
    }
  };

  const fetchMediaAndDocs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      // First, get all chats for this user
      const currentUser = JSON.parse(localStorage.getItem('chasmos_user_data') || '{}');
      const currentUserId = currentUser._id || currentUser.id;
      
      const chatsResponse = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/chat`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Find chats that include the target userId
      const relevantChats = chatsResponse.data.filter(chat => {
        if (chat.isGroupChat) return false;
        return chat.users?.some(user => String(user._id || user.id) === String(userId));
      });
      
      const chatIds = relevantChats.map(chat => chat._id).join(',');
      
      if (!chatIds) {
        console.log('No chats found with this user');
        setMediaFiles([]);
        setDocuments([]);
        setLinks([]);
        return;
      }
      
      // Fetch media, documents, and links using the same endpoints as MediaLinksDocsViewer
      const [mediaRes, docsRes, linksRes] = await Promise.all([
        axios.get(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/message/media?chatIds=${chatIds}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(err => ({ data: [] })),
        axios.get(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/message/documents?chatIds=${chatIds}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(err => ({ data: [] })),
        axios.get(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/message/links?chatIds=${chatIds}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(err => ({ data: [] }))
      ]);
      
      setMediaFiles(mediaRes.data || []);
      setDocuments(docsRes.data || []);
      setLinks(linksRes.data || []);
    } catch (error) {
      console.error('Error fetching media and docs:', error);
      // Set empty arrays on error to prevent undefined issues
      setMediaFiles([]);
      setDocuments([]);
      setLinks([]);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleNavigateToMessage = (messageId) => {
    console.log('handleNavigateToMessage called with:', messageId);
    console.log('onNavigateToMessage function exists:', !!onNavigateToMessage);
    
    if (onNavigateToMessage && messageId) {
      // Close modal first so the message is visible
      onClose();
      // Longer delay to ensure modal is fully closed and DOM is ready
      setTimeout(() => {
        onNavigateToMessage(messageId);
      }, 300);
    } else {
      console.warn('Cannot navigate - messageId:', messageId, 'onNavigateToMessage:', !!onNavigateToMessage);
    }
  };

  const renderMediaTab = () => (
    <div className="grid grid-cols-3 gap-2 p-4">
      {mediaFiles.length > 0 ? (
        mediaFiles.map((media, idx) => {
          console.log('Media item:', media);
          return (
          <motion.div
            key={media._id || `media-${idx}`}
            whileHover={{ scale: 1.05 }}
            className="relative aspect-square rounded-lg overflow-visible group"
          >
            <div className="w-full h-full rounded-lg overflow-hidden">
              {media.mimeType?.startsWith('image/') ? (
                <img
                  src={media.url}
                  alt={media.fileName || 'media'}
                  className="w-full h-full object-cover"
                />
              ) : media.mimeType?.startsWith('video/') ? (
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <video
                    src={media.url}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : null}
            </div>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
              <div className="relative group/nav">
                <button
                  onClick={() => {
                    console.log('Navigate button clicked for media:', media);
                    handleNavigateToMessage(media.messageId);
                  }}
                  className="p-2 bg-white rounded-full hover:bg-blue-100 transition-colors"
                  title="Go to message"
                >
                  <ChevronRight className="w-4 h-4 text-blue-600" />
                </button>
                <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/nav:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  Go to message
                </span>
              </div>
              <div className="relative group/download">
                <button
                  onClick={() => handleDownload(media.url, media.fileName || 'media')}
                  className="p-2 bg-white rounded-full hover:bg-green-100 transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4 text-green-600" />
                </button>
                <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/download:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  Download
                </span>
              </div>
            </div>
          </motion.div>
        );
        })
      ) : (
        <div className="col-span-3 text-center py-8 text-gray-500">
          No media files yet
        </div>
      )}
    </div>
  );

  const renderDocsTab = () => (
    <div className="p-4 space-y-2">
      {documents.length > 0 ? (
        documents.map((doc, idx) => {
          console.log('Document item:', doc);
          return (
          <motion.div
            key={doc._id || `doc-${idx}`}
            whileHover={{ x: 5 }}
            className={`flex items-center justify-between p-3 rounded-lg ${
              effectiveTheme.mode === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-750' 
                : 'bg-gray-50 hover:bg-gray-100'
            } transition-colors group`}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className={`p-2 rounded-lg ${effectiveTheme.accent}`}>
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${effectiveTheme.text}`}>
                  {doc.fileName || 'Unknown'}
                </p>
                <p className={`text-xs ${effectiveTheme.textSecondary}`}>
                  {formatDate(doc.createdAt || doc.timestamp)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative group/nav">
                <button
                  onClick={() => {
                    console.log('Navigate button clicked for doc:', doc);
                    handleNavigateToMessage(doc.messageId);
                  }}
                  className={`p-1.5 rounded hover:bg-blue-500/20 transition-colors`}
                  title="Go to message"
                >
                  <ChevronRight className={`w-4 h-4 ${effectiveTheme.mode === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                </button>
                <span className={`absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/nav:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[100]`}>
                  Go to message
                </span>
              </div>
              <div className="relative group/download">
                <button
                  onClick={() => handleDownload(doc.url, doc.fileName || 'document')}
                  className={`p-1.5 rounded hover:bg-green-500/20 transition-colors`}
                  title="Download"
                >
                  <Download className={`w-4 h-4 ${effectiveTheme.mode === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                </button>
                <span className={`absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/download:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[100]`}>
                  Download
                </span>
              </div>
            </div>
          </motion.div>
        );
        })
      ) : (
        <div className="text-center py-8 text-gray-500">
          No documents yet
        </div>
      )}
    </div>
  );

  const renderLinksTab = () => (
    <div className="p-4 space-y-2">
      {links.length > 0 ? (
        links.map((link, idx) => {
          console.log('Link item:', link);
          return (
          <motion.div
            key={link._id || `link-${idx}`}
            whileHover={{ x: 5 }}
            className={`flex items-center justify-between p-3 rounded-lg ${
              effectiveTheme.mode === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-750' 
                : 'bg-gray-50 hover:bg-gray-100'
            } transition-colors group`}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className={`p-2 rounded-lg ${effectiveTheme.accent}`}>
                <LinkIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${effectiveTheme.text}`}>
                  {link.url}
                </p>
                <p className={`text-xs ${effectiveTheme.textSecondary}`}>
                  {formatDate(link.createdAt || link.timestamp)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative group/nav">
                <button
                  onClick={() => {
                    console.log('Navigate button clicked for link:', link);
                    handleNavigateToMessage(link.messageId);
                  }}
                  className={`p-1.5 rounded hover:bg-blue-500/20 transition-colors`}
                  title="Go to message"
                >
                  <ChevronRight className={`w-4 h-4 ${effectiveTheme.mode === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                </button>
                <span className={`absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/nav:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[100]`}>
                  Go to message
                </span>
              </div>
              <div className="relative group/open">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-1.5 rounded hover:bg-purple-500/20 transition-colors inline-flex`}
                  title="Open link"
                >
                  <LinkIcon className={`w-4 h-4 ${effectiveTheme.mode === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                </a>
                <span className={`absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/open:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[100]`}>
                  Open link
                </span>
              </div>
            </div>
          </motion.div>
        );
        })
      ) : (
        <div className="text-center py-8 text-gray-500">
          No links yet
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40"
            style={{ pointerEvents: 'auto' }}
          />

          {/* Modal - Meteor Drop Effect */}
          <motion.div
            initial={{ 
              y: -500, 
              opacity: 0,
              scale: 0.3,
              rotateX: -90
            }}
            animate={{ 
              y: 0, 
              opacity: 1,
              scale: 1,
              rotateX: 0
            }}
            exit={{ 
              y: -500, 
              opacity: 0,
              scale: 0.3,
              rotateX: -90
            }}
            transition={{ 
              type: 'spring', 
              damping: 20, 
              stiffness: 150,
              duration: 0.6
            }}
            className={`fixed ${
              effectiveTheme.mode === 'dark' 
                ? 'bg-gray-900/95' 
                : 'bg-white/95'
            } backdrop-blur-xl shadow-2xl z-50 overflow-hidden flex flex-col`}
            style={{
              top: '72px',
              right: '0',
              width: '85%',
              maxWidth: '600px',
              bottom: '80px',
              clipPath: 'polygon(8% 0%, 100% 0%, 100% 100%, 0% 100%)',
              borderTopLeftRadius: '60px',
              borderBottomLeftRadius: '30px',
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              pointerEvents: 'auto'
            }}
          >
            {/* Gradient Top Border */}
            <div 
              className="absolute top-0 left-0 right-0 h-1 z-20"
              style={{
                background: 'linear-gradient(90deg, rgba(59, 130, 246, 0) 0%, rgba(59, 130, 246, 1) 10%, rgba(139, 92, 246, 1) 50%, rgba(236, 72, 153, 1) 90%, rgba(236, 72, 153, 0) 100%)',
                clipPath: 'polygon(8% 0%, 100% 0%, 100% 100%, 8% 100%)',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4), 0 1px 3px rgba(59, 130, 246, 0.3)',
                filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.5))'
              }}
            />
            
            {/* Background */}
            <div className="absolute inset-0 z-0 opacity-40">
              <CosmosBg />
            </div>
            
            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              onClick={onClose}
              className={`absolute top-4 right-4 z-50 p-2 rounded-full ${effectiveTheme.hover} transition-colors backdrop-blur-sm`}
            >
              <X className={`w-5 h-5 ${effectiveTheme.text}`} />
            </motion.button>

            {/* Content */}
            <div className="flex-1 overflow-y-auto relative z-10 pt-2">
              {loading ? (
                <div className="flex items-center justify-center h-full py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
                </div>
              ) : userDetails ? (
                <>
                  {/* User Avatar - Appears First (Meteor Head) */}
                  <motion.div 
                    className={`p-6 text-center`}
                    initial={{ opacity: 0, scale: 0.5, y: -50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                      delay: 0.2,
                      type: 'spring',
                      stiffness: 200,
                      damping: 15
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        delay: 0.3,
                        type: 'spring', 
                        stiffness: 200,
                        damping: 15
                      }}
                      className="mx-auto w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-blue-500 shadow-2xl shadow-blue-500/50"
                    >
                      {/* <img
                        src={userDetails.avatar || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'}
                        alt={userDetails.name}
                        className="w-full h-full object-cover"
                      /> */}
                      <img
  src={
    userDetails.avatar && userDetails.avatar.trim() !== ""
      ? userDetails.avatar
      : "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
  }
  alt={userDetails.name}
  className="w-full h-full object-cover"
/>

                    </motion.div>
                    
                    {/* Name - Appears Second */}
                    <motion.h3 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className={`text-2xl font-bold ${effectiveTheme.text} mb-2`}
                    >
                      {userDetails.name}
                    </motion.h3>
                    
                    {/* Bio - Appears Third */}
                    <motion.p 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className={`text-sm ${effectiveTheme.textSecondary} italic`}
                    >
                      {userDetails.bio || 'Hey there! I am using Chasmos.'}
                    </motion.p>
                  </motion.div>

                  {/* Contact Details - Staggered Appearance */}
                  <motion.div 
                    className="px-4 py-3 space-y-3 flex flex-col items-stretch"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    {userDetails.email && (
                      <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        whileHover={{ x: 5 }}
                        className={`flex items-center space-x-3 p-3 rounded-lg backdrop-blur-sm ${
                          effectiveTheme.mode === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50/50'
                        }`}
                        style={{ marginLeft: '3rem', marginRight: '0' }}
                      >
                        <div className={`p-2 rounded-full ${effectiveTheme.accent} flex-shrink-0`}>
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs ${effectiveTheme.textSecondary}`}>Email</p>
                          <p className={`font-medium ${effectiveTheme.text} truncate`}>
                            {userDetails.email}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {userDetails.phoneNumber && (
                      <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        whileHover={{ x: 5 }}
                        className={`flex items-center space-x-3 p-3 rounded-lg backdrop-blur-sm ${
                          effectiveTheme.mode === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50/50'
                        }`}
                        style={{ marginLeft: '2rem', marginRight: '1rem' }}
                      >
                        <div className={`p-2 rounded-full ${effectiveTheme.accent} flex-shrink-0`}>
                          <Phone className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs ${effectiveTheme.textSecondary}`}>Phone</p>
                          <p className={`font-medium ${effectiveTheme.text} truncate`}>
                            {userDetails.phoneNumber}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {userDetails.createdAt && (
                      <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1.0 }}
                        whileHover={{ x: 5 }}
                        className={`flex items-center space-x-3 p-3 rounded-lg backdrop-blur-sm ${
                          effectiveTheme.mode === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50/50'
                        }`}
                        style={{ marginLeft: '1rem', marginRight: '2rem' }}
                      >
                        <div className={`p-2 rounded-full ${effectiveTheme.accent} flex-shrink-0`}>
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs ${effectiveTheme.textSecondary}`}>Joined</p>
                          <p className={`font-medium ${effectiveTheme.text} truncate`}>
                            {formatDate(userDetails.createdAt)}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Media, Docs, Links Section - Expands Last */}
                  <motion.div 
                    className="mt-6"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ delay: 1.1, duration: 0.5 }}
                  >
                    <div className={`border-t ${effectiveTheme.border}`}>
                      {/* Tabs */}
                      <motion.div 
                        className={`flex backdrop-blur-sm ${effectiveTheme.mode === 'dark' ? 'bg-gray-800/30' : 'bg-gray-50/30'}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.2 }}
                      >
                        <button
                          onClick={() => setActiveTab('media')}
                          className={`flex-1 py-3 px-4 font-medium transition-colors relative ${
                            activeTab === 'media'
                              ? effectiveTheme.text
                              : effectiveTheme.textSecondary
                          }`}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <ImageIcon className="w-4 h-4" />
                            <span>Media</span>
                          </div>
                          {activeTab === 'media' && (
                            <motion.div
                              layoutId="activeTab"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                            />
                          )}
                        </button>

                        <button
                          onClick={() => setActiveTab('docs')}
                          className={`flex-1 py-3 px-4 font-medium transition-colors relative ${
                            activeTab === 'docs'
                              ? effectiveTheme.text
                              : effectiveTheme.textSecondary
                          }`}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <FileText className="w-4 h-4" />
                            <span>Docs</span>
                          </div>
                          {activeTab === 'docs' && (
                            <motion.div
                              layoutId="activeTab"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                            />
                          )}
                        </button>

                        <button
                          onClick={() => setActiveTab('links')}
                          className={`flex-1 py-3 px-4 font-medium transition-colors relative ${
                            activeTab === 'links'
                              ? effectiveTheme.text
                              : effectiveTheme.textSecondary
                          }`}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <LinkIcon className="w-4 h-4" />
                            <span>Links</span>
                          </div>
                          {activeTab === 'links' && (
                            <motion.div
                              layoutId="activeTab"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                            />
                          )}
                        </button>
                      </motion.div>

                      {/* Tab Content */}
                      <motion.div 
                        className="min-h-[300px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.3 }}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                          >
                            {activeTab === 'media' && renderMediaTab()}
                            {activeTab === 'docs' && renderDocsTab()}
                            {activeTab === 'links' && renderLinksTab()}
                          </motion.div>
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  </motion.div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className={effectiveTheme.textSecondary}>
                    Unable to load user details
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserProfileModal;
