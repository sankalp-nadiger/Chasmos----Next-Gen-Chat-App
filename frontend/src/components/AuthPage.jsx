
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Phone,
  ArrowRight,
  Camera
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';
import GoogleSignupComplete from './GoogleSignupComplete.jsx';
import GoogleLoginButton from './GoogleLoginButton.jsx';
import imageCompression from "browser-image-compression";
import { supabase } from '../supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const MAX_BIO_LENGTH = 100; // Character limit for bio

/* ✅ BUSINESS CATEGORIES */
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

// Use shared GoogleLoginButton component (supports auth-code flow)
// Use the full `GoogleSignupComplete` component from its file (imported above)
import.meta.env.VITE_SUPABASE_URL
import.meta.env.VITE_SUPABASE_ANON_KEY

// Features data
const appFeatures = [
  {
    id: 1,
    title: "Message Scheduling",
    description: "Schedule your messages to be sent at the perfect time, ensuring timely communication",
    icon: MessageCircle,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: 2,
    title: "End-to-End Encryption",
    description: "Your messages are fully encrypted from sender to receiver, ensuring complete privacy and security",
    icon: Shield,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 3,
    title: "Screenshot Detection",
    description: "Automatically detect and organize screenshots for enhanced privacy",
    icon: Camera,
    color: "from-green-500 to-emerald-500",
  },
];

