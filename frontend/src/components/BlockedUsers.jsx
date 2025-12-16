import React, { useEffect, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import blockService from '../utils/blockService';
import Logo from './Logo';
import CosmosBackground from './CosmosBg';

const BlockedUsers = ({ onClose, effectiveTheme, onUnblock, selectedContact }) => {
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await blockService.getBlockedUsers();
      setBlocked(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleUnblock = async (user) => {
    const userId = user?._id || user?.id;
    if (!userId) return;
    
    try {
      await blockService.unblockUser(userId);
      setBlocked(prev => prev.filter(u => String(u._id || u.id) !== String(userId)));
      setError(''); // Clear any previous errors
      
      // Call parent's unblock handler to update state and show system message
      if (onUnblock) {
        // Create a contact-like object for the parent handler
        const contactObj = {
          _id: userId,
          id: userId,
          userId: userId,
          ...user
        };
        onUnblock(contactObj);
      }
    } catch (err) { 
      setError(err.message || 'Failed to unblock'); 
    }
  };

  return (
    <div className={`fixed inset-0 ${effectiveTheme.primary} flex flex-col h-screen w-screen z-50`}>
      {/* Solid white background in day/light mode */}
      {(!effectiveTheme.mode || effectiveTheme.mode === 'light') && (
        <div style={{ position: 'absolute', inset: 0, background: '#ffffff', zIndex: 0 }} />
      )}

 {/* Cosmos Background */}
      <div className="absolute inset-0 overflow-hidden z-[2]">
        <CosmosBackground effectiveTheme={effectiveTheme} />
      </div>

      {/* Content wrapper - relative positioning */}
      <div className="relative z-10 flex flex-col h-full w-full">
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
                Blocked Users
              </h2>
              <p className={`text-sm ${effectiveTheme.textSecondary}`}>
                Manage blocked contacts
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
              <p className={effectiveTheme.textSecondary}>Loading blocked users...</p>
            </div>
          </div>
        ) : blocked.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Trash2 className={`w-16 h-16 ${effectiveTheme.textSecondary} opacity-50`} />
              <p className={`text-lg ${effectiveTheme.textSecondary}`}>No blocked users</p>
              <p className={`text-sm ${effectiveTheme.textSecondary} opacity-75`}>Blocked contacts will appear here</p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {error && <div className="text-sm text-red-500 mb-3">{error}</div>}
            <ul className="space-y-3">
            {blocked.map(user => (
              <li key={user._id || user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">{(user.name||user.email||'U').charAt(0)}</div>
                  <div>
                    <div className={`font-semibold ${effectiveTheme.text}`}>{user.name || user.email}</div>
                    <div className={`text-sm ${effectiveTheme.textSecondary}`}>{user.email}</div>
                  </div>
                </div>
                <div>
                  <button onClick={() => handleUnblock(user)} className="flex items-center gap-2 px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition-colors">
                    <Trash2 className="w-4 h-4"/> Unblock
                  </button>
                </div>
              </li>
            ))}
            </ul>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default BlockedUsers;