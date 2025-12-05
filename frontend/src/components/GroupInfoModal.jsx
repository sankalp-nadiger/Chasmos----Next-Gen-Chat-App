// GroupInfoModalWhatsApp.jsx
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

const TabButton = ({ active, icon: Icon, label, onClick, color }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex flex-col items-center py-2 rounded-lg transition ${
      active ? `bg-gray-800 text-${color}-400` : "bg-gray-900 text-gray-400"
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="text-xs mt-1">{label}</span>
  </button>
);

const ToggleButton = ({ on, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
      on ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400"
    }`}
  >
    {on ? "On" : "Off"}
  </button>
);

const BusinessToggle = ({ label, value, onToggle }) => (
  <div className="flex justify-between items-center bg-gray-900 rounded-xl p-4 hover:bg-gray-800 transition">
    <span className="text-white font-medium">{label}</span>
    <ToggleButton on={value} onClick={onToggle} />
  </div>
);

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

  const isCreator = group.members?.some(
    (m) => m.id === currentUserId && m.isCreator
  );
  const isAdmin = group.members?.some(
    (m) => m.id === currentUserId && m.isAdmin
  );

  const handleRemoveMember = (memberId) => {
    onUpdateGroup?.({
      ...group,
      members: (group.members || []).filter((m) => m.id !== memberId),
    });
  };

  const handlePromoteToggle = (memberId) => {
    onUpdateGroup?.({
      ...group,
      members: (group.members || []).map((m) =>
        m.id === memberId ? { ...m, isAdmin: !m.isAdmin } : m
      ),
    });
  };

  const handleCopyInvite = async () => {
    const link = group.settings?.inviteLink || "";
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
    } catch (e) {
      console.error("Failed to copy invite link", e);
    }
  };

  const updateBusinessSetting = (key) => {
    onUpdateGroup?.({
      ...group,
      businessSettings: {
        ...group.businessSettings,
        [key]: !group.businessSettings?.[key],
      },
    });
  };

  const mediaContent = group.media || [];
  const docsContent = group.docs || [];
  const linksContent = group.links || [];
  const businessSettings = group.businessSettings || {};

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[20000] bg-[#121212] flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-gray-800 flex items-center justify-center overflow-hidden">
                {group.avatar ? (
                  <img
                    src={group.avatar}
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Logo size="sm" showText={false} textClassName="text-white" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-white font-semibold text-lg">
                  {group.name}
                </span>
                <span className="text-gray-400 text-sm truncate max-w-[60vw]">
                  {group.description}
                </span>
                <span className="text-gray-500 text-xs mt-1">
                  {(group.members || []).length} members
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-gray-700 transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Members */}
            <section>
              <h4 className="text-white font-semibold mb-3">Members</h4>
              <div className="space-y-2">
                {(group.members || []).map((member) => {
                  const me = member.id === currentUserId;
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between bg-gray-900 rounded-xl px-4 py-3 hover:bg-gray-800 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                          {(member.name || "?").charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 text-white">
                            <span className="font-medium">{member.name}</span>
                            {member.isCreator && (
                              <span className="px-2 py-0.5 text-xs bg-gray-700 rounded">
                                Creator
                              </span>
                            )}
                            {member.isAdmin && !member.isCreator && (
                              <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-yellow-700 text-yellow-200 rounded">
                                <ShieldCheck className="w-3 h-3" />
                                Admin
                              </span>
                            )}
                            {me && (
                              <span className="text-gray-400 text-xs">You</span>
                            )}
                          </div>
                          <span className="text-gray-400 text-xs truncate">
                            {member.username || member.email || ""}
                          </span>
                        </div>
                      </div>

                      {(isAdmin || isCreator) && !member.isCreator && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePromoteToggle(member.id)}
                            className="px-3 py-1 text-xs bg-gray-800 text-blue-400 rounded hover:bg-gray-700 transition"
                          >
                            {member.isAdmin ? "Demote" : "Make Admin"}
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="px-3 py-1 text-xs bg-gray-800 text-red-500 rounded hover:bg-gray-700 transition"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Group Settings */}
            <section>
              <h4 className="text-white font-semibold mb-3">Group Settings</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-gray-900 rounded-xl p-4 hover:bg-gray-800 transition">
                  <div>
                    <span className="text-white font-medium">
                      Members can add others
                    </span>
                    <div className="text-gray-400 text-sm">
                      Allow members to add or invite people
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-xs ${
                      group.settings?.allowMembersAdd
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {group.settings?.allowMembersAdd ? "Enabled" : "Disabled"}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-gray-900 rounded-xl p-4 hover:bg-gray-800 transition">
                  <div>
                    <span className="text-white font-medium">Invite via link</span>
                    <div className="text-gray-400 text-sm">
                      Copy or share invite link
                    </div>
                  </div>
                  <button
                    disabled={!group.settings?.inviteEnabled}
                    onClick={handleCopyInvite}
                    className={`px-3 py-1 text-xs rounded ${
                      group.settings?.inviteEnabled
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Copy link
                  </button>
                </div>
              </div>
            </section>

            {/* Tabs */}
            <section>
              <div className="flex gap-3 mb-4">
                <TabButton
                  active={activeTab === "media"}
                  icon={Image}
                  label={`Media (${mediaContent.length})`}
                  color="blue"
                  onClick={() => setActiveTab("media")}
                />
                <TabButton
                  active={activeTab === "docs"}
                  icon={FileText}
                  label={`Docs (${docsContent.length})`}
                  color="green"
                  onClick={() => setActiveTab("docs")}
                />
                <TabButton
                  active={activeTab === "links"}
                  icon={LinkIcon}
                  label={`Links (${linksContent.length})`}
                  color="purple"
                  onClick={() => setActiveTab("links")}
                />
              </div>

              <div className="bg-gray-900 rounded-xl p-4 max-h-72 overflow-y-auto">
                {activeTab === "media" && (
                  mediaContent.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {mediaContent.map((item, idx) => (
                        <img
                          key={idx}
                          src={item}
                          alt="media"
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No media shared</p>
                  )
                )}

                {activeTab === "docs" && (
                  docsContent.length > 0 ? (
                    <ul className="space-y-2">
                      {docsContent.map((doc, idx) => (
                        <li key={idx} className="text-gray-300 text-sm truncate">
                          {doc.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-sm">No documents shared</p>
                  )
                )}

                {activeTab === "links" && (
                  linksContent.length > 0 ? (
                    <ul className="space-y-2">
                      {linksContent.map((link, idx) => (
                        <li key={idx} className="text-blue-400 text-sm truncate underline">
                          <a href={link} target="_blank" rel="noreferrer">{link}</a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-sm">No links shared</p>
                  )
                )}
              </div>
            </section>

            {/* Business Features */}
            {group.type?.toLowerCase() === "business" && (
              <section>
                <h4 className="text-white font-semibold mb-3">Business Features</h4>
                <div className="space-y-2">
                  {Object.keys(businessSettings).length > 0 ? (
                    Object.keys(businessSettings).map((key) => (
                      <BusinessToggle
                        key={key}
                        label={key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                        value={businessSettings[key]}
                        onToggle={() => updateBusinessSetting(key)}
                      />
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">No business features enabled</p>
                  )}
                </div>
              </section>
            )}

            {/* Actions */}
            <section className="space-y-3 mt-6">
              {!isCreator && (
                <button className="w-full flex items-center gap-3 bg-gray-900 text-red-500 py-3 rounded-xl px-4 hover:bg-gray-800 transition">
                  <LogOut className="w-5 h-5" /> Leave group
                </button>
              )}
              <button className="w-full flex items-center gap-3 bg-gray-900 text-yellow-400 py-3 rounded-xl px-4 hover:bg-gray-800 transition">
                Report group
              </button>
              {isCreator && (
                <button
                  onClick={() => onDeleteGroup?.(group.id)}
                  className="w-full flex items-center gap-3 bg-red-600 text-white py-3 rounded-xl px-4 hover:bg-red-700 transition"
                >
                  <Trash className="w-5 h-5" /> Delete group
                </button>
              )}
            </section>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GroupInfoModalWhatsApp;
