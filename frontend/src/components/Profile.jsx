/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  User,
  Camera,
  Edit3,
  Phone,
  Mail,
  Calendar,
  Save,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Logo from "./Logo";
import CosmosBackground from "./CosmosBg";
import { supabase } from "../supabaseClient";

const formatJoinedDate = (createdAt) => {
  try {
    if (!createdAt) return "Unknown";
    const iso =
      typeof createdAt === "string" ? createdAt : createdAt?.$date;
    if (!iso) return "Unknown";

    const date = new Date(iso);
    if (isNaN(date.getTime())) return "Unknown";

    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "Unknown";
  }
};

const Profile = ({ onClose, effectiveTheme }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    userId: "",
    name: "",
    email: "",
    phone: "",
    bio: "",
    location: "",
    joinedDate: "",
    avatar: null,
    isBusiness: false,
    businessCategory: "",
    businessName: "",
    title: "",
  });

  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [removedAvatar, setRemovedAvatar] = useState(false);

  /* ===================== FETCH PROFILE ===================== */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        const stored =
          JSON.parse(localStorage.getItem("userInfo")) ||
          JSON.parse(localStorage.getItem("chasmos_user_data"));

        const userId = stored?._id || stored?.userId;
        if (!userId) return;

        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/users/profile/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message);
        }

        const user = await res.json();

        setProfileData({
          userId: user._id,
          name: user.name || "Guest User",
          email: user.email || "No email provided",
          phone: user.phoneNumber || "No phone provided",
          bio:
            user.bio && user.bio.trim() !== ""
              ? user.bio
              : user.isBusiness
              ? "Tell your customers about your business..."
              : "Hey there! I am using Chasmos.",
          location: user.location || "Not specified",
          joinedDate: formatJoinedDate(user.createdAt),
          avatar: user.avatar || null,
          isBusiness: user.isBusiness || false,
          businessCategory: user.businessCategory || "",
          businessName: user.businessName || "",
          title: user.title || "",
        });

        localStorage.setItem("userInfo", JSON.stringify(user));
        localStorage.setItem("chasmos_user_data", JSON.stringify(user));
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchProfile();
  }, []);

  /* ===================== AVATAR RESET ===================== */
  useEffect(() => {
    setAvatarLoadFailed(false);
    if (profileData.avatar) setRemovedAvatar(false);
  }, [profileData.avatar]);

  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        alert("Image must be less than 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData((prev) => ({
          ...prev,
          avatar: reader.result,
        }));
        setRemovedAvatar(false);
      };

      reader.readAsDataURL(file);
    };

    input.click();
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

      const payload = {
        name: profileData.name,
        bio: profileData.bio,
      };

      if (removedAvatar) payload.clearAvatar = true;
      if (profileData.avatar?.startsWith("data:image")) {
        payload.avatarBase64 = profileData.avatar;
      }

      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Profile update failed");
    }
  };

  /* ===================== UI (UNCHANGED) ===================== */

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`fixed inset-0 ${effectiveTheme.primary} flex flex-col h-screen w-screen z-50`}
    >
      {(!effectiveTheme.mode || effectiveTheme.mode === "light") && (
        <div
          style={{ position: "absolute", inset: 0, background: "#ffffff", zIndex: 0 }}
        />
      )}

      <div className="absolute inset-0 overflow-hidden z-[2]">
        <CosmosBackground effectiveTheme={effectiveTheme} />
      </div>

      <div className="relative z-10 flex flex-col h-full w-full">
        <div className={`${effectiveTheme.secondary} border-b ${effectiveTheme.border} p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button onClick={onClose} className={`p-2 rounded-full hover:${effectiveTheme.hover}`}>
                <X className={`w-5 h-5 ${effectiveTheme.text}`} />
              </button>
              <Logo size="md" showText textClassName={effectiveTheme.text} />
              <div className={`hidden sm:block border-l ${effectiveTheme.border} h-8 mx-2`} />
              <div>
                <h2 className={`text-lg font-semibold ${effectiveTheme.text}`}>Profile</h2>
                <p className={`text-sm ${effectiveTheme.textSecondary}`}>
                  Manage your account information
                </p>
              </div>
            </div>

            <div>
              {isEditing ? (
                <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-lg">
                  <Save className="w-4 h-4 inline mr-2" /> Save
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className={`px-4 py-2 ${effectiveTheme.accent} text-white rounded-lg`}
                >
                  <Edit3 className="w-4 h-4 inline mr-2" /> Edit
                </button>
              )}
            </div>
          </div>
        </div>


        {/* Profile Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-6 max-w-2xl mx-auto">
            {/* Avatar */}
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }} className="flex flex-col items-center mb-8">
              <div className="relative mb-4">
                <motion.div whileHover={{ scale: 1.05 }} className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-1 shadow-lg relative">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold overflow-hidden relative">
                    {/* Always render initials as the visual fallback */}
                    <span className="uppercase z-0">{getInitials(profileData.name)}</span>

                    {/* Render image on top when available; hide it on load error so initials remain visible */}
                    {profileData.avatar && ((typeof profileData.avatar === 'string' && profileData.avatar.trim() !== '') || profileData.avatar instanceof File) && (
                      <img
                        src={profileData.avatar instanceof File ? URL.createObjectURL(profileData.avatar) : profileData.avatar}
                        alt="Profile"
                        className="w-full h-full object-cover absolute inset-0 z-10"
                        style={{ display: avatarLoadFailed ? 'none' : 'block' }}
                        onLoad={() => setAvatarLoadFailed(false)}
                        onError={(e) => {
                          setAvatarLoadFailed(true);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}

                    {/* Avatar action controls (overlayed) - positioned left & right, shown on hover or when editing */}
                    <div
                      className="absolute inset-0 flex items-end justify-between px-2 pb-2 z-20"
                      style={{
                        opacity: isEditing ? 1 : 0,
                        transition: 'opacity 120ms ease-in-out',
                        pointerEvents: isEditing ? 'auto' : 'none',
                      }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setProfileData(prev => ({ ...prev, avatar: null }));
                          setRemovedAvatar(true);
                          setAvatarLoadFailed(false);
                        }}
                        className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
                        title="Remove picture"
                        aria-label="Remove picture"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAvatarUpload}
                        className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors shadow-lg"
                        title="Upload new picture"
                        aria-label="Upload new picture"
                      >
                        <Camera className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
              <motion.h3 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className={`text-2xl font-bold ${effectiveTheme.text} mb-1 flex items-center gap-2 justify-center`}>
                {profileData.name}
                {profileData.isBusiness && (
                  <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full">
                    Business
                  </span>
                )}
              </motion.h3>
              <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className={`text-sm ${effectiveTheme.textSecondary}`}>
                <Calendar className="w-4 h-4 inline mr-1" />
                {profileData.isBusiness 
                  ? `${profileData.businessCategory} • Since ${profileData.joinedDate || 'Unknown'}`
                  : `Member since ${profileData.joinedDate || 'Unknown'}`}
              </motion.p>
            </motion.div>

            {/* Profile Fields */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="space-y-4">
              {/* Email */}
              <motion.div whileHover={{ scale: 1.01 }} className={`p-4 ${effectiveTheme.secondary} rounded-xl border ${effectiveTheme.border} shadow-sm`}>
                <label className={`block text-sm font-medium ${effectiveTheme.textSecondary} mb-2`}><Mail className="w-4 h-4 inline mr-2" />Email Address (Login ID)</label>
                <div className={`px-4 py-3 ${effectiveTheme.text} rounded-lg`}>{profileData.email}</div>
              </motion.div>

              {/* Name */}
              <motion.div whileHover={{ scale: 1.01 }} className={`p-4 ${effectiveTheme.secondary} rounded-xl border ${effectiveTheme.border} shadow-sm`}>
                <label className={`block text-sm font-medium ${effectiveTheme.textSecondary} mb-2`}><User className="w-4 h-4 inline mr-2" />Full Name</label>
                {isEditing ? (
                  <input type="text" value={profileData.name} onChange={(e) => handleInputChange("name", e.target.value)} className={`w-full px-4 py-3 ${effectiveTheme.inputBg} ${effectiveTheme.text} rounded-lg border ${effectiveTheme.border} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} placeholder="Enter your full name" />
                ) : (
                  <div className={`px-4 py-3 ${effectiveTheme.text} rounded-lg`}>{profileData.name}</div>
                )}
              </motion.div>

              {/* Phone */}
              <motion.div whileHover={{ scale: 1.01 }} className={`p-4 ${effectiveTheme.secondary} rounded-xl border ${effectiveTheme.border} shadow-sm`}>
                <label className={`block text-sm font-medium ${effectiveTheme.textSecondary} mb-2`}><Phone className="w-4 h-4 inline mr-2" />Phone Number</label>
                {isEditing ? (
                  <input type="tel" value={profileData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} className={`w-full px-4 py-3 ${effectiveTheme.inputBg} ${effectiveTheme.text} rounded-lg border ${effectiveTheme.border} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} placeholder="Enter your phone number" />
                ) : (
                  <div className={`px-4 py-3 ${effectiveTheme.text} rounded-lg`}>{profileData.phone}</div>
                )}
              </motion.div>

              {/* Bio / About Company */}
              <motion.div whileHover={{ scale: 1.01 }} className={`p-4 ${effectiveTheme.secondary} rounded-xl border ${effectiveTheme.border} shadow-sm`}>
                <label className={`block text-sm font-medium ${effectiveTheme.textSecondary} mb-2`}>
                  {profileData.isBusiness ? 'About Company' : 'Bio'}
                </label>
                {isEditing ? (
                  <textarea value={profileData.bio} onChange={(e) => handleInputChange("bio", e.target.value)} rows={3} className={`w-full px-4 py-3 ${effectiveTheme.inputBg} ${effectiveTheme.text} rounded-lg border ${effectiveTheme.border} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none`} placeholder={profileData.isBusiness ? "Tell customers about your business..." : "Tell us about yourself..."} />
                ) : (
                  <div className={`px-4 py-3 ${effectiveTheme.text} rounded-lg min-h-[80px]`}>{profileData.bio}</div>
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;