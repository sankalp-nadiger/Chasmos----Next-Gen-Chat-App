
/* eslint-disable no-unused-vars */
import React, { useState, useMemo, useEffect, useRef } from "react";
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
  RefreshCw,
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
  const [syncingContacts, setSyncingContacts] = useState(false);
  const [refreshingContacts, setRefreshingContacts] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [selectedBusinessCategory, setSelectedBusinessCategory] = useState(null);
  const [activeSection, setActiveSection] = useState("contacts");

  // ref to hold the fetch function so we can call it from handlers
  const fetchAllRef = useRef(null);

  // Helpers available to both fetchAll and refresh logic
  const normalizePhone = (p) => {
    if (!p) return "";
    let digits = String(p).replace(/\D/g, "");
    if (digits.length > 10) digits = digits.slice(-10);
    return digits;
  };

  const normalizeName = (n) => {
    if (!n) return "";
    return String(n).trim().toLowerCase().replace(/\s+/g, " ");
  };

  const makeKey = (c) => {
    if (!c) return "";
    const email = c.email ? String(c.email).toLowerCase().trim() : "";
    if (email) return `e:${email}`;
    const id = c.id || c._id || c.userId || "";
    if (id) return `i:${String(id)}`;
    const phone = normalizePhone(c.phone || c.phoneNumber || c._rawPhone || c._rawPhone || "");
    if (phone) return `p:${phone}`;
    const n = normalizeName(c.name || c.displayName || "");
    if (n) return `n:${n}`;
    return "";
  };

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
        // Normalize by removing non-digits and trimming country codes (keep last 10 digits)
        const normalizePhone = (p) => {
          if (!p) return "";
          let digits = String(p).replace(/\D/g, "");
          // If number contains a country code (longer than 10), keep last 10 digits
          if (digits.length > 10) digits = digits.slice(-10);
          return digits;
        };
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
            const epRaw = (ec.phone || ec.phoneNumber || ec._rawPhone) || '';
            const ep = normalizePhone(epRaw);
            if (ep) byPhoneExisting.set(ep, ec);
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

        const newAllContacts = [...existingNotRegisteredMapped, ...knownContacts];
        setAllContacts(newAllContacts);
        setRegisteredUsers(newUsers);

        // 2️⃣ BUSINESS USERS
        const bizRes = await fetch(`${API_BASE_URL}/api/user/business`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const bizData = await bizRes.json();

        const mappedBusinesses = bizData.businesses.map((b) => {
          const mapped = {
            id: b._id,
            _id: b._id,
            name: b.name,
            email: b.email,
            avatar: b.avatar,
            title: b.title,
            business: b.businessName,
            location: b.location,
            bio: b.bio || "",
            businessCategory: b.businessCategory,
            isOnline: b.isOnline,
            type: "business",
            isBusiness: true,
            acceptedChatRequests: b.acceptedChatRequests || [],
            sentChatRequests: b.sentChatRequests || [],
            receivedChatRequests: b.receivedChatRequests || [],
          };
          console.log('Business user mapped:', { name: mapped.name, id: mapped.id, _id: mapped._id, email: mapped.email });
          return mapped;
        });

        setBusinessUsers(mappedBusinesses);
        setBusinessCategoryCounts(bizData.categoryCounts || {});

        // Return fetched lists so callers can inspect counts without waiting for state
        return {
          allContacts: newAllContacts,
          registeredUsers: newUsers,
          businessUsers: mappedBusinesses,
        };
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // expose fetchAll via ref so UI can trigger a manual refresh button
    fetchAllRef.current = fetchAll;

    fetchAll();
  }, [existingContacts]);

  const handleRefresh = async () => {
    setRefreshingContacts(true);
    try {
      // helper to produce a stable key (prefer email -> id -> phone -> name)
      const keyFor = (c) => {
        const k = makeKey(c);
        if (k) return k;
        const email = c?.email ? String(c.email).toLowerCase().trim() : "";
        const id = c?.id || c?._id || "";
        const phone = normalizePhone(c?.phone || c?.phoneNumber || c?._rawPhone || "");
        const name = normalizeName(c?.name || c?.displayName || email || "");
        if (email) return `e:${email}`;
        if (id) return `i:${String(id)}`;
        if (phone) return `p:${phone}`;
        if (name) return `n:${name}`;
        return "";
      };

      // collect previous keys for server diff detection
      const prevKeys = new Set();
      (allContacts || []).forEach((c) => { const k = keyFor(c); if (k) prevKeys.add(k); });
      (registeredUsers || []).forEach((c) => { const k = keyFor(c); if (k) prevKeys.add(k); });
      (businessUsers || []).forEach((c) => { const k = keyFor(c); if (k) prevKeys.add(k); });

      // fetch google contacts (we will still include them locally)
      let googleMapped = [];
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const resp = await fetch(`${API_BASE_URL}/api/sync/google-contacts`, { headers: { Authorization: `Bearer ${token}` } });
          if (resp.ok) {
            const body = await resp.json();
            const googleContacts = body?.data || [];
            if (Array.isArray(googleContacts) && googleContacts.length > 0) {
              googleMapped = googleContacts.map((g) => ({
                id: g.googleId || g.email || g.name,
                name: g.name || g.email || 'Unknown',
                email: g.email || undefined,
                avatar: g.avatar || null,
                phone: g.phone || g.mobile || undefined,
                isOnline: false,
                type: g.email ? 'google-contact' : 'contact',
                isGoogleContact: true,
              }));
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch google contacts during refresh', err);
      }

      // Ask server for diffs vs our current keys
      let serverAdded = [];
      let serverRemoved = [];
      try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_BASE_URL}/api/user/changes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : undefined },
          body: JSON.stringify({ keys: Array.from(prevKeys) }),
        });

        if (resp.status === 204) {
          // nothing changed on server
          setToast({ show: true, message: 'Contacts are already up to date' });
          setTimeout(() => setToast({ show: false, message: '' }), 2000);
          return;
        }

        if (resp.ok) {
          const body = await resp.json();
          serverAdded = Array.isArray(body.added) ? body.added : [];
          serverRemoved = Array.isArray(body.removed) ? body.removed : [];
        } else {
          console.warn('Diff endpoint returned non-ok', resp.status);
        }
      } catch (err) {
        console.error('Failed to query server diffs', err);
      }

      // Build current map from existing state + google contacts
      const byKey = new Map();
      const pushIntoMap = (c) => {
        const k = keyFor(c);
        if (!k) return;
        if (!byKey.has(k)) byKey.set(k, { ...c });
        else {
          const ex = byKey.get(k) || {};
          byKey.set(k, { ...ex, ...c });
        }
      };

      (allContacts || []).forEach(pushIntoMap);
      (registeredUsers || []).forEach(pushIntoMap);
      (businessUsers || []).forEach(pushIntoMap);
      (googleMapped || []).forEach(pushIntoMap);

      // apply removals
      (serverRemoved || []).forEach((rk) => byKey.delete(rk));

      // apply additions (server provides minimal sanitized items)
      (serverAdded || []).forEach((item) => {
        const k = keyFor(item) || makeKey(item) || (`i:${item.id}`);
        if (!k) return;
        const existing = byKey.get(k) || {};
        byKey.set(k, { ...existing, ...item });
      });

      const unified = Array.from(byKey.values());

      // split into categories
      const newBusiness = unified.filter((c) => c.type === 'business').map((c) => ({ ...c, id: c.id || keyFor(c) }));
      const newRegistered = unified.filter((c) => c.type === 'user').map((c) => ({ ...c, id: c.id || keyFor(c) }));
      const newAll = unified.filter((c) => c.type === 'contact' || c.type === 'google-contact' || !c.type).map((c) => ({ ...c, id: c.id || keyFor(c) }));

      setAllContacts(newAll);
      setRegisteredUsers(newRegistered);
      setBusinessUsers(newBusiness);

      // compute diff for toast
      const newKeys = new Set();
      newAll.forEach((c) => { const k = keyFor(c); if (k) newKeys.add(k); });
      newRegistered.forEach((c) => { const k = keyFor(c); if (k) newKeys.add(k); });
      newBusiness.forEach((c) => { const k = keyFor(c); if (k) newKeys.add(k); });

      if (newKeys.size !== prevKeys.size) {
        const diff = newKeys.size - prevKeys.size;
        const message = diff > 0 ? `Contacts synced successfully! (+${diff})` : `Contacts synced successfully! (${diff})`;
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
      }
    } catch (e) {
      console.error('Refresh contacts failed', e);
      setError(e.message || 'Refresh failed');
    } finally {
      setRefreshingContacts(false);
    }
  };

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

  // Listen for messages from the Google OAuth popup (backend posts message on success)
  useEffect(() => {
    const handleMessage = (e) => {
      try {
        const data = e.data || {};
        if (!data || typeof data !== 'object') return;
        if (data.type !== 'google_sync') return;

        if (data.success) {
          // If backend provided a fresh token, persist it
          if (data.token) {
            try { localStorage.setItem('token', data.token); } catch (err) {}
          }

          // Close the NewChat modal if parent provided onClose
          try {
            if (typeof onClose === 'function') onClose();
          } catch (e) {}

          // Redirect to /chats and reload to pick up new contacts
          try {
            const target = '/chats';
            if (window.location.pathname !== target) {
              window.location.href = target;
            } else {
              window.location.reload();
            }
          } catch (e) {}
        } else {
          // show an error in the modal if available
          try { setError('Google sync failed: ' + (data.error || 'unknown')); } catch (e) {}
        }
      } catch (err) {
        console.error('handleMessage error', err);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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

  // Helper function to get base categories + count "Other" users
  const getBusinessCategoriesWithOther = (businessUsers, businessCategoryCounts) => {
    const baseCategories = businessCategories.filter(cat => cat.id !== 'other');
    
    // Count users with custom categories (not in base list)
    let otherCount = 0;
    businessUsers.forEach(user => {
      if (user.businessCategory) {
        const isBaseCategory = businessCategories.some(
          cat => cat.label === user.businessCategory || cat.id === user.businessCategory
        );
        if (!isBaseCategory) {
          otherCount++;
        }
      }
    });
    
    // Add "Other" category if there are custom category users
    if (otherCount > 0) {
      baseCategories.push({
        id: 'other',
        name: 'Other',
        label: 'Other',
        icon: Users,
        color: 'bg-gradient-to-br from-gray-500 to-gray-600',
        description: 'Miscellaneous',
        count: otherCount
      });
    }
    
    return baseCategories;
  };
  
  const filteredBusinessContacts = useMemo(() => {
    if (!selectedBusinessCategory) return [];

    // Handle "Other" category - show users with custom categories
    if (selectedBusinessCategory.id === 'other') {
      const self = businessUsers.find((b) => {
        const isCustomCategory = !businessCategories.some(
          cat => (cat.id !== 'other') && (cat.label === b.businessCategory || cat.id === b.businessCategory)
        );
        return isCustomCategory && b.email?.toLowerCase() === currentUserEmail.toLowerCase();
      });

      const others = businessUsers.filter((b) => {
        const isCustomCategory = !businessCategories.some(
          cat => (cat.id !== 'other') && (cat.label === b.businessCategory || cat.id === b.businessCategory)
        );
        return (
          isCustomCategory &&
          b.email?.toLowerCase() !== currentUserEmail.toLowerCase() &&
          (
            b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.business?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.businessCategory?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      });

      return self ? [self, ...others] : others;
    }

    // Handle regular categories
    const self = businessUsers.find(
      (b) =>
        (b.businessCategory === selectedBusinessCategory.id ||
         b.businessCategory === selectedBusinessCategory.label) &&
        b.email?.toLowerCase() === currentUserEmail.toLowerCase()
    );

    const others = businessUsers.filter(
      (b) =>
        (b.businessCategory === selectedBusinessCategory.id ||
         b.businessCategory === selectedBusinessCategory.label) &&
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
  const handleStartChat = async (contact) => {
    const userId =
      contact.userId || contact._id || contact.id || contact.participantId || contact.email;

    // Only consider it an existing chat if explicitly marked or has a chatId
    const isExistingChat = Boolean(contact.chatId) || contact.isPendingChat === false;

    // Check if this is a business account and fetch auto message settings
    let autoMessage = null;
    const isBusinessContact = contact.isBusiness || contact.type === 'business';
    console.log('NewChat.handleStartChat -> contact:', { userId, isBusinessContact, isBusiness: contact.isBusiness, type: contact.type, isExistingChat, chatId: contact.chatId, isPendingChat: contact.isPendingChat });
    if (isBusinessContact && !isExistingChat) {
      console.log('NewChat.handleStartChat -> Condition passed! Fetching auto message for business user');
      try {
        const token = localStorage.getItem("token");
        const fetchUrl = `${API_BASE_URL}/api/user/${userId}`;
        console.log('NewChat.handleStartChat -> Fetching from URL:', fetchUrl);
        const response = await fetch(fetchUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("NewChat.handleStartChat -> fetched /api/user/" + userId + " status=", response.status);
        if (response.ok) {
          const userData = await response.json();
          console.log("NewChat.handleStartChat -> userData", userData);
          if (userData.autoMessageEnabled && (userData.autoMessageText || userData.autoMessageImage)) {
            autoMessage = {
              enabled: true,
              text: userData.autoMessageText || "",
              image: userData.autoMessageImage || "",
              businessUserName: contact.name || contact.chatName,
              businessUserId: userId,
            };
          }
        } else {
          const text = await response.text().catch(() => null);
          console.warn("NewChat.handleStartChat -> failed to fetch user data", response.status, text);
        }
      } catch (error) {
        console.error("Error fetching business auto message:", error);
      }
    }

    // Build payload and ensure pending chats have an `id` so ChattingPage can key messages correctly
    const contactPayload = {
      ...contact,
      userId,
      id: isExistingChat ? contact.id : userId,
      isPendingChat: !isExistingChat,
      autoMessage,
    };

    console.log("NewChat.handleStartChat -> invoking onStartChat", {
      userId,
      isExistingChat,
      autoMessage,
      contactPayloadPreview: {
        id: contactPayload.id,
        name: contactPayload.name,
        isPendingChat: contactPayload.isPendingChat,
        autoMessage: !!contactPayload.autoMessage,
      },
    });

    onStartChat(contactPayload);

    onClose();
  };

  const openOneToOneChat = async (contact) => {
    try {
      const userId = contact.id || contact._id || contact.email;
      console.log('NewChat.openOneToOneChat -> called with:', { 
        contactName: contact.name, 
        contactId: contact.id, 
        contact_id: contact._id, 
        contactEmail: contact.email,
        resolvedUserId: userId,
        contactType: contact.type,
        isBusiness: contact.isBusiness,
        chatId: contact.chatId
      });

      // Only treat as existing chat if there's an actual chatId
      if (contact.chatId) {
        console.log('NewChat.openOneToOneChat -> has chatId, treating as existing chat');
        handleStartChat({ ...contact, isPendingChat: false, userId });
        return;
      }

      // For all users without chatId, check if a chat already exists
      if (userId) {
        try {
          const token = localStorage.getItem("token");
          console.log('NewChat.openOneToOneChat -> Checking for existing chat with user');
          const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ userId }),
          });

          if (response.ok) {
            const chatData = await response.json();
            const existingChatId = chatData._id || chatData.id;
            console.log('NewChat.openOneToOneChat -> Found existing chat:', existingChatId);
            // Chat exists, treat as existing (no auto message for business, load messages for all)
            handleStartChat({ ...contact, chatId: existingChatId, isPendingChat: false, userId });
            return;
          }
        } catch (err) {
          console.error('NewChat.openOneToOneChat -> Error checking for existing chat:', err);
          // Continue to treat as new chat if check fails
        }
      }

      console.log('NewChat.openOneToOneChat -> no chatId, treating as new chat');
      handleStartChat({ ...contact, isPendingChat: true, userId });
    } catch (err) {
      console.error("openOneToOneChat error:", err);
      handleStartChat(contact);
    }
  };

  const handleBusinessCategoryClick = (category) => {
    setSelectedBusinessCategory(category);
  };

  // Manual sync handler triggered by user action
  const handleManualSync = async () => {
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be signed in to sync contacts.');
      return;
    }

    setSyncingContacts(true);
    try {
      const origin = window.location.pathname + window.location.search;
      const resp = await fetch(`${API_BASE_URL}/api/contacts/trigger-sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        // If server tells frontend to connect to Google, open the consent URL
        if (data?.needsGoogleConnect && data.googleConnectUrl) {
          window.open(data.googleConnectUrl, '_blank');
          return;
        }
        setError(data?.message || 'Failed to sync contacts');
        return;
      }

      if (data?.needsGoogleConnect && data.googleConnectUrl) {
        window.open(data.googleConnectUrl, '_blank');
        return;
      }

      // Successful sync: refresh local lists, show toast, then close modal shortly after
      try {
        const fetched = fetchAllRef.current ? await fetchAllRef.current() : null;

        setToast({ show: true, message: 'Contacts synced successfully!' });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
      } catch (err) {
        console.error('Failed to refresh contacts after sync', err);
      }
    } catch (err) {
      console.error('Manual sync error', err);
      setError(err.message || 'Sync failed');
    } finally {
      setSyncingContacts(false);
    }
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
              {activeSection === "business"
                ? (selectedBusinessCategory
                    ? `${selectedBusinessCategory.name} - ${filteredBusinessContacts.length} users`
                    : `${businessUsers.length} users across all business categories`)
                : `${filteredAllContacts.length + filteredRegisteredUsers.length} contacts available`}
            </p>
          </div>
        </div>
      </div>
      {/* Toast (top-left) */}
      {toast?.show && (
        <div className="fixed left-4 top-4 z-50">
          <div className="px-4 py-2 rounded shadow-md bg-green-600 text-white text-sm">
            {toast.message}
          </div>
        </div>
      )}

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
                : "Search users..."
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
                  <div className="ml-3 flex items-center space-x-2">
                    <button
                      onClick={handleManualSync}
                      disabled={syncingContacts}
                      className={`px-3 py-1 text-sm rounded-md border transition-colors ${effectiveTheme.hover || 'hover:bg-gray-200'}`}
                    >
                      {syncingContacts ? 'Syncing...' : 'Sync Contacts'}
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleRefresh(); }}
                      disabled={refreshingContacts || syncingContacts}
                      title="Refresh contacts"
                      className={`px-2 py-1 text-sm rounded-md border transition-colors hover:${effectiveTheme.hover || 'bg-gray-200'} flex items-center justify-center`}
                    >
                      {refreshingContacts ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </button>
                  </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <Loader2 className={`w-16 h-16 ${effectiveTheme.textSecondary || "text-gray-400"} mb-4 animate-spin`} />
                  <p className={`${effectiveTheme.text || "text-gray-900"} text-center`}>
                    Loading contacts...
                  </p>
                </div>
              ) : filteredAllContacts.length === 0 ? (
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

              {loading ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <Loader2 className={`w-16 h-16 ${effectiveTheme.textSecondary || "text-gray-400"} mb-4 animate-spin`} />
                  <p className={`${effectiveTheme.text || "text-gray-900"} text-center`}>
                    Loading users...
                  </p>
                </div>
              ) : filteredRegisteredUsers.length === 0 ? (
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
                  {getBusinessCategoriesWithOther(businessUsers, businessCategoryCounts)
                    .filter((c) => {
                      if (c.id === 'other') return c.count > 0;
                      const countByLabel = businessCategoryCounts[c.label] || 0;
                      const countById = businessCategoryCounts[c.id] || 0;
                      return countByLabel > 0 || countById > 0;
                    })
                    .map((category) => {
                      const count = category.id === 'other' 
                        ? category.count 
                        : (businessCategoryCounts[category.label] || businessCategoryCounts[category.id] || 0);
                      
                      return (
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
                            {count} businesses
                          </p>
                        </motion.div>
                      );
                    })}
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

                {loading ? (
                  <div className="flex flex-col items-center justify-center p-8">
                    <Loader2 className={`w-16 h-16 ${effectiveTheme.textSecondary || "text-gray-400"} mb-4 animate-spin`} />
                    <p className={`${effectiveTheme.text || "text-gray-900"} text-center`}>
                      Loading business users...
                    </p>
                  </div>
                ) : filteredBusinessContacts.length === 0 ? (
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
                      showCustomCategory={selectedBusinessCategory.id === 'other'}
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
  showCustomCategory,
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

const avatarSrc =
  contact.avatar ||
  "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg";

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
<div className="flex items-center gap-4 flex-1 min-w-0">
  {/* PROFILE PHOTO */}
  <div className="relative flex-shrink-0">
    <img
      src={avatarSrc}
      alt={contact.name}
      className="w-12 h-12 rounded-full object-cover border border-gray-300"
      loading="lazy"
      onError={(e) => {
        e.currentTarget.src =
          "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg";
      }}
    />

    {/* Online indicator */}
    {contact.online && (
      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
    )}
  </div>

  {/* TEXT CONTENT */}
  <div className="flex-1 min-w-0">
    {/* Name + Category */}
    <div className="flex items-center gap-4 flex-wrap">
      <h3
        className={`font-semibold truncate ${
          effectiveTheme.text || "text-gray-900"
        }`}
      >
        {contact.name}
        {isSelf && (
          <span className="text-xs text-blue-500 ml-1">(You)</span>
        )}
      </h3>

      {/* Show custom category next to name for "Other" view */}
      {showCustomCategory && contact.businessCategory && (
        <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-gray-200/50">
          <Briefcase
            className={`w-3 h-3 ${
              effectiveTheme.textSecondary || "text-gray-500"
            }`}
          />
          <span
            className={`text-xs font-medium ${
              effectiveTheme.textSecondary || "text-gray-500"
            }`}
          >
            {contact.businessCategory}
          </span>
        </div>
      )}
    </div>

    {/* Bio for Business Users */}
    {isBusiness && (
      <>
        {contact.bio ? (
          <p
            className={`text-sm mt-1 ${
              effectiveTheme.textSecondary || "text-gray-600"
            }`}
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: "1.4em",
              maxHeight: "2.8em",
            }}
          >
            {contact.bio}
          </p>
        ) : !showCustomCategory && contact.businessCategory ? (
          <div className="flex items-center space-x-1 mt-1">
            <Briefcase
              className={`w-3 h-3 ${
                effectiveTheme.textSecondary || "text-gray-500"
              }`}
            />
            <span
              className={`text-xs ${
                effectiveTheme.textSecondary || "text-gray-500"
              }`}
            >
              {contact.businessCategory}
            </span>
          </div>
        ) : null}
      </>
    )}
  </div>
</div>


        {/* LEFT ACTION (for contacts list) */}
        {leftActionType && (
          <div className="flex items-center mr-3 flex-shrink-0">
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
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Don't show chat icon for self */}
            {isSelf ? null : (isBusiness || chatStatus === "accepted" || isMyEmailAcceptedByContact ? (
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
            ))}
          </div>
        )}
      </motion.div>

      {/* INVITE MODAL — USERS ONLY */}
      {!isBusiness && showInviteModal && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm`}
          onClick={() => setShowInviteModal(false)}
        >
          {effectiveTheme.mode !== 'dark' && (
            <div className="absolute inset-0 w-full h-full pointer-events-none">
              <CosmosBackground opacity={0.28} theme="light" />
            </div>
          )}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-md rounded-2xl p-6 shadow-xl ${
              effectiveTheme.primary || ''
            } ${effectiveTheme.mode !== 'dark' ? 'bg-white/90' : ''}`}
            style={{ zIndex: 10 }}
          >
            <div className="flex justify-between mb-4">
              <div>
                <h2 className={`font-semibold text-lg ${effectiveTheme.text || 'text-gray-900'}`}>{contact.name}</h2>
                {contact.bio && (
                  <p className={`text-sm mt-1 truncate ${effectiveTheme.textSecondary || 'text-gray-600'}`}>
                    {contact.bio}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className={`p-1 rounded-full transition-colors ${effectiveTheme.mode === 'dark' ? 'hover:bg-white/5' : 'hover:bg-red-500/20'}`}
              >
                <XCircle className={`w-5 h-5 ${effectiveTheme.textSecondary || 'text-gray-400'}`} />
              </button>
            </div>

            {inviteStatus === "sent" && (
              <div className={`p-4 rounded-xl border ${effectiveTheme.mode === 'dark' ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-500/10 border-yellow-300'}`}>
                <p className={`text-sm font-medium ${effectiveTheme.text || 'text-gray-900'}`}>Invite pending</p>
                <p className={`text-xs ${effectiveTheme.textSecondary || 'text-gray-600'}`}>
                  Waiting for {contact.name} to accept
                </p>
              </div>
            )}

            {inviteStatus === "incoming" && (
              <div className={`p-4 rounded-xl border ${effectiveTheme.mode === 'dark' ? 'bg-orange-900/20 border-orange-700' : 'bg-orange-500/10 border-orange-300'}`}>
                <p className={`text-sm font-medium ${effectiveTheme.text || 'text-gray-900'}`}>Incoming request</p>
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
                className={`w-full mt-4 p-3 rounded-xl border resize-none text-sm ${effectiveTheme.mode === 'dark' ? 'bg-transparent text-gray-100 border-gray-700 placeholder-gray-400' : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'}`}
              />
            )}

            <div className="flex justify-end mt-6 gap-2">
              {inviteStatus === "sent" && (
                <button
                  onClick={handleWithdrawInvite}
                  className={`px-4 py-2 rounded-xl border ${effectiveTheme.mode === 'dark' ? 'border-red-600 text-red-400' : 'border-red-500 text-red-500'}`}
                >
                  Withdraw
                </button>
              )}

              {inviteStatus === "idle" && (
                <>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className={`px-4 py-2 rounded-xl border ${effectiveTheme.mode === 'dark' ? 'border-gray-700 text-gray-200' : 'border-gray-300 text-gray-900'}`}
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
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowSharePopup(false)}
        >
          {effectiveTheme.mode !== 'dark' && (
            <div className="absolute inset-0 w-full h-full pointer-events-none">
              <CosmosBackground opacity={0.22} theme="light" />
            </div>
          )}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-2xl p-5 ${effectiveTheme.primary || ''} shadow-2xl ${effectiveTheme.mode !== 'dark' ? 'bg-white/90' : ''}`}
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
                  Share this invite with others
                </p>
              </div>
              <button
                onClick={() => setShowSharePopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col space-y-3">
              <p className={`text-sm ${effectiveTheme.textSecondary || "text-gray-500"}`}>
                Invite message:
              </p>
              {
                /* Compose a friendly invite + link to copy */
              }
              <textarea
                readOnly
                rows={4}
                value={
                  "Join Chasmos to enjoy the next-gen chat app and have a seamless experience of connecting with people worldwide. If you're a business then make your business visible allowing people to approach you.\n\nhttps://chasmos.netlify.app"
                }
                className={`w-full p-3 rounded-md border ${
                  effectiveTheme.border || "border-gray-300"
                } ${effectiveTheme.primary || "bg-white"} text-sm ${
                  effectiveTheme.text || "text-gray-900"
                }`}
              />
              <div className="flex justify-end">
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const message = "Join Chasmos to enjoy the next-gen chat app. If you're a business then make your business visible allowing people to approach you.\n\nhttps://chasmos.netlify.app";
                    try {
                      if (
                        navigator &&
                        navigator.clipboard &&
                        navigator.clipboard.writeText
                      ) {
                        await navigator.clipboard.writeText(message);
                      } else {
                        const el = document.createElement("textarea");
                        el.value = message;
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