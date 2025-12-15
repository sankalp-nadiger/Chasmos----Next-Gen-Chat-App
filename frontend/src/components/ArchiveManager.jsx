import React, { useEffect, useState } from 'react';
import archiveService from '../utils/archiveService';
import { X, Archive } from 'lucide-react';
import Logo from './Logo';

const ArchiveManager = ({ onClose, effectiveTheme, onOpenChat, onUnarchive }) => {
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await archiveService.getArchivedChats();
      
      // Get current user info
      const currentUser = JSON.parse(localStorage.getItem('chasmos_user_data') || '{}');
      const currentUserId = currentUser._id || currentUser.id;
      
      // Deduplicate by chat id in case backend returns duplicates
      const seen = new Set();
      const unique = [];
      (data || []).forEach(item => {
        const id = item._id || item.id;
        if (!id) return;
        if (!seen.has(String(id))) {
          seen.add(String(id));
          
          // Find the other user (not the logged-in user)
          let otherUser = null;
          if (item.participants && Array.isArray(item.participants)) {
            otherUser = item.participants.find(p => String(p._id || p.id) !== String(currentUserId));
          } else if (item.users && Array.isArray(item.users)) {
            otherUser = item.users.find(u => String(u._id || u.id) !== String(currentUserId));
          }
          
          // Determine display name (skip "sender" as it's a placeholder)
          let displayName = 'Chat';
          if (item.isGroupChat) {
            displayName = item.chatName || 'Group Chat';
          } else {
            // For 1-on-1 chats, use other user's name (ignore "sender" placeholder)
            displayName = otherUser?.name || otherUser?.username || otherUser?.email || 'Chat';
          }
          
          // Add formatted chat data
          unique.push({
            ...item,
            displayName: displayName,
            displayAvatar: otherUser?.avatar || otherUser?.pic || null
          });
        }
      });
      setArchived(unique);
    } catch (err) { setError(err.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleUnarchive = async (chat) => {
    const chatId = chat._id || chat.id;
    try {
      // Remove from local state immediately for better UX
      setArchived(prev => prev.filter(c => String(c._id || c.id) !== String(chatId)));
      
      // Call parent's unarchive handler which will refresh recent chats
      if (onUnarchive) {
        await onUnarchive(chat);
      } else {
        // Fallback if no callback provided
        await archiveService.unarchiveChat(chatId);
      }
    } catch (err) { 
      setError(err.message || 'Failed to unarchive');
      // Reload archived chats on error to restore state
      load();
    }
  };

  return (
    <div className={`fixed inset-0 ${effectiveTheme.primary} flex flex-col h-screen w-screen z-50`}>
      {/* Header */}
      <div className={`${effectiveTheme.secondary} border-b ${effectiveTheme.border} p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className={`p-2 rounded-full hover:${effectiveTheme.hover} transition-colors`}
            >
              <X className={`w-6 h-6 ${effectiveTheme.text}`} />
            </button>
            
            {/* Chasmos Logo and Name */}
            <div className="flex items-center space-x-2">
              <Logo size="md" showText={true} textClassName={effectiveTheme.text} />
            </div>
            
            <div className={`hidden sm:block border-l ${effectiveTheme.border} h-10 mx-3`}></div>
            
            <div>
              <h2 className={`text-xl font-semibold ${effectiveTheme.text}`}>
                Archived Chats
              </h2>
              <p className={`text-sm ${effectiveTheme.textSecondary}`}>
                Manage your archived conversations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className={effectiveTheme.textSecondary}>Loading archived chats...</p>
            </div>
          </div>
        ) : archived.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Archive className={`w-16 h-16 ${effectiveTheme.textSecondary} opacity-50`} />
              <p className={`text-lg ${effectiveTheme.textSecondary}`}>No archived chats</p>
              <p className={`text-sm ${effectiveTheme.textSecondary} opacity-75`}>Your archived conversations will appear here</p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {error && <div className="text-sm text-red-500 mb-3">{error}</div>}
            <ul className="space-y-3">
            {archived.map(chat => (
              <li key={chat._id || chat.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {chat.displayAvatar ? (
                    <img 
                      src={chat.displayAvatar} 
                      alt={chat.displayName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <Archive className="w-4 h-4"/>
                    </div>
                  )}
                  <div>
                    <div className={`font-semibold ${effectiveTheme.text}`}>{chat.displayName}</div>
                    <div className={`text-sm ${effectiveTheme.textSecondary}`}>{chat.lastMessage?.content || ''}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onOpenChat(chat)} className="px-3 py-1 rounded bg-blue-600 text-white">Open</button>
                  <button onClick={() => handleUnarchive(chat)} className="px-3 py-1 rounded bg-green-500 text-white">Unarchive</button>
                </div>
              </li>
            ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchiveManager;
