import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  User,
  Camera,
  Edit3,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Save,
  Upload,
} from "lucide-react";

const Profile = ({ onClose, effectiveTheme, currentUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || "John Doe",
    email: currentUser?.email || "john.doe@example.com",
    phone: currentUser?.phone || "+1 (555) 123-4567",
    bio: currentUser?.bio || "Hey there! I am using Chasmos.",
    location: currentUser?.location || "New York, USA",
    joinedDate: currentUser?.joinedDate || "January 2024",
    avatar: currentUser?.avatar || null,
  });

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Save profile data logic here
    setIsEditing(false);
    console.log("Profile saved:", profileData);
  };

  const handleAvatarUpload = () => {
    // Avatar upload logic here
    console.log("Avatar upload clicked");
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`fixed inset-0 ${effectiveTheme.primary} flex flex-col h-screen w-screen z-50`}
    >
      {/* Header */}
      <div className={`${effectiveTheme.secondary} border-b ${effectiveTheme.border} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className={`p-2 rounded-full hover:${effectiveTheme.hover} transition-colors`}
            >
              <X className={`w-5 h-5 ${effectiveTheme.text}`} />
            </button>
            <div>
              <h2 className={`text-lg font-semibold ${effectiveTheme.text}`}>
                Profile
              </h2>
              <p className={`text-sm ${effectiveTheme.textSecondary}`}>
                Manage your account information
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className={`px-4 py-2 ${effectiveTheme.accent} text-white rounded-lg hover:opacity-90 transition-colors flex items-center space-x-2`}
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-6 max-w-2xl mx-auto">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                {profileData.avatar ? (
                  <img
                    src={profileData.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profileData.name.charAt(0)
                )}
              </div>
              {isEditing && (
                <button
                  onClick={handleAvatarUpload}
                  className="absolute bottom-2 right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <h3 className={`text-2xl font-bold ${effectiveTheme.text} mb-2`}>
              {profileData.name}
            </h3>
            <p className={`text-sm ${effectiveTheme.textSecondary}`}>
              Member since {profileData.joinedDate}
            </p>
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className={`block text-sm font-medium ${effectiveTheme.text} mb-2`}>
                <User className="w-4 h-4 inline mr-2" />
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 ${effectiveTheme.inputBg} ${effectiveTheme.text} rounded-lg border ${effectiveTheme.border} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                />
              ) : (
                <div className={`w-full px-4 py-3 ${effectiveTheme.secondary} ${effectiveTheme.text} rounded-lg border ${effectiveTheme.border}`}>
                  {profileData.name}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className={`block text-sm font-medium ${effectiveTheme.text} mb-2`}>
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 ${effectiveTheme.inputBg} ${effectiveTheme.text} rounded-lg border ${effectiveTheme.border} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                />
              ) : (
                <div className={`w-full px-4 py-3 ${effectiveTheme.secondary} ${effectiveTheme.text} rounded-lg border ${effectiveTheme.border}`}>
                  {profileData.email}
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className={`block text-sm font-medium ${effectiveTheme.text} mb-2`}>
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full px-4 py-3 ${effectiveTheme.inputBg} ${effectiveTheme.text} rounded-lg border ${effectiveTheme.border} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                />
              ) : (
                <div className={`w-full px-4 py-3 ${effectiveTheme.secondary} ${effectiveTheme.text} rounded-lg border ${effectiveTheme.border}`}>
                  {profileData.phone}
                </div>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className={`block text-sm font-medium ${effectiveTheme.text} mb-2`}>
                Bio
              </label>
              {isEditing ? (
                <textarea
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-3 ${effectiveTheme.inputBg} ${effectiveTheme.text} rounded-lg border ${effectiveTheme.border} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none`}
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <div className={`w-full px-4 py-3 ${effectiveTheme.secondary} ${effectiveTheme.text} rounded-lg border ${effectiveTheme.border} min-h-[80px]`}>
                  {profileData.bio}
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <label className={`block text-sm font-medium ${effectiveTheme.text} mb-2`}>
                <MapPin className="w-4 h-4 inline mr-2" />
                Location
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={`w-full px-4 py-3 ${effectiveTheme.inputBg} ${effectiveTheme.text} rounded-lg border ${effectiveTheme.border} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                />
              ) : (
                <div className={`w-full px-4 py-3 ${effectiveTheme.secondary} ${effectiveTheme.text} rounded-lg border ${effectiveTheme.border}`}>
                  {profileData.location}
                </div>
              )}
            </div>
          </div>

          {/* Account Statistics */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 ${effectiveTheme.secondary} rounded-lg border ${effectiveTheme.border} text-center`}>
              <div className={`text-2xl font-bold ${effectiveTheme.text}`}>156</div>
              <div className={`text-sm ${effectiveTheme.textSecondary}`}>Messages Sent</div>
            </div>
            <div className={`p-4 ${effectiveTheme.secondary} rounded-lg border ${effectiveTheme.border} text-center`}>
              <div className={`text-2xl font-bold ${effectiveTheme.text}`}>23</div>
              <div className={`text-sm ${effectiveTheme.textSecondary}`}>Active Chats</div>
            </div>
            <div className={`p-4 ${effectiveTheme.secondary} rounded-lg border ${effectiveTheme.border} text-center`}>
              <div className={`text-2xl font-bold ${effectiveTheme.text}`}>8</div>
              <div className={`text-sm ${effectiveTheme.textSecondary}`}>Groups</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;