// Feature Carousel Component
const FeatureCarousel = ({ currentTheme }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % appFeatures.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % appFeatures.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + appFeatures.length) % appFeatures.length);
  }, []);

  return (
    <div className="relative h-full flex flex-col items-center justify-start pt-16 px-12 py-8 xl:px-24 2xl:px-32">
      <div className="mb-8 text-center max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-6 flex items-center justify-center"
        >
          <Logo size="lg" showText={false} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className={`text-4xl font-bold mb-4 ${currentTheme.text}`}
          style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: "2px" }}
        >
          Welcome to Chasmos
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className={`text-lg ${currentTheme.textSecondary} mb-8`}
        >
          Next-Generation Chat Experience
        </motion.p>
      </div>

      <div className="relative w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className={`${currentTheme.secondary} rounded-2xl p-6 ${currentTheme.shadow} border ${currentTheme.border} min-h-[200px]`}
          >
            <div className="text-center h-full flex flex-col justify-center">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${appFeatures[currentSlide].color} mx-auto mb-4 flex items-center justify-center`}>
                {React.createElement(appFeatures[currentSlide].icon, { className: "w-8 h-8 text-white" })}
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${currentTheme.text}`}>
                {appFeatures[currentSlide].title}
              </h3>
              <p className={`${currentTheme.textSecondary} text-sm leading-relaxed`}>
                {appFeatures[currentSlide].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <button
          onClick={prevSlide}
          className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full ${currentTheme.hover} ${currentTheme.text} flex items-center justify-center transition-all duration-200`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={nextSlide}
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full ${currentTheme.hover} ${currentTheme.text} flex items-center justify-center transition-all duration-200`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex justify-center items-center space-x-2 mt-6">
        {appFeatures.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-110 ${
              index === currentSlide
                ? currentTheme.accent + " shadow-md"
                : "bg-gray-400 hover:bg-gray-300 opacity-70 hover:opacity-100"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Error Alert Component
const ErrorAlert = ({ message, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-2"
    >
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-red-700 dark:text-red-400">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-red-500 hover:text-red-700 transition-colors"
      >
        ×
      </button>
    </motion.div>
  );
};

// Login Form Component
const LoginForm = ({ currentTheme, onLogin, onGoogleNewUser, onForgot }) => {
  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = useCallback(
    async (googleResponse) => {
      console.log('AuthPage.handleGoogleLogin: googleResponse', googleResponse);
      setError("");
      setIsLoading(true);
      try {
        const bodyPayload = googleResponse.code
          ? { code: googleResponse.code }
          : { idToken: googleResponse.credential };

        console.log('AuthPage.handleGoogleLogin: sending payload to server', bodyPayload);
        const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bodyPayload),
        });        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Google login failed");
        }

        if (data.isNewUser) {
          onGoogleNewUser?.({
            email: data.email || data.googleData?.email,
            name: data.name || data.googleData?.name,
            avatar: data.avatar || data.googleData?.picture || data.googleData?.avatar,
            raw: data,
          });
          return;
        }

        // If backend requires Google consent to obtain tokens, redirect user to consent flow
        if (data?.needsGoogleConnect && data.googleConnectUrl) {
          // Persist basic login details so callback can continue the session
          try {
            const userData = data.user || data;
            localStorage.setItem('userInfo', JSON.stringify(userData));
            localStorage.setItem('chasmos_user_data', JSON.stringify(userData));
            localStorage.setItem('token', data.token || data.accessToken || "");
          } catch (e) {}
          // Redirect to Google's OAuth consent to capture refresh token
          window.location.href = data.googleConnectUrl;
          return;
        }

        const userData = data.user || data;
        localStorage.setItem('userInfo', JSON.stringify(userData));
        localStorage.setItem('chasmos_user_data', JSON.stringify(userData));
        localStorage.setItem('token', data.token || data.accessToken || "");
        onLogin?.(data);
      } catch (err) {
        setError(err.message || "Google login failed. Try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [onLogin, onGoogleNewUser]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/api/user/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            emailOrPhone: formData.emailOrPhone,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Login failed");
        }

        // If server asks user to connect Google for contacts (no refresh token), redirect
        if (data?.needsGoogleConnect && data.googleConnectUrl) {
          try {
            localStorage.setItem("userInfo", JSON.stringify(data));
            localStorage.setItem("chasmos_user_data", JSON.stringify(data));
            localStorage.setItem("token", data.token);
          } catch (e) {}
          window.location.href = data.googleConnectUrl;
          return;
        }

        localStorage.setItem("userInfo", JSON.stringify(data));
        localStorage.setItem("chasmos_user_data", JSON.stringify(data));
        localStorage.setItem("token", data.token);
        onLogin?.(data);
      } catch (err) {
        setError(err.message || "Failed to login. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [formData, onLogin]
  );

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <AnimatePresence>
        {error && <ErrorAlert message={error} onClose={() => setError("")} />}
      </AnimatePresence>

      <div>
        <GoogleLoginButton 
          onSuccess={handleGoogleLogin} 
          onError={(err) => setError(err?.message || "Google Sign-in error")} 
        />
      </div>

      <div className="space-y-2">
        <label className={`block text-sm font-medium ${currentTheme.text}`}>
          Email or Phone Number
        </label>
        <div className="relative">
          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${currentTheme.textSecondary}`}>
            <Mail className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="Enter your email or phone number"
            value={formData.emailOrPhone}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, emailOrPhone: e.target.value }))
            }
            className={`w-full pl-10 pr-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${currentTheme.text}`}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className={`block text-sm font-medium ${currentTheme.text}`}>
          Password
        </label>
        <div className="relative">
          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${currentTheme.textSecondary}`}>
            <Lock className="h-5 w-5" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, password: e.target.value }))
            }
            className={`w-full pl-10 pr-12 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${currentTheme.text}`}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`absolute inset-y-0 right-0 pr-3 flex items-center ${currentTheme.textSecondary} hover:${currentTheme.text} transition-colors`}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => onForgot && onForgot()}
          className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
        >
          Forgot password?
        </button>
      </div>

      <motion.button
        type="submit"
        disabled={isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <span>Sign In</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </motion.button>
    </motion.form>
  );
};

