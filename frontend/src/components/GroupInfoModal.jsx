// GroupInfoModalWhatsApp.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
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
  onDeleteGroup,
}) => {
  const [activeTab, setActiveTab] = useState("media");

  const [fetchedGroup, setFetchedGroup] = useState(null);
  const effectiveGroup = fetchedGroup || group;

  if (!group && !fetchedGroup) return null;

  console.log("📊 GroupInfoModal received group data:", {
    inviteEnabled: effectiveGroup.inviteEnabled,
    inviteLink: effectiveGroup.inviteLink,
    permissions: effectiveGroup.permissions,
    features: effectiveGroup.features
  });

  const members = effectiveGroup.members || effectiveGroup.participants || [];
  const settings = effectiveGroup.settings || {};

  // Derive invite/settings/permissions/features from various possible payload shapes
  const derivedInviteEnabled = (typeof effectiveGroup.inviteEnabled !== 'undefined')
    ? Boolean(effectiveGroup.inviteEnabled)
    : (effectiveGroup.group && typeof effectiveGroup.group.inviteEnabled !== 'undefined')
      ? Boolean(effectiveGroup.group.inviteEnabled)
      : Boolean(effectiveGroup.groupSettings && effectiveGroup.groupSettings.allowInvites);

  const derivedInviteLink = effectiveGroup.inviteLink || (effectiveGroup.group && effectiveGroup.group.inviteLink) || (effectiveGroup.groupSettings && effectiveGroup.groupSettings.inviteLink) || "";

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

  console.log('📊 GroupInfoModal derived values:', { derivedInviteEnabled, derivedInviteLink, permissions, features });

  // ✅ Determine creator ID
  const creatorId = effectiveGroup.admin?._id?.toString() || effectiveGroup.admin?.toString() || effectiveGroup.groupAdmin?._id?.toString() || effectiveGroup.groupAdmin?.toString();

  const isCreator = currentUserId?.toString() === creatorId;

  const isAdmin = isCreator || effectiveGroup.admins?.some(admin => {
    const adminId = admin._id?.toString() || admin.toString();
    return adminId === currentUserId?.toString();
  });

  const handleRemoveMember = (memberId) => {
    onUpdateGroup?.({
      ...effectiveGroup,
      members: members.filter((m) => m.id !== memberId && m._id !== memberId),
    });
  };

  const handlePromoteToggle = (memberId) => {
    onUpdateGroup?.({
      ...effectiveGroup,
      members: members.map((m) =>
        (m.id === memberId || m._id === memberId) ? { ...m, isAdmin: !m.isAdmin } : m
      ),
    });
  };

  const handleCopyInvite = async () => {
    const link = effectiveGroup.inviteLink || settings.inviteLink || "";
    if (!link) return;
    const text = `Follow this link to join my chasmos group: ${link}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Invite text copied to clipboard");
    } catch (e) {
      console.error("Failed to copy invite text", e);
      toast.error("Failed to copy invite link");
    }
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

      toast.success(data.message || 'Left group');
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
      toast.error(error.message || 'Failed to leave group. Please try again.');
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
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-lg ${styles.avatarBg} flex items-center justify-center overflow-hidden`}>
                {(() => {
                  const avatarSrc = effectiveGroup?.avatar || effectiveGroup?.icon || effectiveGroup?.groupSettings?.avatar || effectiveGroup?.groupSettings?.icon || effectiveGroup?.groupSettings?.avatarUrl || "";
                  if (avatarSrc) {
                    return (
                      <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover" />
                    );
                  }
                  return <span className={`${styles.titleText} text-xl font-bold`}>{String(displayName || "G").charAt(0)}</span>;
                })()}
              </div>

              <div className="flex flex-col">
                <p className={`${styles.subText} text-sm`}>{members.length} members</p>
                {formatCreatedAt(effectiveGroup) && (
                  <p className={`${styles.subText} text-xs mt-1`}>{`Created ${formatCreatedAt(effectiveGroup)}`}</p>
                )}
              </div>
            </div>

            {/* Center: group name (centered between avatar and close button) */}
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center z-20 pointer-events-none">
              <h2 className={`${styles.titleText} font-semibold text-lg`}>{effectiveGroup.name}</h2>
            </div>

            {/* Right: close button */}
            <div className="relative z-30">
              <button onClick={onClose} className={`p-2 rounded transition group ${themeMode === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-red-600'}`}>
                <X className={`${styles.titleText} w-6 h-6 group-hover:text-white`} />
              </button>
            </div>
          </div>

          {/* ================= BODY ================= */}
          <div className="relative z-10 flex-1 overflow-y-auto p-5 space-y-6">

            {/* ================= DESCRIPTION ================= */}
            {effectiveGroup.description && (
              <Section title="About">
                <div className={`${styles.sectionBg} rounded-xl p-4`}>
                  <p className={`${styles.subText} text-sm`}>{effectiveGroup.description}</p>
                </div>
              </Section>
            )}

            {/* ================= MEMBERS ================= */}
            <Section title={`Members (${members.length})`}>
              {members.map((member) => {
                const memberId = member.id || member._id;
                const me = memberId?.toString() === currentUserId?.toString();
                
                // ✅ Check if this member is the creator
                const isMemberCreator = memberId?.toString() === creatorId;
                
                // ✅ Check if this member is an admin
                const isMemberAdmin = effectiveGroup.admins?.some(admin => {
                  const adminId = admin._id?.toString() || admin.toString();
                  return adminId === memberId?.toString();
                }) || false;

                return (
                  <div
                    key={memberId}
                    className={`flex justify-between items-center ${styles.cardBg} rounded-xl p-3 ${styles.cardHover} transition`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${styles.avatarBg} flex items-center justify-center ${themeMode === 'dark' ? 'text-white' : 'text-gray-900'} overflow-hidden`}>
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="font-semibold">{member.name?.charAt(0) || "?"}</span>
                        )}
                      </div>

                      <div>
                        <div className="flex gap-2 items-center flex-wrap">
                            <span className={`${styles.titleText} text-sm font-medium`}>{member.name}</span>

                          {isMemberCreator && Badge("Creator", "purple")}
                          {isMemberAdmin && !isMemberCreator && Badge("Admin", "blue")}
                          {me && Badge("You", "gray")}
                        </div>

                        <p className={`text-xs ${styles.subText} mt-0.5`}>{member.username || member.email || "Member"}</p>
                      </div>
                    </div>

                    {(isAdmin || isCreator) && !isMemberCreator && !me && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePromoteToggle(memberId)}
                          className="text-xs px-3 py-1.5 bg-gray-800 text-blue-400 rounded hover:bg-gray-700 transition"
                        >
                          {isMemberAdmin ? "Demote" : "Make Admin"}
                        </button>

                        <button
                          onClick={() => handleRemoveMember(memberId)}
                          className="text-xs px-3 py-1.5 bg-gray-800 text-red-500 rounded hover:bg-gray-700 transition"
                        >
                          Remove
                        </button>
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
                      {effectiveGroup.inviteEnabled ? "Members can join using the invite link" : "Invite link is currently disabled"}
                    </span>
                  </div>
                  <StatusBadge enabled={effectiveGroup.inviteEnabled} />
                </div>

                {effectiveGroup.inviteEnabled && (
                  <div className="w-full mt-2 text-sm grid grid-cols-2 gap-2">
                    <button
                      onClick={handleCopyInvite}
                      className="w-full text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                      Copy Invite Link
                    </button>

                    <button
                      onClick={() => {
                        const link = effectiveGroup.inviteLink || settings.inviteLink || "";
                        if (!link) return toast.error('No invite link available');
                        const msg = `Follow this link to join my chasmos group: ${link}`;
                        setForwardMessage({ content: msg });
                        setForwardOpen(true);
                      }}
                      className="w-full text-sm px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 transition"
                    >
                      Forward Link
                    </button>
                  </div>
                )}
              </div>
            </Section>

            {/* ================= PERMISSIONS ================= */}
            <Section title="Permissions">
              <PermissionRow
                label="Creator is Admin"
                description="Group creator has admin privileges"
                enabled={permissions.allowCreatorAdmin}
              />
              <PermissionRow
                label="Allow Others as Admins"
                description="Members can be promoted to admin"
                enabled={permissions.allowOthersAdmin}
              />
              <PermissionRow
                label="Members Can Add Users"
                description="Any member can invite new people"
                enabled={permissions.allowMembersAdd}
              />
            </Section>

            {/* ================= FEATURES ================= */}
            <Section title="Group Features">
              <FeatureRow
                icon={Image}
                label="Media Sharing"
                description="Send photos and videos"
                enabled={features.media}
                color="blue"
              />
              <FeatureRow
                icon={Image}
                label="Gallery View"
                description="View all shared media"
                enabled={features.gallery}
                color="purple"
              />
              <FeatureRow
                icon={FileText}
                label="Document Sharing"
                description="Share files and documents"
                enabled={features.docs}
                color="green"
              />
              <FeatureRow
                icon={FileText}
                label="Polls"
                description="Create and vote on polls"
                enabled={features.polls}
                color="orange"
              />
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
  {!isCreator && (
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
  )}
</Section>
          </div>

          {/* Forward message modal used to forward invite text to other chats */}
          <ForwardMessageModal
            isOpen={forwardOpen}
            onClose={() => setForwardOpen(false)}
            onForward={async (selectedChats, payload) => {
              if (!selectedChats || selectedChats.length === 0) return toast.error('Select at least one chat');
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
                toast.success('Forward sent');
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
                toast.error('Failed to forward message');
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

const PermissionRow = ({ label, description, enabled }) => {
  const themeModeLocal = (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) ? 'dark' : 'light';
  const bg = themeModeLocal === 'dark' ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white hover:bg-gray-50 border border-gray-200';
  const titleClass = themeModeLocal === 'dark' ? 'text-white' : 'text-gray-900';
  const descClass = themeModeLocal === 'dark' ? 'text-gray-400' : 'text-gray-600';
  return (
    <div className={`flex justify-between items-center ${bg} rounded-xl p-4 transition`}>
      <div className="flex-1">
        <span className={`${titleClass} text-sm font-medium block`}>{label}</span>
        {description && (
          <span className={`${descClass} text-xs mt-1 block`}>{description}</span>
        )}
      </div>
      <StatusBadge enabled={enabled} />
    </div>
  );
};

const FeatureRow = ({ icon: Icon, label, description, enabled, color }) => {
  const themeModeLocal = (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) ? 'dark' : 'light';
  const bg = themeModeLocal === 'dark' ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white hover:bg-gray-50 border border-gray-200';
  const titleClass = themeModeLocal === 'dark' ? 'text-white' : 'text-gray-900';
  const descClass = themeModeLocal === 'dark' ? 'text-gray-400' : 'text-gray-600';
  return (
    <div className={`flex items-center justify-between ${bg} rounded-xl p-4 transition`}>
      <div className="flex items-center gap-3 flex-1">
        <div className={`w-10 h-10 rounded-lg bg-${color}-500/10 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        <div>
          <span className={`${titleClass} text-sm font-medium block`}>{label}</span>
          {description && (
            <span className={`${descClass} text-xs mt-1 block`}>{description}</span>
          )}
        </div>
      </div>
      <StatusBadge enabled={enabled} />
    </div>
  );
};

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