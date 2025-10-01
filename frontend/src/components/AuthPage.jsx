import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Send,
  CheckCircle,
  MessageCircle,
  Users,
  Shield,
  Zap,
  Heart,
  Star,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Smartphone,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

// Features data for carousel
const appFeatures = [
  {
    id: 1,
    title: "Real-time Messaging",
    description:
      "Instant messaging with read receipts, typing indicators, and emoji reactions",
    icon: MessageCircle,
    image: "🚀",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: 2,
    title: "Smart Contacts",
    description:
      "Intelligent contact management with online status and last seen",
    icon: Users,
    image: "👥",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 3,
    title: "End-to-End Security",
    description:
      "Your messages are protected with advanced encryption technology",
    icon: Shield,
    image: "🔒",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: 4,
    title: "Lightning Fast",
    description:
      "Optimized performance for smooth and responsive user experience",
    icon: Zap,
    image: "⚡",
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: 5,
    title: "Beautiful Themes",
    description:
      "Dynamic themes that change based on time of day automatically",
    icon: Heart,
    image: "🎨",
    color: "from-red-500 to-rose-500",
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
    setCurrentSlide(
      (prev) => (prev - 1 + appFeatures.length) % appFeatures.length
    );
  }, []);

  return (
    <div className="relative h-full flex flex-col items-center justify-center p-8">
      <div className="mb-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`w-16 h-16 rounded-full ${currentTheme.accent} mx-auto mb-6 flex items-center justify-center`}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="currentColor"
              className="text-blue-500"
            />
            <path
              d="M17.5 15.5C17.25 15.25 16.8125 15.0625 16.375 14.875C15.9375 14.6875 15.5625 14.5 15.0625 14.1875C14.5625 13.875 14.1875 13.625 13.8125 13.3125C13.4375 13 13.0625 12.5625 12.75 12.0625C12.5 11.5625 12.25 11.0625 12 10.5625C11.75 10.0625 11.5 9.5625 11.25 9.0625C11 8.5625 10.75 8.125 10.5 7.625C10.25 7.125 10 6.625 9.75 6.125C9.5 5.625 9.25 5.1875 9 4.6875C8.75 4.1875 8.5 3.75 8.25 3.25C8 2.75 7.75 2.25 7.5 1.75C7.25 1.25 7 0.75 6.75 0.25C6.5 0.25 6.25 0.5 6 0.75C5.75 1 5.5 1.25 5.25 1.5C5 1.75 4.75 2 4.5 2.25C4.25 2.5 4 2.75 3.75 3C3.5 3.25 3.25 3.5 3 3.75C2.75 4 2.5 4.25 2.25 4.5C2 4.75 1.75 5 1.5 5.25C1.25 5.5 1 5.75 0.75 6C0.5 6.25 0.25 6.5 0.25 6.75L0.25 6.75Z"
              fill="white"
            />
          </svg>
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

      {/* Feature Carousel */}
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
              <div
                className={`w-16 h-16 rounded-full bg-gradient-to-br ${appFeatures[currentSlide].color} mx-auto mb-4 flex items-center justify-center text-2xl`}
              >
                {appFeatures[currentSlide].image}
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${currentTheme.text}`}>
                {appFeatures[currentSlide].title}
              </h3>
              <p
                className={`${currentTheme.textSecondary} text-sm leading-relaxed`}
              >
                {appFeatures[currentSlide].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Controls */}
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

      {/* Slide Indicators */}
      <div className="flex justify-center items-center space-x-2 mt-6">
        {appFeatures.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentSlide
                ? currentTheme.accent
                : `${currentTheme.textSecondary} opacity-50`
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Login Form Component
const LoginForm = ({ currentTheme, onLogin }) => {
  const [formData, setFormData] = useState({
    contact: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [contactType, setContactType] = useState("email"); // email or phone
  const [isLoading, setIsLoading] = useState(false);

  const detectContactType = useCallback((value) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (phoneRegex.test(value.replace(/\s/g, ""))) {
      setContactType("phone");
    } else if (emailRegex.test(value)) {
      setContactType("email");
    } else {
      setContactType("email"); // default
    }
  }, []);

  const handleContactChange = useCallback(
    (e) => {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, contact: value }));
      detectContactType(value);
    },
    [detectContactType]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsLoading(true);

      // Simulate login process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setIsLoading(false);
      onLogin?.(formData);
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
      {/* Contact Input */}
      <div className="space-y-2">
        <label className={`block text-sm font-medium ${currentTheme.text}`}>
          Email or Phone Number
        </label>
        <div className="relative">
          <div
            className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${currentTheme.textSecondary}`}
          >
            {contactType === "phone" ? (
              <Phone className="h-5 w-5" />
            ) : (
              <Mail className="h-5 w-5" />
            )}
          </div>
          <input
            type={contactType === "phone" ? "tel" : "email"}
            placeholder={
              contactType === "phone"
                ? "Enter your phone number"
                : "Enter your email"
            }
            value={formData.contact}
            onChange={handleContactChange}
            className={`w-full pl-10 pr-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${currentTheme.text}`}
            required
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <label className={`block text-sm font-medium ${currentTheme.text}`}>
          Password
        </label>
        <div className="relative">
          <div
            className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${currentTheme.textSecondary}`}
          >
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
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input
            type="checkbox"
            className={`rounded border ${currentTheme.border} text-blue-600 focus:ring-blue-500`}
          />
          <span className={`ml-2 text-sm ${currentTheme.textSecondary}`}>
            Remember me
          </span>
        </label>
        <button
          type="button"
          className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
        >
          Forgot password?
        </button>
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
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
    contact: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [contactType, setContactType] = useState("email");
  const [step, setStep] = useState(1); // 1: contact, 2: otp, 3: password
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const detectContactType = useCallback((value) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (phoneRegex.test(value.replace(/\s/g, ""))) {
      setContactType("phone");
    } else if (emailRegex.test(value)) {
      setContactType("email");
    } else {
      setContactType("email");
    }
  }, []);

  const handleContactChange = useCallback(
    (e) => {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, contact: value }));
      detectContactType(value);
    },
    [detectContactType]
  );

  const sendOTP = useCallback(async () => {
    setIsLoading(true);

    // Simulate OTP sending
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setOtpSent(true);
    setStep(2);
    setOtpTimer(60);
    setIsLoading(false);

    // Start countdown
    const timer = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const verifyOTP = useCallback(async () => {
    setIsLoading(true);

    // Simulate OTP verification
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setStep(3);
    setIsLoading(false);
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (step === 1) {
        await sendOTP();
      } else if (step === 2) {
        await verifyOTP();
      } else if (step === 3) {
        if (formData.password !== formData.confirmPassword) {
          alert("Passwords don't match!");
          return;
        }

        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsLoading(false);

        onSignup?.(formData);
      }
    },
    [step, formData, sendOTP, verifyOTP, onSignup]
  );

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Step 1: Contact Information */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${currentTheme.text}`}>
              Email or Phone Number
            </label>
            <div className="relative">
              <div
                className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${currentTheme.textSecondary}`}
              >
                {contactType === "phone" ? (
                  <Phone className="h-5 w-5" />
                ) : (
                  <Mail className="h-5 w-5" />
                )}
              </div>
              <input
                type={contactType === "phone" ? "tel" : "email"}
                placeholder={
                  contactType === "phone"
                    ? "Enter your phone number"
                    : "Enter your email"
                }
                value={formData.contact}
                onChange={handleContactChange}
                className={`w-full pl-10 pr-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${currentTheme.text}`}
                required
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 2: OTP Verification */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <div
              className={`w-16 h-16 rounded-full ${currentTheme.accent} mx-auto mb-4 flex items-center justify-center`}
            >
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${currentTheme.text}`}>
              Verify Your {contactType === "phone" ? "Phone" : "Email"}
            </h3>
            <p className={`text-sm ${currentTheme.textSecondary}`}>
              We've sent a verification code to{" "}
              <span className="font-medium">{formData.contact}</span>
            </p>
          </div>

          <div className="space-y-2">
            <label className={`block text-sm font-medium ${currentTheme.text}`}>
              Verification Code
            </label>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={formData.otp}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, otp: e.target.value }))
              }
              className={`w-full px-4 py-3 ${currentTheme.inputBg} border ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${currentTheme.text} text-center text-lg tracking-widest`}
              maxLength={6}
              required
            />
          </div>

          {otpTimer > 0 ? (
            <p className={`text-center text-sm ${currentTheme.textSecondary}`}>
              Resend code in {otpTimer}s
            </p>
          ) : (
            <button
              type="button"
              onClick={sendOTP}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
            >
              Resend verification code
            </button>
          )}
        </motion.div>
      )}

      {/* Step 3: Password Setup */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="text-center mb-6">
            <div
              className={`w-16 h-16 rounded-full ${currentTheme.accent} mx-auto mb-4 flex items-center justify-center`}
            >
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${currentTheme.text}`}>
              Verification Successful!
            </h3>
            <p className={`text-sm ${currentTheme.textSecondary}`}>
              Now set up your password to secure your account
            </p>
          </div>

          <div className="space-y-2">
            <label className={`block text-sm font-medium ${currentTheme.text}`}>
              Password
            </label>
            <div className="relative">
              <div
                className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${currentTheme.textSecondary}`}
              >
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
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className={`block text-sm font-medium ${currentTheme.text}`}>
              Confirm Password
            </label>
            <div className="relative">
              <div
                className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${currentTheme.textSecondary}`}
              >
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
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {formData.password &&
            formData.confirmPassword &&
            formData.password !== formData.confirmPassword && (
              <p className="text-sm text-red-500">Passwords don't match</p>
            )}
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {step === 1 && (
              <>
                <Send className="w-5 h-5" />
                <span>Send Verification Code</span>
              </>
            )}
            {step === 2 && (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Verify Code</span>
              </>
            )}
            {step === 3 && (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </>
        )}
      </motion.button>

      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-2 pt-4">
        {[1, 2, 3].map((stepNumber) => (
          <div
            key={stepNumber}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              stepNumber <= step
                ? currentTheme.accent
                : `${currentTheme.border} bg-gray-200`
            }`}
          />
        ))}
      </div>
    </motion.form>
  );
};

