/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Lock, Image, Users, Eye, EyeOff, Mail, User, Check, ArrowLeft, X, Camera } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const GoogleSignupComplete = ({ googleData, onSuccess, onBack, currentTheme }) => {
  // Auto-populate avatar from Google data (checks .avatar or .picture)
  const [formData, setFormData] = useState({
    email: googleData?.email || "",
    name: googleData?.name || "",
    avatar: googleData?.avatar || googleData?.picture || "", 
    phoneNumber: "",
    password: "", 
    confirmPassword: "", 
    enableGoogleContacts: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [newAvatar, setNewAvatar] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validation
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (formData.phoneNumber && formData.phoneNumber.trim() && !phoneRegex.test(formData.phoneNumber.trim())) {
      setError("Please enter a valid phone number");
      return;
    }
    
    if (formData.password) {
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }
    
    setIsLoading(true);

    try {
      let finalAvatarUrl = formData.avatar;
      
      // If user selected a new file, upload it to Cloudinary
      if (newAvatar) {
        const uploadData = new FormData();
        uploadData.append('file', newAvatar);
        uploadData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        
        if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
           const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: uploadData
          });
          
          if (uploadRes.ok) {
            const uploadResult = await uploadRes.json();
            finalAvatarUrl = uploadResult.secure_url;
          }
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/google/complete-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          enableGoogleContacts: formData.enableGoogleContacts,
          avatar: finalAvatarUrl
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to complete signup");
      }

      // Save token and user data under the keys the app expects
      localStorage.setItem("chasmos_user_data", JSON.stringify(data));
      localStorage.setItem("chasmos_auth_token", data.token);
      // Keep backward-compatible keys as well
      localStorage.setItem("userInfo", JSON.stringify(data));
      localStorage.setItem("token", data.token);
      
      // If user opted to sync Google contacts, initiate OAuth connect flow
      if (formData.enableGoogleContacts) {
        try {
          const connectRes = await fetch(`${API_BASE_URL}/api/contacts/google/connect`, {
            headers: { Authorization: `Bearer ${data.token}` },
          });
          const connectJson = await connectRes.json();
          if (connectRes.ok && connectJson.url) {
            // Redirect user to Google's OAuth consent screen
            window.location.href = connectJson.url;
            return;
          }
        } catch (e) {
          console.error('Failed to initiate Google contacts sync', e);
        }
      }

      onSuccess(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewAvatar(file);
      // Create a local preview URL immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Shared button styles
  const buttonClasses = `w-full py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-200 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen w-full ${currentTheme.primary} flex flex-col p-6 lg:p-10 relative overflow-y-auto`}
    >
      {/* Top Left Logo */}
      <div className="absolute top-6 left-6 flex items-center space-x-2">
        <div className={`w-10 h-10 rounded-full ${currentTheme.accent} flex items-center justify-center`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="currentColor" className="text-blue-500" />
            <path d="M17.5 15.5C17.25 15.25 16.8125 15.0625 16.375 14.875C15.9375 14.6875 15.5625 14.5 15.0625 14.1875C14.5625 13.875 14.1875 13.625 13.8125 13.3125C13.4375 13 13.0625 12.5625 12.75 12.0625C12.5 11.5625 12.25 11.0625 12 10.5625C11.75 10.0625 11.5 9.5625 11.25 9.0625C11 8.5625 10.75 8.125 10.5 7.625C10.25 7.125 10 6.625 9.75 6.125C9.5 5.625 9.25 5.1875 9 4.6875C8.75 4.1875 8.5 3.75 8.25 3.25C8 2.75 7.75 2.25 7.5 1.75C7.25 1.25 7 0.75 6.75 0.25C6.5 0.25 6.25 0.5 6 0.75C5.75 1 5.5 1.25 5.25 1.5C5 1.75 4.75 2 4.5 2.25C4.25 2.5 4 2.75 3.75 3C3.5 3.25 3.25 3.5 3 3.75C2.75 4 2.5 4.25 2.25 4.5C2 4.75 1.75 5 1.5 5.25C1.25 5.5 1 5.75 0.75 6C0.5 6.25 0.25 6.5 0.25 6.75L0.25 6.75Z" fill="white" />
            </svg>
        </div>
        <span className={`text-xl font-bold ${currentTheme.text} hidden sm:block`} style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: "2px" }}>
            Chasmos
        </span>
      </div>

      {/* Page Header */}
      <div className="mt-8 mb-12 text-center max-w-7xl mx-auto w-full">
        <h2 className={`text-3xl font-bold ${currentTheme.text} mb-2`}>Complete Your Profile</h2>
        <p className={currentTheme.textSecondary}>Please review your details and set up your preferences.</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto w-full mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-1 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* 1. Left Part: Info & Back Button */}
        <div className="flex flex-col w-full lg:w-1/4 gap-6">
            <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className={`w-full ${currentTheme.secondary} p-6 rounded-2xl shadow-sm border ${currentTheme.border} flex-1`}
            >
                <h3 className={`text-lg font-semibold ${currentTheme.text} mb-6 border-b ${currentTheme.border} pb-3`}>
                    Personal Info
                </h3>
                
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className={`block text-sm font-medium ${currentTheme.text}`}>Full Name</label>
                        <div className="relative">
                            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${currentTheme.textSecondary}`}>
                                <User className="h-5 w-5" />
                            </div>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className={`w-full pl-10 pr-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme.text}`}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={`block text-sm font-medium ${currentTheme.text}`}>Email Address</label>
                        <div className="relative">
                            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${currentTheme.textSecondary}`}>
                                <Mail className="h-5 w-5" />
                            </div>
                            <input
                                type="email"
                                value={formData.email}
                                readOnly
                                className={`w-full pl-10 pr-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg text-gray-500 cursor-not-allowed`}
                            />
                        </div>
                        <p className="text-xs text-gray-500">Linked to Google account.</p>
                    </div>
                </div>
            </motion.div>

            {/* Back Button */}
            <button
                type="button"
                onClick={() => onBack && onBack()}
                className={buttonClasses}
            >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
            </button>
        </div>

        {/* 2. Middle Part: Profile Pic & Sync (Bigger Circle, Header Aligned) */}
        <div className="flex flex-col w-full lg:w-2/5 gap-6">
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`w-full ${currentTheme.secondary} p-6 rounded-2xl shadow-sm border ${currentTheme.border} flex-1 flex flex-col items-center text-center`}
            >
                <h3 className={`text-lg font-semibold ${currentTheme.text} mb-8 w-full text-left border-b ${currentTheme.border} pb-3`}>
                    Profile & Sync
                </h3>

                <div className="flex-1 w-full flex flex-col items-center justify-center">
                    <div className="relative mb-8 group">
                        <div 
                            className={`w-56 h-56 lg:w-45 lg:h-45 rounded-full p-1 border-2 border-dashed ${currentTheme.border} group-hover:border-blue-500 transition-colors overflow-hidden relative ${!newAvatar ? "cursor-zoom-in" : ""}`}
                            onClick={() => !newAvatar && setIsExpanded(true)}
                        >
                            <img
                                src={formData.avatar || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"}
                                alt="Profile"
                                referrerPolicy="no-referrer"
                                className="w-full h-full rounded-full object-cover"
                            />
                        </div>
                        <label className="absolute bottom-6 right-5 p-2 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg text-white z-10" title="Upload new picture">
                            <Camera className="w-4 h-4" />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </label>
                        <p className={`mt-3 text-sm ${currentTheme.textSecondary}`}>
                            {formData.avatar && formData.avatar.includes('googleusercontent') && !newAvatar 
                                ? "" 
                                : "Upload Profile Picture"}
                        </p>
                    </div>

                    <div className={`w-full p-4 rounded-xl border ${formData.enableGoogleContacts ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : currentTheme.border} transition-all cursor-pointer`}
                        onClick={() => setFormData(prev => ({ ...prev, enableGoogleContacts: !prev.enableGoogleContacts }))}
                    >
                        <div className="flex items-center space-x-3">
                            <div className={`flex-shrink-0 w-6 h-6 rounded border flex items-center justify-center transition-colors ${formData.enableGoogleContacts ? 'bg-blue-500 border-blue-500' : 'border-gray-400 bg-transparent'}`}>
                                {formData.enableGoogleContacts && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <div className="flex-1 text-left">
                                <p className={`font-medium ${currentTheme.text} flex items-center gap-2`}>
                                <Users className="w-4 h-4 text-blue-500" /> Sync Google Contacts
                                </p>
                                <p className={`text-xs ${currentTheme.textSecondary}`}>Find friends from your contacts automatically</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Hidden Placeholder Button */}
            <div className={`${buttonClasses} opacity-0 pointer-events-none`} aria-hidden="true">
                Placeholder
            </div>
        </div>

        {/* 3. Right Part: Security & Submit Button */}
        <div className="flex flex-col w-full lg:w-1/3 gap-6">
            <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`w-full ${currentTheme.secondary} p-6 rounded-2xl shadow-sm border ${currentTheme.border} flex-1`}
            >
                <h3 className={`text-lg font-semibold ${currentTheme.text} mb-6 border-b ${currentTheme.border} pb-3`}>
                    Security (Optional)
                </h3>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className={`block text-sm font-medium ${currentTheme.text}`}>Phone Number</label>
                        <div className="relative">
                            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${currentTheme.textSecondary}`}>
                                <Phone className="h-5 w-5" />
                            </div>
                            <input
                                type="tel"
                                placeholder="+1 (555) 000-0000"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                className={`w-full pl-10 pr-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme.text}`}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={`block text-sm font-medium ${currentTheme.text}`}>Set Password</label>
                        <div className="relative">
                            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${currentTheme.textSecondary}`}>
                                <Lock className="h-5 w-5" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                className={`w-full pl-10 pr-12 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme.text}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={`absolute inset-y-0 right-0 pr-3 flex items-center ${currentTheme.textSecondary} hover:${currentTheme.text}`}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={`block text-sm font-medium ${currentTheme.text}`}>Confirm Password</label>
                        <div className="relative">
                            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${currentTheme.textSecondary}`}>
                                <Lock className="h-5 w-5" />
                            </div>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Retype password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                disabled={!formData.password}
                                className={`w-full pl-10 pr-12 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme.text} disabled:opacity-50`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className={`absolute inset-y-0 right-0 pr-3 flex items-center ${currentTheme.textSecondary} hover:${currentTheme.text}`}
                            >
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                         {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                            <p className="text-xs text-red-500">Passwords do not match</p>
                        )}
                    </div>
                </div>
            </motion.div>
            
            {/* Complete Button */}
            <button
                type="submit"
                disabled={isLoading}
                className={buttonClasses}
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                    "Complete & Get Started"
                )}
            </button>
        </div>

      </form>

      {/* Profile Image Lightbox with Adaptive Glassy Background */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          >
             {/* 1. Blurred Adaptive Background Layer - Increased intensity */}
            <div className="absolute inset-0 z-0">
                <img 
                    src={formData.avatar} 
                    alt="" 
                    className="w-full h-full object-cover blur-3xl scale-125 opacity-80" 
                    referrerPolicy="no-referrer"
                />
                {/* 2. Glassy Overlay - Darker and blurrier */}
                <div className="absolute inset-0 backdrop-blur-3xl bg-black/50"></div> 
            </div>

             {/* 3. Content Layer */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-10 p-2 rounded-full shadow-2xl ring-4 ring-white/20"
              onClick={(e) => e.stopPropagation()} 
            >
              <img 
                 src={formData.avatar} 
                 alt="Profile" 
                 className="w-72 h-72 md:w-96 md:h-96 rounded-full object-cover shadow-lg"
                 referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setIsExpanded(false)}
                className="absolute top-0 right-0 m-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm border border-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default GoogleSignupComplete;