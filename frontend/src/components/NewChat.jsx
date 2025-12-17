/* eslint-disable no-unused-vars */
import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Send,
  Loader2,
  X,
  XCircle,
  MessageCircle,
  Clock,
  UserCheck,
  Users,
  Briefcase,
  Utensils,
  Car,
  Home,
  Stethoscope,
  GraduationCap,
  Palette,
  ShoppingBag,
  Coffee,
  Scissors,
  MapPin,
  ChevronLeft,
  Copy,
} from "lucide-react";
import Logo from "./Logo";
import CosmosBackground from "./CosmosBg";
import { io } from "socket.io-client";

// Business categories mock data
const businessCategories = [
  {
    id: "restaurants",
    label: "Restaurant",
    icon: Utensils,
    color: "bg-orange-500",
  },
  {
    id: "retail",
    label: "Retail Store",
    icon: ShoppingBag,
    color: "bg-pink-500",
  },
  { id: "ecommerce", label: "E-commerce", icon: Users, color: "bg-purple-500" },
  { id: "technology", label: "Technology", icon: Users, color: "bg-blue-500" },
  {
    id: "education",
    label: "Education",
    icon: GraduationCap,
    color: "bg-green-500",
  },
  {
    id: "healthcare",
    label: "Healthcare",
    icon: Stethoscope,
    color: "bg-red-500",
  },
  { id: "finance", label: "Finance", icon: Briefcase, color: "bg-yellow-500" },
  { id: "real-estate", label: "Real Estate", icon: Home, color: "bg-teal-500" },
  {
    id: "travel",
    label: "Travel & Tourism",
    icon: MapPin,
    color: "bg-cyan-500",
  },
  {
    id: "entertainment",
    label: "Entertainment",
    icon: Users,
    color: "bg-indigo-500",
  },
  {
    id: "marketing",
    label: "Marketing & Advertising",
    icon: Users,
    color: "bg-fuchsia-500",
  },
  {
    id: "freelancer",
    label: "Freelancer / Consultant",
    icon: Palette,
    color: "bg-rose-500",
  },
  { id: "other", label: "Other", icon: Users, color: "bg-gray-500" },
];

