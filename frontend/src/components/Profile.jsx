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
import { supabase } from '../supabaseClient';

const formatJoinedDate = (createdAt) => {
  try {
    if (!createdAt) return "Unknown";

    // 🔥 Handle MongoDB $date format
    const iso =
      typeof createdAt === "string"
        ? createdAt
        : createdAt?.$date;

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
    avatar: null, // Can be File or URL
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Load user from localStorage
    const userData = JSON.parse(
      localStorage.getItem("userInfo") ||
        localStorage.getItem("chasmos_user_data") ||
        "{}"
    );

    setProfileData({
      userId: userData.id || userData._id || userData.userId || "N/A",
      name: userData.name || "Guest User",
      email: userData.email || "No email provided",
      phone: userData.phone || userData.phoneNumber || "No phone provided",
      bio:
        userData.bio && userData.bio.trim() !== ""
          ? userData.bio
          : "Hey there! I am using Chasmos.",
      location: userData.location || "Not specified",
      joinedDate: formatJoinedDate(userData.createdAt),
      avatar: userData.avatar || null,
    });
  }, [refreshKey]);

  // Handle input changes
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

    // ❗ size check (important to avoid 413 error)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileData((prev) => ({
        ...prev,
        avatar: reader.result, // ✅ BASE64 STRING
      }));
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

    // ✅ send base64 ONLY if changed
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

    // ✅ persist server truth (Supabase URL)
    const updatedUser = {
      ...JSON.parse(localStorage.getItem("userInfo")),
      name: data.name,
      bio: data.bio,
      avatar: data.avatar,
    };

    localStorage.setItem("userInfo", JSON.stringify(updatedUser));
    localStorage.setItem("chasmos_user_data", JSON.stringify(updatedUser));

    setIsEditing(false);

    toast.success("Profile updated successfully", {
      style: {
        background: "linear-gradient(135deg, #8b5cf6 0%, #60a5fa 100%)",
        color: "#fff",
        border: "1.5px solid #a78bfa",
        boxShadow: "0 8px 32px rgba(31,38,135,.15)",
        backdropFilter: "blur(8px)",
        fontWeight: 600,
      },
    });
  } catch (err) {
    console.error(err);
    toast.error(err.message || "Profile update failed");
  }
};




  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`fixed inset-0 ${effectiveTheme.primary} flex flex-col h-screen w-screen z-50`}
    >
      {/* Background */}
      {(!effectiveTheme.mode || effectiveTheme.mode === "light") && (
        <div
          style={{ position: "absolute", inset: 0, background: "#ffffff", zIndex: 0 }}
        />
      )}
      <div className="absolute inset-0 overflow-hidden z-[2]">
        <CosmosBackground effectiveTheme={effectiveTheme} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col h-full w-full">
        <div className={`${effectiveTheme.secondary} border-b ${effectiveTheme.border} p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button onClick={onClose} className={`p-2 rounded-full hover:${effectiveTheme.hover} transition-colors`}>
                <X className={`w-5 h-5 ${effectiveTheme.text}`} />
              </button>
              <Logo size="md" showText={true} textClassName={effectiveTheme.text} />
              <div className={`hidden sm:block border-l ${effectiveTheme.border} h-8 mx-2`}></div>
              <div>
                <h2 className={`text-lg font-semibold ${effectiveTheme.text}`}>Profile</h2>
                <p className={`text-sm ${effectiveTheme.textSecondary}`}>Manage your account information</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2">
                  <Save className="w-4 h-4" /> <span>Save</span>
                </button>
              ) : (
                <button onClick={() => setIsEditing(true)} className={`px-4 py-2 ${effectiveTheme.accent} text-white rounded-lg hover:opacity-90 transition-colors flex items-center space-x-2`}>
                  <Edit3 className="w-4 h-4" /> <span>Edit</span>
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
                <motion.div whileHover={{ scale: 1.05 }} className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-1 shadow-lg">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold overflow-hidden">
                    {profileData.avatar ? (
                      <img src={profileData.avatar instanceof File ? URL.createObjectURL(profileData.avatar) : profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="uppercase">{profileData.name.charAt(0)}</span>
                    )}
                  </div>
                </motion.div>
                {isEditing && (
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleAvatarUpload} className="absolute bottom-2 right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors shadow-lg">
                    <Camera className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
              <motion.h3 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className={`text-2xl font-bold ${effectiveTheme.text} mb-1`}>
                {profileData.name}
              </motion.h3>
              <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className={`text-sm ${effectiveTheme.textSecondary}`}>
                <Calendar className="w-4 h-4 inline mr-1" />
                Member since {profileData.joinedDate}
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

              {/* Bio */}
              <motion.div whileHover={{ scale: 1.01 }} className={`p-4 ${effectiveTheme.secondary} rounded-xl border ${effectiveTheme.border} shadow-sm`}>
                <label className={`block text-sm font-medium ${effectiveTheme.textSecondary} mb-2`}>Bio</label>
                {isEditing ? (
                  <textarea value={profileData.bio} onChange={(e) => handleInputChange("bio", e.target.value)} rows={3} className={`w-full px-4 py-3 ${effectiveTheme.inputBg} ${effectiveTheme.text} rounded-lg border ${effectiveTheme.border} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none`} placeholder="Tell us about yourself..." />
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
