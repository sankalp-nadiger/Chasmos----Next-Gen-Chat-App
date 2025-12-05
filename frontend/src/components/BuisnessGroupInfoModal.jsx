// BuisnessGroupInfoModal.jsx
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

const Card = ({ children, className = "" }) => (
  <motion.div
    whileHover={{ y: 0 }}
    className={`bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-sm ${className}`}
  >
    {children}
  </motion.div>
);

const TabButton = ({ active, icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-lg transition ${
      active ? "bg-gray-700 text-white" : "text-gray-400 hover:bg-gray-700"
    }`}
  >
    <Icon className="w-4 h-4 mr-1" /> {label}
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
  <div className="flex justify-between items-center bg-gray-700 rounded-xl p-3 hover:bg-gray-600 transition">
    <span className="text-white font-medium">{label}</span>
    <ToggleButton on={value} onClick={onToggle} />
  </div>
);

const BuisnessGroupInfoModal = ({
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
    await navigator.clipboard.writeText(link);
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

  // Define all possible features to maintain order
  const coreFeatures = [
    "TaskManagement",
    "SprintManagement",
    "MeetsCalendar",
    "CollaborativeDocs",
    "TaskBasedThreads",
    "MentionNotifications",
  ];

  const optionalAddOns = [
    "BusinessDirectory",
    "OrganizationProfile",
    "AIAssistance",
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[20000] bg-black/70 flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Full-page Modal */}
          <motion.div
            className="relative flex-1 overflow-y-auto p-6 bg-gray-900"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center overflow-hidden">
                  {group.avatar ? (
                    <img
                      src={group.avatar}
                      alt={group.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Logo
                      size="sm"
                      showText={false}
                      textClassName="text-white"
                    />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-semibold text-2xl">
                    {group.name}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {group.description}
                  </span>
                  <span className="text-gray-500 text-xs mt-1">
                    {group.members.length} members
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded hover:bg-gray-700 transition"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Members */}
            <Card>
              <h4 className="text-white font-semibold mb-3 text-lg">Members</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {group.members.map((member) => {
                  const me = member.id === currentUserId;
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                          {(member.name || "?")[0]}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 text-white">
                            <span className="font-medium">{member.name}</span>
                            {member.isCreator && (
                              <span className="px-2 py-0.5 bg-gray-700 text-xs rounded">
                                Creator
                              </span>
                            )}
                            {member.isAdmin && !member.isCreator && (
                              <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-yellow-700 text-yellow-200 rounded">
                                <ShieldCheck className="w-3 h-3" /> Admin
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
                            className="px-2 py-1 text-xs bg-gray-700 text-blue-400 rounded hover:bg-gray-600 transition"
                          >
                            {member.isAdmin ? "Demote" : "Admin"}
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="px-2 py-1 text-xs bg-gray-700 text-red-500 rounded hover:bg-gray-600 transition"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Settings */}
            <Card className="mt-4">
              <h4 className="text-white font-semibold mb-3 text-lg">
                Settings
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">
                    Members can add
                  </span>
                  <ToggleButton
                    on={group.settings?.allowMembersAdd}
                    onClick={() =>
                      onUpdateGroup?.({
                        ...group,
                        settings: {
                          ...(group.settings || {}),
                          allowMembersAdd: !group.settings?.allowMembersAdd,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">Invite link</span>
                  <button
                    onClick={handleCopyInvite}
                    disabled={!group.settings?.inviteEnabled}
                    className={`px-3 py-1 text-xs rounded ${
                      group.settings?.inviteEnabled
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </Card>

            {/* Tabs */}
            <Card className="mt-4">
              <div className="flex gap-2 mb-3">
                <TabButton
                  active={activeTab === "media"}
                  icon={Image}
                  label={`Media (${mediaContent.length})`}
                  onClick={() => setActiveTab("media")}
                />
                <TabButton
                  active={activeTab === "docs"}
                  icon={FileText}
                  label={`Docs (${docsContent.length})`}
                  onClick={() => setActiveTab("docs")}
                />
                <TabButton
                  active={activeTab === "links"}
                  icon={LinkIcon}
                  label={`Links (${linksContent.length})`}
                  onClick={() => setActiveTab("links")}
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {activeTab === "media" &&
                  (mediaContent.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {mediaContent.map((m, i) => (
                        <img
                          key={i}
                          src={m}
                          alt={`media-${i}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No media shared</p>
                  ))}
                {activeTab === "docs" &&
                  (docsContent.length > 0 ? (
                    <ul className="space-y-1">
                      {docsContent.map((d, i) => (
                        <li key={i} className="text-gray-300 text-sm truncate">
                          {d.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-sm">No docs shared</p>
                  ))}
                {activeTab === "links" &&
                  (linksContent.length > 0 ? (
                    <ul className="space-y-1">
                      {linksContent.map((l, i) => (
                        <li
                          key={i}
                          className="text-blue-400 text-sm truncate underline"
                        >
                          <a href={l} target="_blank" rel="noreferrer">
                            {l}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-sm">No links shared</p>
                  ))}
              </div>
            </Card>

            {/* Business Features */}
            {group.type?.toLowerCase() === "business" && (
              <Card className="mt-4">
                <h4 className="text-white font-semibold mb-3 text-lg">
                  Business Features
                </h4>

                <div className="space-y-4">
                  {/* CORE FEATURES */}
                  {/* CORE FEATURES */}
                  <div>
                    <h5 className="text-white font-semibold mb-2">
                      Core Features
                    </h5>
                    <div className="space-y-2">
                      {coreFeatures.map((key) => (
                        <BusinessToggle
                          key={key}
                          label={key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                          value={businessSettings[key] ?? false} // use false if undefined
                          onToggle={() => updateBusinessSetting(key)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* OPTIONAL ADD-ONS */}
                  <div>
                    <h5 className="text-white font-semibold mb-2">
                      Optional Add-ons
                    </h5>
                    <div className="space-y-2">
                      {optionalAddOns.map((key) => {
                        if (key in businessSettings) {
                          return (
                            <BusinessToggle
                              key={key}
                              label={key
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (str) => str.toUpperCase())}
                              value={businessSettings[key]}
                              onToggle={() => updateBusinessSetting(key)}
                            />
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Danger Zone */}
            <Card className="mt-4 bg-gray-800">
              <div className="space-y-2">
                {!isCreator && (
                  <button className="w-full flex items-center gap-2 bg-gray-700 text-red-500 px-4 py-2 rounded hover:bg-gray-600 transition">
                    <LogOut className="w-4 h-4" /> Leave group
                  </button>
                )}
                {isCreator && (
                  <button
                    onClick={() => onDeleteGroup?.(group.id)}
                    className="w-full flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                  >
                    <Trash className="w-4 h-4" /> Delete group
                  </button>
                )}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BuisnessGroupInfoModal;
