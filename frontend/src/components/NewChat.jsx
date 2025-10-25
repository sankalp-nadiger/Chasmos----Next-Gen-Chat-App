import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  X, 
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
  MapPin
} from "lucide-react";

// Business categories mock data
const businessCategories = [
  {
    id: 'restaurants',
    name: 'Restaurants',
    icon: Utensils,
    color: 'bg-orange-500',
    description: 'Food & Dining'
  },
  {
    id: 'automotive',
    name: 'Automotive',
    icon: Car,
    color: 'bg-blue-500',
    description: 'Car Services'
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    icon: Home,
    color: 'bg-green-500',
    description: 'Property Services'
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: Stethoscope,
    color: 'bg-red-500',
    description: 'Medical Services'
  },
  {
    id: 'education',
    name: 'Education',
    icon: GraduationCap,
    color: 'bg-purple-500',
    description: 'Learning & Training'
  },
  {
    id: 'beauty',
    name: 'Beauty & Salon',
    icon: Scissors,
    color: 'bg-pink-500',
    description: 'Beauty Services'
  },
  {
    id: 'retail',
    name: 'Retail',
    icon: ShoppingBag,
    color: 'bg-indigo-500',
    description: 'Shopping & Stores'
  },
  {
    id: 'cafe',
    name: 'Cafes & Coffee',
    icon: Coffee,
    color: 'bg-yellow-600',
    description: 'Coffee Shops'
  }
];

