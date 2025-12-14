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
  MapPin,
  Save,
  Upload,
  IdCard,
  Lock,
} from "lucide-react";
import Logo from "./Logo";

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
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Get user data from localStorage (check both keys for compatibility)
    const userData = JSON.parse(localStorage.getItem('userInfo') || localStorage.getItem('chasmos_user_data') || '{}');
    
    console.log('Profile - User data from localStorage:', userData);
    
    setProfileData({
      userId: userData.id || userData._id || userData.userId || "N/A",
      name: userData.name || userData.fullName || "Guest User",
      email: userData.email || "No email provided",
      phone: userData.phone || userData.phoneNumber || "No phone provided",
      bio: userData.bio && userData.bio.trim() !== "" ? userData.bio : "Hey there! I am using Chasmos.",
      location: userData.location || "Not specified",
      joinedDate: userData.joinedDate || userData.createdAt || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      avatar: userData.avatar || userData.profilePicture || userData.profilePic || null,
    });
  }, [refreshKey]);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      
      console.log('Updating profile with:', {
        name: profileData.name,
        bio: profileData.bio,
        pic: profileData.avatar
      });
      
      // Update profile on backend
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileData.name,
          bio: profileData.bio,
          pic: profileData.avatar
        })
      });

      const data = await response.json();
      console.log('Backend response:', data);

      if (response.ok) {
        // Update localStorage with the response from server
        const updatedData = {
          ...data,
          phoneNumber: profileData.phone,
          avatar: data.pic || profileData.avatar,
        };
        
        localStorage.setItem('userInfo', JSON.stringify(updatedData));
        localStorage.setItem('chasmos_user_data', JSON.stringify(updatedData));
        setIsEditing(false);
        setRefreshKey(prev => prev + 1);
        console.log("Profile saved successfully:", updatedData);
        alert('Profile updated successfully!');
      } else {
        console.error("Failed to update profile:", data);
        alert('Failed to update profile: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert('Error saving profile: ' + error.message);
    }
  };

  const handleAvatarUpload = () => {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*'; // Only allow image files
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileData(prev => ({
            ...prev,
            avatar: reader.result
          }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
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
            
            {/* Chasmos Logo and Name */}
            <div className="flex items-center space-x-2">
              <Logo size="md" showText={true} textClassName={effectiveTheme.text} />
            </div>
            
            <div className={`hidden sm:block border-l ${effectiveTheme.border} h-8 mx-2`}></div>
            
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
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center mb-8"
          >
            <div className="relative mb-4">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-1 shadow-lg"
              >
                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold overflow-hidden">
                  {profileData.avatar ? (
                    <img
                      src={profileData.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="uppercase">{profileData.name.charAt(0)}</span>
                  )}
                </div>
              </motion.div>
              {isEditing && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAvatarUpload}
                  className="absolute bottom-2 right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors shadow-lg"
                >
                  <Camera className="w-5 h-5" />
                </motion.button>
              )}
            </div>
            
            <motion.h3 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`text-2xl font-bold ${effectiveTheme.text} mb-1`}
            >
              {profileData.name}
            </motion.h3>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`text-sm ${effectiveTheme.textSecondary}`}
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              Member since {profileData.joinedDate}
            </motion.p>
          </motion.div>

          {/* Profile Information */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            {/* Email - Read Only */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className={`p-4 ${effectiveTheme.secondary} rounded-xl border ${effectiveTheme.border} shadow-sm`}
            >
              <label className={`block text-sm font-medium ${effectiveTheme.textSecondary} mb-2`}>
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address (Login ID)
              </label>
              <div className={`px-4 py-3 ${effectiveTheme.text} rounded-lg`}>
                {profileData.email}
              </div>
            </motion.div>

            {/* Name */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className={`p-4 ${effectiveTheme.secondary} rounded-xl border ${effectiveTheme.border} shadow-sm`}
            >
              <label className={`block text-sm font-medium ${effectiveTheme.textSecondary} mb-2`}>
                <User className="w-4 h-4 inline mr-2" />
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 ${effectiveTheme.inputBg} ${effectiveTheme.text} rounded-lg border ${effectiveTheme.border} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  placeholder="Enter your full name"
                />
              ) : (
                <div className={`px-4 py-3 ${effectiveTheme.text} rounded-lg`}>
                  {profileData.name}
                </div>
              )}
            </motion.div>

            {/* Phone */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className={`p-4 ${effectiveTheme.secondary} rounded-xl border ${effectiveTheme.border} shadow-sm`}
            >
              <label className={`block text-sm font-medium ${effectiveTheme.textSecondary} mb-2`}>
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full px-4 py-3 ${effectiveTheme.inputBg} ${effectiveTheme.text} rounded-lg border ${effectiveTheme.border} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  placeholder="Enter your phone number"
                />
              ) : (
                <div className={`px-4 py-3 ${effectiveTheme.text} rounded-lg`}>
                  {profileData.phone}
                </div>
              )}
            </motion.div>

            {/* Bio */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className={`p-4 ${effectiveTheme.secondary} rounded-xl border ${effectiveTheme.border} shadow-sm`}
            >
              <label className={`block text-sm font-medium ${effectiveTheme.textSecondary} mb-2`}>
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
                <div className={`px-4 py-3 ${effectiveTheme.text} rounded-lg min-h-[80px]`}>
                  {profileData.bio}
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;