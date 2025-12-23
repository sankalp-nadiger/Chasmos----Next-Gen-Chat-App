import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const InviteGroupModal = ({ inviteToken, open, onClose, effectiveTheme }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  // detect theme mode from document (falls back to light)
  const themeMode = (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) ? 'dark' : 'light';

  const modalClasses = `relative z-10 w-full max-w-lg rounded-xl p-6 ${themeMode === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} shadow-lg`;
  const titleClass = themeMode === 'dark' ? 'text-white' : 'text-gray-900';
  const subTextClass = themeMode === 'dark' ? 'text-gray-300' : 'text-gray-500';
  const secondaryTextClass = themeMode === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const primaryBtnClass = themeMode === 'dark'
    ? 'px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition'
    : 'px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition';
  const secondaryBtnClass = themeMode === 'dark'
    ? 'px-4 py-2 rounded border border-gray-700 text-gray-200 hover:bg-gray-800 transition'
    : 'px-4 py-2 rounded border border-gray-200 text-gray-700 hover:bg-gray-50 transition';
  const closeBtnHover = themeMode === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100';
  const [loading, setLoading] = useState(false);
  const [groupInfo, setGroupInfo] = useState(null);
  const [joining, setJoining] = useState(false);
  const location = useLocation();
  const params = useParams();
  const inviteIdFromParams = params?.inviteId || null;
  // consider modal open if parent requested or route contains invite id
  const derivedOpen = !!open || (!!inviteIdFromParams && location?.pathname?.includes('/invite'));
  const [internalOpen, setInternalOpen] = useState(derivedOpen);

  useEffect(() => {
    const shouldFetch = derivedOpen && (inviteToken || inviteIdFromParams || window.location.href.includes('/invite'));
    if (!shouldFetch) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const inviteLink = window.location.href;
        const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const url = `${API_BASE_URL}/api/group/by-invite?inviteLink=${encodeURIComponent(inviteLink)}`;
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error('Failed to fetch invite info');
        const json = await res.json();
        if (!cancelled) setGroupInfo(json);
      } catch (e) {
        console.error('Invite fetch failed', e);
        toast.error('Failed to load invite info');
        onClose && onClose();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open, inviteToken]);

  // sync internalOpen when derived open changes (prop or route)
  useEffect(() => {
    setInternalOpen(derivedOpen);
  }, [derivedOpen]);

  // close modal internally if route no longer contains /invite
  useEffect(() => {
    try {
      if (!location || !location.pathname) return;
      if (!location.pathname.includes('/invite')) {
        // hide modal locally to allow exit animation
        setInternalOpen(false);
      }
    } catch (e) {}
  }, [location && location.pathname]);

  const handleJoin = async () => {
    if (!groupInfo) return;
    setJoining(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
      const res = await fetch(`${API_BASE_URL}/api/group/join-by-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ inviteLink: window.location.href }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to join group');

      toast.success(json.message || 'Joined group');
      // dispatch event so UI can refresh recent chats/messages
      try { window.dispatchEvent(new CustomEvent('chasmos:joined-group', { detail: { group: json.group || json } })); } catch (e) {}
      // close using same handler so internal state and history are kept in sync
      handleClose();
    } catch (e) {
      console.error('Join failed', e);
      toast.error(e.message || 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  const handleClose = () => {
    // hide locally first (allows exit animation)
    try { setInternalOpen(false); } catch (e) {}

    // then call parent's onClose to update history/router
    try {
      if (onClose) onClose();
    } catch (e) {
      console.warn('InviteGroupModal onClose threw', e);
    }

    // If parent didn't navigate away from invite route, ensure we return to chats
    try {
      const path = window.location.pathname || '';
      if (path.includes('/invite')) {
        try { window.history.replaceState({}, '', '/chats'); } catch (e) {}
        // notify router/popstate listeners
        try { window.dispatchEvent(new PopStateEvent('popstate')); } catch (e) { try { window.dispatchEvent(new Event('popstate')); } catch (ee) {} }
      }
    } catch (e) {}
  };

  return (
    <AnimatePresence>
      {internalOpen && (
        <motion.div className="fixed inset-0 z-[20000] flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className={modalClasses}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Group invite</h3>
                <p className={`text-sm ${subTextClass}`}>Invite link: {inviteToken}</p>
              </div>
              <button onClick={handleClose} className={`p-2 rounded ${closeBtnHover}`}>
                <X />
              </button>
            </div>

            <div className="mt-4">
              {loading ? (
                <p className={`text-sm ${secondaryTextClass}`}>Loading...</p>
              ) : groupInfo ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${themeMode === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
                      {groupInfo.name?.charAt(0) || 'G'}
                    </div>
                    <div>
                      <div className={`font-medium ${titleClass}`}>{groupInfo.name}</div>
                      <div className={`text-sm ${secondaryTextClass}`}>{groupInfo.participants?.length || 0} participants</div>
                    </div>
                  </div>

                  <div className={`text-sm ${secondaryTextClass}`}>{groupInfo.description}</div>

                  {groupInfo.participants && groupInfo.currentUserInGroup ? (
                    <div className={`px-3 py-2 rounded ${themeMode === 'dark' ? 'bg-green-900/40 text-green-300' : 'bg-green-50 text-green-700'}`}>You are already in this group</div>
                    ) : (
                    <div className="flex gap-2">
                      <button onClick={handleJoin} disabled={joining} className={primaryBtnClass}>{joining ? 'Joining...' : 'Join group'}</button>
                      <button onClick={handleClose} className={secondaryBtnClass}>Close</button>
                    </div>
                  )}
                </div>
              ) : (
                <p className={`text-sm ${secondaryTextClass}`}>No invite details</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InviteGroupModal;