// const businessContacts = {
//   restaurants: [
//     {
//       id: "rest1",
//       name: "Mario Rossi",
//       avatar:
//         "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=40&h=40&fit=crop&crop=face",
//       title: "Head Chef",
//       business: "Pizza Palace",
//       location: "Downtown",
//       isOnline: true,
//     },
//     {
//       id: "rest2",
//       name: "Sarah Johnson",
//       avatar:
//         "https://images.unsplash.com/photo-1494790108755-2616b612b789?w=40&h=40&fit=crop&crop=face",
//       title: "Restaurant Manager",
//       business: "Burger Barn",
//       location: "Mall Road",
//       isOnline: false,
//     },
//     {
//       id: "rest3",
//       name: "Raj Patel",
//       avatar:
//         "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
//       title: "Owner & Chef",
//       business: "Spice Garden",
//       location: "City Center",
//       isOnline: true,
//     },
//     {
//       id: "rest4",
//       name: "Yuki Tanaka",
//       avatar:
//         "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
//       title: "Sushi Master",
//       business: "Sushi Master",
//       location: "Business District",
//       isOnline: true,
//     },
//   ],
//   automotive: [
//     {
//       id: "auto1",
//       name: "Mike Rodriguez",
//       avatar:
//         "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
//       title: "Lead Mechanic",
//       business: "QuickFix Garage",
//       location: "Industrial Area",
//       isOnline: false,
//     },
//     {
//       id: "auto2",
//       name: "Lisa Chen",
//       avatar:
//         "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
//       title: "Service Manager",
//       business: "Elite Car Wash",
//       location: "Highway",
//       isOnline: true,
//     },
//     {
//       id: "auto3",
//       name: "Tom Wilson",
//       avatar:
//         "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=40&h=40&fit=crop&crop=face",
//       title: "Parts Specialist",
//       business: "AutoParts Plus",
//       location: "Main Street",
//       isOnline: true,
//     },
//   ],
//   "real-estate": [
//     {
//       id: "real1",
//       name: "Jennifer Smith",
//       avatar:
//         "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=40&h=40&fit=crop&crop=face",
//       title: "Senior Agent",
//       business: "Dream Homes Realty",
//       location: "City Center",
//       isOnline: true,
//     },
//     {
//       id: "real2",
//       name: "David Kumar",
//       avatar:
//         "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=40&h=40&fit=crop&crop=face",
//       title: "Property Developer",
//       business: "Urban Properties",
//       location: "Downtown",
//       isOnline: false,
//     },
//     {
//       id: "real3",
//       name: "Amanda Garcia",
//       avatar:
//         "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=40&h=40&fit=crop&crop=face",
//       title: "Rental Coordinator",
//       business: "Rent Easy",
//       location: "University Area",
//       isOnline: true,
//     },
//   ],
//   healthcare: [
//     {
//       id: "health1",
//       name: "Dr. Robert Adams",
//       avatar:
//         "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=40&h=40&fit=crop&crop=face",
//       title: "Cardiologist",
//       business: "City Medical Center",
//       location: "Medical District",
//       isOnline: false,
//     },
//     {
//       id: "health2",
//       name: "Dr. Emily Zhang",
//       avatar:
//         "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=40&h=40&fit=crop&crop=face",
//       title: "Dentist",
//       business: "Dental Care Plus",
//       location: "Suburb",
//       isOnline: true,
//     },
//     {
//       id: "health3",
//       name: "pharmacist John Lee",
//       avatar:
//         "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=40&h=40&fit=crop&crop=face",
//       title: "Pharmacist",
//       business: "Wellness Pharmacy",
//       location: "Mall",
//       isOnline: true,
//     },
//   ],
//   education: [
//     {
//       id: "edu1",
//       name: "Prof. Alex Thompson",
//       avatar:
//         "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
//       title: "Tech Instructor",
//       business: "TechSkills Academy",
//       location: "Tech Park",
//       isOnline: true,
//     },
//     {
//       id: "edu2",
//       name: "Maria Gonzalez",
//       avatar:
//         "https://images.unsplash.com/photo-1494790108755-2616b612b789?w=40&h=40&fit=crop&crop=face",
//       title: "Language Teacher",
//       business: "Language Masters",
//       location: "City Center",
//       isOnline: false,
//     },
//     {
//       id: "edu3",
//       name: "Chris Park",
//       avatar:
//         "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
//       title: "Tutor Coordinator",
//       business: "Kids Learning Hub",
//       location: "Residential Area",
//       isOnline: true,
//     },
//   ],
//   beauty: [
//     {
//       id: "beauty1",
//       name: "Sophia Martinez",
//       avatar:
//         "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
//       title: "Hair Stylist",
//       business: "Glamour Salon",
//       location: "Shopping District",
//       isOnline: true,
//     },
//     {
//       id: "beauty2",
//       name: "Nina Petrov",
//       avatar:
//         "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=40&h=40&fit=crop&crop=face",
//       title: "Spa Therapist",
//       business: "Spa Retreat",
//       location: "Luxury Area",
//       isOnline: false,
//     },
//     {
//       id: "beauty3",
//       name: "Carlos Rivera",
//       avatar:
//         "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
//       title: "Master Barber",
//       business: "Quick Cuts",
//       location: "Downtown",
//       isOnline: true,
//     },
//   ],
//   retail: [
//     {
//       id: "retail1",
//       name: "Ashley Brown",
//       avatar:
//         "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=40&h=40&fit=crop&crop=face",
//       title: "Fashion Consultant",
//       business: "Fashion Forward",
//       location: "Mall",
//       isOnline: true,
//     },
//     {
//       id: "retail2",
//       name: "Kevin Wang",
//       avatar:
//         "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=40&h=40&fit=crop&crop=face",
//       title: "Tech Sales Expert",
//       business: "Electronics Hub",
//       location: "Tech Street",
//       isOnline: true,
//     },
//     {
//       id: "retail3",
//       name: "Rachel Green",
//       avatar:
//         "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=40&h=40&fit=crop&crop=face",
//       title: "Home Design Specialist",
//       business: "Home & Garden",
//       location: "Suburban Plaza",
//       isOnline: false,
//     },
//   ],
//   cafe: [
//     {
//       id: "cafe1",
//       name: "Jake Morrison",
//       avatar:
//         "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=40&h=40&fit=crop&crop=face",
//       title: "Head Barista",
//       business: "Brew & Bite",
//       location: "University Area",
//       isOnline: true,
//     },
//     {
//       id: "cafe2",
//       name: "Emma Davis",
//       avatar:
//         "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
//       title: "Cafe Manager",
//       business: "Morning Glory Cafe",
//       location: "Business District",
//       isOnline: false,
//     },
//     {
//       id: "cafe3",
//       name: "Sam Taylor",
//       avatar:
//         "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
//       title: "Night Shift Supervisor",
//       business: "Night Owl Coffee",
//       location: "Downtown",
//       isOnline: true,
//     },
//   ],
// };

// API Base URL from environment variable
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// Helper to format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "Last seen recently";
  const date = new Date(timestamp);
  const now = new Date();
  const diff = (now - date) / 1000; // seconds

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;

  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};

