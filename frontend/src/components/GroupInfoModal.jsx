// GroupInfoModalWhatsApp.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Image,
  FileText,
  Link as LinkIcon,
  LogOut,
  Trash,
} from "lucide-react";
import CosmosBackground from "./CosmosBg";

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

  if (!group) return null;

  console.log("📊 GroupInfoModal received group data:", {
    inviteEnabled: group.inviteEnabled,
    inviteLink: group.inviteLink,
    permissions: group.permissions,
    features: group.features
  });

  const members = group.members || group.participants || [];
  const settings = group.settings || {};
  
  // ✅ Use actual values from group with proper fallbacks
  const permissions = {
    allowCreatorAdmin: group.permissions?.allowCreatorAdmin !== false,
    allowOthersAdmin: group.permissions?.allowOthersAdmin === true,
    allowMembersAdd: group.permissions?.allowMembersAdd !== false,
  };
  
  const features = {
    media: group.features?.media !== false,
    gallery: group.features?.gallery !== false,
    docs: group.features?.docs !== false,
    polls: group.features?.polls !== false,
  };

  // ✅ Determine creator ID
  const creatorId = group.admin?._id?.toString() || group.admin?.toString() || group.groupAdmin?._id?.toString() || group.groupAdmin?.toString();

  const isCreator = currentUserId?.toString() === creatorId;

  const isAdmin = isCreator || group.admins?.some(admin => {
    const adminId = admin._id?.toString() || admin.toString();
    return adminId === currentUserId?.toString();
  });

  const handleRemoveMember = (memberId) => {
    onUpdateGroup?.({
      ...group,
      members: members.filter((m) => m.id !== memberId && m._id !== memberId),
    });
  };

  const handlePromoteToggle = (memberId) => {
    onUpdateGroup?.({
      ...group,
      members: members.map((m) =>
        (m.id === memberId || m._id === memberId) ? { ...m, isAdmin: !m.isAdmin } : m
      ),
    });
  };

  const handleCopyInvite = async () => {
    const link = group.inviteLink || settings.inviteLink || "";
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      alert("Invite link copied!");
    } catch (e) {
      console.error("Failed to copy invite link", e);
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

  const mediaContent = group.media || [];
  const docsContent = group.docs || [];
  const linksContent = group.links || [];

  // Derive a reliable display name for the group/chat across different API shapes
  const displayName = (
    group?.name ||
    group?.chatName ||
    group?.groupName ||
    group?.groupSettings?.name ||
    group?.groupSettings?.chatName ||
    (group?.chat && (group.chat.chatName || group.chat.name)) ||
    "Group"
  );

  const handleLeaveGroup = async () => {
  if (!confirm('Are you sure you want to leave this group?')) return;
  
  try {
    console.log('Leaving group with ID:', group?._id);

    const response = await fetch('/api/group/exit-group', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on how you store auth token
      },
      body: JSON.stringify({ groupId: group._id }) // or whatever the group ID variable is
      
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to leave group');
    }

    // Success - redirect or update UI
    alert('Successfully left the group');
    // Redirect to groups list or home
    window.location.href = '/groups'; // or use your router's navigation
    
  } catch (error) {
    console.error('Failed to leave group:', error);
    alert(error.message || 'Failed to leave group. Please try again.');
  }
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
                  const avatarSrc = group?.avatar || group?.icon || group?.groupSettings?.avatar || group?.groupSettings?.icon || group?.groupSettings?.avatarUrl || "";
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
              </div>
            </div>

            {/* Center: group name (centered between avatar and close button) */}
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center z-20 pointer-events-none">
              <h2 className={`${styles.titleText} font-semibold text-lg`}>{group.name}</h2>
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
            {group.description && (
              <Section title="About">
                <div className={`${styles.sectionBg} rounded-xl p-4`}>
                  <p className={`${styles.subText} text-sm`}>{group.description}</p>
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
                const isMemberAdmin = group.admins?.some(admin => {
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
                      {group.inviteEnabled ? "Members can join using the invite link" : "Invite link is currently disabled"}
                    </span>
                  </div>
                  <StatusBadge enabled={group.inviteEnabled} />
                </div>

                {group.inviteEnabled && (
                  <button
                    onClick={handleCopyInvite}
                    className="w-full mt-2 text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    Copy Invite Link
                  </button>
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

              <div className={`${styles.sectionBg} rounded-xl p-4 min-h-[200px]`}>
                {activeTab === "media" && (
                  <div className="grid grid-cols-3 gap-2">
                    {mediaContent.length > 0 ? (
                      mediaContent.map((item, i) => (
                        <div key={i} className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm col-span-3 text-center py-8">No media shared yet</p>
                    )}
                  </div>
                )}

                {activeTab === "docs" && (
                  <div className="space-y-2">
                    {docsContent.length > 0 ? (
                      docsContent.map((doc, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition">
                          <FileText className="w-5 h-5 text-blue-400" />
                          <span className={`${styles.titleText} text-sm`}>{doc.name}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm text-center py-8">No documents shared yet</p>
                    )}
                  </div>
                )}

                {activeTab === "links" && (
                  <div className="space-y-2">
                    {linksContent.length > 0 ? (
                      linksContent.map((link, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition">
                          <LinkIcon className="w-5 h-5 text-purple-400" />
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline">
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
    <ActionButton 
      icon={LogOut} 
      label="Leave group" 
      color="red"
      onClick={handleLeaveGroup}
    />
  )}
</Section>
          </div>
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