// Mock business contacts for each category - actual business professionals/contacts
const businessContacts = {
  restaurants: [
    { id: 'rest1', name: 'Mario Rossi', avatar: 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=40&h=40&fit=crop&crop=face', title: 'Head Chef', business: 'Pizza Palace', location: 'Downtown', isOnline: true },
    { id: 'rest2', name: 'Sarah Johnson', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b789?w=40&h=40&fit=crop&crop=face', title: 'Restaurant Manager', business: 'Burger Barn', location: 'Mall Road', isOnline: false },
    { id: 'rest3', name: 'Raj Patel', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face', title: 'Owner & Chef', business: 'Spice Garden', location: 'City Center', isOnline: true },
    { id: 'rest4', name: 'Yuki Tanaka', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face', title: 'Sushi Master', business: 'Sushi Master', location: 'Business District', isOnline: true }
  ],
  automotive: [
    { id: 'auto1', name: 'Mike Rodriguez', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face', title: 'Lead Mechanic', business: 'QuickFix Garage', location: 'Industrial Area', isOnline: false },
    { id: 'auto2', name: 'Lisa Chen', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face', title: 'Service Manager', business: 'Elite Car Wash', location: 'Highway', isOnline: true },
    { id: 'auto3', name: 'Tom Wilson', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=40&h=40&fit=crop&crop=face', title: 'Parts Specialist', business: 'AutoParts Plus', location: 'Main Street', isOnline: true }
  ],
  'real-estate': [
    { id: 'real1', name: 'Jennifer Smith', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=40&h=40&fit=crop&crop=face', title: 'Senior Agent', business: 'Dream Homes Realty', location: 'City Center', isOnline: true },
    { id: 'real2', name: 'David Kumar', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=40&h=40&fit=crop&crop=face', title: 'Property Developer', business: 'Urban Properties', location: 'Downtown', isOnline: false },
    { id: 'real3', name: 'Amanda Garcia', avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=40&h=40&fit=crop&crop=face', title: 'Rental Coordinator', business: 'Rent Easy', location: 'University Area', isOnline: true }
  ],
  healthcare: [
    { id: 'health1', name: 'Dr. Robert Adams', avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=40&h=40&fit=crop&crop=face', title: 'Cardiologist', business: 'City Medical Center', location: 'Medical District', isOnline: false },
    { id: 'health2', name: 'Dr. Emily Zhang', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=40&h=40&fit=crop&crop=face', title: 'Dentist', business: 'Dental Care Plus', location: 'Suburb', isOnline: true },
    { id: 'health3', name: 'pharmacist John Lee', avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=40&h=40&fit=crop&crop=face', title: 'Pharmacist', business: 'Wellness Pharmacy', location: 'Mall', isOnline: true }
  ],
  education: [
    { id: 'edu1', name: 'Prof. Alex Thompson', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face', title: 'Tech Instructor', business: 'TechSkills Academy', location: 'Tech Park', isOnline: true },
    { id: 'edu2', name: 'Maria Gonzalez', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b789?w=40&h=40&fit=crop&crop=face', title: 'Language Teacher', business: 'Language Masters', location: 'City Center', isOnline: false },
    { id: 'edu3', name: 'Chris Park', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face', title: 'Tutor Coordinator', business: 'Kids Learning Hub', location: 'Residential Area', isOnline: true }
  ],
  beauty: [
    { id: 'beauty1', name: 'Sophia Martinez', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face', title: 'Hair Stylist', business: 'Glamour Salon', location: 'Shopping District', isOnline: true },
    { id: 'beauty2', name: 'Nina Petrov', avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=40&h=40&fit=crop&crop=face', title: 'Spa Therapist', business: 'Spa Retreat', location: 'Luxury Area', isOnline: false },
    { id: 'beauty3', name: 'Carlos Rivera', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face', title: 'Master Barber', business: 'Quick Cuts', location: 'Downtown', isOnline: true }
  ],
  retail: [
    { id: 'retail1', name: 'Ashley Brown', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=40&h=40&fit=crop&crop=face', title: 'Fashion Consultant', business: 'Fashion Forward', location: 'Mall', isOnline: true },
    { id: 'retail2', name: 'Kevin Wang', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=40&h=40&fit=crop&crop=face', title: 'Tech Sales Expert', business: 'Electronics Hub', location: 'Tech Street', isOnline: true },
    { id: 'retail3', name: 'Rachel Green', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=40&h=40&fit=crop&crop=face', title: 'Home Design Specialist', business: 'Home & Garden', location: 'Suburban Plaza', isOnline: false }
  ],
  cafe: [
    { id: 'cafe1', name: 'Jake Morrison', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=40&h=40&fit=crop&crop=face', title: 'Head Barista', business: 'Brew & Bite', location: 'University Area', isOnline: true },
    { id: 'cafe2', name: 'Emma Davis', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face', title: 'Cafe Manager', business: 'Morning Glory Cafe', location: 'Business District', isOnline: false },
    { id: 'cafe3', name: 'Sam Taylor', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face', title: 'Night Shift Supervisor', business: 'Night Owl Coffee', location: 'Downtown', isOnline: true }
  ]
};

// Helper to format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "Last seen recently";
  const date = new Date(timestamp);
  const now = new Date();
  const diff = (now - date) / 1000; // seconds

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;

  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const NewChat = ({ effectiveTheme = {}, onClose, onStartChat, existingContacts = [] }) => {
  const [allContacts, setAllContacts] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBusinessCategory, setSelectedBusinessCategory] = useState(null);
  const [activeSection, setActiveSection] = useState('contacts'); // 'contacts', 'users', 'business'

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch users");

        const data = await res.json();
        const formattedUsers = data.map(u => ({
          id: u._id,
          name: u.username,
          avatar: u.avatar || null,
          isOnline: Math.random() < 0.5,
          timestamp: u.createdAt,
          type: 'user'
        }));
        
        // Separate existing contacts from new registered users
        const knownContacts = formattedUsers.filter(user => 
          existingContacts.some(contact => contact.id === user.id)
        );
        const newUsers = formattedUsers.filter(user => 
          !existingContacts.some(contact => contact.id === user.id)
        );
        
        setAllContacts(knownContacts);
        setRegisteredUsers(newUsers);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [existingContacts]);

  const filteredAllContacts = useMemo(() =>
    allContacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [allContacts, searchTerm]
  );

  const filteredRegisteredUsers = useMemo(() =>
    registeredUsers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [registeredUsers, searchTerm]
  );

  const filteredBusinessContacts = useMemo(() => {
    if (!selectedBusinessCategory) return [];
    return businessContacts[selectedBusinessCategory.id]?.filter(contact => 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.business.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
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

  if (loading) return <div className="p-4">Loading users...</div>;
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
      <div className={`${effectiveTheme.secondary || "bg-gray-100"} border-b ${effectiveTheme.border || "border-gray-300"} p-4`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className={`p-2 rounded-full hover:${effectiveTheme.hover || "bg-gray-200"} transition-colors`}
          >
            <X className={`w-5 h-5 ${effectiveTheme.text || "text-gray-900"}`} />
          </button>
          <div>
            <h2 className={`text-lg font-semibold ${effectiveTheme.text || "text-gray-900"}`}>New Chat</h2>
            <p className={`text-sm ${effectiveTheme.textSecondary || "text-gray-500"}`}>
              {selectedBusinessCategory 
                ? `${selectedBusinessCategory.name} - ${filteredBusinessContacts.length} contacts` 
                : `${filteredAllContacts.length + filteredRegisteredUsers.length} contacts available`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 flex-shrink-0">
        <div className={`relative ${effectiveTheme.searchBg || "bg-gray-100"} rounded-lg`}>
          <Search className={`absolute left-3 top-3 w-4 h-4 ${effectiveTheme.textSecondary || "text-gray-500"}`} />
          <input
            type="text"
            placeholder={selectedBusinessCategory ? "Search business contacts..." : "Search contacts..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 bg-transparent ${effectiveTheme.text || "text-gray-900"} placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
          />
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex border-b px-4">
        <button
          onClick={() => {setActiveSection('contacts'); setSelectedBusinessCategory(null);}}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeSection === 'contacts' 
              ? 'border-blue-500 text-blue-600' 
              : `border-transparent ${effectiveTheme.textSecondary || 'text-gray-500'} hover:text-gray-700`
          }`}
        >
          Contacts & Users
        </button>
        <button
          onClick={() => {setActiveSection('business'); setSelectedBusinessCategory(null);}}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeSection === 'business' 
              ? 'border-blue-500 text-blue-600' 
              : `border-transparent ${effectiveTheme.textSecondary || 'text-gray-500'} hover:text-gray-700`
          }`}
        >
          Business Directory
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-hidden">
        {/* Combined Contacts & Users Section */}
        {activeSection === 'contacts' && (
          <div className="h-full flex">
            {/* Left Side - All Contacts (50%) */}
            <div className="w-1/2 border-r overflow-y-auto p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Users className={`w-5 h-5 ${effectiveTheme.textSecondary || 'text-gray-500'}`} />
                <h3 className={`font-medium ${effectiveTheme.text || 'text-gray-900'}`}>
                  Your Contacts ({filteredAllContacts.length})
                </h3>
              </div>
              {filteredAllContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <MessageCircle className={`w-16 h-16 ${effectiveTheme.textSecondary || 'text-gray-400'} mb-4`} />
                  <p className={`${effectiveTheme.text || 'text-gray-900'} text-center`}>
                    {searchTerm ? 'No contacts found matching your search' : 'No contacts available'}
                  </p>
                </div>
              ) : (
                filteredAllContacts.map(contact => (
                  <ContactItem 
                    key={contact.id} 
                    contact={contact} 
                    effectiveTheme={effectiveTheme} 
                    onClick={() => handleStartChat(contact)} 
                    showLastSeen 
                  />
                ))
              )}
            </div>

            {/* Right Side - New Users (50%) */}
            <div className="w-1/2 overflow-y-auto p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Users className={`w-5 h-5 ${effectiveTheme.textSecondary || 'text-gray-500'}`} />
                <h3 className={`font-medium ${effectiveTheme.text || 'text-gray-900'}`}>
                  New Users ({filteredRegisteredUsers.length})
                </h3>
              </div>
              {filteredRegisteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <MessageCircle className={`w-16 h-16 ${effectiveTheme.textSecondary || 'text-gray-400'} mb-4`} />
                  <p className={`${effectiveTheme.text || 'text-gray-900'} text-center`}>
                    {searchTerm ? 'No users found matching your search' : 'All users are already in your contacts'}
                  </p>
                </div>
              ) : (
                filteredRegisteredUsers.map(user => (
                  <ContactItem
                    key={user.id}
                    contact={user}
                    effectiveTheme={effectiveTheme}
                    showLastSeen
                    onClick={() => handleStartChat(user)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Business Directory Section */}
        {activeSection === 'business' && (
          <div className="h-full overflow-y-auto p-4">
            {!selectedBusinessCategory ? (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Briefcase className={`w-5 h-5 ${effectiveTheme.textSecondary || 'text-gray-500'}`} />
                  <h3 className={`font-medium ${effectiveTheme.text || 'text-gray-900'}`}>Business Categories</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {businessCategories.map(category => (
                    <motion.div
                      key={category.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleBusinessCategoryClick(category)}
                      className={`${effectiveTheme.secondary || 'bg-gray-50'} border ${effectiveTheme.border || 'border-gray-200'} rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200`}
                    >
                      <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center mb-3`}>
                        <category.icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className={`font-semibold ${effectiveTheme.text || 'text-gray-900'} mb-1`}>
                        {category.name}
                      </h4>
                      <p className={`text-sm ${effectiveTheme.textSecondary || 'text-gray-500'}`}>
                        {category.description}
                      </p>
                      <p className={`text-xs ${effectiveTheme.textSecondary || 'text-gray-500'} mt-2`}>
                        {businessContacts[category.id]?.length || 0} contacts
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
                    className={`p-1 rounded hover:${effectiveTheme.hover || 'bg-gray-200'} transition-colors`}
                  >
                    ←
                  </button>
                  <selectedBusinessCategory.icon className={`w-5 h-5 ${effectiveTheme.textSecondary || 'text-gray-500'}`} />
                  <h3 className={`font-medium ${effectiveTheme.text || 'text-gray-900'}`}>
                    {selectedBusinessCategory.name} Contacts
                  </h3>
                </div>
                {filteredBusinessContacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8">
                    <MessageCircle className={`w-16 h-16 ${effectiveTheme.textSecondary || 'text-gray-400'} mb-4`} />
                    <p className={`${effectiveTheme.text || 'text-gray-900'} text-center`}>
                      {searchTerm ? 'No business contacts found matching your search' : 'No business contacts available'}
                    </p>
                  </div>
                ) : (
                  filteredBusinessContacts.map(business => (
                    <BusinessContactItem
                      key={business.id}
                      business={business}
                      effectiveTheme={effectiveTheme}
                      onClick={() => handleStartChat({...business, type: 'business'})}
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
const ContactItem = ({ contact, effectiveTheme, onClick, showLastSeen }) => {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      className={`flex items-center justify-between p-4 cursor-pointer border-b ${effectiveTheme.border || 'border-gray-300'} hover:${effectiveTheme.hover || 'bg-gray-200'} transition-all duration-200`}
      onClick={() => onClick(contact)}
    >
      {/* Left: Avatar and Name */}
      <div className="flex items-center space-x-3 min-w-0">
        <div className="relative">
          {contact.avatar ? (
            <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
              {contact.name.charAt(0)}
            </div>
          )}
          {contact.isOnline && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${effectiveTheme.text || 'text-gray-900'} truncate`}>{contact.name}</h3>
          {showLastSeen && (
            <span className={`text-xs ${contact.isOnline ? 'text-green-500' : effectiveTheme.textSecondary || 'text-gray-500'}`}>
              {contact.isOnline ? 'Online' : formatTimestamp(contact.timestamp)}
            </span>
          )}
        </div>
      </div>

      {/* Right: Chat Icon */}
      <div className="flex-shrink-0 ml-4">
        <div className={`w-10 h-10 rounded-full ${effectiveTheme.accent || 'bg-blue-500'} flex items-center justify-center`}>
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

// Business Contact Item Component - for business professionals/contacts
const BusinessContactItem = ({ business, effectiveTheme, onClick }) => {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      className={`flex items-center justify-between p-4 cursor-pointer border-b ${effectiveTheme.border || 'border-gray-300'} hover:${effectiveTheme.hover || 'bg-gray-200'} transition-all duration-200`}
      onClick={() => onClick(business)}
    >
      {/* Left: Contact Info */}
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <div className="relative">
          {business.avatar ? (
            <img src={business.avatar} alt={business.name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {business.name.charAt(0)}
            </div>
          )}
          {business.isOnline && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${effectiveTheme.text || 'text-gray-900'} truncate`}>
            {business.name}
          </h3>
          <p className={`text-sm ${effectiveTheme.textSecondary || 'text-gray-500'} truncate`}>
            {business.title}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`text-xs ${effectiveTheme.textSecondary || 'text-gray-500'} truncate`}>
              {business.business}
            </span>
            <span className={`text-xs ${effectiveTheme.textSecondary || 'text-gray-500'}`}>•</span>
            <div className="flex items-center space-x-1">
              <MapPin className={`w-3 h-3 ${effectiveTheme.textSecondary || 'text-gray-500'}`} />
              <span className={`text-xs ${effectiveTheme.textSecondary || 'text-gray-500'} truncate`}>
                {business.location}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Online Status & Chat Icon */}
      <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
        {business.isOnline && (
          <span className={`text-xs text-green-500 font-medium`}>
            Online
          </span>
        )}
        <div className={`w-10 h-10 rounded-full ${effectiveTheme.accent || 'bg-blue-500'} flex items-center justify-center`}>
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default NewChat;
