/* eslint-disable no-unused-vars */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Send, Paperclip, Image, FileText, Camera, MapPin, X, Clock, Calendar, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CosmosBg from './CosmosBg';
import PollCreationModal from './PollCreationModal';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  const first = parts[0].charAt(0).toUpperCase();
  const last = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first}${last}`;
};

const MessageInput = React.memo(({ 
  onSendMessage, 
  selectedContact,
  effectiveTheme,
  isGroupChat = false,
  socket = null,
  currentUser = null,
}) => {
  const [messageInput, setMessageInput] = useState("");
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [creatingPoll, setCreatingPoll] = useState(false);
  const attachmentMenuRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const typingTimeoutRef = useRef(null);
  const isTypingSentRef = useRef(false);
  // Mention related state
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [selectedMentions, setSelectedMentions] = useState([]); // array of user ids
  const [selectedMentionMap, setSelectedMentionMap] = useState({}); // id -> display name
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedContactFetched, setSelectedContactFetched] = useState(null);

  const fetchGroupMembers = useCallback(async (chatId) => {
    if (!chatId) return;
    setLoadingMembers(true);
    // Try multiple storage keys and sessionStorage as fallback
    const storageCandidates = [
      { store: 'localStorage', key: 'token' },
      { store: 'localStorage', key: 'chasmos_auth_token' },
      { store: 'localStorage', key: 'chasmos_token' },
      { store: 'sessionStorage', key: 'token' },
      { store: 'sessionStorage', key: 'chasmos_auth_token' },
    ];

    let token = null;
    let tokenKeyUsed = null;
    for (const s of storageCandidates) {
      try {
        const val = (s.store === 'localStorage' ? localStorage.getItem(s.key) : sessionStorage.getItem(s.key));
        if (val) {
          token = val;
          tokenKeyUsed = `${s.store}.${s.key}`;
          break;
        }
      } catch (e) {
        // ignore storage access errors
      }
    }

    const masked = token ? (String(token).slice(0, 8) + '...' + String(token).slice(-4)) : null;
    try { console.log('[fetchGroupMembers] using auth token', { tokenKeyUsed, masked }); } catch (e) {}

    const endpoints = [
      // Mirror GroupInfoModal's preferred endpoint
      `${API_BASE}/api/group/group/${chatId}`,
      // prefer new chat participants endpoint
      `${API_BASE}/api/chat/${chatId}/participants`,
      `${API_BASE}/api/group/${chatId}/members`, // legacy endpoints
      `${API_BASE}/api/group/${chatId}`,
      `${API_BASE}/api/chat/group/${chatId}`,
      `${API_BASE}/api/chat/${chatId}`,
      `${API_BASE}/api/group/get/${chatId}`,
    ];

    const tryParseMembers = (data) => {
      if (!data) return [];
      const candidates = [];
      // common shapes
      if (Array.isArray(data.members)) candidates.push(...data.members);
      if (Array.isArray(data.users)) candidates.push(...data.users);
      if (Array.isArray(data.participants)) candidates.push(...data.participants);
      // nested shapes
      if (data.group && Array.isArray(data.group.members)) candidates.push(...data.group.members);
      if (data.chat && Array.isArray(data.chat.users)) candidates.push(...data.chat.users);
      // sometimes API wraps in `data` key
      if (data.data) return tryParseMembers(data.data);
      // remove duplicates
      const uniq = [];
      const seen = new Set();
      for (const m of candidates) {
        const id = String(m?._id || m?.id || m).toString();
        if (!id) continue;
        if (!seen.has(id)) {
          seen.add(id);
          uniq.push(m);
        }
      }
      return uniq;
    };

    try {
      for (const url of endpoints) {
        try {
          const headersObj = {};
          if (token) headersObj.Authorization = `Bearer ${token}`;
          const res = await fetch(url, { headers: headersObj });
          if (!res.ok) {
            try { console.warn('[fetchGroupMembers] non-ok response', { url, status: res.status }); } catch(e){}
            continue;
          }
          const data = await res.json();
          try { console.log('[fetchGroupMembers] response', { url, data }); } catch(e){}
          // If the response contains group info (not just members), log derived features
          const groupShape = data || {};
          const rawFeatures = groupShape.features || (groupShape.group && groupShape.group.features) || (groupShape.groupSettings && groupShape.groupSettings.features) || {};
          const derived = {
            media: rawFeatures.media !== false,
            gallery: rawFeatures.gallery !== false,
            docs: rawFeatures.docs !== false,
            polls: rawFeatures.polls !== false,
          };
          try { console.log('[fetchGroupMembers] derived features from response', { url, derived, groupShapeSummary: { id: groupShape._id || groupShape.id || groupShape.chatId, name: groupShape.name || groupShape.chatName } }); } catch(e) {}

          const members = tryParseMembers(data || {});
          if (members && members.length) {
            setGroupMembers(members);
            return;
          }
          // if we got a 200 but no member objects, still set to empty and stop
          setGroupMembers([]);
          return;
        } catch (e) {
          try { console.warn('[fetchGroupMembers] fetch error', { url, err: e && e.message }); } catch(e){}
          continue;
        }
      }
      // none of the endpoints yielded members
      setGroupMembers([]);
    } catch (e) {
      setGroupMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

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

  // Derive whether this is a group and the effective features (robust to multiple payload shapes)
  const resolvedIsGroup = Boolean(
    isGroupChat ||
    (selectedContact && (selectedContact.isGroup || selectedContact.isGroupChat)) ||
    (selectedContact && (selectedContact.participants || selectedContact.admins || selectedContact.inviteEnabled)) ||
    (selectedContact && (selectedContact.group || selectedContact.groupSettings))
  );

  const derivedFeaturesRaw = (
    // Prefer freshly fetched group info (if available) so UI reflects saved settings
    (selectedContactFetched && selectedContactFetched.features) ||
    (selectedContactFetched && selectedContactFetched.group && selectedContactFetched.group.features) ||
    (selectedContactFetched && selectedContactFetched.groupSettings && selectedContactFetched.groupSettings.features) ||
    selectedContact?.features ||
    (selectedContact?.group && selectedContact.group.features) ||
    (selectedContact?.groupSettings && selectedContact.groupSettings.features) ||
    (selectedContact?.group?.groupSettings && selectedContact.group.groupSettings.features) ||
    {}
  );

  const featureMediaAllowed = derivedFeaturesRaw.media !== false;
  const featureGalleryAllowed = derivedFeaturesRaw.gallery !== false;
  const featureDocsAllowed = derivedFeaturesRaw.docs !== false;
  const featurePollsAllowed = derivedFeaturesRaw.polls !== false;

  // Log derived values for debugging
  useEffect(() => {
    try {
      console.log('[MessageInput] derived features', {
        resolvedIsGroup,
        derivedFeaturesRaw,
        featureMediaAllowed,
        featureGalleryAllowed,
        featureDocsAllowed,
        featurePollsAllowed,
        selectedContactSummary: {
          id: selectedContact?.id || selectedContact?._id || selectedContact?.chatId,
          isGroupFlag: selectedContact?.isGroup || selectedContact?.isGroupChat,
        }
        , fetchedSummary: selectedContactFetched ? { id: selectedContactFetched._id || selectedContactFetched.id || selectedContactFetched.chatId, features: selectedContactFetched.features || selectedContactFetched.groupSettings || selectedContactFetched.group } : null
      });
    } catch (e) {}
  }, [resolvedIsGroup, derivedFeaturesRaw, featureMediaAllowed, featureGalleryAllowed, featureDocsAllowed, featurePollsAllowed, selectedContact, selectedContactFetched]);

  // Precompute show flags to keep JSX readable
  const showDocument = (!resolvedIsGroup || featureDocsAllowed);
  const showPhoto = (!resolvedIsGroup || featureMediaAllowed);
  const showVideo = (!resolvedIsGroup || featureMediaAllowed);
  const showCamera = (!resolvedIsGroup || featureMediaAllowed);
  const showPoll = (resolvedIsGroup && featurePollsAllowed);

  // Compute visible items so we can adapt menu size
  const visibleItems = [showDocument, showPhoto, showVideo, showCamera, true /* location always */, showPoll];
  const visibleCount = visibleItems.filter(Boolean).length;
  const menuMinWidth = Math.max(260, Math.min(680, visibleCount * 78));

  const handleInputChange = useCallback((e) => {
    const val = e.target.value;
    setMessageInput(val);

    // DEBUG
    try { console.log('[Mention] input change, caret-aware detection starting', { val, selectedContact: selectedContact && (selectedContact._id || selectedContact.id || selectedContact.chatId) }); } catch (e) {}

    try {
      const isGroup = isGroupChat || (selectedContact && (selectedContact.isGroup || selectedContact.isGroupChat));
      if (!isGroup || !selectedContact) {
        setShowMentionList(false);
        setMentionSuggestions([]);
        setMentionQuery('');
      } else {
        // caret-aware detection: look at text up to caret to find last @token
        const el = inputRef.current;
        const caret = el ? (el.selectionStart || 0) : val.length;
        const textUpToCaret = val.slice(0, caret);
        const m = textUpToCaret.match(/(?:^|\s)@([^\s@]*)$/);
        if (m) {
          const q = (m[1] || '').toLowerCase();
          try { console.log('[Mention] matched token', { q, caret }); } catch(e) {}
          setMentionQuery(q);
          const members = (groupMembers && groupMembers.length) ? groupMembers : ((selectedContact && (selectedContact.users || selectedContact.participants)) || []);
          try { console.log('[Mention] members count', { count: (members || []).length }); } catch(e) {}
          const filtered = (members || [])
            .filter(u => u && (u.name || u.email || u.username))
            .filter(u => String(u._id || u.id || u).toString() !== (currentUser && (currentUser._id || currentUser.id)))
            .filter(u => {
              if (!q) return true;
              const hay = ((u.name || '') + ' ' + (u.email || '') + ' ' + (u.username || '')).toLowerCase();
              return hay.indexOf(q) !== -1;
            })
            .slice(0, 8);
          setMentionSuggestions(filtered);
          setShowMentionList(filtered.length > 0);
          try { console.log('[Mention] suggestions', { filtered: filtered.map(u => ({ id: u._id || u.id, name: u.name })) }); } catch(e) {}
        } else {
          setShowMentionList(false);
          setMentionQuery('');
          setMentionSuggestions([]);
        }
      }
    } catch (e) {
      setShowMentionList(false);
    }

    try {
      const chatId = selectedContact?.chatId || selectedContact?.id || selectedContact?._id;
      if (!socket || !chatId) return;

      // Emit typing once, then debounce stop typing
      if (!isTypingSentRef.current) {
        const userPayload = currentUser ? { _id: currentUser._id || currentUser.id, name: currentUser.name, avatar: currentUser.avatar } : { _id: null };
        try { console.log('[MessageInput] emitting typing', { chatId, user: userPayload }); } catch(e){}
        socket.emit('typing', { chatId, user: userPayload });
        isTypingSentRef.current = true;
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        try {
          const userPayload = currentUser ? { _id: currentUser._id || currentUser.id, name: currentUser.name, avatar: currentUser.avatar } : { _id: null };
          try { console.log('[MessageInput] emitting stop typing', { chatId, user: userPayload }); } catch(e){}
          socket.emit('stop typing', { chatId, user: userPayload });
        } catch (e) {}
        isTypingSentRef.current = false;
        typingTimeoutRef.current = null;
      }, 1400);
    } catch (e) {
      // ignore
    }
  }, [selectedContact, socket, currentUser]);

  // Clear mention map when mentions cleared
  useEffect(() => {
    if (!selectedMentions || selectedMentions.length === 0) {
      setSelectedMentionMap({});
    }
  }, [selectedMentions]);

  const handleKeyDown = useCallback((e) => {
    try {
      if (e.key === '@') {
        try { console.log('[Mention] onKeyDown @ pressed'); } catch(e) {}
        const isGroup = isGroupChat || (selectedContact && (selectedContact.isGroup || selectedContact.isGroupChat));
        if (!isGroup || !selectedContact) return;
        const members = (groupMembers && groupMembers.length) ? groupMembers : ((selectedContact && (selectedContact.users || selectedContact.participants)) || []);
        try { console.log('[Mention] onKeyDown members count', (members || []).length); } catch(e) {}
        const filtered = (members || [])
          .filter(u => u && (u.name || u.email || u.username))
          .filter(u => String(u._id || u.id || u).toString() !== (currentUser && (currentUser._id || currentUser.id)))
          .slice(0, 8);
        setMentionSuggestions(filtered);
        setShowMentionList(filtered.length > 0);
        setTimeout(() => { try { if (inputRef.current) inputRef.current.focus(); } catch (e) {} }, 0);
      }
    } catch (e) {}
  }, [selectedContact, currentUser, isGroupChat]);

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
          // Always call onSendMessage when server returns only an attachment
          // (the backend may not have created the message during upload,
          // e.g. when chatId is not provided). This ensures scheduled
          // messages with attachments are properly created via the
          // `sendMessage` endpoint and saved with `isScheduled`.
          onSendMessage(payload);
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
      if (selectedMentions && selectedMentions.length) {
        // include validated mention ids
        payload.mentions = selectedMentions;
      }
      if (isScheduled && scheduledDate && scheduledTime) {
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        payload.isScheduled = true;
        payload.scheduledFor = scheduledDateTime.toISOString();
      }
      onSendMessage(payload);
      setMessageInput("");
      setSelectedMentions([]);
      setSelectedMentionMap({});
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
  
  const toggleAttachmentMenu = useCallback(async () => {
    // If group and we don't yet have fetched settings, fetch before deciding
    const chatId = selectedContact?.groupId || selectedContact?.chatId || selectedContact?.chat || selectedContact?.id || selectedContact?._id;
    if (resolvedIsGroup && !selectedContactFetched && chatId) {
      try {
        const json = await fetchGroupInfoAsync(chatId);
        setSelectedContactFetched(json);
      } catch (e) {}
    }

    // decide availability using freshest data (derivedFeaturesRaw will prefer fetched data)
    const anyAvailable = featureMediaAllowed || featureDocsAllowed || (resolvedIsGroup && featurePollsAllowed);
    try { console.log('[MessageInput] toggleAttachmentMenu called', { anyAvailable, resolvedIsGroup, featureMediaAllowed, featureDocsAllowed, featurePollsAllowed }); } catch (e) {}
    if (!anyAvailable) return;
    setShowAttachmentMenu(!showAttachmentMenu);
  }, [showAttachmentMenu, resolvedIsGroup, featureMediaAllowed, featureDocsAllowed, featurePollsAllowed, selectedContact, selectedContactFetched]);

  const handleFileUpload = useCallback((type) => {
    // guard based on feature flags
    if (type === 'document') {
      if (!featureDocsAllowed) return alert('Document sharing is disabled for this group');
      fileInputRef.current?.click();
    } else if (type === 'image') {
      if (!featureMediaAllowed) return alert('Media sharing is disabled for this group');
      imageInputRef.current?.click();
    } else if (type === 'video') {
      if (!featureMediaAllowed) return alert('Media sharing is disabled for this group');
      videoInputRef.current?.click();
    }
    setShowAttachmentMenu(false);
  }, [featureDocsAllowed, featureMediaAllowed]);

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
      // log which icons will be shown when menu opens (include visibleCount)
      try { console.log('[MessageInput] attachment menu opened - showing', { showDocument, showPhoto, showVideo, showCamera, showPoll, visibleCount, menuMinWidth }); } catch (e) {}
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAttachmentMenu, showDocument, showPhoto, showVideo, showCamera, showPoll]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        try {
          const chatId = selectedContact?.chatId || selectedContact?.id || selectedContact?._id;
          const userPayload = currentUser ? { _id: currentUser._id || currentUser.id, name: currentUser.name, avatar: currentUser.avatar } : { _id: null };
          if (socket && chatId) socket.emit('stop typing', { chatId, user: userPayload });
        } catch (e) {}
      }
    };
  }, [socket, selectedContact, currentUser]);

  // Ensure group members are available for mention suggestions.
  useEffect(() => {
    try {
      // Resolve whether this is a group and pick the most likely id to fetch members with.
      const isGroup = Boolean(
        isGroupChat ||
        (selectedContact && (selectedContact.isGroup || selectedContact.isGroupChat)) ||
        (selectedContact && (selectedContact.participants || selectedContact.admins || selectedContact.inviteEnabled))
      );

      const resolvedId = selectedContact?.groupId || selectedContact?.chatId || selectedContact?.chat || selectedContact?.id || selectedContact?._id;
      try { console.log('[MessageInput] ensureGroupMembers', { resolvedId, isGroup }); } catch (e) {}
      if (!isGroup || !resolvedId) return;

      // If the selectedContact already contains members/users/participants, reuse them.
      const existing = selectedContact?.members || selectedContact?.users || selectedContact?.participants;
      if (existing && Array.isArray(existing) && existing.length) {
        setGroupMembers(existing);
        return;
      }

      // Otherwise fetch from server (fetchGroupMembers tries several endpoints).
      fetchGroupMembers(resolvedId);
    } catch (e) {
      try { console.warn('[MessageInput] failed to ensure group members', e && e.message); } catch(e){}
    }
  }, [selectedContact, isGroupChat, fetchGroupMembers]);

  // Fetch full group info (participants + features) similarly to GroupInfoModal
  const fetchGroupInfoAsync = async (chatId) => {
    if (!chatId) return null;
    try {
      const storageCandidates = [
        { store: 'localStorage', key: 'token' },
        { store: 'localStorage', key: 'chasmos_auth_token' },
        { store: 'localStorage', key: 'chasmos_token' },
        { store: 'sessionStorage', key: 'token' },
        { store: 'sessionStorage', key: 'chasmos_auth_token' },
      ];
      let token = null;
      let tokenKeyUsed = null;
      for (const s of storageCandidates) {
        try {
          const val = (s.store === 'localStorage' ? localStorage.getItem(s.key) : sessionStorage.getItem(s.key));
          if (val) { token = val; tokenKeyUsed = `${s.store}.${s.key}`; break; }
        } catch (e) {}
      }
      try { console.log('[MessageInput] fetchGroupInfo will call server', { chatId, tokenKeyUsed }); } catch (e) {}

      const url = `${API_BASE}/api/group/group/${encodeURIComponent(chatId)}`;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(url, { headers });
      const json = await res.json();
      if (!res.ok) {
        try { console.warn('[MessageInput] fetchGroupInfo failed', { url, status: res.status, body: json }); } catch (e) {}
        return null;
      }
      try { console.log('[MessageInput] fetchGroupInfo response', { url, json }); } catch (e) {}
      return json || null;
    } catch (e) {
      try { console.error('[MessageInput] fetchGroupInfo error', e && e.message); } catch (err) {}
      return null;
    }
  };

  useEffect(() => {
    const chatId = selectedContact?.groupId || selectedContact?.chatId || selectedContact?.chat || selectedContact?.id || selectedContact?._id;
    if (!resolvedIsGroup || !chatId) {
      setSelectedContactFetched(null);
      return;
    }

    // When opening the attachment menu, refresh group info so we reflect saved settings
    if (showAttachmentMenu) {
      fetchGroupInfoAsync(chatId).then((json) => setSelectedContactFetched(json));
    }

    // Also fetch once when selectedContact changes so features are available early
    fetchGroupInfoAsync(chatId).then((json) => setSelectedContactFetched(json));
  }, [resolvedIsGroup, selectedContact, showAttachmentMenu]);

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
                  minWidth: `${menuMinWidth}px`,
                  boxShadow: effectiveTheme.mode === 'dark'
                    ? '0 10px 40px rgba(0, 0, 0, 0.5)'
                    : '0 10px 40px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
                  <CosmosBg />
                </div>
                <div className="flex items-center space-x-4 relative z-10">
                  {showDocument && (
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
                  )}

                  {showPhoto && (
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
                  )}

                  {showVideo && (
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
                  )}

                  {showCamera && (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`cursor-pointer flex flex-col items-center space-y-2 p-2 rounded-lg transition-colors ${effectiveTheme.mode === 'dark' ? 'hover:bg-purple-500 hover:bg-opacity-10' : 'hover:bg-purple-100'}`}
                    onClick={() => {
                      if (!featureMediaAllowed) return alert('Media sharing is disabled for this group');
                      imageInputRef.current?.click();
                      setShowAttachmentMenu(false);
                    }}
                  >
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <p className={`${effectiveTheme.text} text-xs font-medium`}>Camera</p>
                  </motion.div>
                  )}

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

                  {showPoll && (
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

            <div className="relative w-full">
              <div style={{ position: 'relative' }}>
                {/* Highlight overlay (shows mentions in blue) */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    color: effectiveTheme.mode === 'dark' ? '#e5e7eb' : '#111827',
                    pointerEvents: 'none',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    paddingRight: 2,
                  }}
                  className="mention-overlay"
                  dangerouslySetInnerHTML={{ __html: (() => {
                    const escapeHtml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    if (!messageInput) {
                      return `<span style=\"color: ${effectiveTheme.mode === 'dark' ? '#9ca3af' : '#6b7280'};\">Type a message...</span>`;
                    }
                    let out = escapeHtml(messageInput);
                    // Replace mentions by display name spans
                    Object.values(selectedMentionMap || {}).forEach((name) => {
                      if (!name) return;
                      try {
                        const re = new RegExp('(@' + escapeRegExp(name) + ')(?=\\s|$)', 'g');
                        out = out.replace(re, `<span style=\"color: #2563EB; font-weight: 600;\">$1</span>`);
                      } catch (e) {}
                    });
                    return out;
                  })() }}
                />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={''}
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  onKeyDown={handleKeyDown}
                  className={`w-full bg-transparent placeholder-gray-400 focus:outline-none`}
                  style={{ color: 'transparent', caretColor: effectiveTheme.mode === 'dark' ? '#fff' : '#1f2937' }}
                />
              </div>

              {showMentionList && mentionSuggestions && mentionSuggestions.length > 0 && inputRef.current && typeof document !== 'undefined' && createPortal(
                <div
                  className="w-72 max-h-56 overflow-auto rounded-lg shadow-lg"
                  style={{
                    position: 'absolute',
                    zIndex: 9999,
                    background: effectiveTheme.mode === 'dark' ? '#0b1220' : '#fff',
                    left: (inputRef.current.getBoundingClientRect().left) + 'px',
                    top: (inputRef.current.getBoundingClientRect().top - 8 - Math.min(56 * mentionSuggestions.length, 224)) + 'px',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.12)'
                  }}
                >
                  {mentionSuggestions.map((u) => (
                    <div
                      key={u._id || u.id}
                      onMouseDown={(e) => { e.preventDefault(); }}
                      onClick={() => {
                        try {
                          const name = u.name || u.email || u.username || 'User';
                              // Replace any trailing @token and append the selected display name
                              const nameToInsert = name;
                              const id = u._id || u.id || u;
                              const before = messageInput.replace(/(?:^|\s)@([^\s@]*)$/, '').trimEnd();
                              const newMessage = (before ? before + ' ' : '') + '@' + nameToInsert + ' ';
                              setMessageInput(newMessage);
                              setShowMentionList(false);
                              setMentionQuery('');
                              setMentionSuggestions([]);
                              setSelectedMentions(prev => {
                                if (!Array.isArray(prev)) return [id];
                                if (prev.includes(id)) return prev;
                                return [...prev, id];
                              });
                              setSelectedMentionMap(prev => ({ ...prev, [id]: name }));
                        } catch (e) {
                          setShowMentionList(false);
                        }
                      }}
                          className={`px-3 py-2 cursor-pointer hover:${effectiveTheme.hover || 'bg-gray-100'} flex items-center gap-3 border-b border-transparent`}
                    >
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name || 'U'} className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-200">
                              {getInitials(u.name || u.email || u.username || '')}
                            </div>
                          )}
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${effectiveTheme.text || 'text-gray-900'}`}>{u.name || u.email || u.username}</div>
                        <div className={`text-xs truncate ${effectiveTheme.textSecondary || 'text-gray-500'}`}>{u.email || ''}</div>
                      </div>
                    </div>
                  ))}
                </div>,
                document.body
              )}
            </div>
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
          onClick={() => { handleSendClick(false); }}
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