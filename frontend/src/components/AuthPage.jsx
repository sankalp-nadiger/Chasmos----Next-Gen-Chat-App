/* eslint-disable no-unused-vars */
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
  ArrowRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';
import GoogleSignupComplete from './GoogleSignupComplete.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Use the full `GoogleSignupComplete` component from its file (imported above)

// Mock Cloudinary upload
const uploadToCloudinary = async (file) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve("https://via.placeholder.com/150"), 1000);
  });
};

const GoogleLoginButton = ({ onSuccess, onError }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: onSuccess,
      });
      
      window.google?.accounts.id.renderButton(
        document.getElementById('googleLoginButton'),
        { 
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with'
        }
      );
    };
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [onSuccess]);
  
  return <div id="googleLoginButton"></div>;
};

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
    title: "Collaborative Project Discussion",
    description: "Discuss project ideas with integrated documentation and real-time collaboration tools",
    icon: Users,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 3,
    title: "Screenshot Detection",
    description: "Automatically detect and organize screenshots for easy reference and sharing",
    icon: Shield,
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
const LoginForm = ({ currentTheme, onLogin, onGoogleNewUser }) => {
  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = useCallback(
    async (googleResponse) => {
      setError("");
      setIsLoading(true);
      try {
        // Support both authorization code and idToken
        const bodyPayload = googleResponse.code
          ? { code: googleResponse.code }
          : { idToken: googleResponse.credential };

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

        // If backend indicates this is a new user, let parent show completion form
        if (data.isNewUser) {
          onGoogleNewUser?.({
            email: data.email || data.googleData?.email,
            name: data.name || data.googleData?.name,
            avatar: data.avatar || data.googleData?.picture || data.googleData?.avatar,
            raw: data,
          });
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

// Signup Form Component
const SignupForm = ({ currentTheme, onSignup }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    bio: "",
    avatar: "",
    picFile: null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, picFile: file }));
    }
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords don't match!");
        return;
      }
      if (!formData.name || !formData.email || !formData.password || !formData.phoneNumber || !formData.bio) {
        setError("Please fill in all required fields");
        return;
      }

      setIsLoading(true);

      try {
        let avatarUrl = formData.avatar;
        if (formData.picFile) {
          avatarUrl = await uploadToCloudinary(formData.picFile);
        }

        const response = await fetch(`${API_BASE_URL}/api/user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
            password: formData.password,
            bio: formData.bio,
            avatar: avatarUrl,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Registration failed");
        }

        localStorage.setItem("userInfo", JSON.stringify(data));
        localStorage.setItem("chasmos_user_data", JSON.stringify(data));
        localStorage.setItem("token", data.token);
        onSignup?.(data);
      } catch (err) {
        setError(err.message || "Failed to create account. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [formData, onSignup]
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

      <div className="space-y-2">
        <label className={`block text-sm font-medium ${currentTheme.text}`}>
          Full Name
        </label>
        <input
          type="text"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          className={`w-full px-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${currentTheme.text}`}
          required
        />
      </div>

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
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            className={`w-full pl-10 pr-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${currentTheme.text}`}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className={`block text-sm font-medium ${currentTheme.text}`}>
          Phone Number
        </label>
        <input
          type="tel"
          placeholder="Enter your phone number"
          value={formData.phoneNumber}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))
          }
          className={`w-full px-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${currentTheme.text}`}
          required
        />
      </div>

      <div className="space-y-2">
        <label className={`block text-sm font-medium ${currentTheme.text}`}>
          Bio
        </label>
        <textarea
          placeholder="Tell us about yourself"
          value={formData.bio}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, bio: e.target.value }))
          }
          rows="3"
          className={`w-full px-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${currentTheme.text} resize-none`}
          required
        />
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
            placeholder="Create a strong password"
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
              setFormData((prev) => ({
                ...prev,
                confirmPassword: e.target.value,
              }))
            }
            className={`w-full pl-10 pr-12 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${currentTheme.text}`}
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

      <div className="space-y-2">
        <label className={`block text-sm font-medium ${currentTheme.text}`}>
          Profile Picture <span className="text-gray-400">(Optional)</span>
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handlePicChange}
          className={`w-full px-4 py-2 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg`}
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
        // For new users, show the completion form
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
                  {isLogin ? (
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