import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Plus,
  Search,
  Users,
  Hash,
  ChevronRight,
  Camera,
  Lock,
  Crown,
  MoreVertical,
} from "lucide-react";
import Logo from "./Logo";

const Community = ({ onClose, effectiveTheme }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // WhatsApp-style status data
  const myStatus = {
    id: "my",
    user: "My Status",
    avatar: null,
    timestamp: "Tap to add status update",
    isMine: true,
    hasStory: false,
  };

  const recentStatuses = [
    {
      id: 2,
      user: "Alice Johnson",
      avatar: null,
      timestamp: "Today, 2:30 PM",
      hasStory: true,
      viewed: false,
    },
    {
      id: 3,
      user: "Bob Smith",
      avatar: null,
      timestamp: "Today, 1:15 PM",
      hasStory: true,
      viewed: false,
    },
  ];

  const viewedStatuses = [
    {
      id: 4,
      user: "Charlie Brown",
      avatar: null,
      timestamp: "Yesterday, 11:20 PM",
      hasStory: true,
      viewed: true,
    },
  ];

  // WhatsApp-style communities
  const communities = [
    {
      id: 1,
      name: "Tech Enthusiasts",
      icon: null,
      lastMessage: "John: Check out this new framework!",
      timestamp: "2:45 PM",
      unread: 5,
      isPrivate: false,
      members: 1234,
    },
    {
      id: 2,
      name: "Photography Club",
      icon: null,
      lastMessage: "Sarah: Amazing shots today 📸",
      timestamp: "Yesterday",
      unread: 0,
      isPrivate: false,
      members: 856,
    },
    {
      id: 3,
      name: "Startup Founders",
      icon: null,
      lastMessage: "Mike: Meeting at 5 PM",
      timestamp: "12/11/24",
      unread: 2,
      isPrivate: true,
      members: 432,
    },
  ];

  // WhatsApp-style channels
  const channels = [
    {
      id: 1,
      name: "Announcements",
      icon: null,
      lastMessage: "Important update about the new feature",
      timestamp: "3:15 PM",
      followers: 5678,
      isAdminOnly: true,
      verified: true,
    },
    {
      id: 2,
      name: "Tech News",
      icon: null,
      lastMessage: "Breaking: New AI model released",
      timestamp: "1:20 PM",
      followers: 3421,
      isAdminOnly: true,
      verified: true,
    },
    {
      id: 3,
      name: "General Discussion",
      icon: null,
      lastMessage: "What do you think about the update?",
      timestamp: "Yesterday",
      followers: 2890,
      isAdminOnly: false,
      verified: false,
    },
  ];

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const StatusItem = ({ status, isMyStatus = false }) => (
    <motion.div
      whileHover={{ backgroundColor: effectiveTheme.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}
      className="flex items-center p-3 cursor-pointer"
    >
      <div className="relative mr-3">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center ${
            status.hasStory
              ? status.viewed
                ? "ring-2 ring-gray-400"
                : "ring-2 ring-green-500"
              : "bg-gray-300 dark:bg-gray-600"
          }`}
        >
          {status.avatar ? (
            <img
              src={status.avatar}
              alt={status.user}
              className="w-full h-full rounded-full object-cover"
            />
          ) : isMyStatus ? (
            <div className="w-full h-full rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <span className={`text-lg font-semibold ${effectiveTheme.textSecondary}`}>
                {getInitials(status.user)}
              </span>
            </div>
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
              {getInitials(status.user)}
            </div>
          )}
        </div>
        {isMyStatus && !status.hasStory && (
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
            <Plus className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`font-medium ${effectiveTheme.text} truncate`}>
          {status.user}
        </h4>
        <p className={`text-sm ${effectiveTheme.textSecondary} truncate`}>
          {status.timestamp}
        </p>
      </div>
    </motion.div>
  );

  const CommunityItem = ({ community }) => (
    <motion.div
      whileHover={{ backgroundColor: effectiveTheme.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}
      className="flex items-center p-3 cursor-pointer"
    >
      <div className="w-12 h-12 mr-3 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0">
        {community.icon ? (
          <img
            src={community.icon}
            alt={community.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <Users className="w-6 h-6 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0 border-b border-gray-200 dark:border-gray-700 pb-3">
        <div className="flex items-center justify-between mb-1">
          <h4 className={`font-medium ${effectiveTheme.text} truncate flex items-center`}>
            {community.name}
            {community.isPrivate && (
              <Lock className="w-3 h-3 ml-1 text-gray-400" />
            )}
          </h4>
          <span className={`text-xs ${effectiveTheme.textSecondary}`}>
            {community.timestamp}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className={`text-sm ${effectiveTheme.textSecondary} truncate flex-1`}>
            {community.lastMessage}
          </p>
          {community.unread > 0 && (
            <span className="ml-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {community.unread}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className={`w-5 h-5 ml-2 ${effectiveTheme.textSecondary}`} />
    </motion.div>
  );

  const ChannelItem = ({ channel }) => (
    <motion.div
      whileHover={{ backgroundColor: effectiveTheme.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}
      className="flex items-center p-3 cursor-pointer"
    >
      <div className="w-12 h-12 mr-3 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
        {channel.icon ? (
          <img
            src={channel.icon}
            alt={channel.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <Hash className="w-6 h-6 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0 border-b border-gray-200 dark:border-gray-700 pb-3">
        <div className="flex items-center justify-between mb-1">
          <h4 className={`font-medium ${effectiveTheme.text} truncate flex items-center`}>
            {channel.name}
            {channel.verified && (
              <svg
                className="w-4 h-4 ml-1 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {channel.isAdminOnly && (
              <Crown className="w-3 h-3 ml-1 text-yellow-500" />
            )}
          </h4>
          <span className={`text-xs ${effectiveTheme.textSecondary}`}>
            {channel.timestamp}
          </span>
        </div>
        <p className={`text-sm ${effectiveTheme.textSecondary} truncate`}>
          {channel.lastMessage}
        </p>
        <p className={`text-xs ${effectiveTheme.textSecondary} mt-1`}>
          {channel.followers.toLocaleString()} followers
        </p>
      </div>
      <ChevronRight className={`w-5 h-5 ml-2 ${effectiveTheme.textSecondary}`} />
    </motion.div>
  );

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`fixed inset-0 ${effectiveTheme.primary} flex flex-col h-screen w-screen z-50`}
    >
      {/* Header - WhatsApp Style */}
      <div className={`${effectiveTheme.secondary} border-b ${effectiveTheme.border}`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3 flex-1">
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
            
            <h2 className={`text-xl font-semibold ${effectiveTheme.text}`}>
              Community
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button className={`p-2 rounded-full hover:${effectiveTheme.hover} transition-colors`}>
              <Camera className={`w-5 h-5 ${effectiveTheme.text}`} />
            </button>
            <button className={`p-2 rounded-full hover:${effectiveTheme.hover} transition-colors`}>
              <Search className={`w-5 h-5 ${effectiveTheme.text}`} />
            </button>
            <button className={`p-2 rounded-full hover:${effectiveTheme.hover} transition-colors`}>
              <MoreVertical className={`w-5 h-5 ${effectiveTheme.text}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Status Section */}
        <div className={`${effectiveTheme.secondary} mb-2`}>
          <div className="flex items-center justify-between p-4 pb-2">
            <h3 className={`text-lg font-semibold ${effectiveTheme.text}`}>
              Status
            </h3>
          </div>

          <StatusItem status={myStatus} isMyStatus={true} />

          {recentStatuses.length > 0 && (
            <>
              <div className={`px-4 py-2 ${effectiveTheme.textSecondary} text-sm font-medium`}>
                Recent updates
              </div>
              {recentStatuses.map((status) => (
                <StatusItem key={status.id} status={status} />
              ))}
            </>
          )}

          {viewedStatuses.length > 0 && (
            <>
              <div className={`px-4 py-2 ${effectiveTheme.textSecondary} text-sm font-medium`}>
                Viewed updates
              </div>
              {viewedStatuses.map((status) => (
                <StatusItem key={status.id} status={status} />
              ))}
            </>
          )}
        </div>

        {/* Communities Section */}
        <div className={`${effectiveTheme.secondary} mb-2`}>
          <div className="flex items-center justify-between p-4 pb-2">
            <h3 className={`text-lg font-semibold ${effectiveTheme.text}`}>
              Communities
            </h3>
            <button className={`p-1 rounded-full hover:${effectiveTheme.hover}`}>
              <Plus className={`w-5 h-5 ${effectiveTheme.text}`} />
            </button>
          </div>
          <div className={`px-4 py-2 ${effectiveTheme.textSecondary} text-xs`}>
            Stay connected with a community — where admins and members can share updates and organize groups
          </div>

          <motion.div
            whileHover={{ backgroundColor: effectiveTheme.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}
            className="flex items-center p-3 cursor-pointer"
          >
            <div className="w-12 h-12 mr-3 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className={`font-medium ${effectiveTheme.text}`}>
                New community
              </h4>
            </div>
            <ChevronRight className={`w-5 h-5 ${effectiveTheme.textSecondary}`} />
          </motion.div>

          {communities.map((community) => (
            <CommunityItem key={community.id} community={community} />
          ))}
        </div>

        {/* Channels Section */}
        <div className={`${effectiveTheme.secondary}`}>
          <div className="flex items-center justify-between p-4 pb-2">
            <h3 className={`text-lg font-semibold ${effectiveTheme.text}`}>
              Channels
            </h3>
            <button className={`p-1 rounded-full hover:${effectiveTheme.hover}`}>
              <Plus className={`w-5 h-5 ${effectiveTheme.text}`} />
            </button>
          </div>
          <div className={`px-4 py-2 ${effectiveTheme.textSecondary} text-xs mb-2`}>
            Follow channels to get updates from people and organizations. Only admins can send messages.
          </div>

          <motion.div
            whileHover={{ backgroundColor: effectiveTheme.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}
            className="flex items-center p-3 cursor-pointer"
          >
            <div className="w-12 h-12 mr-3 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className={`font-medium ${effectiveTheme.text}`}>
                Find channels
              </h4>
            </div>
            <ChevronRight className={`w-5 h-5 ${effectiveTheme.textSecondary}`} />
          </motion.div>

          {channels.map((channel) => (
            <ChannelItem key={channel.id} channel={channel} />
          ))}
        </div>

        <div className="h-20"></div>
      </div>
    </motion.div>
  );
};

export default Community;