const NewChat = ({
  effectiveTheme = {},
  onClose,
  onStartChat,
  existingContacts = [],
  // optional realtime presence passed from parent (ChattingPage)
  onlineUsers: parentOnlineUsers = null,
  groupOnlineCounts: parentGroupOnlineCounts = null,
}) => {
  const [allContacts, setAllContacts] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [groupOnlineCounts, setGroupOnlineCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBusinessCategory, setSelectedBusinessCategory] =
    useState(null);
  const [activeSection, setActiveSection] = useState("contacts"); // 'contacts', 'users', 'business'

  const [businessUsers, setBusinessUsers] = useState([]);
  const [businessCategoryCounts, setBusinessCategoryCounts] = useState({});

  // Get current user email once for all contacts
  let currentUserEmail = "";
  try {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    currentUserEmail = userInfo?.email || userInfo?.user?.email || "";
  } catch (err) {
    console.error("Failed to get current user email", err);
  }

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem("token");

        // 1️⃣ Fetch normal users (NON business)
        const usersRes = await fetch(`${API_BASE_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const users = await usersRes.json();

        const normalUsers = users
          .filter((u) => !u.isBusiness) // ❗ EXCLUDE BUSINESS USERS
          .map((u) => ({
            id: u._id,
            name: u.name,
            email: u.email,
            avatar: u.avatar,
            isOnline: Math.random() < 0.5,
            type: "user",
            bio: u.bio || "",
            acceptedChatRequests: u.acceptedChatRequests || [],
          }));
        console.log("Formatted Users:", formattedUsers);
        // Build lookup maps for fast matching
        const byId = new Map();
        const byEmail = new Map();
        const byPhone = new Map();
        formattedUsers.forEach((u) => {
          if (u.id) byId.set(String(u.id), u);
          if (u.email) byEmail.set(String(u.email).toLowerCase(), u);
          if (u._rawPhone) byPhone.set(u._rawPhone, u);
        });

        // 2️⃣ Fetch business users
        // 2️⃣ Fetch business users
        const bizRes = await fetch(`${API_BASE_URL}/api/user/business`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const bizData = await bizRes.json();

        setBusinessUsers(
          bizData.businesses.map((b) => ({
            id: b._id,
            name: b.name,
            email: b.email,
            avatar: b.avatar,
            title: b.title,
            business: b.businessName,
            location: b.location,
            businessCategory: b.businessCategory,
            isOnline: b.isOnline,
            type: "business",
            acceptedChatRequests: b.acceptedChatRequests || [],
            sentChatRequests: b.sentChatRequests || [],
            receivedChatRequests: b.receivedChatRequests || [],
          }))
        );

        setBusinessCategoryCounts(bizData.categoryCounts || {});

        // Existing contact logic preserved
        const knownContacts = normalUsers.filter((u) =>
          existingContacts.some((c) => c.id === u.id)
        );
        const newUsers = normalUsers.filter(
          (u) => !existingContacts.some((c) => c.id === u.id)
        );

        setAllContacts(knownContacts);
        setRegisteredUsers(newUsers);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // If parent does not provide realtime presence, create a socket connection here
  useEffect(() => {
    if (parentOnlineUsers) return; // parent supplies presence
    let sock = null;
    try {
      const userData = JSON.parse(
        localStorage.getItem("chasmos_user_data") || "{}"
      );
      // helper to apply online flags into current contact lists
      const applyOnlineFlags = (arr) => {
        try {
          const s = new Set((arr || []).map((a) => String(a)));
          setOnlineUsers(s);
          setAllContacts((prev) =>
            prev.map((c) => ({
              ...c,
              isOnline:
                Boolean(c.isOnline) ||
                s.has(String(c.id)) ||
                (c.email && s.has(String(c.email))) ||
                false,
            }))
          );
          setRegisteredUsers((prev) =>
            prev.map((c) => ({
              ...c,
              isOnline:
                Boolean(c.isOnline) ||
                s.has(String(c.id)) ||
                (c.email && s.has(String(c.email))) ||
                false,
            }))
          );
        } catch (e) {
          console.error("applyOnlineFlags error", e);
        }
      };

      sock = io(API_BASE_URL, {
        transports: ["websocket"],
        withCredentials: true,
      });
      sock.on("connect", () => {
        sock.emit("setup", userData);
      });

      sock.on("online users", (arr) => {
        applyOnlineFlags(arr);
      });
      sock.on("user online", ({ userId }) => {
        applyOnlineFlags([userId]);
      });
      sock.on("user offline", ({ userId }) => {
        try {
          setOnlineUsers((prev) => {
            const s = new Set(prev);
            s.delete(String(userId));
            return s;
          });
          // mark offline in lists
          setAllContacts((prev) =>
            prev.map((c) => {
              if (
                String(c.id) === String(userId) ||
                (c.email && String(c.email) === String(userId))
              ) {
                return { ...c, isOnline: false };
              }
              return c;
            })
          );
          setRegisteredUsers((prev) =>
            prev.map((c) => {
              if (
                String(c.id) === String(userId) ||
                (c.email && String(c.email) === String(userId))
              ) {
                return { ...c, isOnline: false };
              }
              return c;
            })
          );
        } catch (e) {}
      });

      sock.on("group online count", ({ chatId, onlineCount }) => {
        try {
          if (!chatId) return;
          setGroupOnlineCounts((prev) => ({
            ...(prev || {}),
            [String(chatId)]: Number(onlineCount || 0),
          }));
        } catch (e) {}
      });
    } catch (e) {
      console.error("NewChat socket init failed", e);
    }

    return () => {
      if (sock) sock.disconnect();
    };
  }, [parentOnlineUsers]);

  const filteredAllContacts = useMemo(
    () =>
      allContacts.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [allContacts, searchTerm]
  );

  const filteredRegisteredUsers = useMemo(
    () =>
      registeredUsers.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [registeredUsers, searchTerm]
  );

  const filteredBusinessContacts = useMemo(() => {
    if (!selectedBusinessCategory) return [];

    // 1️⃣ Include logged-in user in this category unconditionally
    const selfInCategory = businessUsers.find(
      (b) =>
        b.businessCategory === selectedBusinessCategory.id &&
        b.email.toLowerCase() === currentUserEmail.toLowerCase()
    );

    // 2️⃣ Include other users who match the search term
    const othersInCategory = businessUsers.filter(
      (b) =>
        b.businessCategory === selectedBusinessCategory.id &&
        b.email.toLowerCase() !== currentUserEmail.toLowerCase() &&
        (b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.business?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.title?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // 3️⃣ Combine: self first, then others
    return selfInCategory
      ? [selfInCategory, ...othersInCategory]
      : othersInCategory;
  }, [businessUsers, selectedBusinessCategory, searchTerm, currentUserEmail]);

  // Open chat UI for contact, but only set as pending if no chatId exists
  const handleStartChat = (contact) => {
    // Always provide userId for ChattingPage profile logic
    let userId =
      contact.userId ||
      contact._id ||
      contact.id ||
      contact.participantId ||
      contact.email;
    // If contact is a chat (has chatId or id of length 24), open as normal chat
    if (contact.chatId || (contact.id && String(contact.id).length === 24)) {
      onStartChat({ ...contact, isPendingChat: false, userId });
    } else {
      onStartChat({ ...contact, isPendingChat: true, userId });
    }
    onClose();
  };

  // Create or access a one-to-one chat via backend then open it
  const openOneToOneChat = async (contact) => {
    // Do not create a chat on click — open as pending unless a real chat id exists.
    try {
      const userId = contact.id || contact._id || contact.email;
      // If contact already has a chatId (or a DB-like id), treat as existing chat and open normally
      if (contact.chatId || (contact.id && String(contact.id).length === 24)) {
        handleStartChat({ ...contact, isPendingChat: false, userId });
        return;
      }

      // Otherwise, open a pending chat locally. The real chat will be created only when the user sends the first message.
      handleStartChat({ ...contact, isPendingChat: true, userId });
    } catch (err) {
      console.error("openOneToOneChat error:", err);
      handleStartChat(contact);
    }
  };

  const handleBusinessCategoryClick = (category) => {
    setSelectedBusinessCategory(category);
  };

  const handleBackToBusinessCategories = () => {
    setSelectedBusinessCategory(null);
  };

  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`fixed inset-0 ${effectiveTheme.primary || "bg-white"} flex flex-col h-screen w-screen z-50`}
    >
      {/* Header */}
      <div
        className={`${effectiveTheme.secondary || "bg-gray-100"} border-b ${effectiveTheme.border || "border-gray-300"} p-4`}
      >
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className={`p-2 rounded-full hover:${effectiveTheme.hover || "bg-gray-200"} transition-colors`}
          >
            <X
              className={`w-5 h-5 ${effectiveTheme.text || "text-gray-900"}`}
            />
          </button>

          {/* Chasmos Logo and Name */}
          <div className="flex items-center space-x-2">
            <Logo
              size="md"
              showText={true}
              textClassName={effectiveTheme.text || "text-gray-900"}
            />
          </div>

          <div
            className={`hidden sm:block border-l ${effectiveTheme.border || "border-gray-300"} h-8 mx-2`}
          ></div>

          <div className="hidden sm:block">
            <h2
              className={`text-lg font-semibold ${effectiveTheme.text || "text-gray-900"}`}
            >
              New Chat
            </h2>
            <p
              className={`text-sm ${effectiveTheme.textSecondary || "text-gray-500"}`}
            >
              {selectedBusinessCategory
                ? `${selectedBusinessCategory.name} - ${filteredBusinessContacts.length} users`
                : `${filteredAllContacts.length + filteredRegisteredUsers.length} users available`}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 flex-shrink-0">
        <div
          className={`relative ${effectiveTheme.searchBg || "bg-gray-100"} rounded-lg`}
        >
          <Search
            className={`absolute left-3 top-3 w-4 h-4 ${effectiveTheme.textSecondary || "text-gray-500"}`}
          />
          <input
            type="text"
            placeholder={
              selectedBusinessCategory
                ? "Search business users..."
                : "Search contacts..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 bg-transparent ${effectiveTheme.text || "text-gray-900"} placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
          />
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex border-b px-4">
        <button
          onClick={() => {
            setActiveSection("contacts");
            setSelectedBusinessCategory(null);
          }}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeSection === "contacts"
              ? "border-blue-500 text-blue-600"
              : `border-transparent ${effectiveTheme.textSecondary || "text-gray-500"} hover:text-gray-700`
          }`}
        >
          Contacts & Users
        </button>
        <button
          onClick={() => {
            setActiveSection("business");
            setSelectedBusinessCategory(null);
          }}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeSection === "business"
              ? "border-blue-500 text-blue-600"
              : `border-transparent ${effectiveTheme.textSecondary || "text-gray-500"} hover:text-gray-700`
          }`}
        >
          Business Directory
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-hidden">
        {/* Combined Contacts & Users Section */}
        {activeSection === "contacts" && (
          <div className="h-full flex">
            {/* Left Side - All Contacts (50%) */}
            <div className="w-1/2 border-r overflow-y-auto p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Users
                  className={`w-5 h-5 ${effectiveTheme.textSecondary || "text-gray-500"}`}
                />
                <h3
                  className={`font-medium ${effectiveTheme.text || "text-gray-900"}`}
                >
                  Your Contacts ({filteredAllContacts.length})
                </h3>
              </div>

              {filteredAllContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <MessageCircle
                    className={`w-16 h-16 ${effectiveTheme.textSecondary || "text-gray-400"} mb-4`}
                  />
                  <p
                    className={`${effectiveTheme.text || "text-gray-900"} text-center`}
                  >
                    {searchTerm
                      ? "No contacts found matching your search"
                      : "No contacts available"}
                  </p>
                </div>
              ) : (
                (() => {
                  return filteredAllContacts.map((contact) => (
                    <ContactItem
                      key={contact.id}
                      contact={contact}
                      effectiveTheme={effectiveTheme}
                      onClick={() => {}}
                      showLastSeen
                      token={localStorage.getItem("token")}
                      currentUserEmail={currentUserEmail}
                    />
                  ));
                })()
              )}
            </div>

            {/* Right Side - New Users (50%) */}
            <div className="w-1/2 overflow-y-auto p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Users
                  className={`w-5 h-5 ${effectiveTheme.textSecondary || "text-gray-500"}`}
                />
                <h3
                  className={`font-medium ${effectiveTheme.text || "text-gray-900"}`}
                >
                  All Users on Platform ({filteredRegisteredUsers.length})
                </h3>
              </div>

              {filteredRegisteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <MessageCircle
                    className={`w-16 h-16 ${effectiveTheme.textSecondary || "text-gray-400"} mb-4`}
                  />
                  <p
                    className={`${effectiveTheme.text || "text-gray-900"} text-center`}
                  >
                    {searchTerm
                      ? "No users found matching your search"
                      : "All users are already in your contacts"}
                  </p>
                </div>
              ) : (
                (() => {
                  let userEmail = "";
                  try {
                    const userInfo = JSON.parse(
                      localStorage.getItem("userInfo")
                    );
                    userEmail = userInfo?.email || userInfo?.user?.email || "";
                  } catch {}
                  return filteredRegisteredUsers.map((user) => (
                    <ContactItem
                      key={user.id}
                      contact={user}
                      effectiveTheme={effectiveTheme}
                      showLastSeen
                      onClick={() => openOneToOneChat(user)}
                      token={localStorage.getItem("token")}
                      currentUserEmail={currentUserEmail}
                    />
                  ));
                })()
              )}
            </div>
          </div>
        )}

        {/* Business Directory Section */}
        {activeSection === "business" && (
          <div className="h-full overflow-y-auto p-4">
            {!selectedBusinessCategory ? (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Briefcase
                    className={`w-5 h-5 ${effectiveTheme.textSecondary || "text-gray-500"}`}
                  />
                  <h3
                    className={`font-medium ${effectiveTheme.text || "text-gray-900"}`}
                  >
                    Business Categories
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {businessCategories
                    .filter(
                      (category) => businessCategoryCounts[category.id] > 0
                    )
                    .map((category) => (
                      <motion.div
                        key={category.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleBusinessCategoryClick(category)}
                        className={`${effectiveTheme.secondary || "bg-gray-50"} border ${
                          effectiveTheme.border || "border-gray-200"
                        } rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200`}
                      >
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${
                            effectiveTheme.secondary || "bg-gray-200"
                          }`}
                        >
                          <category.icon
                            className={`w-6 h-6 ${effectiveTheme.text || "text-gray-900"}`}
                          />
                        </div>

                        <h4
                          className={`font-semibold ${effectiveTheme.text || "text-gray-900"} mb-1`}
                        >
                          {category.name}
                        </h4>
                        <p
                          className={`text-sm ${effectiveTheme.textSecondary || "text-gray-500"}`}
                        >
                          {category.label}
                        </p>
                        <p className="text-xs mt-2">
                          {businessCategoryCounts[category.id] || 0} businesses
                        </p>
                      </motion.div>
                    ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <button
                    onClick={handleBackToBusinessCategories}
                    className={`p-1 rounded hover:${effectiveTheme.hover || "bg-gray-200"} transition-colors`}
                  >
                    <ChevronLeft
                      className={`w-5 h-5 ${effectiveTheme.text || "text-gray-900"}`}
                    />
                  </button>
                  <selectedBusinessCategory.icon
                    className={`w-5 h-5 ${effectiveTheme.textSecondary || "text-gray-500"}`}
                  />
                  <h3
                    className={`font-medium ${effectiveTheme.text || "text-gray-900"}`}
                  >
                    {selectedBusinessCategory.name} Users
                  </h3>
                </div>

                {filteredBusinessContacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8">
                    <MessageCircle
                      className={`w-16 h-16 ${effectiveTheme.textSecondary || "text-gray-400"} mb-4`}
                    />
                    <p
                      className={`${effectiveTheme.text || "text-gray-900"} text-center`}
                    >
                      {searchTerm
                        ? "No business users found matching your search"
                        : "No other users in this category"}
                    </p>
                  </div>
                ) : (
                  filteredBusinessContacts.map((business) => (
                    <ContactItem
                      key={business.id}
                      contact={business}
                      effectiveTheme={effectiveTheme}
                      onClick={() => handleStartChat(business)}
                      token={localStorage.getItem("token")}
                      currentUserEmail={currentUserEmail}
                      showLastSeen
                      isSelf={
                        business.email.toLowerCase() ===
                        currentUserEmail.toLowerCase()
                      }
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

//Contacts appearing in new chat page
const ContactItem = ({
  contact,
  effectiveTheme,
  onClick,
  showLastSeen,
  token,
  currentUserEmail,
  isSelf,
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [inviteStatus, setInviteStatus] = useState("idle");
  const [chatStatus, setChatStatus] = useState("none");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [showSharePopup, setShowSharePopup] = useState(false);

  // Fetch chat status only (acceptedChatRequests is now in contact)
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL} api/user/request/status/${contact.email}?type=${contact.type}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setChatStatus(data.status);
      } catch (err) {
        console.error("Failed to fetch chat status:", err);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [contact.email, token]);

  // Show chat icon if my email is in contact's acceptedChatRequests (case-insensitive)
  // const myEmailLower = currentUserEmail ? currentUserEmail.toLowerCase() : "";
  // const isMyEmailAcceptedByContact = myEmailLower && (contact.acceptedChatRequests || []).some(e => (e || "").toLowerCase() === myEmailLower);
  // const canSendInvite = chatStatus === "none" && !isMyEmailAcceptedByContact;

  const myEmailLower = currentUserEmail?.toLowerCase() || "";
  let status = "none";

  if (
    (contact.acceptedChatRequests || []).some(
      (e) => (e || "").toLowerCase() === myEmailLower
    )
  ) {
    status = "accepted";
  } else if (
    (contact.sentChatRequests || []).some(
      (e) => (e.email || "").toLowerCase() === myEmailLower
    )
  ) {
    status = "outgoing";
  } else if (
    (contact.receivedChatRequests || []).some(
      (e) => (e.email || "").toLowerCase() === myEmailLower
    )
  ) {
    status = "incoming";
  }

  // Determine if my email is accepted by contact
  const isMyEmailAcceptedByContact = (contact.acceptedChatRequests || []).some(
    (e) => (e || "").toLowerCase() === myEmailLower
  );

  const canSendInvite = chatStatus === "none" && !isMyEmailAcceptedByContact;

  // ------------------- Socket Listener -------------------
  //  useEffect(() => {
  //   if (!socketRef.current) return;

  //   const handleChatAccepted = ({ senderEmail, receiverEmail }) => {
  //     if (contact.email === senderEmail || contact.email === receiverEmail) {
  //       setChatStatus("accepted");
  //     }
  //   };

  //   socketRef.current.on("chatAccepted", handleChatAccepted);

  //   return () => {
  //     socketRef.current.off("chatAccepted", handleChatAccepted);
  //   };
  // }, [contact.email]);

  // ------------------- Send Invite -------------------
  const handleSendInvite = async () => {
    try {
      setSending(true);
      await fetch(`${API_BASE_URL}/api/user/request/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientEmail: contact.email,
          inviteMessage,
          requestType: contact.type,
        }),
      });

      setInviteStatus("sent");
      setChatStatus("outgoing");
    } catch {
      setInviteStatus("sent");
    } finally {
      setSending(false);
    }
  };

  // ------------------- Withdraw Invite -------------------
  const handleWithdrawInvite = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/user/request/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientEmail: contact.email,
          requestType: contact.type,
        }),
      });

      setInviteStatus("idle");
      setChatStatus("none");
      setShowInviteModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  // ------------------- Accept Invite -------------------
  const handleAcceptInvite = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !contact || !contact.email) {
        console.error("Missing token or contact info", { token, contact });
        return;
      }
      console.log("Sending accept invite POST", { token, contact });
      const res = await fetch(`${API_BASE_URL}/api/user/request/accept`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderEmail: contact.email,
          requestType: contact.type,
        }),
      });
      const data = await res.json();

      setChatStatus("accepted");
      setShowInviteModal(false);

      // Notify sender in real-time
      if (typeof socket !== "undefined" && socket?.emit) {
        socket.emit("chatAccepted", {
          senderEmail: contact.email,
          receiverEmail: currentUserEmail,
        });
      }
    } catch (err) {
      console.error("Error accepting invite:", err);
    }
  };

  // ------------------- Open Chat -------------------
  const handleOpenChat = () => {
    onClick(contact); // Make sure your ChatWindow receives contact info
  };

  return (
    <>
      {/* Contact Row */}
      <motion.div
        whileHover={{ x: 4 }}
        className={`flex items-center justify-between p-4 border-b
        ${effectiveTheme.border || "border-gray-300"}
        hover:${effectiveTheme.hover || "bg-gray-100"}`}
      >
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <img
            src={
              contact.avatar ||
              "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
            }
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold truncate">
              {contact.name}{" "}
              {isSelf && (
                <span className="text-xs text-blue-500 ml-1">(You)</span>
              )}
            </h3>
            {showLastSeen && (
              <span className="text-xs text-gray-500">
                {contact.isOnline ? "Online" : "Offline"}
              </span>
            )}
          </div>
        </div>

        {/* LEFT ACTION (for contacts list) */}
        {leftActionType && (
          <div className="flex items-center mr-3">
            {leftActionType === "chat" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (typeof onLeftAction === "function") onLeftAction(contact);
                }}
                className="p-2 rounded-full hover:bg-green-500/20"
                title="Start Chat"
              >
                <MessageCircle className="w-5 h-5 text-green-500" />
              </button>
            )}

            {leftActionType === "copy" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSharePopup(true);
                }}
                className="p-2 rounded-full hover:bg-blue-500/20"
                title={copyFeedback || "Copy invite link"}
              >
                <Copy className="w-5 h-5 text-blue-500" />
              </button>
            )}
          </div>
        )}

        {/* RIGHT ICONS (consolidated into a single action column) */}
        {!hideRightActions && (
          <div className="flex items-center space-x-2">
            {chatStatus === "accepted" ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenChat();
                }}
                className="p-2 rounded-full hover:bg-green-500/20"
                title="Open Chat"
              >
                <MessageCircle className="w-5 h-5 text-green-500" />
              </button>
            ) : chatStatus === "outgoing" ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInviteStatus("sent");
                  setShowInviteModal(true);
                }}
                className="p-2 rounded-full hover:bg-yellow-500/20"
                title="Invite pending"
              >
                <Clock className="w-5 h-5 text-yellow-500" />
              </button>
            ) : chatStatus === "incoming" ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInviteStatus("incoming");
                  setShowInviteModal(true);
                }}
                className="p-2 rounded-full hover:bg-orange-500/20"
                title="Incoming request"
              >
                <Clock className="w-5 h-5 text-orange-500" />
              </button>
            ) : (
              // default: no existing request -> show send (airplane) to invite
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInviteStatus("idle");
                  setShowInviteModal(true);
                }}
                className="p-2 rounded-full hover:bg-blue-500/20"
                title="Send invite"
              >
                <Send className="w-5 h-5 text-blue-500" />
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            <CosmosBackground opacity={0.28} theme="light" />
          </div>
          {/* White soft overlay above the cosmos background to create a day/light frosted effect */}
          <div
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ background: "rgba(255,255,255,0.9)" }}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`relative w-full max-w-md rounded-2xl p-6 shadow-xl ${effectiveTheme.secondary || "bg-white"}`}
            style={{ zIndex: 10 }}
          >
            {/* Header */}

            <div className="flex justify-between mb-4">
              <div>
                <h2 className="font-semibold text-lg">{contact.name}</h2>
                {contact.bio && (
                  <p className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                    {contact.bio}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-full hover:bg-red-500/20 transition"
              >
                <XCircle className="w-5 h-5 text-gray-400 hover:text-red-500" />
              </button>
            </div>

            {/* OUTGOING / INCOMING / IDLE */}
            {inviteStatus === "sent" && (
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-300">
                <p className="text-sm font-medium">Invite pending</p>
                <p className="text-xs text-gray-500">
                  Waiting for {contact.name} to accept
                </p>
              </div>
            )}

            {inviteStatus === "incoming" && (
              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-300">
                <p className="text-sm font-medium">Incoming request</p>
                <p className="text-xs text-gray-500">
                  {contact.name} has already sent you a request
                </p>
                <div className="flex justify-end mt-4 gap-2">
                  <button
                    onClick={handleAcceptInvite}
                    className="px-4 py-2 rounded-xl bg-green-600 text-white"
                  >
                    Accept
                  </button>
                </div>
              </div>
            )}

            {inviteStatus === "idle" && (
              <textarea
                rows="3"
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Add an optional message..."
                className={`w-full mt-4 p-3 rounded-xl border resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${document.documentElement.classList.contains("dark") ? "bg-gray-800 text-gray-100 border-gray-600 placeholder-gray-500" : "bg-white text-gray-900 border-gray-300 placeholder-gray-400"}`}
              />
            )}

            {/* Footer */}
            <div className="flex justify-end mt-6 gap-2">
              {inviteStatus === "sent" && (
                <button
                  onClick={handleWithdrawInvite}
                  className="px-4 py-2 rounded-xl border border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  Withdraw
                </button>
              )}
              {inviteStatus === "idle" && (
                <>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl border hover:bg-red-500/10 hover:text-red-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendInvite}
                    disabled={sending}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white flex items-center gap-2"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send Invite
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Share Link Popup - Only for Your Contacts */}
      {showSharePopup && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          onClick={() => setShowSharePopup(false)}
        >
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            <CosmosBackground opacity={0.22} theme="light" />
          </div>
          <div
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ background: "rgba(255,255,255,0.88)" }}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-2xl p-5 ${effectiveTheme.secondary || "bg-white"} shadow-2xl`}
            style={{ zIndex: 10 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3
                  className={`font-semibold ${effectiveTheme.text || "text-gray-900"}`}
                >
                  Share Chasmos
                </h3>
                <p
                  className={`text-sm ${effectiveTheme.textSecondary || "text-gray-500"}`}
                >
                  Share this link to invite others
                </p>
              </div>
              <button
                onClick={() => setShowSharePopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <div
                className={`flex-1 p-3 rounded-md border ${effectiveTheme.border || "border-gray-300"} ${effectiveTheme.primary || "bg-white"} text-sm break-words ${effectiveTheme.text || "text-gray-900"}`}
              >
                chasmos.netlify.app
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const link = "https://chasmos.netlify.app";
                  try {
                    if (
                      navigator &&
                      navigator.clipboard &&
                      navigator.clipboard.writeText
                    ) {
                      await navigator.clipboard.writeText(link);
                    } else {
                      const el = document.createElement("textarea");
                      el.value = link;
                      document.body.appendChild(el);
                      el.select();
                      document.execCommand("copy");
                      document.body.removeChild(el);
                    }
                    setCopyFeedback("Copied");
                    setTimeout(() => setCopyFeedback(""), 2000);
                  } catch (err) {
                    setCopyFeedback("Failed");
                    setTimeout(() => setCopyFeedback(""), 2000);
                  }
                }}
                className={`px-3 py-2 ${effectiveTheme.accent || "bg-blue-600"} text-white rounded-md hover:opacity-90 whitespace-nowrap transition-all`}
              >
                {copyFeedback || "Copy"}
              </button>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowSharePopup(false)}
                className={`px-3 py-2 text-sm rounded-md ${effectiveTheme.secondary || "bg-gray-200"} ${effectiveTheme.text || "text-gray-900"} hover:opacity-80 transition-all`}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default NewChat;
