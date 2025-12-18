import CosmosBackground from "./CosmosBg";
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, X, Users, ChevronLeft } from "lucide-react";
import Logo from "./Logo";
import SelectContact from "./SelectContact";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const GroupCreation = ({ contacts: initialContacts = [], effectiveTheme, onClose, onCreateGroup }) => {
  const [step, setStep] = useState(2); // start directly at Add Members
  const [contacts, setContacts] = useState(initialContacts || []);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState(null);

  const [selectedContacts, setSelectedContacts] = useState([]);
  const [groupType, setGroupType] = useState("Casual"); // default Casual
  const [searchTerm, setSearchTerm] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState("");

  const MAX_MEMBERS = 200;

  const [inviteEnabled, setInviteEnabled] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);

  const [allowCreatorAdmin, setAllowCreatorAdmin] = useState(true);
  const [allowOthersAdmin, setAllowOthersAdmin] = useState(false);
  const [allowMembersAdd, setAllowMembersAdd] = useState(true);

  const [featureMedia, setFeatureMedia] = useState(true);
  const [featureGallery, setFeatureGallery] = useState(true);
  const [featureDocs, setFeatureDocs] = useState(true);
  const [featurePolls, setFeaturePolls] = useState(true);

  const generateInviteLink = () => {
    const token = Math.random().toString(36).slice(2, 10);
    const link = `${window.location.origin}/invite/group-${Date.now()}-${token}`;
    setInviteLink(link);
    setInviteCopied(false);
  };

  const copyInviteLink = async () => {
    if (!inviteLink) generateInviteLink();
    try {
      await navigator.clipboard.writeText(inviteLink || "");
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch (err) {
      console.error("copy failed", err);
    }
  };

  const getContactId = (contact) =>
    contact?.id || contact?._id || contact?.userId || contact?.contactId || contact?.googleId || "";

  const normalizeId = (id) => (!id ? "" : id.startsWith("google-") ? id.replace("google-", "") : id);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingContacts(true);
      try {
        const token = localStorage.getItem("token");

        const resApp = await fetch(`${API_BASE_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const appContacts = resApp.ok ? await resApp.json() : [];

        let googleContacts = [];
        const resGoogle = await fetch(`${API_BASE_URL}/api/sync/google-contacts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resGoogle.ok) {
          const jsonGoogle = await resGoogle.json();
          googleContacts = Array.isArray(jsonGoogle.data) ? jsonGoogle.data : [];
        }

        if (!cancelled) {
          setContacts([
            ...(Array.isArray(appContacts) ? appContacts : []),
            ...googleContacts.map((c) => ({
              id: `google-${c.email || c.phone}`,
              name: c.name,
              avatar: c.avatar,
              isGoogleContact: true,
            })),
          ]);
        }
      } catch (err) {
        if (!cancelled) {
          setContactsError(err.message);
          setContacts(initialContacts || []);
        }
      } finally {
        if (!cancelled) setLoadingContacts(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [initialContacts]);

  const availableContacts = useMemo(
    () => contacts.filter((c) => !c.isGroup && !c.isDocument),
    [contacts]
  );

  const filteredContacts = useMemo(() => {
    const q = (searchTerm || "").toLowerCase().trim();
    if (!q) return availableContacts;
    return availableContacts.filter((c) =>
      (c.name || c.username || "").toLowerCase().includes(q)
    );
  }, [availableContacts, searchTerm]);

  const handleContactToggle = (rawId) => {
    const id = normalizeId(rawId);

    setSelectedContacts((prev) => {
      const exists = prev.some((p) => normalizeId(p) === id);

      if (exists) {
        return prev.filter((p) => normalizeId(p) !== id);
      }

      if (prev.length >= MAX_MEMBERS) return prev;

      return [...prev, rawId];
    });
  };

  const removeSelected = (rawId) => {
    const id = normalizeId(rawId);
    setSelectedContacts((prev) => prev.filter((p) => normalizeId(p) !== id));
  };

  const isSelected = (c) => {
    const cid = normalizeId(getContactId(c));
    return selectedContacts.some((p) => normalizeId(p) === cid);
  };

  const handleIconChange = (file) => {
    if (!file) {
      setIconFile(null);
      setIconPreview("");
      return;
    }
    setIconFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setIconPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const goNextFromContacts = () => {
    if (selectedContacts.length === 0) return;
    setStep(3);
  };

  const goBack = () => {
    if (step === 2) return onClose?.();
    if (step === 3) return setStep(2);
  };

const handleCreateGroup = async () => {
  if (!groupName.trim()) return;

  const memberIds = selectedContacts.map((id) => normalizeId(id));
  const currentUserId = localStorage.getItem("userId");

  if (!memberIds.includes(currentUserId)) {
    memberIds.push(currentUserId);
  }

  // ✅ Convert image file to Base64 (if exists)
  let avatarBase64 = "";
  if (iconFile) {
    avatarBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(iconFile);
    });
  }

  // ✅ PURE JSON PAYLOAD
  const payload = {
    name: groupName.trim(),
    users: memberIds,              // ✅ ARRAY (IMPORTANT)
    description: groupDescription.trim() || "",
    isPublic: true,
    avatarBase64,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/chat/group`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      console.error("❌ Failed to create group:", json);
      alert("Group creation failed: " + (json.message || "Unknown error"));
    } else {
      console.log("✅ Group created", json);
      onCreateGroup?.(json);
      onClose?.();
    }
  } catch (e) {
    console.error("❌ Error creating group:", e);
    alert("Error creating group");
  }
};


  // BUSINESS CORE FEATURES (default true)
  const [coreTask, setCoreTask] = useState(true);
  const [coreSprint, setCoreSprint] = useState(true);
  const [coreMeets, setCoreMeets] = useState(true);
  const [coreDocs, setCoreDocs] = useState(true);
  const [coreThreads, setCoreThreads] = useState(true);
  const [coreMentions, setCoreMentions] = useState(true);

  // BUSINESS OPTIONAL ADD-ONS (default false)
  const [optDirectory, setOptDirectory] = useState(false);
  const [optOrgProfile, setOptOrgProfile] = useState(false);
  const [optAI, setOptAI] = useState(false);

  const PermissionItem = ({ title, desc, value, onChange }) => (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs opacity-70">{desc}</div>
      </div>

      <label className="relative w-12 h-6 cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="peer hidden"
        />
        <div className="absolute inset-0 bg-gray-400 rounded-full peer-checked:bg-blue-600 transition"></div>
        <div className="absolute w-5 h-5 bg-white rounded-full top-0.5 left-0.5 peer-checked:translate-x-6 transition"></div>
      </label>
    </div>
  );

  const FeatureToggle = ({ label, desc, value, setValue }) => (
    <div className="flex items-center justify-between p-3 rounded-xl shadow-sm bg-white/5 backdrop-blur border border-white/10">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-xs opacity-70">{desc}</div>
      </div>

      <label className="relative w-10 h-5 cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => setValue(e.target.checked)}
          className="peer hidden"
        />
        <div className="absolute inset-0 bg-gray-400 rounded-full peer-checked:bg-blue-600 transition"></div>
        <div className="absolute w-4 h-4 bg-white rounded-full top-0.5 left-0.5 peer-checked:translate-x-5 transition"></div>
      </label>
    </div>
  );

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.25 }}
      className={`fixed inset-0 ${effectiveTheme.primary} flex flex-col h-screen w-screen z-[99999]`}
      style={{ position: 'fixed', inset: 0, minHeight: '100vh', minWidth: '100vw', overflow: 'hidden' }}
    >
      {/* Solid white background in day/light mode */}
      {(!effectiveTheme.mode || effectiveTheme.mode === 'light') && (
        <div style={{ position: 'absolute', inset: 0, background: '#ffffff', zIndex: 0 }} />
      )}
      {/* Cosmos Background */}
      <div className="absolute inset-0 overflow-hidden z-[2]">
        <CosmosBackground effectiveTheme={effectiveTheme} />
      </div>

      {/* Content wrapper - relative positioning */}
      <div className="relative z-10 flex flex-col h-full">
        {/* HEADER */}
        <div className={`${effectiveTheme.secondary} border-b ${effectiveTheme.border} p-4`}>
          <div className="flex items-center justify-between gap-6 relative">
            <button 
              onClick={onClose} 
              title="Close"
              className={`p-2 rounded-full hover:bg-red-500 transition-colors`}
            >
              <X className={`w-5 h-5 ${effectiveTheme.text}`} />
            </button>

            <div className="flex items-center gap-3">
              <Logo size="sm" textClassName={effectiveTheme.text} />
            </div>

            <h2 className={`absolute left-1/2 -translate-x-1/2 text-lg font-semibold ${effectiveTheme.text}`}>
              {step === 2 ? "Add Members" : "Group Details"}
            </h2>

            <button 
              onClick={goBack} 
              title={step === 2 ? "Close" : "Go Back"}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-auto`}
            >
              <ChevronLeft className={`w-5 h-5 ${effectiveTheme.text}`} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto">
          {/* STEP 2 */}
          {step === 2 && (
          <>
            <div className="p-4">
              <div className={`relative ${effectiveTheme.searchBg} rounded-lg border ${effectiveTheme.border}`}>
                <Search className={`absolute left-3 top-3 w-4 h-4 ${effectiveTheme.textSecondary}`} />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-transparent ${effectiveTheme.text} rounded-lg ${effectiveTheme.mode === 'dark' ? 'placeholder-gray-500' : 'placeholder-gray-400'}`}
                />
              </div>
              {loadingContacts && <p className={`mt-2 text-sm ${effectiveTheme.textSecondary}`}>Loading contacts...</p>}
              {contactsError && <p className={`mt-2 text-sm ${effectiveTheme.mode === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Failed to load contacts: {contactsError}</p>}
            </div>

            {selectedContacts.length > 0 && (
              <div className="px-4 flex flex-wrap gap-2 mb-2">
                {selectedContacts
                  .map((id) => contacts.find((c) => normalizeId(getContactId(c)) === normalizeId(id)))
                  .filter(Boolean)
                  .map((c) => (
                    <div
                      key={`pill-${getContactId(c)}`}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-600 ${effectiveTheme.textOnPrimary || 'text-white'}`}
                    >
                      <span className={`w-6 h-6 rounded-full bg-blue-800 flex items-center justify-center text-xs font-bold ${effectiveTheme.textOnPrimary || 'text-white'}`}>
                        {(c.name || c.username || "?")[0]}
                      </span>
                      <span className={`text-sm ${effectiveTheme.textOnPrimary || 'text-white'}`}>{c.name || c.username}</span>
                      {c.isGoogleContact && (
                        <span className="ml-1 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          Google
                        </span>
                      )}
                      <button
                        onClick={() => removeSelected(getContactId(c))}
                        className="ml-2 text-xs bg-red-500 px-2 py-0.5 rounded"
                      >
                        x
                      </button>
                    </div>
                  ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-4 space-y-2">
              {filteredContacts.length === 0 ? (
                <p className={`text-center mt-10 ${effectiveTheme.text} opacity-70`}>No contacts found</p>
              ) : (
                filteredContacts.map((c) => {
                  const cid = getContactId(c);
                  return (
                    <div key={cid} className={`rounded-lg ${isSelected(c) ? "bg-blue-50" : ""}`}>
                      <SelectContact
                        contact={{ ...c, id: cid }}
                        selected={isSelected(c)}
                        onSelect={handleContactToggle}
                        effectiveTheme={effectiveTheme}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* STEP 3 */}
         {step === 3 && (
  <div className="p-4 space-y-8 animate-fadeIn">

    {/* GROUP PHOTO */}
    <div className="flex items-center gap-5 p-4 rounded-2xl shadow-md bg-white/5 backdrop-blur border border-white/10">
      
      {/* ICON */}
      <div className={`w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center shadow-md ${effectiveTheme.secondary}`}>
        {iconPreview ? (
          <img src={iconPreview} className="w-full h-full object-cover" />
        ) : (
          <Logo size="lg" showText={false} textClassName={effectiveTheme.text} />
        )}
      </div>

      {/* CONTROLS */}
      <div className="flex-1 space-y-2">
        <h3 className={`text-lg font-semibold ${effectiveTheme.text}`}>Group Photo</h3>
        <p className={`text-sm opacity-70 ${effectiveTheme.text}`}>Upload a group display photo</p>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer">
            <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow hover:scale-[1.03] transition">
              Upload Photo
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleIconChange(e.target.files?.[0])}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              setIconFile(null);
              setIconPreview("");
            }}
            className="px-4 py-2 rounded-lg bg-red-600 text-white shadow hover:bg-red-700 transition"
          >
            Remove
          </button>
        </div>
      </div>
    </div>

    {/* GROUP NAME */}
    <div className="space-y-1">
      <label className={`text-sm font-medium ${effectiveTheme.text}`}>Group Name</label>
      <input
        type="text"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        placeholder="Enter group name"
        className={`w-full px-4 py-3 rounded-xl border ${effectiveTheme.border} ${effectiveTheme.inputBg} ${effectiveTheme.text} shadow-sm ${effectiveTheme.mode === 'dark' ? 'placeholder-gray-500' : 'placeholder-gray-400'}`}
      />
    </div>

    {/* DESCRIPTION */}
    <div className="space-y-1">
      <label className={`text-sm font-medium ${effectiveTheme.text}`}>Description</label>
      <textarea
        value={groupDescription}
        onChange={(e) => setGroupDescription(e.target.value)}
        placeholder="Write a short description"
        rows={3}
        className={`w-full px-4 py-3 rounded-xl border ${effectiveTheme.border} ${effectiveTheme.inputBg} ${effectiveTheme.text} shadow-sm ${effectiveTheme.mode === 'dark' ? 'placeholder-gray-500' : 'placeholder-gray-400'}`}
      />
    </div>

    {/* INVITE LINK */}
    <div className={`p-5 rounded-2xl shadow-md border ${effectiveTheme.border} ${effectiveTheme.secondary}`}>
      
      <div className="flex items-center justify-between">
        <div>
          <h4 className={`font-semibold ${effectiveTheme.text}`}>Invite Link</h4>
          <p className={`text-sm ${effectiveTheme.textSecondary}`}>Allow joining via link</p>
        </div>

        {/* switch */}
        <label className="relative w-12 h-6 cursor-pointer">
          <input
            type="checkbox"
            checked={inviteEnabled}
            onChange={(e) => {
              const on = e.target.checked;
              setInviteEnabled(on);
              if (on && !inviteLink) generateInviteLink();
            }}
            className="hidden peer"
          />
          <div className="absolute inset-0 bg-gray-400 rounded-full peer-checked:bg-blue-600 transition"></div>
          <div className="absolute w-5 h-5 bg-white rounded-full top-0.5 left-0.5 peer-checked:translate-x-6 transition"></div>
        </label>
      </div>

      {inviteEnabled && (
        <div className="mt-4 flex gap-3">
          <input
            readOnly
            value={inviteLink || ""}
            placeholder="Invite link"
            className={`flex-1 px-4 py-2 rounded-xl border ${effectiveTheme.border} ${effectiveTheme.inputBg} ${effectiveTheme.text} ${effectiveTheme.mode === 'dark' ? 'placeholder-gray-500' : 'placeholder-gray-400'}`}
          />

          <button
            onClick={() => {
              if (!inviteLink) generateInviteLink();
              copyInviteLink();
            }}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow transition"
          >
            {inviteCopied ? "Copied" : inviteLink ? "Copy" : "Generate"}
          </button>
        </div>
      )}
    </div>

    {/* PERMISSIONS */}
    <div className={`p-5 rounded-2xl shadow-md border ${effectiveTheme.border} ${effectiveTheme.secondary}`}>
      <h4 className={`font-semibold text-lg ${effectiveTheme.text}`}>Permissions</h4>

      <div className="space-y-4 mt-3">

        {/* Creator Admin */}
        <PermissionItem
          title="You are the Admin"
          desc="Creator becomes default admin"
          value={allowCreatorAdmin}
          onChange={(v) => setAllowCreatorAdmin(v)}
        />

        {/* Others Admin */}
        <PermissionItem
          title="Allow others to be admins"
          desc="Members can be promoted"
          value={allowOthersAdmin}
          onChange={(v) => setAllowOthersAdmin(v)}
        />

        {/* Members Add */}
        <PermissionItem
          title="Allow members to add users"
          desc="Members can invite or add people"
          value={allowMembersAdd}
          onChange={(v) => setAllowMembersAdd(v)}
        />

      </div>
    </div>

    {/* FEATURES */}
   {/* FEATURES */}
<div className={`p-5 rounded-2xl shadow-md border ${effectiveTheme.border} ${effectiveTheme.secondary}`}>
  <h4 className={`font-semibold text-lg ${effectiveTheme.text}`}>Group Features</h4>

  {/* BUSINESS GROUP FEATURES */}
  {groupType === "Business" ? (
    <div className="space-y-6 mt-5">

      {/* CORE FEATURES */}
      <div>
        <h5 className={`text-md font-semibold mb-3 ${effectiveTheme.text}`}>Core Features</h5>

        <FeatureToggle label="Task Management" value={coreTask} setValue={setCoreTask} />
        <FeatureToggle label="Sprint Management" value={coreSprint} setValue={setCoreSprint} />
        <FeatureToggle label="Meets + Calendar" value={coreMeets} setValue={setCoreMeets} />
        <FeatureToggle label="Collaborative Docs" value={coreDocs} setValue={setCoreDocs} />
        <FeatureToggle label="Task-based Threads" value={coreThreads} setValue={setCoreThreads} />
        <FeatureToggle label="Mention Notifications" value={coreMentions} setValue={setCoreMentions} />
      </div>

      {/* OPTIONAL ADD-ONS */}
      <div>
        <h5 className={`text-md font-semibold mb-3 ${effectiveTheme.text}`}>Optional Add-ons</h5>

        <FeatureToggle label="Business Directory" value={optDirectory} setValue={setOptDirectory} />
        <FeatureToggle label="Organization Profile" value={optOrgProfile} setValue={setOptOrgProfile} />
        <FeatureToggle label="AI Assistance" value={optAI} setValue={setOptAI} />
      </div>

    </div>
  ) : (

    /* CASUAL GROUP FEATURES (existing) */
    <div className="grid grid-cols-2 gap-4 mt-4">
      <FeatureToggle label="Media" desc="Send photos/videos" value={featureMedia} setValue={setFeatureMedia} />
      <FeatureToggle label="Gallery" desc="View shared media" value={featureGallery} setValue={setFeatureGallery} />
      <FeatureToggle label="Docs" desc="Share documents" value={featureDocs} setValue={setFeatureDocs} />
      <FeatureToggle label="Polls" desc="Create polls" value={featurePolls} setValue={setFeaturePolls} />
    </div>

  )}
</div>


    {/* MEMBERS */}
    <div>
      <h3 className={`font-semibold text-lg ${effectiveTheme.text}`}>Members ({selectedContacts.length})</h3>

      <div className="space-y-3 mt-3">
        {selectedContacts
          .map((id) =>
            contacts.find((c) => normalizeId(getContactId(c)) === normalizeId(id))
          )
          .filter(Boolean)
          .map((c) => (
            <div
              key={`member-${getContactId(c)}`}
              className={`flex items-center gap-3 p-4 rounded-xl shadow border ${effectiveTheme.border} ${effectiveTheme.secondary}`}
            >
              <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold">
                {(c.name || c.username || "?")[0]}
              </div>

              <div className="flex flex-col">
                <span className={`font-medium ${effectiveTheme.text}`}>{c.name || c.username}</span>
                <span className={`text-xs ${effectiveTheme.textSecondary}`}>
                  {c.username || c.email || c.phone}
                </span>
              </div>

              <button
                onClick={() => removeSelected(getContactId(c))}
                className="ml-auto px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 transition"
              >
                Remove
              </button>
            </div>
          ))}
      </div>
    </div>

  </div>
)}
        </div>

      {/* FOOTER */}
      <div className={`p-4 border-t ${effectiveTheme.border} ${effectiveTheme.secondary} flex items-center justify-between`}>
        <span className={effectiveTheme.text}>
          {step === 2 ? `${selectedContacts.length} selected` : `${selectedContacts.length} members • ${groupType}`}
        </span>

        {step === 2 && (
          <button
            onClick={goNextFromContacts}
            disabled={selectedContacts.length === 0}
            className={`px-4 py-2 rounded-lg ${selectedContacts.length === 0 ? "bg-gray-300 text-gray-500" : "bg-blue-500 text-white hover:bg-blue-600"}`}
          >
            Next
          </button>
        )}

        {step === 3 && (
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim()}
            className={`px-4 py-2 rounded-lg ${!groupName.trim() ? "bg-gray-300 text-gray-500" : "bg-blue-600 text-white hover:bg-blue-700"}`}
          >
            Create Group
          </button>
        )}
      </div>
      </div>
    </motion.div>
  );
};

export default GroupCreation;