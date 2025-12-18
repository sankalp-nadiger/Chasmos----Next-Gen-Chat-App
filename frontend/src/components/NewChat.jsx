

// // export default NewChat;
// /* eslint-disable no-unused-vars */
// import React, { useState, useMemo, useEffect } from "react";
// import { motion } from "framer-motion";
// import {
//   Search,
//   Send,
//   Loader2,
//   X,
//   XCircle,
//   MessageCircle,
//   Clock,
//    UserCheck,
//   Users,
//   Briefcase,
//   Utensils,
//   Car,
//   Home,
//   Stethoscope,
//   GraduationCap,
//   Palette,
//   ShoppingBag,
//   Coffee,
//   Scissors,
//   MapPin,
//   ChevronLeft,
//   Copy,
// } from "lucide-react";
// import Logo from "./Logo";
// import CosmosBackground from "./CosmosBg";
// import { io } from "socket.io-client";

// // Business categories mock data
// const businessCategories = [
//   {
//     id: "restaurants",
//     label: "Restaurants",
//     icon: Utensils,
//     color: "bg-orange-500",
//     description: "Food & Dining",
//   },
//   {
//     id: "automotive",
//     label: "Automotive",
//     icon: Car,
//     color: "bg-blue-500",
//     description: "Car Services",
//   },
//   {
//     id: "real-estate",
//     label: "Real Estate",
//     icon: Home,
//     color: "bg-green-500",
//     description: "Property Services",
//   },
//   {
//     id: "healthcare",
//     label: "Healthcare",
//     icon: Stethoscope,
//     color: "bg-red-500",
//     description: "Medical Services",
//   },
//   {
//     id: "education",
//     label: "Education",
//     icon: GraduationCap,
//     color: "bg-purple-500",
//     description: "Learning & Training",
//   },
//   {
//     id: "beauty",
//     label: "Beauty & Salon",
//     icon: Scissors,
//     color: "bg-pink-500",
//     description: "Beauty Services",
//   },
//   {
//     id: "retail",
//     label: "Retail Store",
//     icon: ShoppingBag,
//     color: "bg-indigo-500",
//     description: "Shopping & Stores",
//   },
//   {
//     id: "cafe",
//     label: "Cafes & Coffee",
//     icon: Coffee,
//     color: "bg-yellow-600",
//     description: "Coffee Shops",
//   },
//   {
//     id: "ecommerce",
//     label: "E-commerce",
//     icon: Users,
//     color: "bg-purple-600",
//     description: "Online Stores",
//   },
//   {
//     id: "technology",
//     label: "Technology",
//     icon: Users,
//     color: "bg-blue-600",
//     description: "IT & Software",
//   },
//   {
//     id: "finance",
//     label: "Finance",
//     icon: Briefcase,
//     color: "bg-yellow-500",
//     description: "Banking & Finance",
//   },
//   {
//     id: "travel",
//     label: "Travel & Tourism",
//     icon: MapPin,
//     color: "bg-cyan-500",
//     description: "Travel Services",
//   },
//   {
//     id: "entertainment",
//     label: "Entertainment",
//     icon: Users,
//     color: "bg-indigo-500",
//     description: "Media & Fun",
//   },
//   {
//     id: "marketing",
//     label: "Marketing & Advertising",
//     icon: Users,
//     color: "bg-fuchsia-500",
//     description: "Promotion & Ads",
//   },
//   {
//     id: "freelancer",
//     label: "Freelancer / Consultant",
//     icon: Palette,
//     color: "bg-rose-500",
//     description: "Independent Professionals",
//   },
//   {
//     id: "other",
//     label: "Other",
//     icon: Users,
//     color: "bg-gray-500",
//     description: "Miscellaneous",
//   },
// ];

// // API Base URL from environment variable
// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// // Helper to format timestamp
// const formatTimestamp = (timestamp) => {
//   if (!timestamp) return "Last seen recently";
//   const date = new Date(timestamp);
//   const now = new Date();
//   const diff = (now - date) / 1000; // seconds

//   if (diff < 60) return "Just now";
//   if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
//   if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;

//   return (
//     date.toLocaleDateString() +
//     " " +
//     date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
//   );
// };


// const NewChat = ({
//   effectiveTheme = {},
//   onClose,
//   onStartChat,
//   existingContacts = [],
// }) => {
//   const [allContacts, setAllContacts] = useState([]);
//   const [registeredUsers, setRegisteredUsers] = useState([]);
//   const [businessUsers, setBusinessUsers] = useState([]);
//   const [businessCategoryCounts, setBusinessCategoryCounts] = useState({});
//   const [searchTerm, setSearchTerm] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedBusinessCategory, setSelectedBusinessCategory] = useState(null);
//   const [activeSection, setActiveSection] = useState("contacts");

//   // =========================
//   // CURRENT USER EMAIL
//   // =========================
//   let currentUserEmail = "";
//   try {
//     const userInfo = JSON.parse(localStorage.getItem("userInfo"));
//     currentUserEmail = userInfo?.email || userInfo?.user?.email || "";
//   } catch {}

//   // =========================
//   // FETCH USERS + BUSINESSES
//   // =========================
//   useEffect(() => {
//     const fetchAll = async () => {
//       try {
//         const token = localStorage.getItem("token");

//         // 1️⃣ NORMAL USERS (NON BUSINESS)
//         const usersRes = await fetch(`${API_BASE_URL}/api/user`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const users = await usersRes.json();

