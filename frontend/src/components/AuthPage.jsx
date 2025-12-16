/* eslint-disable no-unused-vars */
import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  MessageCircle,
  Users,
  Shield,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  ArrowRight,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import Logo from "./Logo";
import GoogleSignupComplete from "./GoogleSignupComplete.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/* ✅ FIXED BUSINESS CATEGORIES (ID + LABEL) */
const BUSINESS_CATEGORIES = [
  { id: "restaurants", label: "Restaurant" },
  { id: "retail", label: "Retail Store" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "technology", label: "Technology" },
  { id: "education", label: "Education" },
  { id: "healthcare", label: "Healthcare" },
  { id: "finance", label: "Finance" },
  { id: "real-estate", label: "Real Estate" },
  { id: "travel", label: "Travel & Tourism" },
  { id: "entertainment", label: "Entertainment" },
  { id: "marketing", label: "Marketing & Advertising" },
  { id: "freelancer", label: "Freelancer / Consultant" },
  { id: "other", label: "Other" },
];

/* ---------------- ERROR ALERT ---------------- */
const ErrorAlert = ({ message, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-2"
  >
    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
    <div className="flex-1 text-sm text-red-700 dark:text-red-400">
      {message}
    </div>
    <button onClick={onClose}>×</button>
  </motion.div>
);

/* ---------------- LOGIN FORM ---------------- */
const LoginForm = ({ currentTheme, onLogin, onGoogleNewUser }) => {
  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userInfo", JSON.stringify(data));
      onLogin(data);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <ErrorAlert message={error} onClose={() => setError("")} />}

      <input
        placeholder="Email or phone"
        className={`w-full px-4 py-3 ${currentTheme.inputBg} border rounded-lg`}
        value={formData.emailOrPhone}
        onChange={(e) =>
          setFormData((p) => ({ ...p, emailOrPhone: e.target.value }))
        }
        required
      />

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          className={`w-full px-4 py-3 ${currentTheme.inputBg} border rounded-lg`}
          value={formData.password}
          onChange={(e) =>
            setFormData((p) => ({ ...p, password: e.target.value }))
          }
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-3"
        >
          {showPassword ? <EyeOff /> : <Eye />}
        </button>
      </div>

      <button
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
};

/* ---------------- SIGNUP FORM ---------------- */
const SignupForm = ({ currentTheme, onSignup }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    bio: "",
    isBusiness: false,
    businessCategory: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword)
      return setError("Passwords do not match");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userInfo", JSON.stringify(data));
      onSignup(data);
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <ErrorAlert message={error} onClose={() => setError("")} />}

      <input
        placeholder="Full name"
        required
        className={`w-full px-4 py-3 ${currentTheme.inputBg} border rounded-lg`}
        onChange={(e) =>
          setFormData((p) => ({ ...p, name: e.target.value }))
        }
      />

      <input
        placeholder="Email"
        required
        className={`w-full px-4 py-3 ${currentTheme.inputBg} border rounded-lg`}
        onChange={(e) =>
          setFormData((p) => ({ ...p, email: e.target.value }))
        }
      />

      <input
        placeholder="Phone"
        required
        className={`w-full px-4 py-3 ${currentTheme.inputBg} border rounded-lg`}
        onChange={(e) =>
          setFormData((p) => ({ ...p, phoneNumber: e.target.value }))
        }
      />

      {/* BUSINESS TOGGLE */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.isBusiness}
          onChange={(e) =>
            setFormData((p) => ({
              ...p,
              isBusiness: e.target.checked,
              businessCategory: "",
            }))
          }
        />
        Business account
      </label>

      {/* BUSINESS CATEGORY */}
      {formData.isBusiness && (
        <select
          required
          value={formData.businessCategory}
          className={`w-full px-4 py-3 ${currentTheme.inputBg} border rounded-lg`}
          onChange={(e) =>
            setFormData((p) => ({
              ...p,
              businessCategory: e.target.value,
            }))
          }
        >
          <option value="">Select category</option>
          {BUSINESS_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      )}

      <textarea
        placeholder={formData.isBusiness ? "About company" : "Bio"}
        required
        className={`w-full px-4 py-3 ${currentTheme.inputBg} border rounded-lg`}
        onChange={(e) =>
          setFormData((p) => ({ ...p, bio: e.target.value }))
        }
      />

      <input
        type="password"
        placeholder="Password"
        required
        className={`w-full px-4 py-3 ${currentTheme.inputBg} border rounded-lg`}
        onChange={(e) =>
          setFormData((p) => ({ ...p, password: e.target.value }))
        }
      />

      <input
        type="password"
        placeholder="Confirm password"
        required
        className={`w-full px-4 py-3 ${currentTheme.inputBg} border rounded-lg`}
        onChange={(e) =>
          setFormData((p) => ({ ...p, confirmPassword: e.target.value }))
        }
      />

      <button
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg"
      >
        {loading ? "Creating..." : "Create Account"}
      </button>
    </form>
  );
};

/* ---------------- MAIN AUTH PAGE ---------------- */
const AuthPage = ({ onAuthenticated }) => {
  const { currentTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [googleData, setGoogleData] = useState(null);

  return googleData ? (
    <GoogleSignupComplete
      googleData={googleData}
      currentTheme={currentTheme}
      onBack={() => setGoogleData(null)}
      onSuccess={(data) => onAuthenticated(true, data)}
    />
  ) : (
    <div className="min-h-screen flex">
      <div className="w-full max-w-md mx-auto p-8">
        <div className="flex mb-6">
          <button onClick={() => setIsLogin(true)} className="flex-1">
            Sign In
          </button>
          <button onClick={() => setIsLogin(false)} className="flex-1">
            Sign Up
          </button>
        </div>

        {isLogin ? (
          <LoginForm
            currentTheme={currentTheme}
            onLogin={(data) => onAuthenticated(true, data)}
          />
        ) : (
          <SignupForm
            currentTheme={currentTheme}
            onSignup={(data) => onAuthenticated(true, data)}
          />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
