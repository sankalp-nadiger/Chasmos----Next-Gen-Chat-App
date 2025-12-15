// GroupInfoModalWhatsApp.jsx (Simplified)
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

const GroupInfoModal = ({
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
      members: group.members.filter((m) => m.id !== memberId),
    });
  };

  const handlePromoteToggle = (memberId) => {
    onUpdateGroup?.({
      ...group,
      members: group.members.map((m) =>
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
                {group.members?.map((member) => {
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

            {/* Invite Link */}
            <section>
              <h4 className="text-white font-semibold mb-3">Invite via Link</h4>
              <div className="bg-gray-900 p-4 rounded-xl flex justify-between items-center">
                <span className="text-gray-300 text-sm truncate">
                  {group.settings?.inviteLink || "No invite link"}
                </span>
                <button
                  onClick={handleCopyInvite}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded"
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
                  label={`Media (${group.media?.length || 0})`}
                  color="blue"
                  onClick={() => setActiveTab("media")}
                />
                <TabButton
                  active={activeTab === "docs"}
                  icon={FileText}
                  label={`Docs (${group.docs?.length || 0})`}
                  color="green"
                  onClick={() => setActiveTab("docs")}
                />
                <TabButton
                  active={activeTab === "links"}
                  icon={LinkIcon}
                  label={`Links (${group.links?.length || 0})`}
                  color="purple"
                  onClick={() => setActiveTab("links")}
                />
              </div>

              <div className="bg-gray-900 rounded-xl p-4 max-h-72 overflow-y-auto">
                {activeTab === "media" &&
                  (group.media?.length ? (
                    <div className="grid grid-cols-3 gap-2">
                      {group.media.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No media shared</p>
                  ))}

                {activeTab === "docs" &&
                  (group.docs?.length ? (
                    <ul className="space-y-2">
                      {group.docs.map((doc, idx) => (
                        <li key={idx} className="text-gray-300 text-sm truncate">
                          {doc.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-sm">No documents shared</p>
                  ))}

                {activeTab === "links" &&
                  (group.links?.length ? (
                    <ul className="space-y-2">
                      {group.links.map((link, idx) => (
                        <li
                          key={idx}
                          className="text-blue-400 text-sm truncate underline"
                        >
                          <a href={link} target="_blank">
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-sm">No links shared</p>
                  ))}
              </div>
            </section>

            {/* Actions */}
            <section className="space-y-3 mt-6">
              {!isCreator && (
                <button className="w-full flex items-center gap-3 bg-gray-900 text-red-500 py-3 rounded-xl px-4 hover:bg-gray-800 transition">
                  <LogOut className="w-5 h-5" /> Leave group
                </button>
              )}

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

export default GroupInfoModal;