//         const normalUsers = users
//           .filter((u) => !u.isBusiness)
//           .map((u) => ({
//             id: u._id,
//             name: u.name,
//             email: u.email,
//             avatar: u.avatar,
//             isOnline: !!u.online,
//             type: "user",
//             bio: u.bio || "",
//             acceptedChatRequests: u.acceptedChatRequests || [],
//           }));

//         // Preserve original contact split logic
//         const knownContacts = normalUsers.filter((u) =>
//           existingContacts.some((c) => c.id === u.id)
//         );

//         const newUsers = normalUsers.filter(
//           (u) => !existingContacts.some((c) => c.id === u.id)
//         );

//         setAllContacts(knownContacts);
//         setRegisteredUsers(newUsers);

//         // 2️⃣ BUSINESS USERS
//         const bizRes = await fetch(`${API_BASE_URL}/api/user/business`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const bizData = await bizRes.json();

//         const mappedBusinesses = bizData.businesses.map((b) => ({
//           id: b._id,
//           name: b.name,
//           email: b.email,
//           avatar: b.avatar,
//           title: b.title,
//           business: b.businessName,
//           location: b.location,
//           businessCategory: b.businessCategory,
//           isOnline: b.isOnline,
//           type: "business",
//           acceptedChatRequests: b.acceptedChatRequests || [],
//           sentChatRequests: b.sentChatRequests || [],
//           receivedChatRequests: b.receivedChatRequests || [],
//         }));

//         setBusinessUsers(mappedBusinesses);
//         setBusinessCategoryCounts(bizData.categoryCounts || {});
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAll();
//   }, [existingContacts]);

//   // =========================
//   // FILTERS (PRESERVED)
//   // =========================
//   const filteredAllContacts = useMemo(
//     () =>
//       allContacts.filter((c) =>
//         c.name.toLowerCase().includes(searchTerm.toLowerCase())
//       ),
//     [allContacts, searchTerm]
//   );

//   const filteredRegisteredUsers = useMemo(
//     () =>
//       registeredUsers.filter((c) =>
//         c.name.toLowerCase().includes(searchTerm.toLowerCase())
//       ),
//     [registeredUsers, searchTerm]
//   );

//   const filteredBusinessContacts = useMemo(() => {
//     if (!selectedBusinessCategory) return [];

//     // Self business first
//     const self = businessUsers.find(
//       (b) =>
//         b.businessCategory === selectedBusinessCategory.id &&
//         b.email?.toLowerCase() === currentUserEmail.toLowerCase()
//     );

//     const others = businessUsers.filter(
//       (b) =>
//         b.businessCategory === selectedBusinessCategory.id &&
//         b.email?.toLowerCase() !== currentUserEmail.toLowerCase() &&
//         (
//           b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           b.business?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           b.title?.toLowerCase().includes(searchTerm.toLowerCase())
//         )
//     );

//     return self ? [self, ...others] : others;
//   }, [businessUsers, selectedBusinessCategory, searchTerm, currentUserEmail]);

//   // =========================
//   // CHAT START (ORIGINAL)
//   // =========================
//   const handleStartChat = (contact) => {
//     const userId =
//       contact.userId || contact._id || contact.id || contact.email;

//     const isExistingChat =
//       contact.chatId || (contact.id && String(contact.id).length === 24);

//     onStartChat({
//       ...contact,
//       userId,
//       isPendingChat: !isExistingChat,
//     });

//     onClose();
//   };

//   // =========================
//   // OPEN ONE TO ONE CHAT ✅
//   // (MERGED – WAS MISSING)
//   // =========================
//   const openOneToOneChat = async (contact) => {
//     try {
//       const userId = contact.id || contact._id || contact.email;

//       if (contact.chatId || (contact.id && String(contact.id).length === 24)) {
//         handleStartChat({ ...contact, isPendingChat: false, userId });
//         return;
//       }

//       handleStartChat({ ...contact, isPendingChat: true, userId });
//     } catch (err) {
//       console.error("openOneToOneChat error:", err);
//       handleStartChat(contact);
//     }
//   };

//   if (error) return <div className="p-4 text-red-500">{error}</div>;

//   // =========================
//   // RENDER
//   // =========================
//   return (
//     <motion.div
//       initial={{ x: "100%" }}
//       animate={{ x: 0 }}
//       exit={{ x: "100%" }}
//       transition={{ duration: 0.3 }}
//       className={`fixed inset-0 ${effectiveTheme.primary || "bg-white"} flex flex-col z-50`}
//     >
//       {/* HEADER */}
//       <div className={`${effectiveTheme.secondary || "bg-gray-100"} border-b p-4`}>
//         <div className="flex items-center gap-3">
//           <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
//             <X className="w-5 h-5" />
//           </button>
//           <Logo size="md" showText />
//           <h2 className="text-lg font-semibold">New Chat</h2>
//         </div>
//       </div>

//       {/* SEARCH */}
//       <div className="p-4">
//         <input
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           placeholder="Search..."
//           className="w-full px-4 py-3 rounded-lg bg-gray-100 focus:ring-2 focus:ring-blue-500"
//         />
//       </div>

//       {/* TABS */}
//       <div className="flex border-b px-4">
//         {["contacts", "business"].map((tab) => (
//           <button
//             key={tab}
//             onClick={() => {
//               setActiveSection(tab);
//               setSelectedBusinessCategory(null);
//             }}
//             className={`px-4 py-2 border-b-2 ${
//               activeSection === tab
//                 ? "border-blue-500 text-blue-600"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             {tab === "contacts" ? "Contacts & Users" : "Business Directory"}
//           </button>
//         ))}
//       </div>

