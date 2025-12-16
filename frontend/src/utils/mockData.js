// Mock data for chat application
export const mockContacts = [
  {
    id: 1,
    name: "Alex Johnson",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
    lastMessage: "Hey! How are you doing?",
    timestamp: "2 min ago",
    unreadCount: 2,
    isOnline: true,
    isTyping: false,
  },
  {
    id: 2,
    name: "Sarah Williams",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b789?w=40&h=40&fit=crop&crop=face",
    lastMessage: "Can we schedule a meeting for tomorrow?",
    timestamp: "5 min ago",
    unreadCount: 1,
    isOnline: true,
    isTyping: true,
  },
  {
    id: 3,
    name: "Document",
    avatar: null,
    lastMessage: "ML analysis complete",
    timestamp: "10 min ago",
    unreadCount: 0,
    isOnline: false,
    isTyping: false,
    isDocument: true,
  },
  {
    id: 4,
    name: "Mike Chen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
    lastMessage: "Thanks for the help!",
    timestamp: "1 hour ago",
    unreadCount: 0,
    isOnline: false,
    isTyping: false,
  },
  {
    id: 5,
    name: "Emma Davis",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
    lastMessage: "See you at the conference",
    timestamp: "2 hours ago",
    unreadCount: 3,
    isOnline: true,
    isTyping: false,
  },
  {
    id: 6,
    name: "James Wilson",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
    lastMessage: "Project update sent",
    timestamp: "3 hours ago",
    unreadCount: 0,
    isOnline: false,
    isTyping: false,
  },
  {
    id: 7,
    name: "Lisa Anderson",
    avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=40&h=40&fit=crop&crop=face",
    lastMessage: "Great job on the presentation!",
    timestamp: "Yesterday",
    unreadCount: 0,
    isOnline: true,
    isTyping: false,
  },
  {
    id: 13,
    name: "Robert Brown",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=40&h=40&fit=crop&crop=face",
    lastMessage: "Let's catch up soon!",
    timestamp: "2 days ago",
    unreadCount: 1,
    isOnline: false,
    isTyping: false,
  },
  {
    id: 14,
    name: "Maria Garcia",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=40&h=40&fit=crop&crop=face",
    lastMessage: "Thanks for the feedback",
    timestamp: "3 days ago",
    unreadCount: 0,
    isOnline: true,
    isTyping: false,
  },
  {
    id: 15,
    name: "David Kim",
    avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=40&h=40&fit=crop&crop=face",
    lastMessage: "Meeting rescheduled to 4 PM",
    timestamp: "4 days ago",
    unreadCount: 2,
    isOnline: false,
    isTyping: false,
  },
  {
    id: 16,
    name: "Jennifer Lee",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=40&h=40&fit=crop&crop=face",
    lastMessage: "Great work on the design!",
    timestamp: "5 days ago",
    unreadCount: 0,
    isOnline: true,
    isTyping: false,
  },
  {
    id: 17,
    name: "Michael Taylor",
    avatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=40&h=40&fit=crop&crop=face",
    lastMessage: "Can we schedule a call?",
    timestamp: "1 week ago",
    unreadCount: 3,
    isOnline: false,
    isTyping: false,
  },
  {
    id: 18,
    name: "Amanda White",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=40&h=40&fit=crop&crop=face",
    lastMessage: "The report is ready",
    timestamp: "1 week ago",
    unreadCount: 0,
    isOnline: true,
    isTyping: false,
  },
  {
    id: 19,
    name: "Christopher Davis",
    avatar: "https://images.unsplash.com/photo-1558203728-00f45181dd84?w=40&h=40&fit=crop&crop=face",
    lastMessage: "See you tomorrow",
    timestamp: "1 week ago",
    unreadCount: 1,
    isOnline: false,
    isTyping: false,
  },
  {
    id: 20,
    name: "Jessica Martinez",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face",
    lastMessage: "Project approved!",
    timestamp: "2 weeks ago",
    unreadCount: 0,
    isOnline: true,
    isTyping: false,
  },
  {
    id: 21,
    name: "Daniel Rodriguez",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=40&h=40&fit=crop&crop=face",
    lastMessage: "Thanks for your help",
    timestamp: "2 weeks ago",
    unreadCount: 2,
    isOnline: false,
    isTyping: false,
  },
  {
    id: 22,
    name: "Ashley Johnson",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=40&h=40&fit=crop&crop=face",
    lastMessage: "Looking forward to the event",
    timestamp: "3 weeks ago",
    unreadCount: 0,
    isOnline: true,
    isTyping: false,
  },
  // Groups
  {
    id: 8,
    name: "Development Team",
    avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=40&h=40&fit=crop&crop=face",
    lastMessage: "Code review completed",
    timestamp: "30 min ago",
    unreadCount: 5,
    isOnline: false,
    isTyping: false,
    isGroup: true,
    members: [1, 2, 4, 6], // Alex, Sarah, Mike, James
    admin: 1,
  },
  {
    id: 9,
    name: "Project Alpha",
    avatar: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=40&h=40&fit=crop&crop=face",
    lastMessage: "Meeting at 3 PM today",
    timestamp: "1 hour ago",
    unreadCount: 2,
    isOnline: false,
    isTyping: false,
    isGroup: true,
    members: [2, 5, 7], // Sarah, Emma, Lisa
    admin: 2,
  },
  {
    id: 10,
    name: "Design Team",
    avatar: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=40&h=40&fit=crop&crop=face",
    lastMessage: "New mockups ready for review",
    timestamp: "2 hours ago",
    unreadCount: 1,
    isOnline: false,
    isTyping: false,
    isGroup: true,
    members: [5, 7, 1], // Emma, Lisa, Alex
    admin: 5,
  },
  {
    id: 11,
    name: "Marketing Squad",
    avatar: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=40&h=40&fit=crop&crop=face",
    lastMessage: "Campaign analytics are looking good!",
    timestamp: "4 hours ago",
    unreadCount: 0,
    isOnline: false,
    isTyping: false,
    isGroup: true,
    members: [4, 6, 7], // Mike, James, Lisa
    admin: 6,
  },
  {
    id: 12,
    name: "Study Group",
    avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=40&h=40&fit=crop&crop=face",
    lastMessage: "Next session tomorrow at 7 PM",
    timestamp: "Yesterday",
    unreadCount: 3,
    isOnline: false,
    isTyping: false,
    isGroup: true,
    members: [1, 2, 4, 5, 6, 7], // Almost everyone
    admin: 1,
  },
  // Documents
  {
    id: 13,
    name: "Project Proposal",
    avatar: null,
    lastMessage: "Document updated",
    timestamp: "1 hour ago",
    unreadCount: 0,
    isOnline: false,
    isTyping: false,
    isDocument: true,
  },
  {
    id: 14,
    name: "Meeting Notes",
    avatar: null,
    lastMessage: "Summary added",
    timestamp: "3 hours ago",
    unreadCount: 1,
    isOnline: false,
    isTyping: false,
    isDocument: true,
  },
  {
    id: 15,
    name: "Technical Specs",
    avatar: null,
    lastMessage: "Version 2.1 released",
    timestamp: "1 day ago",
    unreadCount: 0,
    isOnline: false,
    isTyping: false,
    isDocument: true,
  },
  // Community Channels
  {
    id: 16,
    name: "Announcements",
    avatar: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=40&h=40&fit=crop&crop=face",
    lastMessage: "New feature rollout next week",
    timestamp: "2 hours ago",
    unreadCount: 2,
    isOnline: false,
    isTyping: false,
    isCommunity: true,
  },
  {
    id: 17,
    name: "General Discussion",
    avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=40&h=40&fit=crop&crop=face",
    lastMessage: "What's everyone working on today?",
    timestamp: "4 hours ago",
    unreadCount: 5,
    isOnline: false,
    isTyping: false,
    isCommunity: true,
  },
  {
    id: 18,
    name: "Tech Talk",
    avatar: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=40&h=40&fit=crop&crop=face",
    lastMessage: "New JavaScript features discussion",
    timestamp: "6 hours ago",
    unreadCount: 1,
    isOnline: false,
    isTyping: false,
    isCommunity: true,
  },
  {
    id: 19,
    name: "Random",
    avatar: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=40&h=40&fit=crop&crop=face",
    lastMessage: "Anyone up for coffee? ☕",
    timestamp: "8 hours ago",
    unreadCount: 3,
    isOnline: false,
    isTyping: false,
    isCommunity: true,
  },
];

