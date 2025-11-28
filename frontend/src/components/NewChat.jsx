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
} from "lucide-react";
import Logo from "./Logo";

// Business categories mock data
const businessCategories = [
  {
    id: "restaurants",
    name: "Restaurants",
    icon: Utensils,
    color: "bg-orange-500",
    description: "Food & Dining",
  },
  {
    id: "automotive",
    name: "Automotive",
    icon: Car,
    color: "bg-blue-500",
    description: "Car Services",
  },
  {
    id: "real-estate",
    name: "Real Estate",
    icon: Home,
    color: "bg-green-500",
    description: "Property Services",
  },
  {
    id: "healthcare",
    name: "Healthcare",
    icon: Stethoscope,
    color: "bg-red-500",
    description: "Medical Services",
  },
  {
    id: "education",
    name: "Education",
    icon: GraduationCap,
    color: "bg-purple-500",
    description: "Learning & Training",
  },
  {
    id: "beauty",
    name: "Beauty & Salon",
    icon: Scissors,
    color: "bg-pink-500",
    description: "Beauty Services",
  },
  {
    id: "retail",
    name: "Retail",
    icon: ShoppingBag,
    color: "bg-indigo-500",
    description: "Shopping & Stores",
  },
  {
    id: "cafe",
    name: "Cafes & Coffee",
    icon: Coffee,
    color: "bg-yellow-600",
    description: "Coffee Shops",
  },
];

