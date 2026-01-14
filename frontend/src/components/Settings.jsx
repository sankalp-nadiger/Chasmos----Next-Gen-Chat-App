import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Languages,
  Bell,
  Shield,
  Database,
  HelpCircle,
  ChevronRight,
  User,
  Volume2,
  VolumeX,
  Globe,
  Lock,
  Download,
  Trash2,
  Info,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import Logo from "./Logo";
import CosmosBackground from "./CosmosBg";

const Settings = ({ onClose, effectiveTheme, onProfileClick }) => {
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [googleContactsSyncEnabled, setGoogleContactsSyncEnabled] = useState(false);
  const [language, setLanguage] = useState("English");
  const [isLoading, setIsLoading] = useState(false);
  const [isBusiness, setIsBusiness] = useState(false);
  const [autoMessageEnabled, setAutoMessageEnabled] = useState(false);
  const [autoMessageText, setAutoMessageText] = useState("");
  const [autoMessageImage, setAutoMessageImage] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // Load settings from backend on mount
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/user/settings`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications);
          setSoundEnabled(data.sound);
          if (data.googleContactsSyncEnabled !== undefined) {
            setGoogleContactsSyncEnabled(data.googleContactsSyncEnabled);
          }
          if (data.isBusiness !== undefined) {
            setIsBusiness(data.isBusiness);
          }
          if (data.autoMessageEnabled !== undefined) {
            setAutoMessageEnabled(data.autoMessageEnabled);
          }
          if (data.autoMessageText !== undefined) {
            setAutoMessageText(data.autoMessageText);
          }
          if (data.autoMessageImage !== undefined) {
            setAutoMessageImage(data.autoMessageImage);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Update settings on backend
  const updateSettings = async (settingName, value) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/user/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          [settingName]: value
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Settings updated:', data);
      } else {
        console.error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationsChange = (value) => {
    setNotifications(value);
    localStorage.setItem('notificationsEnabled', JSON.stringify(value));
    updateSettings('notifications', value);
  };

  const handleSoundChange = (value) => {
    setSoundEnabled(value);
    localStorage.setItem('soundEnabled', JSON.stringify(value));
    updateSettings('sound', value);
  };

  const handleGoogleContactsSyncChange = (value) => {
    setGoogleContactsSyncEnabled(value);
    updateSettings('googleContactsSyncEnabled', value);
  };

  const handleAutoMessageEnabledChange = (value) => {
    setAutoMessageEnabled(value);
    updateSettings('autoMessageEnabled', value);
  };

  const handleAutoMessageTextChange = (e) => {
    const value = e.target.value;
    setAutoMessageText(value);
  };

  const handleAutoMessageTextBlur = () => {
    updateSettings('autoMessageText', autoMessageText);
  };

  const handleAutoMessageImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;
      setAutoMessageImage(base64Image);
      // Update on backend
      await updateSettings('autoMessageImage', base64Image);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAutoMessageImage = async () => {
    setAutoMessageImage("");
    await updateSettings('autoMessageImage', "");
  };



  const quickSettings = [
    {
      id: "notifications",
      title: "Notifications",
      description: "Enable push notifications",
      icon: Bell,
      type: "toggle",
      value: notifications,
      onChange: handleNotificationsChange,
    },
    {
      id: "sound",
      title: "Sound",
      description: "Enable notification sounds",
      icon: soundEnabled ? Volume2 : VolumeX,
      type: "toggle",
      value: soundEnabled,
      onChange: handleSoundChange,
    },
    {
      id: "googleContactsSync",
      title: "Google Contacts Sync On Login",
      description: "Sync your Google contacts on login",
      icon: Globe,
      type: "toggle",
      value: googleContactsSyncEnabled,
      onChange: handleGoogleContactsSyncChange,
    },
  ];



  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`fixed inset-0 ${effectiveTheme.primary} flex flex-col h-screen w-screen z-50`}
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
      <div className="relative z-10 flex flex-col h-full w-full">
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
                Settings
              </h2>
              <p className={`text-sm ${effectiveTheme.textSecondary}`}>
                Manage your app preferences
              </p>
            </div>
          </div>
          
          <button 
            onClick={onProfileClick}
            className={`p-2 rounded-lg ${effectiveTheme.hover} hover:scale-105 transition-transform cursor-pointer`}
          >
            <User className={`w-5 h-5 ${effectiveTheme.text}`} />
          </button>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-4">
          {/* Quick Settings */}
          <div className="mb-6">
            <h3 className={`text-sm font-semibold ${effectiveTheme.textSecondary} uppercase tracking-wide mb-3`}>
              Quick Settings
            </h3>
            <div className={`${effectiveTheme.secondary} rounded-lg border ${effectiveTheme.border} overflow-hidden`}>
              {quickSettings.map((setting, index) => (
                <div
                  key={setting.id}
                  className={`flex items-center justify-between p-4 ${
                    index !== quickSettings.length - 1 ? `border-b ${effectiveTheme.border}` : ''
                  } hover:${effectiveTheme.hover} transition-colors`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg ${effectiveTheme.accent} flex items-center justify-center`}>
                      <setting.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className={`font-medium ${effectiveTheme.text}`}>
                        {setting.title}
                      </h4>
                      <p className={`text-sm ${effectiveTheme.textSecondary}`}>
                        {setting.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <button
                      onClick={() => setting.onChange(!setting.value)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        setting.value ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          setting.value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Business Auto Message Settings - Only for business accounts */}
          {isBusiness && (
            <div className="mb-6">
              <h3 className={`text-sm font-semibold ${effectiveTheme.textSecondary} uppercase tracking-wide mb-3`}>
                Business Auto Message
              </h3>
              <div className={`${effectiveTheme.secondary} rounded-lg border ${effectiveTheme.border} overflow-hidden`}>
                {/* Auto Message Toggle */}
                <div className={`flex items-center justify-between p-4 border-b ${effectiveTheme.border} hover:${effectiveTheme.hover} transition-colors`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg ${effectiveTheme.accent} flex items-center justify-center`}>
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className={`font-medium ${effectiveTheme.text}`}>
                        Auto Message
                      </h4>
                      <p className={`text-sm ${effectiveTheme.textSecondary}`}>
                        Send automatic initial message to new chats
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <button
                      onClick={() => handleAutoMessageEnabledChange(!autoMessageEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoMessageEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoMessageEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Auto Message Text - Show only if enabled */}
                {autoMessageEnabled && (
                  <div className="p-4 space-y-4">
                    {/* Image Upload */}
                    <div>
                      <label className={`block text-sm font-medium ${effectiveTheme.text} mb-2`}>
                        Auto Message Image (Optional)
                      </label>
                      {autoMessageImage ? (
                        <div className="relative inline-block">
                          <img
                            src={autoMessageImage}
                            alt="Auto message preview"
                            className={`w-32 h-32 object-cover rounded-lg border-2 ${effectiveTheme.border}`}
                          />
                          <button
                            onClick={handleRemoveAutoMessageImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            title="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className={`flex items-center justify-center w-32 h-32 border-2 border-dashed ${effectiveTheme.border} rounded-lg cursor-pointer hover:${effectiveTheme.hover} transition-colors`}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAutoMessageImageChange}
                            className="hidden"
                          />
                          <div className="text-center">
                            <Upload className={`w-6 h-6 mx-auto mb-1 ${effectiveTheme.textSecondary}`} />
                            <span className={`text-xs ${effectiveTheme.textSecondary}`}>Upload Image</span>
                          </div>
                        </label>
                      )}
                      <p className={`text-xs ${effectiveTheme.textSecondary} mt-2`}>
                        Max 5MB • JPG, PNG, WebP
                      </p>
                    </div>
                    
                    {/* Text Input */}
                    <div>
                      <label className={`block text-sm font-medium ${effectiveTheme.text} mb-2`}>
                        Auto Message Text (Optional)
                      </label>
                      <textarea
                        value={autoMessageText}
                        onChange={handleAutoMessageTextChange}
                        onBlur={handleAutoMessageTextBlur}
                        placeholder="Enter your automatic message..."
                        className={`w-full px-3 py-2 rounded-lg border ${effectiveTheme.border} ${effectiveTheme.secondary} ${effectiveTheme.text} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                        rows={3}
                        maxLength={500}
                      />
                      <p className={`text-xs ${effectiveTheme.textSecondary} mt-1`}>
                        {autoMessageText.length}/500 characters
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* App Information */}
          <div className="mt-6">
            <h3 className={`text-sm font-semibold ${effectiveTheme.textSecondary} uppercase tracking-wide mb-3`}>
              About
            </h3>
            <div className={`${effectiveTheme.secondary} rounded-lg border ${effectiveTheme.border} p-4`}>
              <div className="flex flex-col items-center mb-4">
                <Logo className="w-32 h-32 mb-2" />
                <p className={`text-sm ${effectiveTheme.textSecondary}`}>Version 1.0.0</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={effectiveTheme.textSecondary}>Build</span>
                  <span className={effectiveTheme.text}>2024.10.08</span>
                </div>
                <div className="flex justify-between">
                  <span className={effectiveTheme.textSecondary}>Platform</span>
                  <span className={effectiveTheme.text}>Web</span>
                </div>
                <div className="flex justify-between">
                  <span className={effectiveTheme.textSecondary}>Storage Used</span>
                  <span className={effectiveTheme.text}>142 MB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 mb-8 text-center">
          </div>
        </div>
      </div>
      </div>
    </motion.div>
  );
};

export default Settings;