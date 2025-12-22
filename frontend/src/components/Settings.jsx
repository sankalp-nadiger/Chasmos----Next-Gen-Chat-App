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