// Forgot Password Form Component
const ForgotPasswordForm = ({ currentTheme, onCancel, onDone }) => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [step, setStep] = useState("enter"); // enter | verify | reset | done
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const sendOtp = async () => {
    setError("");
    if (!emailOrPhone) return setError("Please enter email or phone number");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setStep("verify");
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    if (!otp) return setError("Please enter the OTP");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/verify-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "OTP verification failed");
      setStep("reset");
    } catch (err) {
      setError(err.message || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    setError("");
    if (!newPassword || !confirmPassword) return setError("Please fill in the new password");
    if (newPassword !== confirmPassword) return setError("Passwords do not match");
    if (newPassword.length < 6) return setError("Password must be at least 6 characters");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");
      setStep("done");
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <AnimatePresence>
        {error && <ErrorAlert message={error} onClose={() => setError("")} />}
      </AnimatePresence>

      {step === "enter" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${currentTheme.text}`}>Email or Phone</label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${currentTheme.textSecondary}`}>
                <Mail className="h-5 w-5" />
              </div>
              <input
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="Enter email or phone"
                className={`w-full pl-10 pr-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg ${currentTheme.text}`}
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button type="button" onClick={onCancel} className="text-sm text-gray-500">Cancel</button>
            <button onClick={sendOtp} disabled={isLoading} className="py-2 px-4 bg-blue-600 text-white rounded-lg">
              {isLoading ? 'Sending…' : 'Send OTP'}
            </button>
          </div>
        </div>
      )}

      {step === "verify" && (
        <div className="space-y-4">
          <p className={`${currentTheme.textSecondary} text-sm`}>We've sent an OTP to the provided contact. Enter it below.</p>
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${currentTheme.text}`}>OTP</label>
            <input value={otp} onChange={(e) => setOtp(e.target.value)} className={`w-full px-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg ${currentTheme.text}`} placeholder="Enter OTP" />
          </div>

          <div className="flex justify-between items-center">
            <button type="button" onClick={() => setStep('enter')} className="text-sm text-gray-500">Back</button>
            <button onClick={verifyOtp} disabled={isLoading} className="py-2 px-4 bg-blue-600 text-white rounded-lg">{isLoading ? 'Verifying…' : 'Verify OTP'}</button>
          </div>
        </div>
      )}

      {step === "reset" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${currentTheme.text}`}>New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`w-full px-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg ${currentTheme.text}`} placeholder="New password" />
          </div>
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${currentTheme.text}`}>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full px-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg ${currentTheme.text}`} placeholder="Confirm password" />
          </div>

          <div className="flex justify-between items-center">
            <button type="button" onClick={() => setStep('verify')} className="text-sm text-gray-500">Back</button>
            <button onClick={resetPassword} disabled={isLoading} className="py-2 px-4 bg-blue-600 text-white rounded-lg">{isLoading ? 'Resetting…' : 'Reset Password'}</button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="space-y-4 text-center">
          <p className={`${currentTheme.text} font-medium`}>Password reset successful.</p>
          <div className="flex justify-center">
            <button onClick={() => { onDone && onDone(); }} className="py-2 px-4 bg-green-600 text-white rounded-lg">Back to Sign In</button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Signup Form Component