//       {/* BODY */}
//       <div className="flex-1 overflow-y-auto p-4">
//         {/* CONTACTS */}
//         {activeSection === "contacts" && (
//           <>
//             {filteredAllContacts.map((c) => (
//               <ContactItem
//                 key={c.id}
//                 contact={c}
//                 onClick={() => openOneToOneChat(c)}
//                 effectiveTheme={effectiveTheme}
//                 currentUserEmail={currentUserEmail}
//                 token={localStorage.getItem("token")}
//                 showLastSeen
//               />
//             ))}

//             {filteredRegisteredUsers.map((u) => (
//               <ContactItem
//                 key={u.id}
//                 contact={u}
//                 onClick={() => openOneToOneChat(u)}
//                 effectiveTheme={effectiveTheme}
//                 currentUserEmail={currentUserEmail}
//                 token={localStorage.getItem("token")}
//                 showLastSeen
//               />
//             ))}
//           </>
//         )}

//         {/* BUSINESS */}
//         {activeSection === "business" && (
//           <>
//             {!selectedBusinessCategory ? (
//               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//                 {businessCategories
//                   .filter((c) => businessCategoryCounts[c.id] > 0)
//                   .map((cat) => (
//                     <div
//                       key={cat.id}
//                       onClick={() => setSelectedBusinessCategory(cat)}
//                       className="p-4 border rounded-lg cursor-pointer hover:shadow"
//                     >
//                       <div
//                         className={`w-12 h-12 ${cat.color} rounded-lg flex items-center justify-center mb-2`}
//                       >
//                         <cat.icon className="text-white w-6 h-6" />
//                       </div>
//                       <h4 className="font-semibold">{cat.label}</h4>
//                       <p className="text-xs text-gray-500">
//                         {businessCategoryCounts[cat.id]} businesses
//                       </p>
//                     </div>
//                   ))}
//               </div>
//             ) : (
//               filteredBusinessContacts.map((b) => (
//                 <ContactItem
//                   key={b.id}
//                   contact={b}
//                   onClick={() => openOneToOneChat(b)}
//                   effectiveTheme={effectiveTheme}
//                   currentUserEmail={currentUserEmail}
//                   token={localStorage.getItem("token")}
//                   showLastSeen
//                   isSelf={
//                     b.email?.toLowerCase() ===
//                     currentUserEmail.toLowerCase()
//                   }
//                 />
//               ))
//             )}
//           </>
//         )}
//       </div>
//     </motion.div>
//   );
// };


// //Contacts appearing in new chat page
// const ContactItem = ({
//   contact,
//   effectiveTheme,
//   onClick,
//   showLastSeen,
//   token,
//   currentUserEmail,
//   isSelf,
// }) => {
//   const [showInviteModal, setShowInviteModal] = useState(false);
//   const [inviteMessage, setInviteMessage] = useState("");
//   const [sending, setSending] = useState(false);
//   const [inviteStatus, setInviteStatus] = useState("idle");
//   const [chatStatus, setChatStatus] = useState("none");

//   const isBusiness = contact.type === "business";

//   // 🔹 Fetch chat status (SKIP for business)
//   useEffect(() => {
//     if (isBusiness) {
//       setChatStatus("accepted");
//       return;
//     }

//     const fetchStatus = async () => {
//       try {
//         const res = await fetch(
//           `${API_BASE_URL}/api/user/request/status/${contact.email}?type=${contact.type}`,
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );
//         const data = await res.json();
//         setChatStatus(data.status);
//       } catch (err) {
//         console.error("Failed to fetch chat status:", err);
//       }
//     };

//     fetchStatus();
//     const interval = setInterval(fetchStatus, 5000);
//     return () => clearInterval(interval);
//   }, [contact.email, token, isBusiness]);

//   const myEmailLower = currentUserEmail?.toLowerCase() || "";

//   const isMyEmailAcceptedByContact =
//     (contact.acceptedChatRequests || []).some(
//       (e) => (e || "").toLowerCase() === myEmailLower
//     );

//   const canSendInvite =
//     !isBusiness && chatStatus === "none" && !isMyEmailAcceptedByContact;

//   // 🔹 Send Invite
//   const handleSendInvite = async () => {
//     try {
//       setSending(true);
//       await fetch(`${API_BASE_URL}/api/user/request/send`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           recipientEmail: contact.email,
//           inviteMessage,
//           requestType: contact.type,
//         }),
//       });

//       setInviteStatus("sent");
//       setChatStatus("outgoing");
//     } catch {
//       setInviteStatus("sent");
//     } finally {
//       setSending(false);
//     }
//   };

//   // 🔹 Withdraw Invite
//   const handleWithdrawInvite = async () => {
//     try {
//       await fetch(`${API_BASE_URL}/api/user/request/withdraw`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           recipientEmail: contact.email,
//           requestType: contact.type,
//         }),
//       });

//       setInviteStatus("idle");
//       setChatStatus("none");
//       setShowInviteModal(false);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   // 🔹 Accept Invite
//   const handleAcceptInvite = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       if (!token || !contact?.email) return;

//       await fetch(`${API_BASE_URL}/api/user/request/accept`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           senderEmail: contact.email,
//           requestType: contact.type,
//         }),
//       });

//       setChatStatus("accepted");
//       setShowInviteModal(false);
//     } catch (err) {
//       console.error("Error accepting invite:", err);
//     }
//   };

//   const handleOpenChat = () => {
//     onClick(contact);
//   };

