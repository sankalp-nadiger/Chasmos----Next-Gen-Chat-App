import React, { useEffect, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import blockService from '../utils/blockService';

const BlockedUsers = ({ onClose, effectiveTheme }) => {
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

  const handleUnblock = async (id) => {
    try {
      await blockService.unblockUser(id);
      setBlocked(prev => prev.filter(u => String(u._id || u.id) !== String(id)));
    } catch (err) { setError(err.message || 'Failed to unblock'); }
  };

  return (
    <div className={`fixed inset-0 z-50 p-6 ${effectiveTheme.primary} overflow-auto`}> 
      <div className={`max-w-2xl mx-auto ${effectiveTheme.secondary} border ${effectiveTheme.border} rounded-lg shadow-lg`}> 
        <div className={`p-4 flex items-center justify-between border-b ${effectiveTheme.border}`}>
          <h3 className={`font-semibold ${effectiveTheme.text}`}>Blocked Users</h3>
          <div className="flex items-center space-x-2">
            <button className={`p-2 rounded hover:${effectiveTheme.hover}`} onClick={onClose}><X className={effectiveTheme.text}/> </button>
          </div>
        </div>

        <div className="p-4">
          {loading && <div className={effectiveTheme.textSecondary}>Loading…</div>}
          {error && <div className="text-sm text-red-500">{error}</div>}
          {!loading && blocked.length === 0 && <div className={effectiveTheme.textSecondary}>No blocked users</div>}

          <ul className="mt-3 space-y-3">
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
                  <button onClick={() => handleUnblock(user._id || user.id)} className="flex items-center gap-2 px-3 py-1 rounded bg-red-500 text-white">
                    <Trash2 className="w-4 h-4"/> Unblock
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BlockedUsers;