// Mock business contacts for each category - actual business professionals/contacts
const businessContacts = {
  restaurants: [
    {
      id: "rest1",
      name: "Mario Rossi",
      avatar:
        "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=40&h=40&fit=crop&crop=face",
      title: "Head Chef",
      business: "Pizza Palace",
      location: "Downtown",
      isOnline: true,
    },
    {
      id: "rest2",
      name: "Sarah Johnson",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b789?w=40&h=40&fit=crop&crop=face",
      title: "Restaurant Manager",
      business: "Burger Barn",
      location: "Mall Road",
      isOnline: false,
    },
    {
      id: "rest3",
      name: "Raj Patel",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
      title: "Owner & Chef",
      business: "Spice Garden",
      location: "City Center",
      isOnline: true,
    },
    {
      id: "rest4",
      name: "Yuki Tanaka",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
      title: "Sushi Master",
      business: "Sushi Master",
      location: "Business District",
      isOnline: true,
    },
  ],
  automotive: [
    {
      id: "auto1",
      name: "Mike Rodriguez",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
      title: "Lead Mechanic",
      business: "QuickFix Garage",
      location: "Industrial Area",
      isOnline: false,
    },
    {
      id: "auto2",
      name: "Lisa Chen",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
      title: "Service Manager",
      business: "Elite Car Wash",
      location: "Highway",
      isOnline: true,
    },
    {
      id: "auto3",
      name: "Tom Wilson",
      avatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=40&h=40&fit=crop&crop=face",
      title: "Parts Specialist",
      business: "AutoParts Plus",
      location: "Main Street",
      isOnline: true,
    },
  ],
  "real-estate": [
    {
      id: "real1",
      name: "Jennifer Smith",
      avatar:
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=40&h=40&fit=crop&crop=face",
      title: "Senior Agent",
      business: "Dream Homes Realty",
      location: "City Center",
      isOnline: true,
    },
    {
      id: "real2",
      name: "David Kumar",
      avatar:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=40&h=40&fit=crop&crop=face",
      title: "Property Developer",
      business: "Urban Properties",
      location: "Downtown",
      isOnline: false,
    },
    {
      id: "real3",
      name: "Amanda Garcia",
      avatar:
        "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=40&h=40&fit=crop&crop=face",
      title: "Rental Coordinator",
      business: "Rent Easy",
      location: "University Area",
      isOnline: true,
    },
  ],
  healthcare: [
    {
      id: "health1",
      name: "Dr. Robert Adams",
      avatar:
        "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=40&h=40&fit=crop&crop=face",
      title: "Cardiologist",
      business: "City Medical Center",
      location: "Medical District",
      isOnline: false,
    },
    {
      id: "health2",
      name: "Dr. Emily Zhang",
      avatar:
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=40&h=40&fit=crop&crop=face",
      title: "Dentist",
      business: "Dental Care Plus",
      location: "Suburb",
      isOnline: true,
    },
    {
      id: "health3",
      name: "pharmacist John Lee",
      avatar:
        "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=40&h=40&fit=crop&crop=face",
      title: "Pharmacist",
      business: "Wellness Pharmacy",
      location: "Mall",
      isOnline: true,
    },
  ],
  education: [
    {
      id: "edu1",
      name: "Prof. Alex Thompson",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
      title: "Tech Instructor",
      business: "TechSkills Academy",
      location: "Tech Park",
      isOnline: true,
    },
    {
      id: "edu2",
      name: "Maria Gonzalez",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b789?w=40&h=40&fit=crop&crop=face",
      title: "Language Teacher",
      business: "Language Masters",
      location: "City Center",
      isOnline: false,
    },
    {
      id: "edu3",
      name: "Chris Park",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
      title: "Tutor Coordinator",
      business: "Kids Learning Hub",
      location: "Residential Area",
      isOnline: true,
    },
  ],
  beauty: [
    {
      id: "beauty1",
      name: "Sophia Martinez",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
      title: "Hair Stylist",
      business: "Glamour Salon",
      location: "Shopping District",
      isOnline: true,
    },
    {
      id: "beauty2",
      name: "Nina Petrov",
      avatar:
        "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=40&h=40&fit=crop&crop=face",
      title: "Spa Therapist",
      business: "Spa Retreat",
      location: "Luxury Area",
      isOnline: false,
    },
    {
      id: "beauty3",
      name: "Carlos Rivera",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
      title: "Master Barber",
      business: "Quick Cuts",
      location: "Downtown",
      isOnline: true,
    },
  ],
  retail: [
    {
      id: "retail1",
      name: "Ashley Brown",
      avatar:
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=40&h=40&fit=crop&crop=face",
      title: "Fashion Consultant",
      business: "Fashion Forward",
      location: "Mall",
      isOnline: true,
    },
    {
      id: "retail2",
      name: "Kevin Wang",
      avatar:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=40&h=40&fit=crop&crop=face",
      title: "Tech Sales Expert",
      business: "Electronics Hub",
      location: "Tech Street",
      isOnline: true,
    },
    {
      id: "retail3",
      name: "Rachel Green",
      avatar:
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=40&h=40&fit=crop&crop=face",
      title: "Home Design Specialist",
      business: "Home & Garden",
      location: "Suburban Plaza",
      isOnline: false,
    },
  ],
  cafe: [
    {
      id: "cafe1",
      name: "Jake Morrison",
      avatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=40&h=40&fit=crop&crop=face",
      title: "Head Barista",
      business: "Brew & Bite",
      location: "University Area",
      isOnline: true,
    },
    {
      id: "cafe2",
      name: "Emma Davis",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
      title: "Cafe Manager",
      business: "Morning Glory Cafe",
      location: "Business District",
      isOnline: false,
    },
    {
      id: "cafe3",
      name: "Sam Taylor",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
      title: "Night Shift Supervisor",
      business: "Night Owl Coffee",
      location: "Downtown",
      isOnline: true,
    },
  ],
};

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
}) => {
  const [allContacts, setAllContacts] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBusinessCategory, setSelectedBusinessCategory] =
    useState(null);
  const [activeSection, setActiveSection] = useState("contacts"); // 'contacts', 'users', 'business'

 useEffect(() => {
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch users");

      const data = await res.json();

      // Assign random online status only once here
      const formattedUsers = data.map((u) => ({
        id: u._id,
        name: u.name || "unknown",
        email: u.email,
        avatar: u.avatar || null,
        isOnline: Math.random() < 0.5, // ✅ assigned once
        timestamp: u.createdAt,
        type: "user",
      }));

      // Separate existing contacts from new registered users
      const knownContacts = formattedUsers.filter((user) =>
        existingContacts.some((contact) => contact.id === user.id)
      );
      const newUsers = formattedUsers.filter(
        (user) => !existingContacts.some((contact) => contact.id === user.id)
      );

      // Also include existingContacts that are NOT registered users (e.g., Google contacts)
      const existingNotRegistered = (existingContacts || []).filter(
        (c) => !formattedUsers.some((u) => String(u.id) === String(c.id))
      );

      const existingNotRegisteredMapped = existingNotRegistered.map((c) => ({
        id: c.id || c._id || c.googleId || c.email || c.phone || `${c.name}`,
        name: c.name || c.email || c.phone || "Unknown",
        email: c.email || undefined,
        avatar: c.avatar || null,
        isOnline: c.isOnline || false,
        type: c.isGoogleContact ? "google-contact" : "contact",
      }));

      // Merge: put non-registered existing contacts first, then known registered contacts
      setAllContacts([...existingNotRegisteredMapped, ...knownContacts]);
      setRegisteredUsers(newUsers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchUsers();
  // ensure it runs only once on mount
  
}, []);


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
    return (
      businessContacts[selectedBusinessCategory.id]?.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.business.toLowerCase().includes(searchTerm.toLowerCase())
      ) || []
    );
  }, [selectedBusinessCategory, searchTerm]);

  const handleStartChat = (contact) => {
    onStartChat(contact);
    onClose();
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
            <Logo size="md" showText={true} textClassName={effectiveTheme.text || "text-gray-900"} />
          </div>
          
          <div className={`hidden sm:block border-l ${effectiveTheme.border || "border-gray-300"} h-8 mx-2`}></div>
          
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
                filteredAllContacts.map((contact) => (
                  <ContactItem
                    key={contact.id}
                    contact={contact}
                    effectiveTheme={effectiveTheme}
                    onClick={() => handleStartChat(contact)}
                    showLastSeen
                    token={localStorage.getItem("token")} //  Added token here
                  />
                ))
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
                filteredRegisteredUsers.map((user) => (
                  <ContactItem
                    key={user.id}
                    contact={user}
                    effectiveTheme={effectiveTheme}
                    showLastSeen
                    onClick={() => handleStartChat(user)}
                    token={localStorage.getItem("token")} //  Added token here
                  />
                ))
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
                  {businessCategories.map((category) => (
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
                        className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center mb-3`}
                      >
                        <category.icon className="w-6 h-6 text-white" />
                      </div>
                      <h4
                        className={`font-semibold ${effectiveTheme.text || "text-gray-900"} mb-1`}
                      >
                        {category.name}
                      </h4>
                      <p
                        className={`text-sm ${effectiveTheme.textSecondary || "text-gray-500"}`}
                      >
                        {category.description}
                      </p>
                      <p
                        className={`text-xs ${effectiveTheme.textSecondary || "text-gray-500"} mt-2`}
                      >
                        {businessContacts[category.id]?.length || 0} users
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
                    <ChevronLeft className={`w-5 h-5 ${effectiveTheme.text || "text-gray-900"}`} />
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
                        : "No business users available"}
                    </p>
                  </div>
                ) : (
                  filteredBusinessContacts.map((business) => (
                    <BusinessContactItem
                      key={business.id}
                      business={business}
                      effectiveTheme={effectiveTheme}
                      onClick={() =>
                        handleStartChat({ ...business, type: "business" })
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
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isAccepted, setIsAccepted] = useState(false);

  // Check if this contact is already accepted
  useEffect(() => {
    const fetchAcceptedChats = async () => {
      try {
        const userToken = localStorage.getItem("token");
        if (!userToken) return;

        const res = await fetch(`${API_BASE_URL}/api/user/requests/accepted`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        const data = await res.json();

        if (Array.isArray(data) && data.includes(contact.email)) {
          setIsAccepted(true);
        }
      } catch (err) {
        console.error("Error fetching accepted chats:", err);
      }
    };
    fetchAcceptedChats();
  }, [contact.email]);

  // ---- Send Invite Handler ----
  const handleSendInvite = async () => {
    setFeedback({ type: "", message: "" });
    try {
      if (!token) throw new Error("You must be logged in to send an invite.");

      setSending(true);
      const res = await fetch(`${API_BASE_URL}/api/user/request/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientEmail: contact.email,
          inviteMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error(
            "Session expired or unauthorized. Please log in again."
          );
        }
        throw new Error(data.message || "Failed to send invite");
      }

      setFeedback({ type: "success", message: "Invite sent successfully!" });
      setInviteMessage("");
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSending(false);
    }
  };

  // ---- Withdraw Invite ----
  const handleWithdrawInvite = async () => {
    try {
      const userToken = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/user/request/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ recipientEmail: contact.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to withdraw invite");

      setFeedback({ type: "info", message: "Invite withdrawn successfully." });
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  return (
    <>
      {/* Contact Row */}
      <motion.div
        whileHover={{ x: 4 }}
        className={`flex items-center justify-between p-4 cursor-pointer border-b ${
          effectiveTheme.border || "border-gray-300"
        } hover:${effectiveTheme.hover || "bg-gray-100"} transition-all duration-200`}
      >
       
        {/* Left Side */}
<div
  className="flex items-center space-x-3 min-w-0"
  onClick={() => onClick(contact)}
>
  <div className="relative">
    {contact.avatar ? (
      <img
        src={contact.avatar}
        alt={contact.name}
        className="w-12 h-12 rounded-full object-cover"
      />
    ) : (
      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
        {contact.name.charAt(0)}
      </div>
    )}
    {contact.isOnline && (
      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
    )}
  </div>

  <div className="flex-1 min-w-0">
    {/* Name */}
    <h3
      className={`font-semibold ${effectiveTheme.text || "text-gray-900"} truncate`}
    >
      {contact.name}
    </h3>

    {/* Online/Offline */}
    {showLastSeen && (
      <span
        className={`text-xs ${
          contact.isOnline
            ? "text-green-500"
            : effectiveTheme.textSecondary || "text-gray-500"
        }`}
      >
        {contact.isOnline ? "Online" : "Offline"}
      </span>
    )}

    {/* Timestamp / Last Seen */}
    {!contact.isOnline && contact.timestamp && (
      <p
        className={`text-xs ${
          effectiveTheme.textSecondary || "text-gray-400"
        } mt-0.5`}
      >
        Last seen{" "}
        {new Date(contact.timestamp).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    )}
  </div>
</div>


        {/* Right: Dynamic Button */}
        {isAccepted ? (
          // Chat Icon when accepted
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(contact);
            }}
            className="ml-3 p-2 rounded-full hover:bg-green-500/20 transition"
            title="Start Chat"
          >
            <MessageCircle className="w-5 h-5 text-green-500" />
          </button>
        ) : (
          // Default: Send Invite
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowInviteModal(true);
            }}
            className="ml-3 p-2 rounded-full hover:bg-blue-500/20 transition"
            title="Send Chat Invite"
          >
            <Send className="w-5 h-5 text-blue-500" />
          </button>
        )}
      </motion.div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-md rounded-2xl p-6 ${
              effectiveTheme.secondary || "bg-white dark:bg-gray-800"
            } shadow-2xl`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img
                  src={
                    contact.avatar ||
                    "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
                  }
                  alt={contact.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div>
                  <h2
                    className={`font-semibold text-lg ${effectiveTheme.text || "text-gray-900"}`}
                  >
                    {contact.name}
                  </h2>
                  <p
                    className={`text-sm ${effectiveTheme.textSecondary || "text-gray-500"}`}
                  >
                    {contact.bio || "No bio available"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Message Input */}
            <textarea
              rows="3"
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              placeholder="Add an optional message..."
              className={`w-full p-3 border rounded-lg text-sm
                ${effectiveTheme.bg || "bg-white"} 
                ${effectiveTheme.border || "border-gray-300"} 
                focus:ring-2 focus:ring-blue-500 outline-none resize-none
                placeholder-gray-400
                text-gray-900 dark:text-gray-100
                dark:bg-gray-800 dark:placeholder-gray-500`}
            />

            {/* Feedback */}
            {feedback.message && (
              <div
                className={`mt-3 text-sm ${
                  feedback.type === "error"
                    ? "text-red-500"
                    : feedback.type === "info"
                    ? "text-yellow-500"
                    : "text-green-500"
                }`}
              >
                {feedback.message}
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end mt-5 space-x-2">
              {feedback.type === "success" ||
              feedback.message.includes("already sent") ? (
                <button
                  onClick={handleWithdrawInvite}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-400 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  <X className="w-4 h-4 text-red-500" />
                  Withdraw Invite
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-md bg-gray-600 dark:bg-gray-300 hover:opacity-80 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendInvite}
                    disabled={sending}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {sending ? "Sending..." : "Send Invite"}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};




// Business Contact Item Component - for business professionals/contacts
const BusinessContactItem = ({ business, effectiveTheme, onClick }) => {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      className={`flex items-center justify-between p-4 cursor-pointer border-b ${effectiveTheme.border || "border-gray-300"} hover:${effectiveTheme.hover || "bg-gray-200"} transition-all duration-200`}
      onClick={() => onClick(business)}
    >
      {/* Left: Contact Info */}
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <div className="relative">
          {business.avatar ? (
            <img
              src={business.avatar}
              alt={business.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {business.name.charAt(0)}
            </div>
          )}
          {business.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold ${effectiveTheme.text || "text-gray-900"} truncate`}
          >
            {business.name}
          </h3>
          <p
            className={`text-sm ${effectiveTheme.textSecondary || "text-gray-500"} truncate`}
          >
            {business.title}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <span
              className={`text-xs ${effectiveTheme.textSecondary || "text-gray-500"} truncate`}
            >
              {business.business}
            </span>
            <span
              className={`text-xs ${effectiveTheme.textSecondary || "text-gray-500"}`}
            >
              •
            </span>
            <div className="flex items-center space-x-1">
              <MapPin
                className={`w-3 h-3 ${effectiveTheme.textSecondary || "text-gray-500"}`}
              />
              <span
                className={`text-xs ${effectiveTheme.textSecondary || "text-gray-500"} truncate`}
              >
                {business.location}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Online Status & Chat Icon */}
      <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
        {business.isOnline && (
          <span className={`text-xs text-green-500 font-medium`}>Online</span>
        )}
        <div
          className={`w-10 h-10 rounded-full ${effectiveTheme.accent || "bg-blue-500"} flex items-center justify-center`}
        >
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default NewChat;