const SignupForm = ({ currentTheme, onSignup }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    bio: "",
    picFile: null,
    isBusiness: false,
    businessCategory: "",
    customBusinessCategory: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePicChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((p) => ({ ...p, picFile: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    /* ---------- VALIDATION ---------- */
    if (
      !formData.name ||
      !formData.email ||
      !formData.phoneNumber ||
      !formData.password ||
      !formData.bio
    ) {
      return setError("Please fill in all required fields");
    }

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords don't match");
    }

    if (formData.isBusiness && !formData.businessCategory) {
      return setError("Please select a business category");
    }

    if (
      formData.isBusiness &&
      formData.businessCategory === "other" &&
      !formData.customBusinessCategory.trim()
    ) {
      return setError("Please specify your business category");
    }

    setIsLoading(true);

    try {
      /* ---------- FINAL BUSINESS CATEGORY LABEL ---------- */
      let finalBusinessCategory = null;

      if (formData.isBusiness) {
        if (formData.businessCategory === "other") {
          finalBusinessCategory = formData.customBusinessCategory.trim();
        } else {
          const selected = BUSINESS_CATEGORIES.find(
            (c) => c.id === formData.businessCategory
          );
          finalBusinessCategory = selected?.label || null;
        }
      }

      /* ---------- AVATAR UPLOAD ---------- */
      let avatarUrl = null;

      if (formData.picFile) {
        const compressed = await imageCompression(formData.picFile, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        });

        const ext = compressed.name.split(".").pop();
        const fileName = `avatars/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, compressed, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        avatarUrl = data.publicUrl;
      }

      /* ---------- API REQUEST ---------- */
      const response = await fetch(`${API_BASE_URL}/api/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          bio: formData.bio,
          avatar: avatarUrl,
          isBusiness: formData.isBusiness,
          businessCategory: finalBusinessCategory,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Signup failed");

      /* ---------- SAVE ---------- */
      localStorage.setItem("userInfo", JSON.stringify(data));
      localStorage.setItem("chasmos_user_data", JSON.stringify(data));
      localStorage.setItem("token", data.token);

      onSignup?.(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AnimatePresence>
        {error && <ErrorAlert message={error} onClose={() => setError("")} />}
      </AnimatePresence>

      {/* FULL NAME */}
      <div className="space-y-2">
        <label className={`block text-sm font-medium ${currentTheme.text}`}>
          Full Name
        </label>
        <input
          placeholder="Enter your full name"
          value={formData.name}
          onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
          className={`w-full px-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 ${currentTheme.text}`}
          required
        />
      </div>

      {/* EMAIL */}
      <div className="space-y-2">
        <label className={`block text-sm font-medium ${currentTheme.text}`}>
          Email Address
        </label>
        <div className="relative">
          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${currentTheme.textSecondary}`}>
            <Mail className="h-5 w-5" />
          </div>
          <input
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
            className={`w-full pl-10 pr-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 ${currentTheme.text}`}
            required
          />
        </div>
      </div>

      {/* PHONE */}
      <div className="space-y-2">
        <label className={`block text-sm font-medium ${currentTheme.text}`}>
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          placeholder="Enter your phone number"
          value={formData.phoneNumber}
          onChange={(e) => setFormData(p => ({ ...p, phoneNumber: e.target.value }))}
          className={`w-full px-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 ${currentTheme.text}`}
          required
        />
      </div>

      {/* BUSINESS TOGGLE */}
      <label className={`flex items-center gap-2 text-sm ${currentTheme.text}`}>
        <input
          type="checkbox"
          checked={formData.isBusiness}
          onChange={(e) =>
            setFormData(p => ({
              ...p,
              isBusiness: e.target.checked,
              businessCategory: "",
              customBusinessCategory: "",
            }))
          }
          className="w-4 h-4"
        />
        Business Account
      </label>

      {/* BUSINESS CATEGORY */}
      {formData.isBusiness && (
        <>
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${currentTheme.text}`}>
              Business Category
            </label>
            <select
              value={formData.businessCategory}
              onChange={(e) =>
                setFormData(p => ({
                  ...p,
                  businessCategory: e.target.value,
                  customBusinessCategory: "",
                }))
              }
              className={`w-full px-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 ${currentTheme.text}`}
              required
            >
              <option value="">Select category</option>
              {BUSINESS_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {formData.businessCategory === "other" && (
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${currentTheme.text}`}>
                Specify Business Category
              </label>
              <textarea
                placeholder="Enter your business category"
                value={formData.customBusinessCategory}
                onChange={(e) =>
                  setFormData(p => ({ ...p, customBusinessCategory: e.target.value }))
                }
                className={`w-full px-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 ${currentTheme.text} resize-none`}
                rows="2"
                maxLength={50}
                required
              />
            </div>
          )}
        </>
      )}

      {/* BIO with character limit */}
      <div className="space-y-2">
        <label className={`block text-sm font-medium ${currentTheme.text}`}>
          {formData.isBusiness ? "About Company" : "Bio"}
          <span className={`ml-2 text-xs ${currentTheme.textSecondary}`}>
            ({formData.bio.length}/{MAX_BIO_LENGTH})
          </span>
        </label>
        <textarea
          placeholder={formData.isBusiness ? "Brief description of your company" : "Tell us about yourself"}
          value={formData.bio}
          onChange={(e) => {
            const text = e.target.value;
            if (text.length <= MAX_BIO_LENGTH) {
              setFormData(p => ({ ...p, bio: text }));
            }
          }}
          className={`w-full px-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 ${currentTheme.text} resize-none`}
          rows="3"
          maxLength={MAX_BIO_LENGTH}
          required
        />
        {formData.bio.length >= MAX_BIO_LENGTH && (
          <p className="text-xs text-orange-500">
            Maximum character limit reached
          </p>
        )}
      </div>

      {/* PASSWORD */}
      <div className="space-y-2">
        <label className={`block text-sm font-medium ${currentTheme.text}`}>
          Password
        </label>
        <div className="relative">
          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${currentTheme.textSecondary}`}>
            <Lock className="h-5 w-5" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            value={formData.password}
            onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
            className={`w-full pl-10 pr-12 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 ${currentTheme.text}`}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`absolute inset-y-0 right-0 pr-3 flex items-center ${currentTheme.textSecondary} hover:${currentTheme.text} transition-colors`}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* CONFIRM PASSWORD */}
      <div className="space-y-2">
        <label className={`block text-sm font-medium ${currentTheme.text}`}>
          Confirm Password
        </label>
        <div className="relative">
          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${currentTheme.textSecondary}`}>
            <Lock className="h-5 w-5" />
          </div>
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData(p => ({ ...p, confirmPassword: e.target.value }))
            }
            className={`w-full pl-10 pr-12 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 ${currentTheme.text}`}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className={`absolute inset-y-0 right-0 pr-3 flex items-center ${currentTheme.textSecondary} hover:${currentTheme.text} transition-colors`}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {formData.password &&
          formData.confirmPassword &&
          formData.password !== formData.confirmPassword && (
            <p className="text-sm text-red-500">Passwords don't match</p>
          )}
      </div>

      {/* AVATAR */}
      <div className="space-y-2">
        <label className={`block text-sm font-medium ${currentTheme.text}`}>
          Profile Picture <span className="text-gray-400">(Optional)</span>
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handlePicChange}
          className={`w-full px-4 py-2 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg ${currentTheme.text}`}
        />
      </div>

      <motion.button
        type="submit"
        disabled={isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <span>Create Account</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </motion.button>
    </motion.form>
  );
};

// Main AuthPage Component
const AuthPage = ({ onAuthenticated }) => {
  const { currentTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [googleData, setGoogleData] = useState(null);
  
  const handleGoogleResponse = useCallback(async (response) => {
    try {
      const { credential } = response;
      
      const googleResponse = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
      });

      const data = await googleResponse.json();

      if (!googleResponse.ok) {
        throw new Error(data.message || 'Google authentication failed');
      }

      if (data.isNewUser) {
        setGoogleData({
          email: data.email,
          name: data.name,
          avatar: data.picture
        });
      } else {
        // For existing users, proceed with login
        localStorage.setItem('userInfo', JSON.stringify(data));
        localStorage.setItem('chasmos_user_data', JSON.stringify(data));
        localStorage.setItem('token', data.token);
        onAuthenticated?.(true, data);
      }
    } catch (error) {
      console.error('Google auth error:', error);
      alert(error.message || 'Failed to authenticate with Google');
    }
  }, [onAuthenticated]);

  const handleLogin = useCallback(
    (userData) => {
      onAuthenticated?.(true, userData);
    },
    [onAuthenticated]
  );

  const handleSignup = useCallback(
    (userData) => {
      onAuthenticated?.(true, userData);
    },
    [onAuthenticated]
  );

  return (
    <>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700&display=swap');
        .perspective-1000 {
          perspective: 1000px;
          transform-style: preserve-3d;
        }
        `}
      </style>
      
      {googleData ? (
        <GoogleSignupComplete 
          googleData={googleData}
          currentTheme={currentTheme}
          onBack={() => setGoogleData(null)}
          onSuccess={(userData) => {
            setGoogleData(null);
            onAuthenticated?.(true, userData);
          }}
        />
      ) : (
        <div className={`min-h-screen flex ${currentTheme.primary} w-full`}>
          <div className={`hidden lg:flex lg:w-1/2 ${currentTheme.primary} relative overflow-hidden`}>
            <FeatureCarousel currentTheme={currentTheme} />
          </div>

          <div className={`w-full lg:w-1/2 flex flex-col ${currentTheme.secondary}`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className={`flex rounded-lg p-1 ${currentTheme.searchBg} relative overflow-hidden`}>
                <motion.div
                  className={`absolute top-1 bottom-1 w-1/2 ${currentTheme.accent} rounded-md shadow-md`}
                  animate={{
                    x: isLogin ? "0%" : "100%",
                    transition: {
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    },
                  }}
                />

                <motion.button
                  onClick={() => setIsLogin(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 relative z-10 ${
                    isLogin
                      ? "text-white"
                      : `${currentTheme.text} hover:${currentTheme.hover}`
                  }`}
                >
                  <motion.span
                    animate={{
                      scale: isLogin ? 1.05 : 1,
                      transition: { duration: 0.2 },
                    }}
                  >
                    Sign In
                  </motion.span>
                </motion.button>

                <motion.button
                  onClick={() => setIsLogin(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 relative z-10 ${
                    !isLogin
                      ? "text-white"
                      : `${currentTheme.text} hover:${currentTheme.hover}`
                  }`}
                >
                  <motion.span
                    animate={{
                      scale: !isLogin ? 1.05 : 1,
                      transition: { duration: 0.2 },
                    }}
                  >
                    Sign Up
                  </motion.span>
                </motion.button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
              <div className="w-full max-w-md">
                <div className="text-center mb-8 overflow-hidden">
                  <motion.div
                    key={isLogin ? "login-header" : "signup-header"}
                    initial={{
                      opacity: 0,
                      y: 30,
                      rotateX: -15,
                      scale: 0.9,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      rotateX: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: -30,
                      rotateX: 15,
                      scale: 0.9,
                    }}
                    transition={{
                      duration: 0.5,
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                    }}
                    className="perspective-1000"
                  >
                    <h2 className={`text-2xl font-bold ${currentTheme.text} mb-2`}>
                      {isLogin ? "Welcome Back!" : "Join Chasmos"}
                    </h2>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                      className={currentTheme.textSecondary}
                    >
                      {isLogin
                        ? "Sign in to your account to continue chatting"
                        : "Create your account and start connecting with friends"}
                    </motion.p>
                  </motion.div>
                </div>

                <AnimatePresence mode="wait">
                  {isForgot ? (
                    <motion.div
                      key="forgot"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.35 }}
                      className="perspective-1000"
                    >
                      <motion.div initial={{ y: 10 }} animate={{ y: 0 }} transition={{ duration: 0.3 }}>
                        <ForgotPasswordForm
                          currentTheme={currentTheme}
                          onCancel={() => setIsForgot(false)}
                          onDone={() => { setIsForgot(false); setIsLogin(true); }}
                        />
                      </motion.div>
                    </motion.div>
                  ) : isLogin ? (
                    <motion.div
                      key="login"
                      initial={{
                        opacity: 0,
                        x: -50,
                        scale: 0.95,
                        rotateY: -10,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale: 1,
                        rotateY: 0,
                      }}
                      exit={{
                        opacity: 0,
                        x: 50,
                        scale: 0.95,
                        rotateY: 10,
                      }}
                      transition={{
                        duration: 0.5,
                        type: "spring",
                        stiffness: 200,
                        damping: 25,
                      }}
                      className="perspective-1000"
                    >
                      <motion.div
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                      >
                        <LoginForm
                          currentTheme={currentTheme}
                          onLogin={handleLogin}
                          onGoogleNewUser={(data) => {
                            setGoogleData({
                              email: data.email,
                              name: data.name,
                              avatar: data.avatar
                            });
                          }}
                          onForgot={() => setIsForgot(true)}
                        />
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="signup"
                      initial={{
                        opacity: 0,
                        x: 50,
                        scale: 0.95,
                        rotateY: 10,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale: 1,
                        rotateY: 0,
                      }}
                      exit={{
                        opacity: 0,
                        x: -50,
                        scale: 0.95,
                        rotateY: -10,
                      }}
                      transition={{
                        duration: 0.5,
                        type: "spring",
                        stiffness: 200,
                        damping: 25,
                      }}
                      className="perspective-1000"
                    >
                      <motion.div
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                      >
                        <SignupForm
                          currentTheme={currentTheme}
                          onSignup={handleSignup}
                        />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-8 text-center">
                  <p className={`text-xs ${currentTheme.textSecondary}`}>
                    By continuing, you agree to our{" "}
                    <button className="text-blue-600 hover:text-blue-500 font-medium">
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button className="text-blue-600 hover:text-blue-500 font-medium">
                      Privacy Policy
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AuthPage;