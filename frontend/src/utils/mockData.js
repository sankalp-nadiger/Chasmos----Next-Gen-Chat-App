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

export const formatMessageTime = (date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

// Avatar fallback generator
export const generateAvatarFallback = (name) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};