export const mockMessages = {
  1: [
    {
      id: 1,
      type: "text",
      content: "Hey! How are you doing?",
      sender: "other",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      isRead: true,
    },
    {
      id: 2,
      type: "text",
      content: "I'm doing great! Just working on some exciting projects.",
      sender: "me",
      timestamp: new Date(Date.now() - 1 * 60 * 1000),
      isRead: true,
    },
  ],
  2: [
    {
      id: 1,
      type: "text",
      content: "Can we schedule a meeting for tomorrow?",
      sender: "other",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      isRead: true,
    },
    {
      id: 2,
      type: "text",
      content: "Sure! What time works best for you?",
      sender: "me",
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
      isRead: true,
    },
  ],
  3: [
    {
      id: 1,
      type: "document",
      content: "analysis-report.pdf",
      sender: "other",
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      isRead: true,
      documentSize: "2.4 MB",
    },
    {
      id: 2,
      type: "text",
      content: "ML analysis complete. The model shows 94% accuracy on the test dataset.",
      sender: "other",
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      isRead: true,
    },
  ],
  4: [
    {
      id: 1,
      type: "text",
      content: "Thanks for the help with the React component!",
      sender: "other",
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      isRead: true,
    },
    {
      id: 2,
      type: "text",
      content: "You're welcome! Happy to help anytime.",
      sender: "me",
      timestamp: new Date(Date.now() - 58 * 60 * 1000),
      isRead: true,
    },
  ],
  5: [
    {
      id: 1,
      type: "text",
      content: "See you at the conference next week!",
      sender: "other",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: false,
    },
    {
      id: 2,
      type: "text",
      content: "Looking forward to your presentation on AI.",
      sender: "other",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000),
      isRead: false,
    },
    {
      id: 3,
      type: "text",
      content: "Don't forget to book your hotel room!",
      sender: "other",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 60000),
      isRead: false,
    },
  ],
};

