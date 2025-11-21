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

const Settings = ({ onClose, effectiveTheme }) => {
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [language, setLanguage] = useState("English");

  const settingsOptions = [
    {
      id: "dtranslate",
      title: "DTranslate",
      description: "Real-time message translation",
      icon: Languages,
      type: "navigate",
      action: () => console.log("DTranslate settings"),
    },
    {
      id: "saritair",
      title: "Saritair",
      description: "Voice and audio settings",
      icon: Volume2,
      type: "navigate", 
      action: () => console.log("Saritair settings"),
    },
    {
      id: "privacy",
      title: "Privacy",
      description: "Control your privacy settings",
      icon: Shield,
      type: "navigate",
      action: () => console.log("Privacy settings"),
    },
    {
      id: "data-storage",
      title: "Data and Storage",
      description: "Manage data usage and storage",
      icon: Database,
      type: "navigate",
      action: () => console.log("Data and Storage settings"),
    },
    {
      id: "help",
      title: "Help",
      description: "Get help and support",
      icon: HelpCircle,
      type: "navigate",
      action: () => console.log("Help center"),
    },
  ];

  const quickSettings = [
    {
      id: "notifications",
      title: "Notifications",
      description: "Enable push notifications",
      icon: Bell,
      type: "toggle",
      value: notifications,
      onChange: setNotifications,
    },
    {
      id: "sound",
      title: "Sound",
      description: "Enable notification sounds",
      icon: soundEnabled ? Volume2 : VolumeX,
      type: "toggle",
      value: soundEnabled,
      onChange: setSoundEnabled,
    },
  ];

  const handleSettingClick = (option) => {
    if (option.type === "navigate") {
      option.action();
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
          
          <div className={`p-2 rounded-lg ${effectiveTheme.hover}`}>
            <User className={`w-5 h-5 ${effectiveTheme.text}`} />
          </div>
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

          {/* Main Settings */}
          <div>
            <h3 className={`text-sm font-semibold ${effectiveTheme.textSecondary} uppercase tracking-wide mb-3`}>
              Settings
            </h3>
            <div className={`${effectiveTheme.secondary} rounded-lg border ${effectiveTheme.border} overflow-hidden`}>
              {settingsOptions.map((option, index) => (
                <motion.button
                  key={option.id}
                  onClick={() => handleSettingClick(option)}
                  whileHover={{ x: 4 }}
                  className={`w-full flex items-center justify-between p-4 text-left ${
                    index !== settingsOptions.length - 1 ? `border-b ${effectiveTheme.border}` : ''
                  } hover:${effectiveTheme.hover} transition-all duration-200`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg ${effectiveTheme.accent} flex items-center justify-center`}>
                      <option.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className={`font-medium ${effectiveTheme.text}`}>
                        {option.title}
                      </h4>
                      <p className={`text-sm ${effectiveTheme.textSecondary}`}>
                        {option.description}
                      </p>
                    </div>
                  </div>
                  
                  <ChevronRight className={`w-5 h-5 ${effectiveTheme.textSecondary}`} />
                </motion.button>
              ))}
            </div>
          </div>

          {/* App Information */}
          <div className="mt-6">
            <h3 className={`text-sm font-semibold ${effectiveTheme.textSecondary} uppercase tracking-wide mb-3`}>
              About
            </h3>
            <div className={`${effectiveTheme.secondary} rounded-lg border ${effectiveTheme.border} p-4`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-12 h-12 rounded-lg ${effectiveTheme.accent} flex items-center justify-center`}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="currentColor"
                      className="text-blue-500"
                    />
                    <path
                      d="M17.5 15.5C17.25 15.25 16.8125 15.0625 16.375 14.875C15.9375 14.6875 15.5625 14.5 15.0625 14.1875C14.5625 13.875 14.1875 13.625 13.8125 13.3125C13.4375 13 13.0625 12.5625 12.75 12.0625C12.5 11.5625 12.25 11.0625 12 10.5625C11.75 10.0625 11.5 9.5625 11.25 9.0625C11 8.5625 10.75 8.125 10.5 7.625C10.25 7.125 10 6.625 9.75 6.125C9.5 5.625 9.25 5.1875 9 4.6875C8.75 4.1875 8.5 3.75 8.25 3.25C8 2.75 7.75 2.25 7.5 1.75C7.25 1.25 7 0.75 6.75 0.25C6.5 0.25 6.25 0.5 6 0.75C5.75 1 5.5 1.25 5.25 1.5C5 1.75 4.75 2 4.5 2.25C4.25 2.5 4 2.75 3.75 3C3.5 3.25 3.25 3.5 3 3.75C2.75 4 2.5 4.25 2.25 4.5C2 4.75 1.75 5 1.5 5.25C1.25 5.5 1 5.75 0.75 6C0.5 6.25 0.25 6.5 0.25 6.75L0.25 6.75Z"
                      fill="white"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className={`font-semibold ${effectiveTheme.text}`}>Chasmos</h4>
                  <p className={`text-sm ${effectiveTheme.textSecondary}`}>Version 1.0.0</p>
                </div>
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
            <p className={`text-xs ${effectiveTheme.textSecondary}`}>
              Made with ❤️ by Chasmos Team
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;