// Main AuthPage Component
const AuthPage = ({ onAuthenticated }) => {
  const { currentTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);

  const handleLogin = useCallback(
    (formData) => {
      console.log("Login:", formData);
      onAuthenticated?.(true);
    },
    [onAuthenticated]
  );

  const handleSignup = useCallback(
    (formData) => {
      console.log("Signup:", formData);
      onAuthenticated?.(true);
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

      <div className={`min-h-screen flex ${currentTheme.primary}`}>
        {/* Left Side - Features Carousel */}
        <div
          className={`hidden lg:flex lg:w-1/2 ${currentTheme.primary} relative overflow-hidden`}
        >
          <FeatureCarousel currentTheme={currentTheme} />
        </div>

        {/* Right Side - Authentication Form */}
        <div
          className={`w-full lg:w-1/2 flex flex-col ${currentTheme.secondary}`}
        >
          {/* Toggle Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div
              className={`flex rounded-lg p-1 ${currentTheme.searchBg} relative overflow-hidden`}
            >
              {/* Animated Background Slider */}
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

          {/* Form Content */}
          <div className="flex-1 flex items-center justify-center p-6">
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
                  <h2
                    className={`text-2xl font-bold ${currentTheme.text} mb-2`}
                  >
                    {isLogin ? "Welcome Back!" : "Join Chasmos"}
                  </h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className={`${currentTheme.textSecondary}`}
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

              {/* Additional Info */}
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
    </>
  );
};

export default AuthPage;
