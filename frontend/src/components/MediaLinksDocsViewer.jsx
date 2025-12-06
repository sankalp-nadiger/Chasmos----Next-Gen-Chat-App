import React, { useState, useEffect, useCallback } from 'react';
import { X, Download, ExternalLink, FileText, Image, Video, File, Link, Filter, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MediaLinksDocsViewer = ({ onClose, effectiveTheme, contacts, selectedContact }) => {
  const [activeTab, setActiveTab] = useState('media'); // media, links, docs
  const [mediaItems, setMediaItems] = useState([]);
  const [linkItems, setLinkItems] = useState([]);
  const [docItems, setDocItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedChats, setSelectedChats] = useState([]);
  const [availableChats, setAvailableChats] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // Fetch recent chats from backend
  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
        if (!token) {
          console.error('No token found');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/chat`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch chats');
        }

        const chatsData = await response.json();
        
        // Transform chats into the format needed for the component
        const transformedChats = chatsData.map(chat => {
          // For 1-on-1 chats, get the other user's info
          const currentUserId = JSON.parse(localStorage.getItem('chasmos_user_data') || '{}')._id;
          let chatName = 'Unknown';
          let chatAvatar = null;
          
          if (!chat.isGroupChat && chat.users && chat.users.length > 0) {
            const otherUser = chat.users.find(user => 
              String(user._id || user.id) !== String(currentUserId)
            );
            if (otherUser) {
              chatName = otherUser.name || otherUser.email || 'Unknown';
              chatAvatar = otherUser.avatar;
            }
          } else if (chat.isGroupChat) {
            chatName = chat.chatName || 'Group Chat';
            chatAvatar = chat.groupAvatar;
          }

          return {
            id: chat._id,
            name: chatName,
            avatar: chatAvatar
          };
        });

        setAvailableChats(transformedChats);
        setSelectedChats(transformedChats.map(c => c.id)); // Select all by default
      } catch (error) {
        console.error('Error fetching recent chats:', error);
        setError('Failed to load chats');
      }
    };

    fetchRecentChats();
  }, [API_BASE_URL]);

  // Fetch data when tab or selected chats change
  useEffect(() => {
    if (selectedChats.length > 0) {
      fetchData();
    }
  }, [activeTab, selectedChats]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
      if (!token) {
        console.error('No authentication token found');
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const chatIds = selectedChats.join(',');
      console.log('Fetching data for chats:', chatIds);
      
      let endpoint = '';
      
      switch (activeTab) {
        case 'media':
          endpoint = `/api/message/media?chatIds=${chatIds}`;
          break;
        case 'links':
          endpoint = `/api/message/links?chatIds=${chatIds}`;
          break;
        case 'docs':
          endpoint = `/api/message/documents?chatIds=${chatIds}`;
          break;
        default:
          endpoint = `/api/message/media?chatIds=${chatIds}`;
      }

      console.log('Fetching from endpoint:', `${API_BASE_URL}${endpoint}`);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch ${activeTab}: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log(`Received ${data.length} items for ${activeTab}`);
      
      switch (activeTab) {
        case 'media':
          setMediaItems(data || []);
          break;
        case 'links':
          setLinkItems(data || []);
          break;
        case 'docs':
          setDocItems(data || []);
          break;
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || `Failed to load ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleChatSelection = (chatId) => {
    setSelectedChats(prev => {
      if (prev.includes(chatId)) {
        return prev.filter(id => id !== chatId);
      } else {
        return [...prev, chatId];
      }
    });
  };

  const selectAllChats = () => {
    setSelectedChats(availableChats.map(c => c.id));
  };

  const deselectAllChats = () => {
    setSelectedChats([]);
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download file');
    }
  };

  const renderMediaGrid = () => {
    if (loading) {
      return <div className={`text-center py-8 ${effectiveTheme.textSecondary}`}>Loading media...</div>;
    }

    if (mediaItems.length === 0) {
      return <div className={`text-center py-8 ${effectiveTheme.textSecondary}`}>No media found</div>;
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {mediaItems.map((item, index) => (
          <motion.div
            key={item._id || index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative group rounded-lg overflow-hidden ${effectiveTheme.secondary} border ${effectiveTheme.border} hover:shadow-lg transition-shadow`}
          >
            {item.mimeType?.startsWith('image/') ? (
              <div className="aspect-square">
                <img
                  src={item.url}
                  alt={item.fileName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : item.mimeType?.startsWith('video/') ? (
              <div className="aspect-square bg-black">
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  controls={false}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="w-12 h-12 text-white opacity-70" />
                </div>
              </div>
            ) : null}
            
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button
                onClick={() => handleDownload(item.url, item.fileName)}
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors mr-2"
                title="Download"
              >
                <Download className="w-5 h-5 text-gray-800" />
              </button>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                title="Open"
              >
                <ExternalLink className="w-5 h-5 text-gray-800" />
              </a>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
              <p className="text-xs text-white truncate">{item.fileName}</p>
              <p className="text-xs text-gray-300">{new Date(item.createdAt).toLocaleDateString()}</p>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderLinksList = () => {
    if (loading) {
      return <div className={`text-center py-8 ${effectiveTheme.textSecondary}`}>Loading links...</div>;
    }

    if (linkItems.length === 0) {
      return <div className={`text-center py-8 ${effectiveTheme.textSecondary}`}>No links found</div>;
    }

    return (
      <div className="p-4 space-y-3">
        {linkItems.map((item, index) => (
          <motion.div
            key={item._id || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-4 rounded-lg ${effectiveTheme.secondary} border ${effectiveTheme.border} hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${effectiveTheme.mode === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                <Link className={`w-5 h-5 ${effectiveTheme.mode === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-medium ${effectiveTheme.mode === 'dark' ? 'text-blue-400' : 'text-blue-600'} hover:underline break-all`}
                >
                  {item.url}
                </a>
                <p className={`text-sm mt-1 ${effectiveTheme.textSecondary}`}>
                  {item.content && item.content !== item.url ? item.content : ''}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className={effectiveTheme.textSecondary}>
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                  <span className={effectiveTheme.textSecondary}>
                    From: {item.senderName || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderDocsList = () => {
    if (loading) {
      return <div className={`text-center py-8 ${effectiveTheme.textSecondary}`}>Loading documents...</div>;
    }

    if (docItems.length === 0) {
      return <div className={`text-center py-8 ${effectiveTheme.textSecondary}`}>No documents found</div>;
    }

    return (
      <div className="p-4 space-y-3">
        {docItems.map((item, index) => (
          <motion.div
            key={item._id || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-4 rounded-lg ${effectiveTheme.secondary} border ${effectiveTheme.border} hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${effectiveTheme.mode === 'dark' ? 'bg-green-900/30' : 'bg-green-100'}`}>
                {item.mimeType?.includes('pdf') ? (
                  <FileText className={`w-5 h-5 ${effectiveTheme.mode === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                ) : (
                  <File className={`w-5 h-5 ${effectiveTheme.mode === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${effectiveTheme.text} truncate`}>{item.fileName}</p>
                <p className={`text-sm mt-1 ${effectiveTheme.textSecondary}`}>
                  {item.fileSize ? `${(item.fileSize / 1024).toFixed(2)} KB` : 'Unknown size'}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className={effectiveTheme.textSecondary}>
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                  <span className={effectiveTheme.textSecondary}>
                    From: {item.senderName || 'Unknown'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(item.url, item.fileName)}
                  className={`p-2 rounded-lg ${effectiveTheme.mode === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                  title="Download"
                >
                  <Download className={`w-5 h-5 ${effectiveTheme.text}`} />
                </button>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-lg ${effectiveTheme.mode === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                  title="Open"
                >
                  <ExternalLink className={`w-5 h-5 ${effectiveTheme.text}`} />
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-6xl h-[90vh] ${effectiveTheme.secondary} border ${effectiveTheme.border} rounded-lg shadow-2xl flex flex-col overflow-hidden`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${effectiveTheme.border}`}>
          <h2 className={`text-xl font-semibold ${effectiveTheme.text}`}>
            Media, Links & Documents
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`p-2 rounded-lg ${effectiveTheme.mode === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
              title="Filter by chats"
            >
              <Filter className={`w-5 h-5 ${effectiveTheme.text}`} />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${effectiveTheme.mode === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
            >
              <X className={`w-5 h-5 ${effectiveTheme.text}`} />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilter && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`border-b ${effectiveTheme.border} overflow-hidden`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-medium ${effectiveTheme.text}`}>Filter by Chats</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllChats}
                      className={`text-xs px-3 py-1 rounded ${effectiveTheme.mode === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllChats}
                      className={`text-xs px-3 py-1 rounded ${effectiveTheme.mode === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'} ${effectiveTheme.text} transition-colors`}
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {availableChats.map(chat => (
                    <label
                      key={chat.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${selectedChats.includes(chat.id) ? (effectiveTheme.mode === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100') : (effectiveTheme.mode === 'dark' ? 'bg-gray-800' : 'bg-gray-100')} hover:shadow transition-all`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedChats.includes(chat.id)}
                        onChange={() => toggleChatSelection(chat.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${effectiveTheme.mode === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} ${effectiveTheme.text}`}>
                          {chat.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={`text-sm truncate ${effectiveTheme.text}`}>{chat.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className={`flex border-b ${effectiveTheme.border}`}>
          <button
            onClick={() => setActiveTab('media')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              activeTab === 'media'
                ? `${effectiveTheme.mode === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'} border-b-2 border-blue-500`
                : `${effectiveTheme.textSecondary} hover:${effectiveTheme.hover}`
            }`}
          >
            <Image className="w-5 h-5 inline mr-2" />
            Media
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              activeTab === 'links'
                ? `${effectiveTheme.mode === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'} border-b-2 border-blue-500`
                : `${effectiveTheme.textSecondary} hover:${effectiveTheme.hover}`
            }`}
          >
            <Link className="w-5 h-5 inline mr-2" />
            Links
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              activeTab === 'docs'
                ? `${effectiveTheme.mode === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'} border-b-2 border-blue-500`
                : `${effectiveTheme.textSecondary} hover:${effectiveTheme.hover}`
            }`}
          >
            <FileText className="w-5 h-5 inline mr-2" />
            Documents
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="p-4 m-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          {selectedChats.length === 0 ? (
            <div className={`text-center py-8 ${effectiveTheme.textSecondary}`}>
              Please select at least one chat to view content
            </div>
          ) : (
            <>
              {activeTab === 'media' && renderMediaGrid()}
              {activeTab === 'links' && renderLinksList()}
              {activeTab === 'docs' && renderDocsList()}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default MediaLinksDocsViewer;
