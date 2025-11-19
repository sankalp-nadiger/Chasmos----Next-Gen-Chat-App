import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Phone, Lock, Image, Users, Eye, EyeOff } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const GoogleSignupComplete = ({ googleData, onSuccess, currentTheme }) => {
  const [formData, setFormData] = useState({
    email: googleData.email || "",
    name: googleData.name || "",
    avatar: googleData.avatar || "",
    phoneNumber: "",
    password: "", // Optional
    enableGoogleContacts: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [newAvatar, setNewAvatar] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validate phone number only if provided (phone is optional)
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (formData.phoneNumber && formData.phoneNumber.trim() && !phoneRegex.test(formData.phoneNumber.trim())) {
      setError("Please enter a valid phone number");
      return;
    }
    
    // Validate password if provided
    if (formData.password && formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    setIsLoading(true);

    try {
      let finalAvatarUrl = formData.avatar;
      
      if (newAvatar) {
        // Upload new avatar if changed
        const uploadData = new FormData();
        uploadData.append('file', newAvatar);
        uploadData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
          throw new Error("Cloudinary configuration is missing");
        }
        
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: uploadData
        });
        
        if (!uploadRes.ok) {
          throw new Error("Failed to upload image");
        }
      
        const uploadResult = await uploadRes.json();
        finalAvatarUrl = uploadResult.secure_url;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/google/complete-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          avatar: finalAvatarUrl
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to complete signup");
      }

      // Store user data and token
      localStorage.setItem("userInfo", JSON.stringify(data));
      localStorage.setItem("token", data.token);
      
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
      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full mx-auto p-6"
    >
      <div className="text-center mb-8">
        <h2 className={`text-2xl font-bold ${currentTheme.text} mb-2`}>
          Complete Your Profile
        </h2>
        <p className={`${currentTheme.textSecondary}`}>
          Just a few more details to get started
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Preview/Upload */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <img
              src={formData.avatar}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
            />
            <label className={`absolute bottom-0 right-0 p-1 rounded-full ${currentTheme.secondary} cursor-pointer`}>
              <Image className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${currentTheme.text}`}>
            Phone Number <span className="text-gray-400">(Optional)</span>
          </label>
          <div className="relative">
            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${currentTheme.textSecondary}`}>
              <Phone className="h-5 w-5" />
            </div>
            <input
              type="tel"
              placeholder="Enter your phone number (optional)"
              value={formData.phoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              className={`w-full pl-10 pr-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
        </div>

        {/* Optional Password */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${currentTheme.text}`}>
            Password <span className="text-gray-400">(Optional)</span>
          </label>
          <div className="relative">
            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${currentTheme.textSecondary}`}>
              <Lock className="h-5 w-5" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password (optional)"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className={`w-full pl-10 pr-12 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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

        {/* Google Contacts Sync Permission */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="enableContacts"
            checked={formData.enableGoogleContacts}
            onChange={(e) => setFormData(prev => ({ ...prev, enableGoogleContacts: e.target.checked }))}
            className={`rounded border ${currentTheme.border} text-blue-600 focus:ring-blue-500`}
          />
          <label htmlFor="enableContacts" className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className={`text-sm ${currentTheme.text}`}>
              Sync Google Contacts
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Complete Signup"
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default GoogleSignupComplete;