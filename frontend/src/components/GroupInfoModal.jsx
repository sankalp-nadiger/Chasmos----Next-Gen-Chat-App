// GroupInfoModalWhatsApp.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Image,
  FileText,
  Link as LinkIcon,
  LogOut,
  Trash,
  Download,
  ExternalLink,
} from "lucide-react";
import CosmosBackground from "./CosmosBg";
import ForwardMessageModal from "./ForwardMessageModal";
import blockService from "../utils/blockService";

const TabButton = ({ active, icon: Icon, label, onClick, color }) => {
  const themeModeLocal = (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) ? 'dark' : 'light';
  const base = themeModeLocal === 'dark' ? (active ? `bg-gray-800 text-${color}-400` : 'bg-gray-900 text-gray-400') : (active ? `bg-white/90 text-${color}-600` : 'bg-white text-gray-700');
  return (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center py-2 rounded-lg transition ${base}`}>
      <Icon className="w-5 h-5" />
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
};

const GroupInfoModalWhatsApp = ({
  open,
  group,
  currentUserId,
  onClose,
  onUpdateGroup,
}) => {
  const [activeTab, setActiveTab] = useState("media");
  const [fetchedGroup, setFetchedGroup] = useState(null);
  const [inviteLinkLocal, setInviteLinkLocal] = useState("");
  const effectiveGroup = fetchedGroup || group;

  console.log("📊 GroupInfoModal received group data:", {
    inviteEnabled: effectiveGroup.inviteEnabled,
    inviteLink: effectiveGroup.inviteLink,
    permissions: effectiveGroup.permissions,
  });

  const derivedInviteLink = effectiveGroup.inviteLink || (effectiveGroup.group && effectiveGroup.group.inviteLink) || (effectiveGroup.groupSettings && effectiveGroup.groupSettings.inviteLink) || "";
  const settings = effectiveGroup.settings || {};

  // Derive invite/settings/permissions/features from various possible payload shapes
  const derivedInviteEnabled = (typeof effectiveGroup.inviteEnabled !== 'undefined')
    ? Boolean(effectiveGroup.inviteEnabled)
    : (effectiveGroup.group && typeof effectiveGroup.group.inviteEnabled !== 'undefined')
      ? Boolean(effectiveGroup.group.inviteEnabled)
      : Boolean(effectiveGroup.groupSettings && effectiveGroup.groupSettings.allowInvites);

  const derivedPermissionsRaw = effectiveGroup.permissions || (effectiveGroup.group && effectiveGroup.group.permissions) || {};
  const permissions = {
    allowCreatorAdmin: derivedPermissionsRaw.allowCreatorAdmin !== false,
    allowOthersAdmin: Boolean(derivedPermissionsRaw.allowOthersAdmin),
    allowMembersAdd: derivedPermissionsRaw.allowMembersAdd !== false,
  };

  const derivedFeaturesRaw = effectiveGroup.features || (effectiveGroup.group && effectiveGroup.group.features) || {};
  const features = {
    media: derivedFeaturesRaw.media !== false,
    gallery: derivedFeaturesRaw.gallery !== false,
    docs: derivedFeaturesRaw.docs !== false,
    polls: derivedFeaturesRaw.polls !== false,
  };

  console.log('📊 GroupInfoModal derived values:', { derivedInviteLink, permissions, features });

  // ✅ Determine creator ID
  const creatorId = effectiveGroup.admin?._id?.toString() || effectiveGroup.admin?.toString() || effectiveGroup.groupAdmin?._id?.toString() || effectiveGroup.groupAdmin?.toString();

  const isCreator = currentUserId?.toString() === creatorId;

  const isAdmin = isCreator || effectiveGroup.admins?.some(admin => {
    const adminId = admin._id?.toString() || admin.toString();
    return adminId === currentUserId?.toString();
  });

  const handleCopyInvite = async () => {
    const link = inviteLinkLocal || effectiveGroup.inviteLink || settings.inviteLink || "";
    if (!link) return;
    const text = `Follow this link to join my chasmos group: ${link}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Invite text copied to clipboard", 'success', 2000);
    } catch (e) {
      console.error("Failed to copy invite text", e);
      showToast("Failed to copy invite link", 'error', 3000);
    }
  };

  const [generatingInvite, setGeneratingInvite] = useState(false);

  const handleGenerateInvite = async () => {
    try {
      if (generatingInvite) return;
      setGeneratingInvite(true);
      const token = localStorage.getItem('token');
      const gid = effectiveGroup._id || effectiveGroup.id || effectiveGroup.chat || effectiveGroup.chatId;
      if (!gid) throw new Error('Group id not found');
      const res = await fetch(`${API_BASE_URL}/api/group/regenerate-invite-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ groupId: gid }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to generate invite link');
      // update local group state with returned group or inviteLink
      if (json.group) {
        // ensure the invite toggle shows as enabled locally
        const g = { ...json.group, inviteEnabled: true };
        setFetchedGroup(g);
        if (json.inviteLink) setInviteLinkLocal(json.inviteLink);
        else if (g.inviteLink) setInviteLinkLocal(g.inviteLink);
        setInviteEnabledState(true);
        try { onUpdateGroup?.(g); } catch (e) {}
      } else if (json.inviteLink) {
        // merge into fetchedGroup and mark invite enabled locally
        setFetchedGroup(prev => ({ ...(prev || effectiveGroup), inviteLink: json.inviteLink, inviteEnabled: true }));
        setInviteLinkLocal(json.inviteLink);
        setInviteEnabledState(true);
        try { onUpdateGroup?.({ ...(fetchedGroup || effectiveGroup), inviteLink: json.inviteLink, inviteEnabled: true }); } catch (e) {}
      }
      showToast(json.message || 'Invite link generated', 'success', 2000);
    } catch (e) {
      console.error('Failed to generate invite link', e);
      showToast(e.message || 'Failed to generate invite link', 'error', 3000);
    } finally {
      setGeneratingInvite(false);
    }
  };

  const updateSettingsOnServer = async (payload) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/group/update-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update settings');
      // Keep local modal state in sync with backend when full group returned
      if (json.group) {
        setFetchedGroup(json.group);
        try { onUpdateGroup?.(json.group); } catch (e) { /* ignore */ }
      } else {
        try { onUpdateGroup?.(json.group || json); } catch (e) { /* ignore */ }
      }
      // show toast success
      showToast(json.message || 'Settings saved', 'success', 2000);
      return json;
    } catch (e) {
      console.error('Failed to update group settings', e);
      showToast(e.message || 'Failed to save', 'error', 3000);
      return null;
    }
  };

  const handleToggleInvite = async (val) => {
    // Only update local state; save will persist when Save is clicked
    setInviteEnabledState(!!val);
  };

  const handleTogglePermission = async (key, val) => {
    // Only update local state; Save will persist
    const next = { ...permissionsState, [key]: !!val };
    setPermissionsState(next);
  };

  const handleToggleFeature = async (key, val) => {
    // Only update local state; Save will persist
    const next = { ...featuresState, [key]: !!val };
    setFeaturesState(next);
  };

  const [savingSettings, setSavingSettings] = useState(false);
  
  const [editingEnabled, setEditingEnabled] = useState(false);
  const [groupAvatarLocal, setGroupAvatarLocal] = useState("");
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [removedGroupAvatar, setRemovedGroupAvatar] = useState(false);
  const fileInputRef = useRef(null);
  const [groupNameLocal, setGroupNameLocal] = useState(effectiveGroup?.name || "");

  const openFilePicker = () => {
    if (!editingEnabled) return;
    try { fileInputRef.current?.click(); } catch (e) { }
  };

  const handleFileChange = (e) => {
    const file = e?.target?.files && e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Image must be less than 2MB', 'error'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setGroupAvatarLocal(reader.result);
      setRemovedGroupAvatar(false);
      setAvatarLoadFailed(false);
    };
    reader.readAsDataURL(file);
    try { e.target.value = ''; } catch (e) { }
  };

  const handleRemoveAvatar = () => {
    setGroupAvatarLocal("");
    setRemovedGroupAvatar(true);
    setAvatarLoadFailed(false);
  };
  
  const rawMembers = (effectiveGroup.members || effectiveGroup.participants || []).filter(m => m != null);
  const [displayMembers, setDisplayMembers] = useState(rawMembers);
  const [unblockLoadingMemberIds, setUnblockLoadingMemberIds] = useState(new Set());
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
   // Helper to show toast messages (type: 'success' | 'error')
  const showToast = (message, type = 'success', timeout = 2000) => {
    setToast({ show: true, message: message || '', type });
    try { window.clearTimeout(window._chasmos_toast_timeout); } catch (e) {}
    window._chasmos_toast_timeout = setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, timeout);
  };

  useEffect(() => {
    return () => {
      try { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); } catch (e) {}
    };
  }, []);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [addingUserId, setAddingUserId] = useState(null);
  const [selectedAddIds, setSelectedAddIds] = useState([]);
  const [addingMultiple, setAddingMultiple] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [addPage, setAddPage] = useState(1);
  const PAGE_SIZE = 20;
  const [unblockLoadingAvailableIds, setUnblockLoadingAvailableIds] = useState(new Set());
  // Selected members to be promoted when Save is clicked
  const [selectedPromoteIds, setSelectedPromoteIds] = useState([]);
  // Selected members to be removed when Save is clicked
  const [selectedRemoveIds, setSelectedRemoveIds] = useState([]);

  const toggleSelectPromote = (memberId) => {
    setSelectedPromoteIds((prev) => {
      const s = new Set(prev || []);
      if (s.has(memberId)) s.delete(memberId); else s.add(memberId);
      return Array.from(s);
    });
  };
  const toggleSelectRemove = (memberId) => {
    setSelectedRemoveIds((prev) => {
      const s = new Set(prev || []);
      if (s.has(memberId)) s.delete(memberId); else s.add(memberId);
      return Array.from(s);
    });
  };
  const handleSaveAll = async () => {
    try {
      setSavingSettings(true);
      const res = await updateSettingsOnServer({
        groupId: effectiveGroup._id,
        inviteEnabled: !!inviteEnabledState,
        permissions: permissionsState,
        features: featuresState,
        promoteIds: Array.isArray(selectedPromoteIds) ? selectedPromoteIds : [],
        removeIds: Array.isArray(selectedRemoveIds) ? selectedRemoveIds : [],
        ...(groupAvatarLocal && String(groupAvatarLocal).startsWith('data:image') ? { avatarBase64: groupAvatarLocal } : {}),
        ...(removedGroupAvatar ? { clearAvatar: true } : {}),
        ...(typeof groupNameLocal === 'string' ? { name: groupNameLocal } : {}),
      });
      if (res) {
        // clear selections after successful save
        setSelectedPromoteIds([]);
        setSelectedRemoveIds([]);
        // Exit editing mode only after successful save
        setEditingEnabled(false);

        // Notify parent with updated group data. Prefer server response if provided.
        let updatedGroup = null;
        if (res.group) updatedGroup = res.group;
        else if (res.updatedGroup) updatedGroup = res.updatedGroup;
        else if (res.data && (res.data.group || res.data.updatedGroup)) updatedGroup = res.data.group || res.data.updatedGroup;
        else {
          updatedGroup = {
            ...(effectiveGroup || {}),
            name: groupNameLocal || effectiveGroup?.name,
            avatar: removedGroupAvatar ? '' : (groupAvatarLocal || effectiveGroup?.avatar),
          };
        }
        try { onUpdateGroup?.(updatedGroup); } catch (e) { console.warn('onUpdateGroup failed', e); }
      }
      // toast handled by updateSettingsOnServer; ensure visible if not
      showToast('Settings saved', 'success', 2000);
    } catch (e) {
      console.error('Save failed', e);
      showToast('Failed to save settings', 'error', 3000);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleEdit = () => {
    // If we're turning off editing (Cancel), reset local state to group's current values
    if (editingEnabled) {
      setInviteEnabledState(Boolean(group.inviteEnabled));
      setPermissionsState({
        allowCreatorAdmin: group.permissions?.allowCreatorAdmin !== false,
        allowOthersAdmin: group.permissions?.allowOthersAdmin === true,
        allowMembersAdd: group.permissions?.allowMembersAdd !== false,
      });
      setFeaturesState({
        media: group.features?.media !== false,
        gallery: group.features?.gallery !== false,
        docs: group.features?.docs !== false,
        polls: group.features?.polls !== false,
      });
      setSelectedPromoteIds([]);
      setSelectedRemoveIds([]);
      // Reset local avatar/name edits on cancel
      try { setGroupAvatarLocal(effectiveGroup?.avatar || ''); } catch (e) {}
      try { setRemovedGroupAvatar(false); } catch (e) {}
      try { setGroupNameLocal(effectiveGroup?.name || ''); } catch (e) {}
    }
    setEditingEnabled(!editingEnabled);
  };

  // Sync local avatar when modal opens or group changes
  useEffect(() => {
    try {
      const src = effectiveGroup?.avatar || effectiveGroup?.icon || effectiveGroup?.groupSettings?.avatar || "";
      setGroupAvatarLocal(src || "");
      setRemovedGroupAvatar(!Boolean(src));
    } catch (e) {
      setGroupAvatarLocal("");
      setRemovedGroupAvatar(false);
    }
    // sync name local copy
    try {
      setGroupNameLocal(effectiveGroup?.name || effectiveGroup?.chatName || effectiveGroup?.groupName || "");
    } catch (e) {}
  }, [open, effectiveGroup?.avatar, effectiveGroup?.icon, effectiveGroup?.groupSettings]);

  // Load available users from backend and filter out current participants
  const loadAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/user`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      const all = Array.isArray(json) ? json : (json.users || []);
      const participantIds = new Set((displayMembers || []).map(m => String(m._id || m.id || m)));
      // Exclude current participants first
      let candidates = all.filter(u => !participantIds.has(String(u._id || u.id || u)));

      // Also try to fetch google contacts to annotate candidates (so we can show the Google tag)
      try {
        const resGoogle = await fetch(`${API_BASE_URL}/api/sync/google-contacts`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (resGoogle.ok) {
          const jsonGoogle = await resGoogle.json();
          const googleContacts = Array.isArray(jsonGoogle.data) ? jsonGoogle.data : [];
          const googleEmails = new Set();
          const googlePhones = new Set();
          (googleContacts || []).forEach((g) => {
            if (g.email) googleEmails.add(String(g.email).toLowerCase().trim());
            const gp = String(g.phone || g.mobile || g.mobileNumber || "").replace(/\D/g, "");
            if (gp) googlePhones.add(gp.length > 10 ? gp.slice(-10) : gp);
          });

          // Annotate candidates with isGoogleContact
          candidates = candidates.map(u => {
            const email = String(u.email || u.username || "").toLowerCase();
            const phone = String(u.phoneNumber || u.phone || u.mobile || "").replace(/\D/g, "");
            const phoneNorm = phone ? (phone.length > 10 ? phone.slice(-10) : phone) : "";
            return {
              ...u,
              isGoogleContact: (email && googleEmails.has(email)) || (phoneNorm && googlePhones.has(phoneNorm)),
            };
          });
        }
      } catch (e) {
        // ignore google contacts errors; proceed without annotation
      }

      // Check block status for each candidate: exclude those who have blocked you,
      // but preserve those you have blocked (annotate with isBlocked) so user can unblock them.
      const checks = await Promise.all(
        candidates.map(async (u) => {
          try {
            const uid = String(u._id || u.id || u);
            const status = await blockService.checkBlockStatus(uid);
            return { user: u, hasBlockedYou: !!(status && status.hasBlockedYou), isBlocked: !!(status && status.isBlocked) };
          } catch (e) {
            // On error assume not blocked to avoid over-filtering
            return { user: u, hasBlockedYou: false, isBlocked: false };
          }
        })
      );

      const filtered = checks.filter(c => !c.hasBlockedYou).map(c => ({ ...c.user, isBlocked: c.isBlocked }));
      setAvailableUsers(filtered);
        setSelectedAddIds([]);
        setShowAddMemberModal(true);
    } catch (e) {
      console.error('Failed to load users', e);
      showToast('Failed to load users', 'error', 3000);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddMember = async (userId) => {
    // single-user add kept for compatibility; delegates to batch handler
    return handleAddSelected([userId]);
  };

  const toggleSelectAvailable = (userId) => {
    setSelectedAddIds(prev => {
      const s = new Set(prev || []);
      if (s.has(String(userId))) s.delete(String(userId)); else s.add(String(userId));
      return Array.from(s);
    });
  };

  const filteredAvailableUsers = useMemo(() => {
    const q = String(addSearch || '').trim().toLowerCase();
    if (!q) return availableUsers || [];
    return (availableUsers || []).filter(u => {
      const name = String(u.name || u.username || u.fullName || '').toLowerCase();
      const email = String(u.email || u.username || u.phone || '').toLowerCase();
      const id = String(u._id || u.id || '').toLowerCase();
      return name.includes(q) || email.includes(q) || id.includes(q);
    });
  }, [availableUsers, addSearch]);

  const totalPages = Math.max(1, Math.ceil((filteredAvailableUsers || []).length / PAGE_SIZE));
  useEffect(() => { setAddPage(1); }, [addSearch, availableUsers]);
  const paginatedAvailable = useMemo(() => {
    const start = (Math.max(1, addPage) - 1) * PAGE_SIZE;
    return (filteredAvailableUsers || []).slice(start, start + PAGE_SIZE);
  }, [filteredAvailableUsers, addPage]);

  const handleUnblockAvailableUser = async (userId) => {
    try {
      setUnblockLoadingAvailableIds(prev => new Set(prev).add(String(userId)));
      await blockService.unblockUser(String(userId));
      // Update the availableUsers list to remove isBlocked flag
      setAvailableUsers(prev => (prev || []).map(u => {
        const uid = u._id || u.id || u.userId || '';
        if (String(uid) === String(userId)) return { ...u, isBlocked: false };
        return u;
      }));
      showToast('User unblocked successfully', 'success', 2000);
    } catch (err) {
      console.error('Unblock failed', err);
      showToast('Failed to unblock user', 'error', 3000);
    } finally {
      setUnblockLoadingAvailableIds(prev => {
        const copy = new Set(prev);
        copy.delete(String(userId));
        return copy;
      });
    }
  };

  const handleAddSelected = async (ids) => {
    const toAdd = Array.isArray(ids) ? ids : Array.from(selectedAddIds || []);
    if (!toAdd || toAdd.length === 0) return showToast('Select at least one user', 'error', 2500);
    setAddingMultiple(true);
    const token = localStorage.getItem('token');
    const successes = [];
    const failures = [];
    let lastGroup = null;
    for (const uid of toAdd) {
      try {
        setAddingUserId(uid);
        const res = await fetch(`${API_BASE_URL}/api/group/add-member`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ groupId: effectiveGroup._id, userId: uid }),
        });
        const json = await res.json();
        if (!res.ok) {
          failures.push({ uid, message: json?.message || 'Failed to add' });
        } else {
          successes.push(String(uid));
          lastGroup = json.group || json || lastGroup;
        }
      } catch (e) {
        failures.push({ uid, message: e.message || String(e) });
      } finally {
        setAddingUserId(null);
      }
    }

    setAddingMultiple(false);

    if (successes.length) {
      // If backend returned an updated group for any add, prefer that and update local state + parent
      if (lastGroup) {
        setFetchedGroup(lastGroup);
        try { onUpdateGroup?.(lastGroup); } catch (e) { /* ignore */ }
      } else {
        // Backend didn't return the full group: merge added users from availableUsers into local fetched/group state
        const addedUsersRaw = (availableUsers || []).filter(u => successes.includes(String(u._id || u.id || u)));
        // Normalize fields to match members rendering expectations
        const addedUsers = addedUsersRaw.map(u => ({
          _id: u._id || u.id || u.userId || u.userID || u.idStr || null,
          id: u._id || u.id || u.userId || u.userID || u.idStr || null,
          name: u.name || u.username || u.displayName || u.fullName || u.firstName || 'Member',
          username: u.username || u.email || u.phone || '',
          email: u.email || '',
          avatar: u.avatar || u.photo || u.picture || u.profilePic || '',
        }));

        setFetchedGroup(prev => {
          const base = prev || group || {};
          const existing = Array.isArray(base.members) ? base.members : (Array.isArray(base.participants) ? base.participants : []);
          const merged = [...existing, ...addedUsers];
          return { ...base, members: merged, participants: merged };
        });

        try {
          onUpdateGroup?.({ ...(fetchedGroup || group || {}), members: [ ...((fetchedGroup || group || {}).members || []), ...addedUsers ] });
        } catch (e) { /* ignore */ }
      }

      // remove added users from available list
      setAvailableUsers(prev => prev ? prev.filter(u => !successes.includes(String(u._id || u.id || u))) : []);
      setSelectedAddIds([]);
      showToast(`${successes.length} member(s) added`, 'success', 2000);
    }

    if (failures.length) {
      console.error('Some adds failed', failures);
      showToast(`${failures.length} add(s) failed`, 'error', 4000);
    }

    // close modal if all succeeded
    if (successes.length && failures.length === 0) setShowAddMemberModal(false);
  };

  // Determine theme mode based on document class (falls back to 'light')
  const themeMode = (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) ? 'dark' : 'light';

  const styles = {
    sectionBg: themeMode === 'dark' ? 'bg-gray-900' : 'bg-white/90',
    sectionHover: themeMode === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100',
    cardBg: themeMode === 'dark' ? 'bg-gray-900' : 'bg-white',
    cardHover: themeMode === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100',
    avatarBg: themeMode === 'dark' ? 'bg-gray-700' : 'bg-white border border-gray-200',
    titleText: themeMode === 'dark' ? 'text-white' : 'text-gray-900',
    subText: themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600',
    panelBg: themeMode === 'dark' ? 'bg-gray-900' : 'bg-white',
    borderColor: themeMode === 'dark' ? 'border-gray-800' : 'border-gray-200'
  };

  const modalOverlayClass = themeMode === 'dark' ? 'bg-black/60' : 'bg-black/20';
  const modalContainerBgClass = themeMode === 'dark' ? 'bg-gray-900' : 'bg-white';
  const modalTitleClass = themeMode === 'dark' ? 'text-white' : 'text-gray-900';
  const modalDescClass = themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const cancelBtnClass = themeMode === 'dark'
    ? 'px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 bg-transparent hover:bg-gray-800'
    : 'px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 bg-transparent hover:bg-gray-50';

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  // Normalize members into full user objects so UI always has names/avatars
  useEffect(() => {
    let cancelled = false;
    const current = (effectiveGroup.members || effectiveGroup.participants || []).filter(m => m != null);
    const needFetch = current.some(m => !(m && (m.name || m.username || m.email)));

    (async () => {
      try {
        let normalized;
        
        // Fetch user data if needed
        if (needFetch) {
          const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const res = await fetch(`${API_BASE_URL}/api/user`, { headers });
          const json = await res.json();
          const all = Array.isArray(json) ? json : (json.users || []);
          const usersById = new Map(all.map(u => [String(u._id || u.id), u]));
          normalized = current.map(m => {
            if (m && (m.name || m.username || m.email)) return { _id: m._id || m.id || null, ...(typeof m === 'object' ? m : {}) };
            const id = String(m._id || m.id || m || '');
            const found = usersById.get(id);
            if (found) return { _id: found._id || found.id, ...found };
            return { _id: id, name: undefined, username: '', email: '', avatar: '' };
          });
        } else {
          // Members already have basic info, just normalize the structure
          normalized = current.map(m => ({ _id: m._id || m.id || m, ...(typeof m === 'object' ? m : {}) }));
        }

        const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch Google contacts to annotate members
        try {
          const resGoogle = await fetch(`${API_BASE_URL}/api/sync/google-contacts`, { headers });
          if (resGoogle.ok) {
            const jsonGoogle = await resGoogle.json();
            const googleContacts = Array.isArray(jsonGoogle.data) ? jsonGoogle.data : [];
            const googleEmails = new Set();
            const googlePhones = new Set();
            (googleContacts || []).forEach((g) => {
              if (g.email) googleEmails.add(String(g.email).toLowerCase().trim());
              const gp = String(g.phone || g.mobile || g.mobileNumber || "").replace(/\D/g, "");
              if (gp) googlePhones.add(gp.length > 10 ? gp.slice(-10) : gp);
            });

            // Annotate normalized members with isGoogleContact
            normalized = normalized.map(u => {
              const email = String(u.email || u.username || "").toLowerCase();
              const phone = String(u.phoneNumber || u.phone || u.mobile || "").replace(/\D/g, "");
              const phoneNorm = phone ? (phone.length > 10 ? phone.slice(-10) : phone) : "";
              return {
                ...u,
                isGoogleContact: (email && googleEmails.has(email)) || (phoneNorm && googlePhones.has(phoneNorm)),
              };
            });
          }
        } catch (e) {
          // ignore google contacts errors
        }

        // Check block status for members (same pattern as GroupCreation)
        try {
          const checks = await Promise.all(
            normalized.map(async (u) => {
              try {
                const uid = String(u._id || u.id || u);
                if (!uid) return { ...u, isBlocked: false };
                const status = await blockService.checkBlockStatus(uid);
                console.log(`🔍 Block check for ${uid}:`, status);
                // Annotate whether current user has blocked them
                const result = { ...u, isBlocked: Boolean(status?.isBlocked) };
                console.log(`✅ Annotated member:`, result);
                return result;
              } catch (e) {
                console.error(`❌ Block check error for ${u._id || u.id}:`, e);
                // On error, keep the user without isBlocked flag
                return { ...u, isBlocked: false };
              }
            })
          );
          normalized = checks;
          console.log(`📊 All normalized members with block status:`, normalized);
        } catch (e) {
          console.error('❌ Block status batch error:', e);
          // ignore block status errors
        }

        if (!cancelled) setDisplayMembers(normalized);
      } catch (e) {
        console.warn('Failed to normalize group members', e);
        if (!cancelled) setDisplayMembers(current.map(m => (typeof m === 'object' ? m : { _id: m })));
      }
    })();

    return () => { cancelled = true; };
  }, [effectiveGroup._id, effectiveGroup.chat, effectiveGroup.participants, effectiveGroup.members]);

  const formatCreatedAt = (g) => {
    const raw = g?.createdAtIso || g?.createdAt || g?.createdAtFormatted || null;
    if (!raw) return null;
    let d = null;
    try {
      // If it's already an ISO string or timestamp, parse it
      if (typeof raw === 'string' || typeof raw === 'number') {
        d = new Date(raw);
      } else if (raw instanceof Date) {
        d = raw;
      } else {
        d = new Date(raw);
      }
      if (isNaN(d.getTime())) return String(raw);
    } catch (e) {
      return String(raw);
    }

    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
  };

  const [mediaContent, setMediaContent] = useState(effectiveGroup.media || []);
  const [docsContent, setDocsContent] = useState(effectiveGroup.docs || []);
  const [linksContent, setLinksContent] = useState(effectiveGroup.links || []);
  const [loadingContent, setLoadingContent] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [recentChats, setRecentChats] = useState([]);
  const [unblockLoadingIds, setUnblockLoadingIds] = useState(new Set());

  const [inviteEnabledState, setInviteEnabledState] = useState(Boolean(group?.inviteEnabled));
  const [permissionsState, setPermissionsState] = useState({
    allowCreatorAdmin: group?.permissions?.allowCreatorAdmin !== false,
    allowOthersAdmin: group?.permissions?.allowOthersAdmin === true,
    allowMembersAdd: group?.permissions?.allowMembersAdd !== false,
  });
  const [featuresState, setFeaturesState] = useState({
    media: group.features?.media !== false,
    gallery: group.features?.gallery !== false,
    docs: group.features?.docs !== false,
    polls: group.features?.polls !== false,
  });

  // Sync local toggle state when modal is opened or group changes
  useEffect(() => {
    setInviteEnabledState(Boolean(group.inviteEnabled));
    setPermissionsState({
      allowCreatorAdmin: group.permissions?.allowCreatorAdmin !== false,
      allowOthersAdmin: group.permissions?.allowOthersAdmin === true,
      allowMembersAdd: group.permissions?.allowMembersAdd !== false,
    });
    setFeaturesState({
      media: group.features?.media !== false,
      gallery: group.features?.gallery !== false,
      docs: group.features?.docs !== false,
      polls: group.features?.polls !== false,
    });
    // clear any previous promote selections when opening
    setSelectedPromoteIds([]);
    // clear any previous removal selections when opening
    setSelectedRemoveIds([]);
    // disable editing mode when reopening
    setEditingEnabled(false);
  }, [open, group]);

  useEffect(() => {
    if (!open) return;

    const chatId = effectiveGroup.chat || effectiveGroup.chatId || effectiveGroup._id || effectiveGroup.id;
    if (!chatId) return;

    let cancelled = false;
    setLoadingContent(true);

    const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const mediaUrl = `${API_BASE_URL}/api/message/media?chatIds=${encodeURIComponent(chatId)}`;
    const docsUrl = `${API_BASE_URL}/api/message/documents?chatIds=${encodeURIComponent(chatId)}`;
    const linksUrl = `${API_BASE_URL}/api/message/links?chatIds=${encodeURIComponent(chatId)}`;

    Promise.all([
      fetch(mediaUrl, { headers }),
      fetch(docsUrl, { headers }),
      fetch(linksUrl, { headers }),
    ])
      .then(async ([mRes, dRes, lRes]) => {
        const m = mRes.ok ? await mRes.json() : [];
        const d = dRes.ok ? await dRes.json() : [];
        const l = lRes.ok ? await lRes.json() : [];
        if (!cancelled) {
          setMediaContent(Array.isArray(m) ? m : []);
          setDocsContent(Array.isArray(d) ? d : []);
          setLinksContent(Array.isArray(l) ? l : []);
        }
      })
      .catch((e) => {
        console.error('Failed to fetch group content:', e);
      })
      .finally(() => {
        if (!cancelled) setLoadingContent(false);
      });

    return () => { cancelled = true; };
  }, [open, effectiveGroup.chat, effectiveGroup.chatId, effectiveGroup._id, effectiveGroup.id]);

  // Fetch recent chats for forwarding list (matches ChattingPage behaviour)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API_BASE_URL}/api/chat/recent/forward`, { headers })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load recent chats');
        const json = await res.json();
        console.log('Fetched recent chats for forward modal:', json);
        if (cancelled) return;

        // Prefer other participant's name/avatar for 1-on-1 chats
        try {
          const _local = JSON.parse(localStorage.getItem('chasmos_user_data') || '{}');
          const myId = String(_local._id || _local.id || _local.userId || '');
          const mapped = (Array.isArray(json) ? json : []).map((c) => {
            try {
              // Normalize participant sources
              const participants = c.participants || c.users || [];
              if (!c.isGroupChat && Array.isArray(participants) && participants.length > 0) {
                // Find the other participant (not current user)
                const other = participants.find(p => {
                  const pid = p && (p._id || p.id || p.userId || p);
                  return pid && String(pid) !== myId;
                }) || participants[0];

                if (other) {
                  const name = other.name || other.email || other.username || other._id || c.name || c.chatName || '';
                  const avatar = other.avatar || other.image || other.avatarUrl || c.avatar || c.groupSettings?.avatar || '';
                  return { ...c, name, avatar };
                }
              }
            } catch (e) {
              // fall back to original
            }
            return c;
          });

          setRecentChats(mapped);
        } catch (e) {
          console.warn('Failed to normalize recent chats for forward modal', e);
          setRecentChats(Array.isArray(json) ? json : []);
        }
      })
      .catch((e) => {
        console.warn('Failed to fetch recent chats for forward modal', e);
      });
    return () => { cancelled = true; };
  }, [open]);

  // Fetch full group info (participants/admins) from backend by chat id
  useEffect(() => {
    if (!open) return;
    const chatId = group.chat || group.chatId || group._id || group.id;
    if (!chatId) return;

    let cancelled = false;
    const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const url = `${API_BASE_URL}/api/group/group/${encodeURIComponent(chatId)}`;
    fetch(url, { headers })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Failed to fetch group');
        if (!cancelled) setFetchedGroup(json);
      })
      .catch((e) => {
        console.error('Failed to fetch group info by chat id:', e);
      });

    return () => { cancelled = true; };
  }, [open, group.chat, group.chatId, group._id, group.id]);

    if (!group && !fetchedGroup) return null;

  const downloadFile = async (url, filename) => {
    try {
      // Always fetch as blob first to ensure browser prompts a save
      const resp = await fetch(url, { mode: 'cors' });
      if (!resp.ok) throw new Error('Network response was not ok');
      const blob = await resp.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || '';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error('Download failed, opening in new tab as fallback', e);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  // Derive a reliable display name for the group/chat across different API shapes
  const displayName = (
    effectiveGroup?.name ||
    effectiveGroup?.chatName ||
    effectiveGroup?.groupName ||
    effectiveGroup?.groupSettings?.name ||
    effectiveGroup?.groupSettings?.chatName ||
    (effectiveGroup?.chat && (effectiveGroup.chat.chatName || effectiveGroup.chat.name)) ||
    "Group"
  );

  // Performs the leave-group request (no UI confirmation)
  const performLeaveGroup = async () => {
    try {
      console.log('Leaving group with ID:', effectiveGroup?._id);
      const id = effectiveGroup?._id || effectiveGroup?.groupId || effectiveGroup?.chat || effectiveGroup?.chatId;
      if (!id) throw new Error('Group id not found');

      const url = `${API_BASE_URL}/api/group/exit-group`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ groupId: id })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to leave group');

      showToast(data.message || 'Left group', 'success', 2000);
      // Inform parent to update UI if provided, else close modal
      if (onUpdateGroup) {
        try {
          const _local = JSON.parse(localStorage.getItem('chasmos_user_data') || '{}');
          const removeId = String(_local._id || _local.id || _local.userId || '');
          const filterIds = (arr) => (Array.isArray(arr) ? arr.filter(a => String((a && (a._id || a.id || a))) !== removeId) : arr);
          onUpdateGroup({ ...effectiveGroup, participants: filterIds(effectiveGroup.participants || effectiveGroup.members || []), members: filterIds(effectiveGroup.participants || effectiveGroup.members || []) });
        } catch (e) { console.error('onUpdateGroup failed', e); }
      }
      onClose && onClose();
    } catch (error) {
      console.error('Failed to leave group:', error);
      showToast(error.message || 'Failed to leave group. Please try again.', 'error', 3000);
    }
    setShowLeaveConfirm(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-[20000] flex flex-col ${themeMode === 'dark' ? 'bg-[#121212]' : ''}`}
          style={themeMode === 'light' ? { background: 'transparent' } : {}}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Cosmos background behind the modal */}
          <CosmosBackground
            theme={themeMode}
            opacity={1}
            className="absolute inset-0 pointer-events-none"
            zIndex={-1}
            showNebula={true}
            showComets={true}
            showParticles={true}
            showStars={true}
          />
          {/* White overlay in day mode to match GroupCreation styling */}
          {themeMode === 'light' && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm pointer-events-none z-0" />
          )}
          {/* ================= HEADER ================= */}
          <div className={`relative z-10 flex items-center justify-between px-5 py-4 border-b ${themeMode === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
            {/* Left: avatar + members count (left aligned) */}
            <div className="flex items-center gap-4 group">
              <div className={`w-14 h-14 rounded-lg ${styles.avatarBg} flex items-center justify-center overflow-visible relative`}>
                {(() => {
                  const avatarSrc = (!removedGroupAvatar)
                    ? (groupAvatarLocal || effectiveGroup?.avatar || effectiveGroup?.icon || effectiveGroup?.groupSettings?.avatar || effectiveGroup?.groupSettings?.icon || effectiveGroup?.groupSettings?.avatarUrl || "")
                    : "";
                  const initial = String(displayName || "G").charAt(0);
                  return (
                    <div className="w-full h-full relative">
                      {avatarSrc ? (
                        <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className={`${styles.titleText} text-xl font-bold`}>{initial}</span>
                        </div>
                      )}

                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                      {editingEnabled && (
                        <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition">
                          <div className="flex flex-col gap-1">
                            {avatarSrc ? (
                              <>
                                <button
                                  onClick={handleRemoveAvatar}
                                  title="Remove picture"
                                  className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={openFilePicker}
                                  title="Change picture"
                                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${themeMode === 'dark' ? 'bg-white/6 text-white border border-white/10' : 'bg-gray-200 text-gray-700 border border-gray-300'}`}
                                >
                                  ✎
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={openFilePicker}
                                title="Add picture"
                                className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md"
                              >
                                +
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className={`flex flex-col transition-all ${editingEnabled ? 'group-hover:ml-10' : ''}`}>
                <p className={`${styles.subText} text-sm`}>{displayMembers.length} members</p>
                {formatCreatedAt(effectiveGroup) && (
                  <p className={`${styles.subText} text-xs mt-1`}>{`Created ${formatCreatedAt(effectiveGroup)}`}</p>
                )}
              </div>
            </div>

            {/* Center: group name (centered between avatar and close button) */}
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center z-20 pointer-events-none">
              {editingEnabled ? (
                <input
                  type="text"
                  value={groupNameLocal}
                  onChange={(e) => {
                    const v = e.target.value;
                    setGroupNameLocal(v);
                  }}
                  className={`pointer-events-auto text-center font-semibold text-lg px-3 py-1 rounded ${themeMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}
                />
              ) : (
                <h2 className={`${styles.titleText} font-semibold text-lg`}>{effectiveGroup.name}</h2>
              )}
            </div>

            {/* Right: save + close buttons (edit controls only visible to admins) */}
            <div className="relative z-30 flex items-center space-x-2">
              {isAdmin && (
                <>
                  <button
                    onClick={handleToggleEdit}
                    className={`px-3 py-1 rounded text-sm font-medium ${editingEnabled ? 'bg-yellow-500 text-white' : (themeMode === 'dark' ? 'bg-white/6 text-white' : 'bg-white border border-gray-200 text-gray-800')}`}
                  >
                    {editingEnabled ? 'Cancel' : 'Edit'}
                  </button>

                  <button
                    onClick={handleSaveAll}
                    disabled={!editingEnabled || savingSettings}
                    className={`px-3 py-1 rounded text-sm font-medium ${(!editingEnabled || savingSettings) ? 'opacity-60 cursor-not-allowed' : ''} ${themeMode === 'dark' ? 'bg-white/6 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}
                  >
                    {savingSettings ? 'Saving...' : 'Save'}
                  </button>
                </>
              )}

              <div>
                <button onClick={onClose} className={`p-2 rounded transition group ${themeMode === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-red-600'}`}>
                  <X className={`${styles.titleText} w-6 h-6 group-hover:text-white`} />
                </button>
              </div>
            </div>
          </div>

          {/* ================= BODY ================= */}
          <div className="relative z-10 flex-1 overflow-y-auto p-5 space-y-6">

            {/* Toast */}
            {toast?.show && (
              <div className="fixed right-6 bottom-6 z-[30000]">
                <div className={`px-4 py-2 rounded shadow-md ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white text-sm`}>
                  {toast.message}
                </div>
              </div>
            )}

            {/* ================= DESCRIPTION ================= */}
            {effectiveGroup.description && (
              <Section title="About">
                <div className={`${styles.sectionBg} rounded-xl p-4`}>
                  <p className={`${styles.subText} text-sm`}>{effectiveGroup.description}</p>
                </div>
              </Section>
            )}

            {/* ================= MEMBERS ================= */}
            <Section>
              <div className="flex items-center justify-between">
                <h4 className={`${styles.titleText} font-semibold text-base mb-3`}>{`Members (${displayMembers.length})`}</h4>
                {(isAdmin || permissionsState?.allowMembersAdd) && (
                  <div>
                    <button
                      onClick={async () => { await loadAvailableUsers?.(); }}
                      className={`px-3 py-1 rounded text-sm font-medium ${themeMode === 'dark' ? 'bg-white/6 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}
                    >
                      Add Member
                    </button>
                  </div>
                )}
              </div>
              {permissionsState.allowOthersAdmin && (
                <div className={`rounded-xl p-3 ${styles.sectionBg} ${styles.cardHover}`}>
                  <div className={`${styles.titleText} text-sm font-medium`}>Creator is admin by default</div>
                  <div className={`text-xs ${styles.subText} mt-1`}>Promote members to admin in the members list below.</div>
                </div>
              )}
              {displayMembers.map((member) => {
                const memberId = member.id || member._id || (member && member._id) || member;
                const me = String(memberId) === String(currentUserId);

                // safe display name and avatar
                let displayName = 'Member';
                if (member && (member.name || member.username || member.email)) {
                  displayName = member.name || member.username || member.email;
                } else if (me) {
                  try {
                    const _local = JSON.parse(localStorage.getItem('chasmos_user_data') || '{}');
                    displayName = _local?.name || _local?.fullName || _local?.username || _local?.email || 'You';
                  } catch (e) {
                    displayName = 'You';
                  }
                }
                let avatarSrc = member && (member.avatar || member.image || member.photo || member.picture) ? (member.avatar || member.image || member.photo || member.picture) : null;
                // fallback to current user's stored avatar when viewing self
                if (!avatarSrc && me) {
                  try {
                    const _local = JSON.parse(localStorage.getItem('chasmos_user_data') || '{}');
                    avatarSrc = _local?.avatar || _local?.image || _local?.photo || _local?.picture || avatarSrc;
                  } catch (e) { /* ignore */ }
                }

                const isMemberCreator = String(memberId) === String(creatorId);
                const isMemberAdmin = effectiveGroup.admins?.some(admin => {
                  const adminId = admin._id?.toString() || admin.toString();
                  return adminId === String(memberId);
                }) || false;

                return (
                  <div
                    key={String(memberId)}
                    className={`flex justify-between items-center ${styles.cardBg} rounded-xl p-3 ${styles.cardHover} transition`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${styles.avatarBg} flex items-center justify-center ${themeMode === 'dark' ? 'text-white' : 'text-gray-900'} overflow-hidden`}>
                        {avatarSrc ? (
                          <img src={avatarSrc} alt={displayName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="font-semibold">{String(displayName || '?').charAt(0)}</span>
                        )}
                      </div>

                      <div>
                        <div className="flex gap-2 items-center flex-wrap">
                          <span className={`${styles.titleText} text-sm font-medium`}>
                            {displayName}
                            {me && (
                              <span className={`${styles.subText} text-xs ml-1`}>
                                (You)
                              </span>
                            )}
                          </span>

                          {isMemberCreator && Badge("Creator", "purple")}
                          {isMemberAdmin && !isMemberCreator && Badge("Admin", "blue")}
                          {member.isGoogleContact && (
                            <span className="ml-1 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                              Google
                            </span>
                          )}
                        </div>

                        <p className={`text-xs ${styles.subText} mt-0.5`}>{member.username || member.email || (me ? (JSON.parse(localStorage.getItem('chasmos_user_data')||'{}').email || 'Member') : 'Member')}</p>
                      </div>
                    </div>

                    {!isMemberCreator && !me && (
                      <div className="flex gap-2 items-center">
                        {member.isBlocked ? (
                          <div className="flex items-center gap-2">
                            <div className={`text-xs ${styles.subText} mr-2`}>You've blocked this user</div>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  setUnblockLoadingMemberIds(prev => new Set(prev).add(String(memberId)));
                                  await blockService.unblockUser(String(memberId));
                                  setDisplayMembers(prev => (prev || []).map(m => {
                                    const mId = String(m._id || m.id || m);
                                    if (mId === String(memberId)) return { ...m, isBlocked: false };
                                    return m;
                                  }));
                                  showToast('User unblocked', 'success', 2000);
                                } catch (err) {
                                  console.error('Unblock failed', err);
                                  showToast('Failed to unblock', 'error', 3000);
                                } finally {
                                  setUnblockLoadingMemberIds(prev => {
                                    const copy = new Set(prev);
                                    copy.delete(String(memberId));
                                    return copy;
                                  });
                                }
                              }}
                              disabled={unblockLoadingMemberIds.has(String(memberId))}
                              className={`text-xs px-2 py-1 rounded ${themeMode === 'dark' ? 'bg-white/6 text-white' : 'bg-white border border-gray-200 text-gray-800'} disabled:opacity-50 disabled:cursor-not-allowed transition`}
                            >
                              {unblockLoadingMemberIds.has(String(memberId)) ? 'Unblocking...' : 'Unblock'}
                            </button>
                          </div>
                        ) : isAdmin ? (
                          <>
                            {permissionsState.allowOthersAdmin ? (
                              isMemberAdmin ? null : (
                                <button
                                  type="button"
                                  onClick={() => { if (editingEnabled) toggleSelectPromote(String(memberId)); }}
                                  disabled={!editingEnabled}
                                  aria-pressed={selectedPromoteIds.includes(String(memberId))}
                                  title={selectedPromoteIds.includes(String(memberId)) ? 'Selected for promotion' : (editingEnabled ? 'Promote as admin' : 'Enable Edit to promote')}
                                  aria-label={selectedPromoteIds.includes(String(memberId)) ? 'Selected for promotion' : 'Promote as admin'}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center border transition ${!editingEnabled ? 'opacity-50 cursor-not-allowed' : ''} ${selectedPromoteIds.includes(String(memberId)) ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-300 text-gray-600'}`}
                                >
                                  {selectedPromoteIds.includes(String(memberId)) ? '✓' : '+'}
                                </button>
                              )
                            ) : null}

                            <button
                              type="button"
                              onClick={() => toggleSelectRemove(String(memberId))}
                              disabled={!editingEnabled}
                              aria-pressed={selectedRemoveIds.includes(String(memberId))}
                              title={selectedRemoveIds.includes(String(memberId)) ? 'Marked for removal' : (editingEnabled ? (isAdmin ? 'Mark for removal' : 'You are not an admin') : 'Enable Edit to remove')}
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition ${!editingEnabled ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-400' : ''} ${selectedRemoveIds.includes(String(memberId)) ? 'bg-red-600 text-white' : (isAdmin ? 'bg-yellow-400 text-yellow-800' : 'bg-yellow-400 text-white')}`}
                            >
                              <Trash className={`${selectedRemoveIds.includes(String(memberId)) ? 'w-4 h-4 text-white' : 'w-4 h-4 text-yellow-800'}`} />
                            </button>
                          </>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </Section>

            {/* ================= INVITE LINK ================= */}
            <Section title="Invite Link">
              <div className={`${styles.sectionBg} rounded-xl p-4`}>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className={`${styles.titleText} text-sm font-medium block`}>Invite via link</span>
                        <span className={`text-xs ${styles.subText} mt-1 block`}>
                      {(editingEnabled ? inviteEnabledState : effectiveGroup.inviteEnabled) ? "Members can join using the invite link" : "Invite link is currently disabled"}
                    </span>
                  </div>
                  {isAdmin ? (
                    <label className={`relative inline-flex items-center ${editingEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                      <input disabled={!editingEnabled} type="checkbox" className="sr-only peer" checked={inviteEnabledState} onChange={(e) => handleToggleInvite(e.target.checked)} />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 transition" />
                      <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full peer-checked:translate-x-5 transition" />
                    </label>
                  ) : (
                    <div className="flex items-center">
                      <StatusBadge enabled={(effectiveGroup.inviteEnabled === undefined) ? Boolean(inviteEnabledState) : Boolean(effectiveGroup.inviteEnabled)} />
                    </div>
                  )}
                </div>

                <div className="w-full mt-2 text-sm">
                  {
                    // determine if invite is enabled from any source (persisted or local edit)
                    (() => {
                      const isInviteEnabled = Boolean(inviteLinkLocal || fetchedGroup?.inviteEnabled || effectiveGroup.inviteEnabled || inviteEnabledState || derivedInviteEnabled);
                      const hasLink = Boolean(inviteLinkLocal || fetchedGroup?.inviteLink || effectiveGroup.inviteLink || settings.inviteLink || derivedInviteLink);

                      if (!isInviteEnabled) return null;

                      // If a link exists show copy/forward to everyone
                      if (hasLink) {
                        return (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={handleCopyInvite}
                              className="w-full text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                            >
                              Copy Invite Link
                            </button>

                            <button
                              onClick={() => {
                                const link = inviteLinkLocal || fetchedGroup?.inviteLink || effectiveGroup.inviteLink || settings.inviteLink || derivedInviteLink || "";
                                if (!link) return showToast('No invite link available', 'error', 2500);
                                const msg = `Follow this link to join my chasmos group: ${link}`;
                                setForwardMessage({ content: msg });
                                setForwardOpen(true);
                              }}
                              className="w-full text-sm px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 transition"
                            >
                              Forward Link
                            </button>
                          </div>
                        );
                      }

                      // No link yet but invite is enabled: only admins in edit mode can generate
                      if (isAdmin && editingEnabled) {
                        return (
                          <div className="flex justify-center">
                            <button
                              onClick={handleGenerateInvite}
                              disabled={generatingInvite}
                              className={`px-6 py-2 rounded-lg ${generatingInvite ? 'bg-gray-300 text-gray-700' : 'bg-green-600 text-white hover:bg-green-700'} transition`}
                            >
                              {generatingInvite ? 'Generating...' : 'Generate Invite Link'}
                            </button>
                          </div>
                        );
                      }

                      return null;
                    })()
                  }
                </div>
              </div>
            </Section>

            {/* ================= PERMISSIONS ================= */}
            <Section title="Permissions">
              <div className={`${styles.sectionBg} rounded-xl p-4 space-y-3`}>
                {(() => {
                  const isPrimaryAdmin = String(effectiveGroup.admin?._id || effectiveGroup.admin || '') === String(currentUserId || '');
                  if (!isPrimaryAdmin) return null;
                  return (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`${styles.titleText} text-sm font-medium`}>Allow Others as Admins</div>
                        <div className={`text-xs ${styles.subText}`}>Members can be promoted to admin</div>
                      </div>
                      {isAdmin ? (
                        <label className={`relative inline-flex items-center ${editingEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                          <input disabled={!editingEnabled} type="checkbox" className="sr-only peer" checked={permissionsState.allowOthersAdmin} onChange={(e) => handleTogglePermission('allowOthersAdmin', e.target.checked)} />
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 transition" />
                          <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full peer-checked:translate-x-5 transition" />
                        </label>
                      ) : (
                        <StatusBadge enabled={effectiveGroup.permissions?.allowOthersAdmin !== false} />
                      )}
                    </div>
                  );
                })()}

                <div className="flex items-center justify-between">
                  <div>
                    <div className={`${styles.titleText} text-sm font-medium`}>Members Can Add Users</div>
                    <div className={`text-xs ${styles.subText}`}>Any member can invite new people</div>
                  </div>
                  {isAdmin ? (
                    <label className={`relative inline-flex items-center ${editingEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                      <input disabled={!editingEnabled} type="checkbox" className="sr-only peer" checked={permissionsState.allowMembersAdd} onChange={(e) => handleTogglePermission('allowMembersAdd', e.target.checked)} />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 transition" />
                      <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full peer-checked:translate-x-5 transition" />
                    </label>
                  ) : (
                    <StatusBadge enabled={effectiveGroup.permissions?.allowMembersAdd !== false} />
                  )}
                </div>
              </div>
            </Section>

            {/* ================= FEATURES ================= */}
            <Section title="Group Features">
              <div className="space-y-3">
                <div className={`${styles.sectionBg} rounded-xl p-4 flex items-center justify-between`}>
                  <div>
                    <div className={`${styles.titleText} text-sm font-medium`}>Media Sharing</div>
                    <div className={`text-xs ${styles.subText}`}>Send photos and videos</div>
                  </div>
                  {isAdmin ? (
                    <label className={`relative inline-flex items-center ${editingEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                      <input disabled={!editingEnabled} type="checkbox" className="sr-only peer" checked={featuresState.media} onChange={(e) => handleToggleFeature('media', e.target.checked)} />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 transition" />
                      <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full peer-checked:translate-x-5 transition" />
                    </label>
                  ) : (
                    <StatusBadge enabled={effectiveGroup.features?.media !== false} />
                  )}
                </div>

                {/* <div className={`${styles.sectionBg} rounded-xl p-4 flex items-center justify-between`}>
                  <div>
                    <div className={`${styles.titleText} text-sm font-medium`}>Gallery View</div>
                    <div className={`text-xs ${styles.subText}`}>View all shared media</div>
                  </div>
                  {isAdmin ? (
                    <label className={`relative inline-flex items-center ${editingEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                      <input disabled={!editingEnabled} type="checkbox" className="sr-only peer" checked={featuresState.gallery} onChange={(e) => handleToggleFeature('gallery', e.target.checked)} />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 transition" />
                      <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full peer-checked:translate-x-5 transition" />
                    </label>
                  ) : (
                    <StatusBadge enabled={effectiveGroup.features?.gallery !== false} />
                  )}
                </div> */}

                <div className={`${styles.sectionBg} rounded-xl p-4 flex items-center justify-between`}>
                  <div>
                    <div className={`${styles.titleText} text-sm font-medium`}>Document Sharing</div>
                    <div className={`text-xs ${styles.subText}`}>Share files and documents</div>
                  </div>
                  {isAdmin ? (
                    <label className={`relative inline-flex items-center ${editingEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                      <input disabled={!editingEnabled} type="checkbox" className="sr-only peer" checked={featuresState.docs} onChange={(e) => handleToggleFeature('docs', e.target.checked)} />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 transition" />
                      <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full peer-checked:translate-x-5 transition" />
                    </label>
                  ) : (
                    <StatusBadge enabled={effectiveGroup.features?.docs !== false} />
                  )}
                </div>

                <div className={`${styles.sectionBg} rounded-xl p-4 flex items-center justify-between`}>
                  <div>
                    <div className={`${styles.titleText} text-sm font-medium`}>Polls</div>
                    <div className={`text-xs ${styles.subText}`}>Create and vote on polls</div>
                  </div>
                  {isAdmin ? (
                    <label className={`relative inline-flex items-center ${editingEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                      <input disabled={!editingEnabled} type="checkbox" className="sr-only peer" checked={featuresState.polls} onChange={(e) => handleToggleFeature('polls', e.target.checked)} />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 transition" />
                      <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full peer-checked:translate-x-5 transition" />
                    </label>
                  ) : (
                    <StatusBadge enabled={effectiveGroup.features?.polls !== false} />
                  )}
                </div>
              </div>
            </Section>

            {/* ================= MEDIA TABS ================= */}
            <Section title="Shared Content">
              <div className="flex gap-2 mb-4">
                <TabButton
                  active={activeTab === "media"}
                  icon={Image}
                  label="Media"
                  onClick={() => setActiveTab("media")}
                  color="blue"
                />
                <TabButton
                  active={activeTab === "docs"}
                  icon={FileText}
                  label="Docs"
                  onClick={() => setActiveTab("docs")}
                  color="green"
                />
                <TabButton
                  active={activeTab === "links"}
                  icon={LinkIcon}
                  label="Links"
                  onClick={() => setActiveTab("links")}
                  color="purple"
                />
              </div>


                <div className="max-h-[360px] overflow-y-auto">
                {activeTab === "media" && (
                  <div className="grid grid-cols-6 gap-2">
                    {mediaContent.length > 0 ? (
                      mediaContent.map((item, i) => (
                        <div key={i} className={`aspect-square rounded-lg overflow-hidden relative ${themeMode === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                          <div className="absolute left-0 right-0 bottom-0 p-2 flex justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent">
                            <button
                              onClick={() => window.open(item.url, '_blank')}
                              className="text-xs bg-white/10 hover:bg-white/20 text-white rounded px-2 py-1 flex items-center gap-2"
                              aria-label="View media"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>View</span>
                            </button>

                            <button
                              onClick={() => downloadFile(item.url, item.fileName || `media-${i}`)}
                              className="text-xs bg-white/10 hover:bg-white/20 text-white rounded px-2 py-1 flex items-center gap-2"
                              aria-label="Download media"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-6 flex items-center justify-center py-12">
                        <p className="text-gray-400 text-sm text-center">No media shared yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "docs" && (
                  <div className="space-y-2">
                    {docsContent.length > 0 ? (
                      docsContent.map((doc, i) => {
                        const url = doc.url || doc.fileUrl || doc.file || doc.urlNew || doc.link;
                        const filename = doc.fileName || doc.name || `document-${i}`;
                        return (
                          <div key={i} className={`flex items-center gap-3 p-3 rounded-lg transition ${themeMode === 'dark' ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white hover:bg-gray-50 border border-gray-200'}`}>
                            <FileText className={`w-5 h-5 ${themeMode === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                            <div className="flex-1">
                              <span className={`${styles.titleText} text-sm block`}>{doc.name || doc.fileName || doc.file || filename}</span>
                              {doc.mimeType && <span className={`text-xs ${styles.subText}`}>{doc.mimeType}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => url ? window.open(url, '_blank') : alert('No URL available')}
                                className={`text-xs px-3 py-1 rounded ${themeMode === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-800'} flex items-center gap-2`}
                              >
                                <ExternalLink className="w-4 h-4" />
                                View
                              </button>
                              <button
                                onClick={() => url ? downloadFile(url, filename) : alert('No URL available')}
                                className={`text-xs px-3 py-1 rounded ${themeMode === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-800'} flex items-center gap-2`}
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-400 text-sm text-center py-8">No documents shared yet</p>
                    )}
                  </div>
                )}

                {activeTab === "links" && (
                  <div className="space-y-2">
                    {linksContent.length > 0 ? (
                      linksContent.map((link, i) => (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-lg transition ${themeMode === 'dark' ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white hover:bg-gray-50 border border-gray-200'}`}>
                          <LinkIcon className={`w-5 h-5 ${themeMode === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className={`${themeMode === 'dark' ? 'text-blue-400' : 'text-blue-600'} text-sm hover:underline`}>
                            {link.title || link.url}
                          </a>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm text-center py-8">No links shared yet</p>
                    )}
                  </div>
                )}
              </div>
              
            </Section>

            {/* ================= ACTIONS ================= */}
            <Section title="Actions">
    <>
      <ActionButton 
        icon={LogOut} 
        label="Leave group" 
        color="red"
        onClick={() => setShowLeaveConfirm(true)}
      />

      {/* Leave confirmation modal */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[21000] flex items-center justify-center"
          >
            <div className={`absolute inset-0 ${modalOverlayClass}`} onClick={() => setShowLeaveConfirm(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative z-10 w-full max-w-md rounded-xl p-6 ${modalContainerBgClass} shadow-lg`}
            >
              <h3 className={`${modalTitleClass} text-lg font-semibold mb-2`}>Leave group</h3>
              <p className={`${modalDescClass} text-sm mb-4`}>Are you sure you want to leave this group? You will lose access to group messages.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowLeaveConfirm(false)} className={cancelBtnClass}>Cancel</button>
                <button onClick={performLeaveGroup} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm">Leave</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
 
</Section>
          </div>

          {/* Forward message modal used to forward invite text to other chats */}
          <ForwardMessageModal
            isOpen={forwardOpen}
            onClose={() => setForwardOpen(false)}
            onForward={async (selectedChats, payload) => {
              if (!selectedChats || selectedChats.length === 0) return showToast('Select at least one chat', 'error', 2500);
              try {
                const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
                for (const chat of selectedChats) {
                  const chatId = chat.chatId || chat._id || chat.id;
                  const forwardData = {
                    chatId,
                    content: (payload && payload.content) || (forwardMessage && forwardMessage.content) || '',
                    attachments: (payload && payload.attachments) || [],
                    type: (payload && payload.type) || 'text',
                    isForwarded: true,
                  };
                  await fetch(`${API_BASE_URL}/api/message/forward`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(forwardData),
                  });
                }
                showToast('Forward sent', 'success', 2000);
                setForwardOpen(false);
                try {
                  const forwardedIds = (selectedChats || []).map(c => c.chatId || c._id || c.id).filter(Boolean);
                  if (typeof window !== 'undefined' && forwardedIds.length) {
                    window.dispatchEvent(new CustomEvent('chasmos:forwarded', { detail: { chatIds: forwardedIds } }));
                  }
                } catch (e) {
                  console.warn('Failed to dispatch forwarded event', e);
                }
              } catch (e) {
                console.error('Forward failed', e);
                showToast('Failed to forward message', 'error', 3000);
              }
            }}
            contacts={recentChats}
            effectiveTheme={{
              mode: themeMode,
              primary: themeMode === 'dark' ? 'bg-gray-900' : 'bg-white/90',
              secondary: themeMode === 'dark' ? 'bg-gray-900' : 'bg-white',
              border: themeMode === 'dark' ? 'border-gray-800' : 'border-gray-200',
              text: themeMode === 'dark' ? 'text-white' : 'text-gray-900',
              textSecondary: themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600',
              accent: themeMode === 'dark' ? 'bg-blue-600' : 'bg-blue-500',
              hover: themeMode === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'
            }}
            currentUserId={currentUserId}
            message={forwardMessage}
            setMessage={setForwardMessage}
          />

          {/* Add Member Modal */}
          <AnimatePresence>
            {showAddMemberModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[21500] flex items-center justify-center"
              >
                <div className={`absolute inset-0 ${modalOverlayClass}`} onClick={() => setShowAddMemberModal(false)} />
                <motion.div
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.98, opacity: 0 }}
                  className={`relative z-10 w-full max-w-xl rounded-xl p-4 ${modalContainerBgClass} shadow-lg`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`${modalTitleClass} text-lg font-semibold`}>Add members</h3>
                    <div className="flex items-center gap-2">
                      <div className={`text-sm ${styles.subText} mr-2 hidden sm:block`}>{selectedAddIds.length} selected</div>
                      <button
                        onClick={() => handleAddSelected()}
                        disabled={addingMultiple || selectedAddIds.length === 0}
                        className={`px-3 py-1 rounded text-sm font-medium ${addingMultiple || selectedAddIds.length === 0 ? 'opacity-60 cursor-not-allowed' : (themeMode === 'dark' ? 'bg-white/6 text-white' : 'bg-white border border-gray-200 text-gray-800')}`}
                      >
                        {addingMultiple ? 'Adding...' : 'Add Selected'}
                      </button>
                      <button onClick={() => setShowAddMemberModal(false)} className={`p-2 rounded ${themeMode === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                        <X className={`${modalTitleClass} w-5 h-5`} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="mb-2">
                      <input
                        type="search"
                        placeholder="Search users by name or email"
                        value={addSearch}
                        onChange={(e) => setAddSearch(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${themeMode === 'dark' ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
                      />
                      <div className={`text-xs mt-1 ${styles.subText}`}>{`Showing ${Math.min(((addPage-1)*PAGE_SIZE)+1, (filteredAvailableUsers||[]).length||0)}-${Math.min(addPage*PAGE_SIZE, (filteredAvailableUsers||[]).length||0)} of ${(filteredAvailableUsers||[]).length || 0}`}</div>
                    </div>

                    <div className="max-h-[56vh] overflow-y-auto space-y-2">
                      {loadingUsers && (
                        <div className={`${styles.subText} text-sm`}>Loading users...</div>
                      )}

                      {!loadingUsers && (filteredAvailableUsers || []).length === 0 && (
                        <div className={`${styles.subText} text-sm`}>No available users to add</div>
                      )}

                      {!loadingUsers && paginatedAvailable.map((u) => {
                        const uid = u._id || u.id || u.userId || '';
                        const isUserBlocked = u.isBlocked === true;
                        const isUnblocking = unblockLoadingAvailableIds.has(String(uid));
                        return (
                          <div
                            key={uid}
                            onClick={() => { if (!isUserBlocked) toggleSelectAvailable(uid); }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (!isUserBlocked && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleSelectAvailable(uid); } }}
                            className={`flex items-center justify-between p-2 rounded transition ${isUserBlocked ? '' : 'cursor-pointer'} ${themeMode === 'dark' ? 'hover:bg-gray-800 bg-transparent' : 'hover:bg-gray-50 bg-white'}`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-10 h-10 rounded-full ${styles.avatarBg} flex items-center justify-center overflow-hidden flex-shrink-0`}>
                                {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover rounded-full" alt={u.name || u.username} /> : <span className={`${styles.titleText}`}>{String(u.name || u.username || 'U').charAt(0)}</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className={`${styles.titleText} text-sm font-medium truncate`}>{u.name || u.username || uid}</div>
                                  {u.isGoogleContact && (
                                    <span className="ml-1 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full flex-shrink-0">
                                      Google
                                    </span>
                                  )}
                                </div>
                                <div className={`text-xs ${styles.subText} truncate`}>{u.email || u.phone || ''}</div>
                              </div>
                            </div>

                            <div className="ml-3 flex-shrink-0">
                              {isUserBlocked ? (
                                <div className="flex items-center gap-2">
                                  <div className={`text-xs ${styles.subText} mr-2`}>You've blocked this user</div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleUnblockAvailableUser(uid); }}
                                    disabled={isUnblocking}
                                    className={`text-xs px-2 py-1 rounded ${themeMode === 'dark' ? 'bg-white/6 text-white' : 'bg-white border border-gray-200 text-gray-800'} ${isUnblocking ? 'opacity-60 cursor-not-allowed' : ''}`}
                                  >
                                    {isUnblocking ? 'Unblocking...' : 'Unblock'}
                                  </button>
                                </div>
                              ) : (
                                <label className="inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={selectedAddIds.includes(String(uid))}
                                    onChange={(e) => { e.stopPropagation(); toggleSelectAvailable(uid); }}
                                    className={`h-4 w-4 mr-2 ${themeMode === 'dark' ? 'accent-white' : ''}`}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination controls */}
                    <div className="flex items-center justify-between mt-3">
                      <div className={`text-xs ${styles.subText}`}>{`${(filteredAvailableUsers||[]).length} result(s)`}</div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setAddPage(p => Math.max(1, p - 1))}
                          disabled={addPage <= 1}
                          className={`px-2 py-1 rounded text-sm ${addPage <= 1 ? 'opacity-50 cursor-not-allowed' : (themeMode === 'dark' ? 'bg-white/6 text-white' : 'bg-white border border-gray-200 text-gray-800')}`}
                        >
                          Prev
                        </button>
                        <div className={`text-sm ${styles.subText}`}>{`Page ${addPage} / ${totalPages}`}</div>
                        <button
                          onClick={() => setAddPage(p => Math.min(totalPages, p + 1))}
                          disabled={addPage >= totalPages}
                          className={`px-2 py-1 rounded text-sm ${addPage >= totalPages ? 'opacity-50 cursor-not-allowed' : (themeMode === 'dark' ? 'bg-white/6 text-white' : 'bg-white border border-gray-200 text-gray-800')}`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================= REUSABLE COMPONENTS ================= */
const Section = ({ title, children }) => {
  const themeModeLocal = (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) ? 'dark' : 'light';
  const titleClass = themeModeLocal === 'dark' ? 'text-white' : 'text-gray-800';
  return (
    <section className="space-y-3">
      {title && (
        <h4 className={`${titleClass} font-semibold text-base mb-3`}>{title}</h4>
      )}
      <div className="space-y-3">{children}</div>
    </section>
  );
};

const StatusBadge = ({ enabled }) => (
  <span
    className={`px-3 py-1 text-xs font-medium rounded-full ${
      enabled 
        ? "bg-green-500/20 text-green-400 border border-green-500/30" 
        : "bg-red-500/20 text-red-400 border border-red-500/30"
    }`}
  >
    {enabled ? "Enabled" : "Disabled"}
  </span>
);

const Badge = (text, color) => {
  const colorClasses = {
    purple: "bg-purple-600",
    blue: "bg-blue-600",
    gray: "bg-gray-600",
  };
  
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded ${colorClasses[color] || "bg-gray-600"} text-white font-medium`}>
      {text}
    </span>
  );
};

const ActionButton = ({ icon: Icon, label, color, onClick }) => {
  const themeModeLocal = (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) ? 'dark' : 'light';
  const isDanger = color === 'red';

  // base classes depending on theme and danger flag
  let base;
  if (isDanger) {
    base = themeModeLocal === 'dark'
      ? 'bg-gray-900 hover:bg-red-700 text-gray-400 group'
      : 'bg-white hover:bg-red-600 border border-gray-200 text-gray-700 group';
  } else {
    base = themeModeLocal === 'dark'
      ? 'bg-gray-900 hover:bg-gray-800 text-gray-400'
      : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-700';
  }

  const colorClasses = {
    red: 'text-red-400',
    orange: 'text-orange-400',
    yellow: 'text-yellow-400',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl ${base} ${colorClasses[color] || ''} transition`}
    >
      {Icon && <Icon className={`w-5 h-5 ${isDanger ? 'group-hover:text-white' : ''}`} />}
      <span className={`font-medium ${isDanger ? 'group-hover:text-white' : ''}`}>{label}</span>
    </button>
  );
};

export default GroupInfoModalWhatsApp;