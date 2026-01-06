import CosmosBackground from "./CosmosBg";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, X, ChevronLeft } from "lucide-react";
import Logo from "./Logo";
import SelectContact from "./SelectContact";
import blockService from "../utils/blockService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const GroupCreation = ({
  contacts: initialContacts = [],
  effectiveTheme,
  onClose,
  onCreateGroup,
}) => {
  const [step, setStep] = useState(2); // start directly at Add Members
  const [contacts, setContacts] = useState(initialContacts || []);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState(null);

  const [selectedContacts, setSelectedContacts] = useState([]);
  const [unblockLoadingIds, setUnblockLoadingIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState("");

  const MAX_MEMBERS = 200;

  // Invite settings
  const [inviteEnabled, setInviteEnabled] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);

  // Permissions
  // Permissions
  // `allowCreatorAdmin` is intentionally always true (creator is admin by default).
  // Keep a variable for compatibility but do not expose it in the UI.
  const allowCreatorAdmin = true;
  const [allowOthersAdmin, setAllowOthersAdmin] = useState(false);
  const [allowMembersAdd, setAllowMembersAdd] = useState(true);

  // Features
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
    contact?.id ||
    contact?._id ||
    contact?.userId ||
    contact?.contactId ||
    contact?.googleId ||
    "";

  const normalizeId = (id) =>
    !id ? "" : id.startsWith("google-") ? id.replace("google-", "") : id;

  const normalizePhone = (p) => {
    if (!p) return "";
    const digits = String(p).replace(/\D/g, "");
    if (!digits) return "";
    return digits.length > 10 ? digits.slice(-10) : digits;
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingContacts(true);
      try {
        const token = localStorage.getItem("token");

        const resApp = await fetch(`${API_BASE_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const appRaw = resApp.ok ? await resApp.json() : [];
        const appContactsArray = Array.isArray(appRaw) ? appRaw : (appRaw.users || []);

        // Exclude users who have blocked the current user
        const appFiltered = await Promise.all(
          appContactsArray.map(async (u) => {
            try {
              const uid = String(u._id || u.id || u.userId || "");
              if (!uid) return u;
              const status = await blockService.checkBlockStatus(uid);
              // If the other user has blocked you, exclude them
              if (status && status.hasBlockedYou) return null;
              // Annotate whether current user has blocked them
              return { ...u, isBlocked: Boolean(status?.isBlocked) };
            } catch (e) {
              return u; // on error, keep the user to avoid over-filtering
            }
          })
        );
        const appContacts = appFiltered.filter(Boolean);

        let googleContacts = [];
        const resGoogle = await fetch(
          `${API_BASE_URL}/api/sync/google-contacts`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (resGoogle.ok) {
          const jsonGoogle = await resGoogle.json();
          googleContacts = Array.isArray(jsonGoogle.data)
            ? jsonGoogle.data
            : [];
        }

        if (!cancelled) {
          // Build quick lookup sets from google contacts (email and phone)
          const googleEmails = new Set();
          const googlePhones = new Set();
          (googleContacts || []).forEach((g) => {
            if (g.email) googleEmails.add(String(g.email).toLowerCase().trim());
            const gp = normalizePhone(g.phone || g.mobile || g.mobileNumber || "");
            if (gp) googlePhones.add(gp);
          });

          // Annotate registered app contacts if they match a google contact
          const annotated = (Array.isArray(appContacts) ? appContacts : []).map((u) => {
            const emailMatch = u.email && googleEmails.has(String(u.email).toLowerCase().trim());
            const phoneMatch = googlePhones.has(normalizePhone(u.phoneNumber || u.phone || u.mobile || ""));
            return {
              ...u,
              isGoogleContact: !!(emailMatch || phoneMatch),
            };
          });

          setContacts(annotated);
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

    // Convert image file to Base64 (if exists)
    let avatarBase64 = "";
    if (iconFile) {
      avatarBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(iconFile);
      });
    }

    // Build features object
    const features = {
      media: featureMedia,
      gallery: featureGallery,
      docs: featureDocs,
      polls: featurePolls,
    };

    // Complete payload with all settings
    const payload = {
      name: groupName.trim(),
      users: memberIds,
      description: groupDescription.trim() || "",
      isPublic: true,
      avatarBase64,
      groupType: "Casual",

      // Invite settings
      inviteEnabled,
      inviteLink: inviteEnabled ? inviteLink : "",

      // Permissions
      permissions: {
        allowCreatorAdmin,
        allowOthersAdmin,
        allowMembersAdd,
      },

      // Features
      features,
    };

    console.log("📤 Creating group with payload:", payload);

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
        console.log("✅ Group created successfully:", json);
        onCreateGroup?.(json);
        onClose?.();
      }
    } catch (e) {
      console.error("❌ Error creating group:", e);
      alert("Error creating group");
    }
  };

  const PermissionItem = ({ title, desc, value, onChange }) => (
    <div className="flex items-center justify-between">
      <div>
        <div className={`font-medium ${effectiveTheme.text}`}>{title}</div>
        <p className={`text-xs ${effectiveTheme.textSecondary}`}>{desc}</p>
      </div>

      <label className="relative w-12 h-6 cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="hidden peer"
        />
        <div className="absolute inset-0 bg-gray-400 rounded-full peer-checked:bg-blue-600 transition"></div>
        <div className="absolute w-5 h-5 bg-white rounded-full top-0.5 left-0.5 peer-checked:translate-x-6 transition"></div>
      </label>
    </div>
  );

  const FeatureToggle = ({ label, desc, value, setValue }) => (
    <div
      className={`flex items-center justify-between p-3 rounded-xl shadow-sm bg-white/5 backdrop-blur border border-white/10`}
    >
      <div>
        <div className={`font-medium ${effectiveTheme.text}`}>{label}</div>
        {desc && (
          <p className={`text-xs ${effectiveTheme.textSecondary}`}>{desc}</p>
        )}
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
      style={{
        position: "fixed",
        inset: 0,
        minHeight: "100vh",
        minWidth: "100vw",
        overflow: "hidden",
      }}
    >
      {/* Solid white background in day/light mode */}
      {(!effectiveTheme.mode || effectiveTheme.mode === "light") && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#ffffff",
            zIndex: 0,
          }}
        />
      )}
      {/* Cosmos Background */}
      <div className="absolute inset-0 overflow-hidden z-[2]">
        <CosmosBackground effectiveTheme={effectiveTheme} />
      </div>

      {/* Content wrapper - relative positioning */}
      <div className="relative z-10 flex flex-col h-full">
        {/* HEADER */}
        <div
          className={`${effectiveTheme.secondary} border-b ${effectiveTheme.border} p-4`}
        >
          <div className="flex items-center justify-between gap-6 relative">
            <button
              onClick={onClose}
              title="Close"
              className={`p-2 rounded-full transition-colors`}
              style={{ 
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X className={`w-5 h-5 ${effectiveTheme.text}`} />
            </button>

            <div className="flex items-center gap-3">
              <Logo size="sm" textClassName={effectiveTheme.text} />
            </div>

            <h2
              className={`absolute left-1/2 -translate-x-1/2 text-lg font-semibold ${effectiveTheme.text}`}
            >
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
          {/* STEP 2 - Add Members */}
          {step === 2 && (
            <>
              <div className="p-4">
                <div
                  className={`relative ${effectiveTheme.searchBg} rounded-lg border ${effectiveTheme.border}`}
                >
                  <Search
                    className={`absolute left-3 top-3 w-4 h-4 ${effectiveTheme.textSecondary}`}
                  />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 bg-transparent ${effectiveTheme.text} rounded-lg ${effectiveTheme.mode === "dark" ? "placeholder-gray-500" : "placeholder-gray-400"}`}
                  />
                </div>
                {/* Loading state is shown centered in the contacts list below */}
                {contactsError && (
                  <p
                    className={`mt-2 text-sm ${effectiveTheme.mode === "dark" ? "text-red-400" : "text-red-600"}`}
                  >
                    Failed to load contacts: {contactsError}
                  </p>
                )}
              </div>

              {selectedContacts.length > 0 && (
                <div className="px-4 flex flex-wrap gap-2 mb-2">
                  {selectedContacts
                    .map((id) =>
                      contacts.find(
                        (c) => normalizeId(getContactId(c)) === normalizeId(id)
                      )
                    )
                    .filter(Boolean)
                    .map((c) => (
                      <div
                        key={`pill-${getContactId(c)}`}
                        className={`flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-600 ${effectiveTheme.textOnPrimary || "text-white"}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full bg-blue-800 flex items-center justify-center text-xs font-bold ${effectiveTheme.textOnPrimary || "text-white"}`}
                        >
                          {(c.name || c.username || "?")[0]}
                        </span>
                        <span
                          className={`text-sm ${effectiveTheme.textOnPrimary || "text-white"}`}
                        >
                          {c.name || c.username}
                        </span>
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
                {loadingContacts ? (
                  <div className="flex items-center justify-center min-h-[40vh]">
                    <p className={`text-center ${effectiveTheme.textSecondary} text-sm`}>Loading contacts...</p>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <p
                    className={`text-center mt-10 ${effectiveTheme.text} opacity-70`}
                  >
                    No contacts found
                  </p>
                ) : (
                  filteredContacts.map((c) => {
                    const cid = getContactId(c);
                    return (
                      <div
                        key={cid}
                        className={`rounded-lg ${isSelected(c) ? "bg-blue-50" : ""}`}
                      >
                        <SelectContact
                          contact={{ ...c, id: cid }}
                          selected={isSelected(c)}
                          onSelect={handleContactToggle}
                          effectiveTheme={effectiveTheme}
                          onUnblock={async (id) => {
                            try {
                              setUnblockLoadingIds(prev => new Set(prev).add(String(id)));
                              await blockService.unblockUser(String(id));
                              // clear blocked flag in contacts
                              setContacts(prev => (prev || []).map(p => {
                                const matchId = getContactId(p);
                                if (String(matchId) === String(id)) return { ...p, isBlocked: false };
                                return p;
                              }));
                              // auto-select after unblocking
                              handleContactToggle(id);
                            } catch (err) {
                              console.error('Unblock failed', err);
                            } finally {
                              setUnblockLoadingIds(prev => {
                                const copy = new Set(prev);
                                copy.delete(String(id));
                                return copy;
                              });
                            }
                          }}
                          unblockLoading={unblockLoadingIds.has(String(cid))}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* STEP 3 - Group Details */}
          {step === 3 && (
            <div className="p-4 space-y-6 animate-fadeIn">
              {/* GROUP PHOTO */}
              <div
                className={`flex items-center gap-5 p-4 rounded-2xl shadow-md bg-white/5 backdrop-blur border border-white/10`}
              >
                {/* ICON */}
                <div
                  className={`w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center shadow-md ${effectiveTheme.secondary}`}
                >
                  {iconPreview ? (
                    <img
                      src={iconPreview}
                      alt="Group Icon"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Logo
                      size="lg"
                      showText={false}
                      textClassName={effectiveTheme.text}
                    />
                  )}
                </div>

                {/* CONTROLS */}
                <div className="flex-1 space-y-2">
                  <h3
                    className={`text-lg font-semibold ${effectiveTheme.text}`}
                  >
                    Group Photo
                  </h3>
                  <p className={`text-sm opacity-70 ${effectiveTheme.text}`}>
                    Upload a group display photo
                  </p>

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
              <div className="space-y-2">
                <label className={`text-sm font-medium ${effectiveTheme.text}`}>
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className={`w-full px-4 py-3 rounded-xl border ${effectiveTheme.border} ${effectiveTheme.inputBg} ${effectiveTheme.text} shadow-sm ${effectiveTheme.mode === "dark" ? "placeholder-gray-500" : "placeholder-gray-400"}`}
                />
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${effectiveTheme.text}`}>
                  Description
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Write a short description"
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border ${effectiveTheme.border} ${effectiveTheme.inputBg} ${effectiveTheme.text} shadow-sm ${effectiveTheme.mode === "dark" ? "placeholder-gray-500" : "placeholder-gray-400"}`}
                />
              </div>

              {/* INVITE LINK */}
              <div
                className={`p-5 rounded-2xl shadow-md border ${effectiveTheme.border} ${effectiveTheme.secondary}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className={`font-semibold ${effectiveTheme.text}`}>
                      Invite Link
                    </h4>
                    <p className={`text-sm ${effectiveTheme.textSecondary}`}>
                      Allow joining via link
                    </p>
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
                  <div className="flex gap-3">
                    <input
                      readOnly
                      value={inviteLink || ""}
                      placeholder="Invite link"
                      className={`flex-1 px-4 py-2 rounded-xl border ${effectiveTheme.border} ${effectiveTheme.inputBg} ${effectiveTheme.text} ${effectiveTheme.mode === "dark" ? "placeholder-gray-500" : "placeholder-gray-400"}`}
                    />

                    <button
                      onClick={() => {
                        if (!inviteLink) generateInviteLink();
                        copyInviteLink();
                      }}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow transition"
                    >
                      {inviteCopied
                        ? "Copied"
                        : inviteLink
                          ? "Copy"
                          : "Generate"}
                    </button>
                  </div>
                )}
              </div>

              {/* PERMISSIONS */}
              <div
                className={`p-5 rounded-2xl shadow-md border ${effectiveTheme.border} ${effectiveTheme.secondary}`}
              >
                <h4
                  className={`font-semibold text-lg mb-4 ${effectiveTheme.text}`}
                >
                  Permissions
                </h4>

                <div className="space-y-4">
                  <PermissionItem
                    title="Allow others to be admins"
                    desc="Members can be promoted"
                    value={allowOthersAdmin}
                    onChange={setAllowOthersAdmin}
                  />

                  <PermissionItem
                    title="Allow members to add users"
                    desc="Members can invite or add people"
                    value={allowMembersAdd}
                    onChange={setAllowMembersAdd}
                  />
                </div>
              </div>

              {/* FEATURES */}
              <div
                className={`p-5 rounded-2xl shadow-md border ${effectiveTheme.border} ${effectiveTheme.secondary}`}
              >
                <h4
                  className={`font-semibold text-lg mb-4 ${effectiveTheme.text}`}
                >
                  Group Features
                </h4>

                <div className="space-y-3">
                  <FeatureToggle
                    label="Media"
                    desc="Send photos/videos"
                    value={featureMedia}
                    setValue={setFeatureMedia}
                  />
                  {/* <FeatureToggle
                    label="Gallery"
                    desc="View shared media"
                    value={featureGallery}
                    setValue={setFeatureGallery}
                  /> */}
                  <FeatureToggle
                    label="Docs"
                    desc="Share documents"
                    value={featureDocs}
                    setValue={setFeatureDocs}
                  />
                  <FeatureToggle
                    label="Polls"
                    desc="Create polls"
                    value={featurePolls}
                    setValue={setFeaturePolls}
                  />
                </div>
              </div>

              {/* MEMBERS */}
              <div>
                <h3
                  className={`font-semibold text-lg mb-3 ${effectiveTheme.text}`}
                >
                  Members ({selectedContacts.length})
                </h3>

                <div className="space-y-3">
                  {selectedContacts
                    .map((id) =>
                      contacts.find(
                        (c) => normalizeId(getContactId(c)) === normalizeId(id)
                      )
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
                          <span
                            className={`font-medium ${effectiveTheme.text}`}
                          >
                            {c.name || c.username}
                          </span>
                          <span
                            className={`text-xs ${effectiveTheme.textSecondary}`}
                          >
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
        <div
          className={`p-4 border-t ${effectiveTheme.border} ${effectiveTheme.secondary} flex items-center justify-between`}
        >
          <span className={effectiveTheme.text}>
            {step === 2
              ? `${selectedContacts.length} selected`
              : `${selectedContacts.length} members`}
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
