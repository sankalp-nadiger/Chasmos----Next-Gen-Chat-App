/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShieldCheck,
  Image,
  FileText,
  Link as LinkIcon,
  LogOut,
  Trash,
} from "lucide-react";
import Logo from "./Logo";
import CosmosBackground from "./CosmosBg";

const TabButton = ({ active, icon: Icon, label, onClick, color, effectiveTheme }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex flex-col items-center py-2 rounded-lg transition ${
      active 
        ? effectiveTheme?.mode === 'dark'
          ? `bg-gray-800 text-${color}-400` 
          : `bg-gray-200 text-${color}-600`
        : effectiveTheme?.mode === 'dark'
          ? "bg-gray-900 text-gray-400"
          : "bg-gray-100 text-gray-600"
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="text-xs mt-1">{label}</span>
  </button>
);

const GroupInfoModal = ({
  open,
  group,
  currentUserId,
  onClose,
  onUpdateGroup,
  onDeleteGroup,
  effectiveTheme,
}) => {
  const [activeTab, setActiveTab] = useState("media");

  if (!group) return null;

  // Map Chat model structure to component expected structure
  // Use participants for full user objects, fall back to users if needed
  const participants = group.participants || [];
  const users = group.users || [];
  const admins = group.admins || [];
  const groupAdmin = group.groupAdmin;
  const groupSettings = group.groupSettings || {};
  const chatName = group.chatName || group.name || "Group";
  const avatar = groupSettings.avatar || group.avatar;
  const description = groupSettings.description || group.description || "";
  const inviteLink = groupSettings.inviteLink || group.inviteLink || "";

  // Normalize current user ID for comparison
  const normalizedCurrentUserId = String(currentUserId);

  // Check if current user is admin or group admin
  const isGroupAdmin = groupAdmin && String(groupAdmin._id || groupAdmin) === normalizedCurrentUserId;
  const isAdmin = admins?.some(a => String(a._id || a) === normalizedCurrentUserId) || isGroupAdmin;

  // Format members from participants array (has full user objects), or fall back to users
  const members = (participants.length > 0 ? participants : users)
    .filter(user => user !== null && user !== undefined) // Filter out null/undefined values
    .map(user => ({
      id: String(user._id || user.id),
      name: user.name || "Unknown",
      avatar: user.avatar || "",
      isAdmin: admins?.some(a => String(a._id || a) === String(user._id || user.id)),
      isCreator: groupAdmin && String(groupAdmin._id || groupAdmin) === String(user._id || user.id),
    }));

  const handleRemoveMember = (memberId) => {
    // This would be handled by parent component
    onUpdateGroup?.({
      ...group,
      users: users.filter(u => String(u._id || u.id) !== memberId),
    });
  };

  const handlePromoteToggle = (memberId) => {
    // This would be handled by parent component
    const newAdmins = admins?.some(a => String(a._id || a) === memberId)
      ? admins.filter(a => String(a._id || a) !== memberId)
      : [...(admins || []), ...users.filter(u => String(u._id || u.id) === memberId)];
    
    onUpdateGroup?.({
      ...group,
      admins: newAdmins,
    });
  };

  const handleCopyInvite = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch (e) {
      console.error("Failed to copy invite link", e);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-[20000] flex flex-col`}
          style={{
            backgroundColor: effectiveTheme?.mode === 'dark' ? '#121212' : '#f5f5f5',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Cosmos Background */}
          <div className="absolute inset-0 overflow-hidden">
            <CosmosBackground effectiveTheme={effectiveTheme} />
          </div>

          {/* Content wrapper - relative positioning */}
          <div className="relative z-10 flex flex-col h-full">
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${
              effectiveTheme?.mode === 'dark' 
                ? 'border-gray-700 bg-gray-900/80 backdrop-blur' 
                : 'border-gray-300 bg-white/80 backdrop-blur'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden ${
                  effectiveTheme?.mode === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                }`}>
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={chatName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Logo size="sm" showText={false} textClassName="text-white" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className={`font-semibold text-lg ${
                    effectiveTheme?.mode === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {chatName}
                  </span>
                  <span className={`text-sm truncate max-w-[60vw] ${
                    effectiveTheme?.mode === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {description}
                  </span>
                  <span className={`text-xs mt-1 ${
                    effectiveTheme?.mode === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    {members.length} members
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className={`p-2 rounded transition ${
                  effectiveTheme?.mode === 'dark' 
                    ? 'hover:bg-gray-700 text-white' 
                    : 'hover:bg-gray-300 text-gray-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className={`flex-1 overflow-y-auto p-5 space-y-6`}>

              {/* Members */}
              <section>
                <h4 className={`font-semibold mb-3 ${
                  effectiveTheme?.mode === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Members ({members.length})
                </h4>
                <div className="space-y-2">
                  {members && members.length > 0 ? (
                    members.map((member) => {
                      const me = member.id === normalizedCurrentUserId;
                      return (
                        <div
                          key={member.id}
                          className={`flex items-center justify-between rounded-xl px-4 py-3 transition ${
                            effectiveTheme?.mode === 'dark' 
                              ? 'bg-gray-900/60 hover:bg-gray-800/60 backdrop-blur' 
                              : 'bg-white/60 hover:bg-gray-100/60 backdrop-blur border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white flex items-center justify-center font-semibold">
                              {(member.name || "?").charAt(0).toUpperCase()}
                            </div>

                            <div className="flex flex-col">
                              <div className={`flex items-center gap-2 ${
                                effectiveTheme?.mode === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                                <span className="font-medium">{member.name}</span>
                                {member.isCreator && (
                                  <span className={`px-2 py-0.5 text-xs rounded ${
                                    effectiveTheme?.mode === 'dark' 
                                      ? 'bg-gray-700 text-gray-200' 
                                      : 'bg-gray-300 text-gray-700'
                                  }`}>
                                    Creator
                                  </span>
                                )}
                                {member.isAdmin && !member.isCreator && (
                                  <span className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded ${
                                    effectiveTheme?.mode === 'dark' 
                                      ? 'bg-yellow-700 text-yellow-200' 
                                      : 'bg-yellow-200 text-yellow-800'
                                  }`}>
                                    <ShieldCheck className="w-3 h-3" />
                                    Admin
                                  </span>
                                )}
                                {me && (
                                  <span className={`text-xs ${
                                    effectiveTheme?.mode === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {(isAdmin || isGroupAdmin) && !member.isCreator && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handlePromoteToggle(member.id)}
                                className={`px-3 py-1 text-xs rounded transition ${
                                  effectiveTheme?.mode === 'dark' 
                                    ? 'bg-gray-800 text-blue-400 hover:bg-gray-700' 
                                    : 'bg-gray-200 text-blue-600 hover:bg-gray-300'
                                }`}
                              >
                                {member.isAdmin ? "Demote" : "Make Admin"}
                              </button>

                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className={`px-3 py-1 text-xs rounded transition ${
                                  effectiveTheme?.mode === 'dark' 
                                    ? 'bg-gray-800 text-red-500 hover:bg-gray-700' 
                                    : 'bg-gray-200 text-red-600 hover:bg-gray-300'
                                }`}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className={`text-sm ${
                      effectiveTheme?.mode === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      No members to display
                    </p>
                  )}
                </div>
              </section>

              {/* Invite Link */}
              <section>
                <h4 className={`font-semibold mb-3 ${
                  effectiveTheme?.mode === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Invite via Link
                </h4>
                <div className={`p-4 rounded-xl flex justify-between items-center ${
                  effectiveTheme?.mode === 'dark' 
                    ? 'bg-gray-900/60 backdrop-blur' 
                    : 'bg-white/60 backdrop-blur border border-gray-200'
                }`}>
                  <span className={`text-sm truncate ${
                    effectiveTheme?.mode === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {inviteLink || "No invite link"}
                  </span>
                  <button
                    onClick={handleCopyInvite}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                  >
                    Copy
                  </button>
                </div>
              </section>

              {/* Tabs */}
              <section>
                <div className="flex gap-3 mb-4">
                  <TabButton
                    active={activeTab === "media"}
                    icon={Image}
                    label="Media"
                    color="blue"
                    onClick={() => setActiveTab("media")}
                    effectiveTheme={effectiveTheme}
                  />
                  <TabButton
                    active={activeTab === "docs"}
                    icon={FileText}
                    label="Docs"
                    color="green"
                    onClick={() => setActiveTab("docs")}
                    effectiveTheme={effectiveTheme}
                  />
                  <TabButton
                    active={activeTab === "links"}
                    icon={LinkIcon}
                    label="Links"
                    color="purple"
                    onClick={() => setActiveTab("links")}
                    effectiveTheme={effectiveTheme}
                  />
                </div>

                <div className={`rounded-xl p-4 max-h-72 overflow-y-auto ${
                  effectiveTheme?.mode === 'dark' 
                    ? 'bg-gray-900/60 backdrop-blur' 
                    : 'bg-white/60 backdrop-blur border border-gray-200'
                }`}>
                  {activeTab === "media" && (
                    <p className={`text-sm ${
                      effectiveTheme?.mode === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>No media shared</p>
                  )}

                  {activeTab === "docs" && (
                    <p className={`text-sm ${
                      effectiveTheme?.mode === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>No documents shared</p>
                  )}

                  {activeTab === "links" && (
                    <p className={`text-sm ${
                      effectiveTheme?.mode === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>No links shared</p>
                  )}
                </div>
              </section>

              {/* Actions */}
              <section className="space-y-3 mt-6">
                {!members.some(m => m.isCreator && m.id === normalizedCurrentUserId) && (
                  <button className={`w-full flex items-center gap-3 py-3 rounded-xl px-4 transition ${
                    effectiveTheme?.mode === 'dark' 
                      ? 'bg-gray-900/60 text-red-500 hover:bg-gray-800/60' 
                      : 'bg-white/60 text-red-600 hover:bg-gray-100/60 border border-gray-200'
                  }`}>
                    <LogOut className="w-5 h-5" /> Leave group
                  </button>
                )}

                {members.some(m => m.isCreator && m.id === normalizedCurrentUserId) && (
                  <button
                    onClick={() => onDeleteGroup?.(group.id || group._id)}
                    className="w-full flex items-center gap-3 bg-red-600 text-white py-3 rounded-xl px-4 hover:bg-red-700 transition"
                  >
                    <Trash className="w-5 h-5" /> Delete group
                  </button>
                )}
              </section>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GroupInfoModal;