//   return (
//     <>
//       {/* CONTACT ROW */}
//       <motion.div
//         whileHover={{ x: 4 }}
//         className={`flex items-center justify-between p-4 cursor-pointer border-b
//         ${effectiveTheme.border || "border-gray-300"}
//         hover:${effectiveTheme.hover || "bg-gray-100"}`}
//       >
//         {/* LEFT */}
//         <div className="flex items-center gap-3" onClick={handleOpenChat}>
//           <img
//             src={
//               contact.avatar ||
//               "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
//             }
//             className="w-12 h-12 rounded-full object-cover"
//           />
//           <div>
//             <h3 className="font-semibold truncate">
//               {contact.name}
//               {isSelf && (
//                 <span className="text-xs text-blue-500 ml-1">(You)</span>
//               )}
//             </h3>
//             {showLastSeen && (
//               <span className="text-xs text-gray-500">
//                 {contact.isOnline ? "Online" : "Offline"}
//               </span>
//             )}
//           </div>
//         </div>

//         {/* RIGHT ICONS */}

//         {/* CHAT ICON — ALWAYS FOR BUSINESS */}
//         {(isBusiness ||
//           chatStatus === "accepted" ||
//           isMyEmailAcceptedByContact) && (
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               handleOpenChat();
//             }}
//             className="p-2 rounded-full hover:bg-green-500/20"
//           >
//             <MessageCircle className="w-5 h-5 text-green-500" />
//           </button>
//         )}

//         {/* INVITE ICONS — USERS ONLY */}
//         {!isBusiness && canSendInvite && (
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               setInviteStatus("idle");
//               setShowInviteModal(true);
//             }}
//             className="p-2 rounded-full hover:bg-blue-500/20"
//           >
//             <Send className="w-5 h-5 text-blue-500" />
//           </button>
//         )}

//         {!isBusiness && chatStatus === "outgoing" && (
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               setInviteStatus("sent");
//               setShowInviteModal(true);
//             }}
//             className="p-2 rounded-full hover:bg-yellow-500/20"
//           >
//             <Clock className="w-5 h-5 text-yellow-500" />
//           </button>
//         )}

//         {!isBusiness && chatStatus === "incoming" && (
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               setInviteStatus("incoming");
//               setShowInviteModal(true);
//             }}
//             className="p-2 rounded-full hover:bg-orange-500/20"
//           >
//             <Clock className="w-5 h-5 text-orange-500" />
//           </button>
//         )}
//       </motion.div>

//       {/* INVITE MODAL — USERS ONLY */}
//       {!isBusiness && showInviteModal && (
//         <div
//           className="fixed inset-0 flex items-center justify-center z-50"
//           style={{ background: "rgba(0,0,0,0.4)" }}
//         >
//           <motion.div
//             initial={{ scale: 0.9, opacity: 0 }}
//             animate={{ scale: 1, opacity: 1 }}
//             className={`relative w-full max-w-md rounded-2xl p-6 shadow-xl ${
//               effectiveTheme.secondary || "bg-white"
//             }`}
//           >
//             <div className="flex justify-between mb-4">
//               <div>
//                 <h2 className="font-semibold text-lg">{contact.name}</h2>
//                 {contact.bio && (
//                   <p className="text-sm text-gray-500 mt-1 truncate">
//                     {contact.bio}
//                   </p>
//                 )}
//               </div>
//               <button
//                 onClick={() => setShowInviteModal(false)}
//                 className="p-1 rounded-full hover:bg-red-500/20"
//               >
//                 <XCircle className="w-5 h-5 text-gray-400 hover:text-red-500" />
//               </button>
//             </div>

//             {inviteStatus === "sent" && (
//               <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-300">
//                 <p className="text-sm font-medium">Invite pending</p>
//                 <p className="text-xs text-gray-500">
//                   Waiting for {contact.name} to accept
//                 </p>
//               </div>
//             )}

//             {inviteStatus === "incoming" && (
//               <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-300">
//                 <p className="text-sm font-medium">Incoming request</p>
//                 <div className="flex justify-end mt-4">
//                   <button
//                     onClick={handleAcceptInvite}
//                     className="px-4 py-2 rounded-xl bg-green-600 text-white"
//                   >
//                     Accept
//                   </button>
//                 </div>
//               </div>
//             )}

//             {inviteStatus === "idle" && (
//               <textarea
//                 rows="3"
//                 value={inviteMessage}
//                 onChange={(e) => setInviteMessage(e.target.value)}
//                 placeholder="Add an optional message..."
//                 className="w-full mt-4 p-3 rounded-xl border resize-none text-sm"
//               />
//             )}

//             <div className="flex justify-end mt-6 gap-2">
//               {inviteStatus === "sent" && (
//                 <button
//                   onClick={handleWithdrawInvite}
//                   className="px-4 py-2 rounded-xl border border-red-500 text-red-500"
//                 >
//                   Withdraw
//                 </button>
//               )}