// Utility functions
export const formatTime = (date) => {
  const now = new Date();
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  return date.toLocaleDateString();
};

export const formatMessageTime = (timestamp) => {
  if (!timestamp) return "";

  // Handle both Date objects and numeric timestamps
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

  // Fallback if the timestamp is invalid
  if (isNaN(date.getTime())) return "";

  // Format: 10:42 AM
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};


export const searchContacts = (contacts, searchTerm) => {
  if (!searchTerm.trim()) return contacts;
  
  return contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

export const getContactById = (contacts, id) => {
  return contacts.find(contact => contact.id === parseInt(id));
};

export const generateTypingIndicator = () => {
  return Math.random() < 0.3; // 30% chance of someone typing
};

export const generateAvatarFallback = (contact) => {
  const text =
    contact?.name ||
    contact?.username ||
    contact?.chatName ||
    "?";

  return text
    .toString()
    .split(" ")
    .map(word => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};


// Returns the hover label for a message date.
// If the message is within the current week (Monday -> Saturday),
// return the weekday name (e.g. "Monday"). Otherwise return a short
// locale date string like "Apr 12, 2024".
export const formatHoverDate = (timestamp) => {
  if (!timestamp) return "";
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  // If the date is today, return "Today"
  const isSameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  if (isSameDay) return "Today";
  // Compute Monday of current week
  const todayDay = now.getDay(); // 0 (Sun) - 6 (Sat)
  const daysSinceMonday = (todayDay + 6) % 7; // 0 for Mon, 6 for Sun
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - daysSinceMonday);

  // Saturday is monday + 5 days
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  saturday.setHours(23, 59, 59, 999);

  // If date falls between monday and saturday (inclusive), show day name
  if (date >= monday && date <= saturday) {
    return date.toLocaleDateString(undefined, { weekday: "long" });
  }

  // Otherwise show locale short date (month day, year if different)
  const sameYear = date.getFullYear() === now.getFullYear();
  const opts = { month: "short", day: "numeric" };
  if (!sameYear) opts.year = "numeric";
  return date.toLocaleDateString(undefined, opts);
};