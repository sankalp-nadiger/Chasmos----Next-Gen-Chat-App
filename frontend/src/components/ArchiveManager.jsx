import React, { useEffect, useState } from 'react';
import archiveService from '../utils/archiveService';
import { X, Archive } from 'lucide-react';
import Logo from './Logo';

const ArchiveManager = ({ onClose, effectiveTheme, onOpenChat }) => {
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await archiveService.getArchivedChats();
      // Deduplicate by chat id in case backend returns duplicates
      const seen = new Set();
      const unique = [];
      (data || []).forEach(item => {
        const id = item._id || item.id;
        if (!id) return;
        if (!seen.has(String(id))) {
          seen.add(String(id));
          unique.push(item);
        }
      });
      setArchived(unique);
    } catch (err) { setError(err.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleUnarchive = async (chatId) => {
    try {
      await archiveService.unarchiveChat(chatId);
      setArchived(prev => prev.filter(c => String(c._id || c.id) !== String(chatId)));
    } catch (err) { setError(err.message || 'Failed to unarchive'); }
  };

  return (
    <div className={`fixed inset-0 z-50 p-6 ${effectiveTheme.primary} overflow-auto`}> 
      <div className={`max-w-3xl mx-auto ${effectiveTheme.secondary} border ${effectiveTheme.border} rounded-lg shadow-lg`}> 
        <div className={`p-4 flex items-center justify-between border-b ${effectiveTheme.border}`}>
          <div className="flex items-center gap-3">
            <Logo size="sm" showText={true} textClassName={`${effectiveTheme.text}`} containerClassName="" />
          </div>
          <div className="flex items-center space-x-2">
            <button className={`p-2 rounded hover:${effectiveTheme.hover}`} onClick={onClose}><X className={effectiveTheme.text}/> </button>
          </div>
        </div>

        <div className="p-4">
          {loading && <div className={effectiveTheme.textSecondary}>Loading…</div>}
          {error && <div className="text-sm text-red-500">{error}</div>}
          {!loading && archived.length === 0 && <div className={effectiveTheme.textSecondary}>No archived chats</div>}

          <ul className="mt-3 space-y-3">
            {archived.map(chat => (
              <li key={chat._id || chat.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"><Archive className="w-4 h-4"/></div>
                  <div>
                    <div className={`font-semibold ${effectiveTheme.text}`}>{chat.name || (chat.users && chat.users[0] && chat.users[0].name) || 'Chat'}</div>
                    <div className={`text-sm ${effectiveTheme.textSecondary}`}>{chat.lastMessage?.content || ''}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onOpenChat(chat)} className="px-3 py-1 rounded bg-blue-600 text-white">Open</button>
                  <button onClick={() => handleUnarchive(chat._id || chat.id)} className="px-3 py-1 rounded bg-green-500 text-white">Unarchive</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ArchiveManager;