//               {inviteStatus === "idle" && (
//                 <>
//                   <button
//                     onClick={() => setShowInviteModal(false)}
//                     className="px-4 py-2 rounded-xl border"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={handleSendInvite}
//                     disabled={sending}
//                     className="px-4 py-2 rounded-xl bg-blue-600 text-white flex items-center gap-2"
//                   >
//                     {sending ? (
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                     ) : (
//                       <Send className="w-4 h-4" />
//                     )}
//                     Send Invite
//                   </button>
//                 </>
//               )}
//             </div>
//           </motion.div>
//         </div>
//       )}
//     </>
//   );
// };

// // Business Contact Item Component - for business professionals/contacts


// export default NewChat;

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

// Business categories configuration
const businessCategories = [
  {
    id: "restaurants",
    label: "Restaurants",
    name: "Restaurants",
    icon: Utensils,
    color: "bg-orange-500",
    description: "Food & Dining",
  },
  {
    id: "automotive",
    label: "Automotive",
    name: "Automotive",
    icon: Car,
    color: "bg-blue-500",
    description: "Car Services",
  },
  {
    id: "real-estate",
    label: "Real Estate",
    name: "Real Estate",
    icon: Home,
    color: "bg-green-500",
    description: "Property Services",
  },
  {
    id: "healthcare",
    label: "Healthcare",
    name: "Healthcare",
    icon: Stethoscope,
    color: "bg-red-500",
    description: "Medical Services",
  },
  {
    id: "education",
    label: "Education",
    name: "Education",
    icon: GraduationCap,
    color: "bg-purple-500",
    description: "Learning & Training",
  },
  {
    id: "beauty",
    label: "Beauty & Salon",
    name: "Beauty & Salon",
    icon: Scissors,
    color: "bg-pink-500",
    description: "Beauty Services",
  },
  {
    id: "retail",
    label: "Retail Store",
    name: "Retail",
    icon: ShoppingBag,
    color: "bg-indigo-500",
    description: "Shopping & Stores",
  },
  {
    id: "cafe",
    label: "Cafes & Coffee",
    name: "Cafes & Coffee",
    icon: Coffee,
    color: "bg-yellow-600",
    description: "Coffee Shops",
  },
  {
    id: "ecommerce",
    label: "E-commerce",
    name: "E-commerce",
    icon: Users,
    color: "bg-purple-600",
    description: "Online Stores",
  },
  {
    id: "technology",
    label: "Technology",
    name: "Technology",
    icon: Users,
    color: "bg-blue-600",
    description: "IT & Software",
  },
  {
    id: "finance",
    label: "Finance",
    name: "Finance",
    icon: Briefcase,
    color: "bg-yellow-500",
    description: "Banking & Finance",
  },
  {
    id: "travel",
    label: "Travel & Tourism",
    name: "Travel & Tourism",
    icon: MapPin,
    color: "bg-cyan-500",
    description: "Travel Services",
  },
  {
    id: "entertainment",
    label: "Entertainment",
    name: "Entertainment",
    icon: Users,
    color: "bg-indigo-500",
    description: "Media & Fun",
  },
  {
    id: "marketing",
    label: "Marketing & Advertising",
    name: "Marketing & Advertising",
    icon: Users,
    color: "bg-fuchsia-500",
    description: "Promotion & Ads",
  },
  {
    id: "freelancer",
    label: "Freelancer / Consultant",
    name: "Freelancer / Consultant",
    icon: Palette,
    color: "bg-rose-500",
    description: "Independent Professionals",
  },
  {
    id: "other",
    label: "Other",
    name: "Other",
    icon: Users,
    color: "bg-gray-500",
    description: "Miscellaneous",
  },
];

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
  const [businessUsers, setBusinessUsers] = useState([]);
  const [businessCategoryCounts, setBusinessCategoryCounts] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [groupOnlineCounts, setGroupOnlineCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBusinessCategory, setSelectedBusinessCategory] = useState(null);
  const [activeSection, setActiveSection] = useState("contacts");

  // =========================
  // CURRENT USER EMAIL
  // =========================
  let currentUserEmail = "";
  try {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    currentUserEmail = userInfo?.email || userInfo?.user?.email || "";
  } catch {}

  // =========================
  // FETCH USERS + BUSINESSES
  // =========================
  useEffect(() => {
    // Sync from parent if provided
    if (parentOnlineUsers) setOnlineUsers(new Set(parentOnlineUsers));
    if (parentGroupOnlineCounts) setGroupOnlineCounts(parentGroupOnlineCounts);

    const fetchAll = async () => {
      try {
        const token = localStorage.getItem("token");

        // Helper functions for phone normalization
        const normalizePhone = (p) => (p ? String(p).replace(/\D/g, "") : "");
        const extractPossiblePhone = (c) => {
          if (!c) return "";
          const candidates = [
            c.phone,
            c.phoneNumber,
            c.mobile,
            c.value,
            (c.phoneNumbers && c.phoneNumbers[0] && c.phoneNumbers[0].value),
            c.resourceName,
            c.id,
          ].filter(Boolean);

          for (const cand of candidates) {
            const normalized = normalizePhone(cand);
            if (normalized) return normalized;
          }

          const idStr = String(c.id || "");
          const m = idStr.match(/(\+?\d[\d\s-]{6,})/);
          if (m) return normalizePhone(m[0]);

          return "";
        };

        // 1️⃣ NORMAL USERS (NON BUSINESS)
        const usersRes = await fetch(`${API_BASE_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const users = await usersRes.json();

        const normalUsers = users
          .filter((u) => !u.isBusiness)
          .map((u) => ({
            id: u._id || u.id,
            name: u.name || "Unknown",
            email: u.email,
            contacts: u.googleContacts || [],
            phoneNumber: u.phoneNumber || u.phone || "",
            _rawPhone: normalizePhone(u.phoneNumber || u.phone || ""),
            avatar: u.avatar,
            isOnline: !!u.online,
            timestamp: u.createdAt,
            type: "user",
            bio: u.bio || "",
            acceptedChatRequests: u.acceptedChatRequests || [],
          }));

        // Build lookup maps
        const byId = new Map();
        const byEmail = new Map();
        const byPhone = new Map();
        normalUsers.forEach((u) => {
          if (u.id) byId.set(String(u.id), u);
          if (u.email) byEmail.set(String(u.email).toLowerCase(), u);
          if (u._rawPhone) byPhone.set(u._rawPhone, u);
        });

        const knownContacts = [];
        const existingNotRegisteredMapped = [];

        (existingContacts || []).forEach((c) => {
          const cId = c.id || c._id;
          const cEmail = c.email ? String(c.email).toLowerCase() : "";
          const cPhoneRaw = extractPossiblePhone(c);

          let matched = null;
          if (cId && byId.has(String(cId))) matched = byId.get(String(cId));
          else if (cEmail && byEmail.has(cEmail)) matched = byEmail.get(cEmail);
          else if (cPhoneRaw && byPhone.has(cPhoneRaw)) matched = byPhone.get(cPhoneRaw);

          if (matched) {
            if (!knownContacts.find((k) => String(k.id) === String(matched.id))) {
              if (c && (c.isOnline === true || c.isOnline === false)) {
                matched.isOnline = c.isOnline;
              }
              knownContacts.push(matched);
            }
          } else {
            existingNotRegisteredMapped.push({
              id: c.id || c._id || c.googleId || c.email || c.phone || `${c.name}`,
              name: c.name || c.email || c.phone || "Unknown",
              email: c.email || undefined,
              avatar: c.avatar || null,
              isOnline: c.isOnline || false,
              type: c.isGoogleContact ? "google-contact" : "contact",
            });
          }
        });

        // Apply online flags from existingContacts to normalUsers
        if (Array.isArray(existingContacts) && existingContacts.length > 0) {
          const byEmailExisting = new Map();
          const byIdExisting = new Map();
          const byPhoneExisting = new Map();
          existingContacts.forEach((ec) => {
            if (ec.email) byEmailExisting.set(String(ec.email).toLowerCase(), ec);
            if (ec.id) byIdExisting.set(String(ec.id), ec);
            const ep = (ec.phone || ec.phoneNumber || ec._rawPhone) || '';
            if (ep) byPhoneExisting.set(String(ep), ec);
          });

          normalUsers.forEach((fu) => {
            let override = null;
            if (fu.id && byIdExisting.has(String(fu.id))) override = byIdExisting.get(String(fu.id));
            else if (fu.email && byEmailExisting.has(String(fu.email).toLowerCase())) override = byEmailExisting.get(String(fu.email).toLowerCase());
            else if (fu._rawPhone && byPhoneExisting.has(String(fu._rawPhone))) override = byPhoneExisting.get(String(fu._rawPhone));
            if (override && (override.isOnline === true || override.isOnline === false)) {
              fu.isOnline = override.isOnline;
            }
          });
        }

        const knownIds = new Set(knownContacts.map((u) => String(u.id)));
        const newUsers = normalUsers.filter((u) => !knownIds.has(String(u.id)));

        setAllContacts([...existingNotRegisteredMapped, ...knownContacts]);
        setRegisteredUsers(newUsers);

        // 2️⃣ BUSINESS USERS
        const bizRes = await fetch(`${API_BASE_URL}/api/user/business`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const bizData = await bizRes.json();

        const mappedBusinesses = bizData.businesses.map((b) => ({
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
        }));

        setBusinessUsers(mappedBusinesses);
        setBusinessCategoryCounts(bizData.categoryCounts || {});
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [existingContacts]);

  // =========================
  // REALTIME PRESENCE (Socket)
  // =========================
  useEffect(() => {
    if (parentOnlineUsers) return; // parent supplies presence
    let sock = null;
    try {
      const userData = JSON.parse(localStorage.getItem('chasmos_user_data') || '{}');
      
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
              isOnline: Boolean(c.isOnline) || s.has(String(c.id)) || (c.email && s.has(String(c.email))) || false,
            }))
          );
          setBusinessUsers((prev) =>
            prev.map((c) => ({
              ...c,
              isOnline: Boolean(c.isOnline) || s.has(String(c.id)) || (c.email && s.has(String(c.email))) || false,
            }))
          );
        } catch (e) {
          console.error('applyOnlineFlags error', e);
        }
      };

      sock = io(API_BASE_URL, { transports: ['websocket'], withCredentials: true });
      sock.on('connect', () => {
        sock.emit('setup', userData);
      });

      sock.on('online users', (arr) => {
        applyOnlineFlags(arr);
      });
      sock.on('user online', ({ userId }) => {
        applyOnlineFlags([userId]);
      });
      sock.on('user offline', ({ userId }) => {
        try {
          setOnlineUsers((prev) => {
            const s = new Set(prev);
            s.delete(String(userId));
            return s;
          });
          setAllContacts((prev) => prev.map((c) => {
            if (String(c.id) === String(userId) || (c.email && String(c.email) === String(userId))) {
              return { ...c, isOnline: false };
            }
            return c;
          }));
          setRegisteredUsers((prev) => prev.map((c) => {
            if (String(c.id) === String(userId) || (c.email && String(c.email) === String(userId))) {
              return { ...c, isOnline: false };
            }
            return c;
          }));
          setBusinessUsers((prev) => prev.map((c) => {
            if (String(c.id) === String(userId) || (c.email && String(c.email) === String(userId))) {
              return { ...c, isOnline: false };
            }
            return c;
          }));
        } catch (e) {}
      });

      sock.on('group online count', ({ chatId, onlineCount }) => {
        try { 
          if (!chatId) return; 
          setGroupOnlineCounts(prev => ({ ...(prev||{}), [String(chatId)]: Number(onlineCount||0) })); 
        } catch (e) {}
      });
    } catch (e) {
      console.error('NewChat socket init failed', e);
    }

    return () => { if (sock) sock.disconnect(); };
  }, [parentOnlineUsers]);

  // =========================
  // FILTERS
  // =========================
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

    // Self business first
    const self = businessUsers.find(
      (b) =>
        b.businessCategory === selectedBusinessCategory.id &&
        b.email?.toLowerCase() === currentUserEmail.toLowerCase()
    );

    const others = businessUsers.filter(
      (b) =>
        b.businessCategory === selectedBusinessCategory.id &&
        b.email?.toLowerCase() !== currentUserEmail.toLowerCase() &&
        (
          b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.business?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.title?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return self ? [self, ...others] : others;
  }, [businessUsers, selectedBusinessCategory, searchTerm, currentUserEmail]);

  // =========================
  // CHAT START
  // =========================
  const handleStartChat = (contact) => {
    const userId =
      contact.userId || contact._id || contact.id || contact.participantId || contact.email;

    const isExistingChat =
      contact.chatId || (contact.id && String(contact.id).length === 24);

    onStartChat({
      ...contact,
      userId,
      isPendingChat: !isExistingChat,
    });

    onClose();
  };

  const openOneToOneChat = async (contact) => {
    try {
      const userId = contact.id || contact._id || contact.email;

      if (contact.chatId || (contact.id && String(contact.id).length === 24)) {
        handleStartChat({ ...contact, isPendingChat: false, userId });
        return;
      }

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

  // =========================
  // RENDER
  // =========================
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
            <X className={`w-5 h-5 ${effectiveTheme.text || "text-gray-900"}`} />
          </button>

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
            <h2 className={`text-lg font-semibold ${effectiveTheme.text || "text-gray-900"}`}>
              New Chat
            </h2>
            <p className={`text-sm ${effectiveTheme.textSecondary || "text-gray-500"}`}>
              {selectedBusinessCategory
                ? `${selectedBusinessCategory.name} - ${filteredBusinessContacts.length} users`
                : `${filteredAllContacts.length + filteredRegisteredUsers.length} users available`}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 flex-shrink-0">
        <div className={`relative ${effectiveTheme.searchBg || "bg-gray-100"} rounded-lg`}>
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
        {/* Contacts & Users Section */}
        {activeSection === "contacts" && (
          <div className="h-full flex">
            {/* Left Side - All Contacts (50%) */}
            <div className="w-1/2 border-r overflow-y-auto p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Users
                  className={`w-5 h-5 ${effectiveTheme.textSecondary || "text-gray-500"}`}
                />
                <h3 className={`font-medium ${effectiveTheme.text || "text-gray-900"}`}>
                  Your Contacts ({filteredAllContacts.length})
                </h3>
              </div>

              {filteredAllContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <MessageCircle
                    className={`w-16 h-16 ${effectiveTheme.textSecondary || "text-gray-400"} mb-4`}
                  />
                  <p className={`${effectiveTheme.text || "text-gray-900"} text-center`}>
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
                    onClick={() => {}}
                    showLastSeen
                    token={localStorage.getItem("token")}
                    currentUserEmail={currentUserEmail}
                    leftActionType={contact.type === 'user' ? 'chat' : 'copy'}
                    onLeftAction={openOneToOneChat}
                    hideRightActions={true}
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
                <h3 className={`font-medium ${effectiveTheme.text || "text-gray-900"}`}>
                  All Users on Platform ({filteredRegisteredUsers.length})
                </h3>
              </div>

              {filteredRegisteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <MessageCircle
                    className={`w-16 h-16 ${effectiveTheme.textSecondary || "text-gray-400"} mb-4`}
                  />
                  <p className={`${effectiveTheme.text || "text-gray-900"} text-center`}>
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
                    onClick={() => openOneToOneChat(user)}
                    token={localStorage.getItem("token")}
                    currentUserEmail={currentUserEmail}
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
                  <h3 className={`font-medium ${effectiveTheme.text || "text-gray-900"}`}>
                    Business Categories
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {businessCategories
                    .filter((c) => businessCategoryCounts[c.id] > 0)
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
                          className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center mb-3`}
                        >
                          <category.icon className="w-6 h-6 text-white" />
                        </div>
                        <h4
                          className={`font-semibold ${effectiveTheme.text || "text-gray-900"} mb-1`}
                        >
                          {category.label}
                        </h4>
                        <p
                          className={`text-xs ${effectiveTheme.textSecondary || "text-gray-500"} mt-2`}
                        >
                          {businessCategoryCounts[category.id]} businesses
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
                  <h3 className={`font-medium ${effectiveTheme.text || "text-gray-900"}`}>
                    {selectedBusinessCategory.name} Users
                  </h3>
                </div>

                {filteredBusinessContacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8">
                    <MessageCircle
                      className={`w-16 h-16 ${effectiveTheme.textSecondary || "text-gray-400"} mb-4`}
                    />
                    <p className={`${effectiveTheme.text || "text-gray-900"} text-center`}>
                      {searchTerm
                        ? "No business users found matching your search"
                        : "No business users available"}
                    </p>
                  </div>
                ) : (
                  filteredBusinessContacts.map((business) => (
                    <ContactItem
                      key={business.id}
                      contact={business}
                      effectiveTheme={effectiveTheme}
                      onClick={() => openOneToOneChat(business)}
                      showLastSeen
                      token={localStorage.getItem("token")}
                      currentUserEmail={currentUserEmail}
                      isSelf={
                        business.email?.toLowerCase() ===
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

// ContactItem Component
const ContactItem = ({
  contact,
  effectiveTheme,
  onClick,
  showLastSeen,
  token,
  currentUserEmail,
  leftActionType,
  onLeftAction,
  hideRightActions,
  isSelf,
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [inviteStatus, setInviteStatus] = useState("idle");
  const [chatStatus, setChatStatus] = useState("none");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [showSharePopup, setShowSharePopup] = useState(false);

  const isBusiness = contact.type === "business";
  const myEmailLower = currentUserEmail?.toLowerCase() || "";

  // Fetch chat status (SKIP for business)
  useEffect(() => {
    if (isBusiness) {
      setChatStatus("accepted");
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/user/request/status/${contact.email}?type=${contact.type}`,
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
  }, [contact.email, token, isBusiness]);

  const isMyEmailAcceptedByContact =
    (contact.acceptedChatRequests || []).some(
      (e) => (e || "").toLowerCase() === myEmailLower
    );

  const canSendInvite =
    !isBusiness && chatStatus === "none" && !isMyEmailAcceptedByContact;

  // Send Invite
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

  // Withdraw Invite
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

  // Accept Invite
  const handleAcceptInvite = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !contact?.email) return;

      await fetch(`${API_BASE_URL}/api/user/request/accept`, {
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

      setChatStatus("accepted");
      setShowInviteModal(false);
    } catch (err) {
      console.error("Error accepting invite:", err);
    }
  };

  const handleOpenChat = () => {
    onClick(contact);
  };

  return (
    <>
      {/* CONTACT ROW */}
      <motion.div
        whileHover={{ x: 4 }}
        className={`flex items-center justify-between p-4 cursor-pointer border-b
        ${effectiveTheme.border || "border-gray-300"}
        hover:${effectiveTheme.hover || "bg-gray-100"}`}
      >
        {/* LEFT */}
        <div className="flex items-center gap-3" onClick={handleOpenChat}>
          <div className="relative">
            <img
              src={
                contact.avatar ||
                "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
              }
              className="w-12 h-12 rounded-full object-cover"
            />
            {contact.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            )}
          </div>
          <div>
            <h3 className="font-semibold truncate">
              {contact.name}
              {isSelf && (
                <span className="text-xs text-blue-500 ml-1">(You)</span>
              )}
            </h3>
            {isBusiness && contact.title && (
              <p className={`text-sm ${effectiveTheme.textSecondary || "text-gray-500"} truncate`}>
                {contact.title}
              </p>
            )}
            {isBusiness && contact.business && (
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-xs ${effectiveTheme.textSecondary || "text-gray-500"} truncate`}>
                  {contact.business}
                </span>
                {contact.location && (
                  <>
                    <span className={`text-xs ${effectiveTheme.textSecondary || "text-gray-500"}`}>•</span>
                    <div className="flex items-center space-x-1">
                      <MapPin className={`w-3 h-3 ${effectiveTheme.textSecondary || "text-gray-500"}`} />
                      <span className={`text-xs ${effectiveTheme.textSecondary || "text-gray-500"} truncate`}>
                        {contact.location}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
            {showLastSeen && !isBusiness && (
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
                title={copyFeedback || 'Copy invite link'}
              >
                <Copy className="w-5 h-5 text-blue-500" />
              </button>
            )}
          </div>
        )}

        {/* RIGHT ICONS */}
        {!hideRightActions && (
          <div className="flex items-center space-x-2">
            {isBusiness || chatStatus === "accepted" || isMyEmailAcceptedByContact ? (
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

      {/* INVITE MODAL — USERS ONLY */}
      {!isBusiness && showInviteModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            <CosmosBackground opacity={0.28} theme="light" />
          </div>
          <div
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ background: "rgba(255,255,255,0.9)" }}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`relative w-full max-w-md rounded-2xl p-6 shadow-xl ${
              effectiveTheme.secondary || "bg-white"
            }`}
            style={{ zIndex: 10 }}
          >
            <div className="flex justify-between mb-4">
              <div>
                <h2 className="font-semibold text-lg">{contact.name}</h2>
                {contact.bio && (
                  <p className="text-sm text-gray-500 mt-1 truncate">
                    {contact.bio}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-full hover:bg-red-500/20"
              >
                <XCircle className="w-5 h-5 text-gray-400 hover:text-red-500" />
              </button>
            </div>

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
                <div className="flex justify-end mt-4">
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
                className="w-full mt-4 p-3 rounded-xl border resize-none text-sm"
              />
            )}

            <div className="flex justify-end mt-6 gap-2">
              {inviteStatus === "sent" && (
                <button
                  onClick={handleWithdrawInvite}
                  className="px-4 py-2 rounded-xl border border-red-500 text-red-500"
                >
                  Withdraw
                </button>
              )}

              {inviteStatus === "idle" && (
                <>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl border"
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

      {/* Share Link Popup */}
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
            className={`w-full max-w-sm rounded-2xl p-5 ${
              effectiveTheme.secondary || "bg-white"
            } shadow-2xl`}
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
                className={`flex-1 p-3 rounded-md border ${
                  effectiveTheme.border || "border-gray-300"
                } ${effectiveTheme.primary || "bg-white"} text-sm break-words ${
                  effectiveTheme.text || "text-gray-900"
                }`}
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
                className={`px-3 py-2 ${
                  effectiveTheme.accent || "bg-blue-600"
                } text-white rounded-md hover:opacity-90 whitespace-nowrap transition-all`}
              >
                {copyFeedback || "Copy"}
              </button>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowSharePopup(false)}
                className={`px-3 py-2 text-sm rounded-md ${
                  effectiveTheme.secondary || "bg-gray-200"
                } ${effectiveTheme.text || "text-gray-900"} hover:opacity-80 transition-all`}
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