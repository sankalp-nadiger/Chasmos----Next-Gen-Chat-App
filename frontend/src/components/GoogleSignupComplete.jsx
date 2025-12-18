/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Lock,
  Users,
  Eye,
  EyeOff,
  Mail,
  User,
  Check,
  ArrowLeft,
  X,
  Camera,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/* ================= BUSINESS CATEGORIES (ID + LABEL) ================= */
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

const GoogleSignupComplete = ({
  googleData,
  onSuccess,
  onBack,
  currentTheme,
}) => {
  const [formData, setFormData] = useState({
    email: googleData?.email || "",
    name: googleData?.name || "",
    avatar: googleData?.avatar || googleData?.picture || "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    enableGoogleContacts: false,

    /* BUSINESS */
    isBusiness: false,
    businessCategory: "",
    bio: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [newAvatar, setNewAvatar] = useState(null);

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.isBusiness && !formData.businessCategory) {
      setError("Please select a business category");
      return;
    }

    if (
      formData.password &&
      formData.password !== formData.confirmPassword
    ) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      let finalAvatarUrl = formData.avatar;

      /* Upload avatar if changed */
      if (newAvatar) {
        const uploadData = new FormData();
        uploadData.append("file", newAvatar);
        uploadData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: uploadData }
        );

        if (res.ok) {
          const data = await res.json();
          finalAvatarUrl = data.secure_url;
        }
      }

      const response = await fetch(
        `${API_BASE_URL}/api/auth/google/complete-signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
            phoneNumber: formData.phoneNumber,
            password: formData.password,
            avatar: finalAvatarUrl,
            enableGoogleContacts: formData.enableGoogleContacts,

            /* BUSINESS */
            isBusiness: formData.isBusiness,
            businessCategory: formData.isBusiness
              ? formData.businessCategory
              : "",
            bio: formData.bio,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      localStorage.setItem("userInfo", JSON.stringify(data));
      localStorage.setItem("token", data.token);

      onSuccess(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <motion.div className={`min-h-screen w-full ${currentTheme.primary} p-6`}>
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        <h2 className={`text-3xl font-bold ${currentTheme.text}`}>
          Complete Your Profile
        </h2>

        {error && (
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {/* ================= PERSONAL INFO ================= */}
        <div className={`${currentTheme.secondary} p-6 rounded-xl space-y-4`}>
          <div>
            <label className={currentTheme.text}>Full Name</label>
            <input
              value={formData.name}
              onChange={(e) =>
                setFormData((p) => ({ ...p, name: e.target.value }))
              }
              className="w-full px-4 py-2 rounded-lg border"
            />
          </div>

          <div>
            <label className={currentTheme.text}>Email</label>
            <input
              value={formData.email}
              readOnly
              className="w-full px-4 py-2 rounded-lg border opacity-60"
            />
          </div>

          {/* ================= BUSINESS TOGGLE ================= */}
          <div className="flex items-center space-x-3">
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
            <span className={currentTheme.text}>
              This is a business account
            </span>
          </div>

          {/* ================= CATEGORY ================= */}
          {formData.isBusiness && (
            <div>
              <label className={currentTheme.text}>Business Category</label>
              <select
                value={formData.businessCategory}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    businessCategory: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 rounded-lg border"
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
          )}

          {/* ================= BIO ================= */}
         <div className="relative w-full">
  <textarea
    id="bio"
    value={formData.bio || ""}
    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
    placeholder=" " // Important for floating label trick
    className="peer w-full p-4 pt-6 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
    rows={4}
  />
  <label
    htmlFor="bio"
    className={`absolute left-4 top-2 text-gray-500 text-sm transition-all 
      peer-placeholder-shown:top-4 
      peer-placeholder-shown:text-gray-400 
      peer-placeholder-shown:text-base
      peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-500`}
  >
    {formData.isBusiness ? "About Company" : "Bio"}
  </label>
</div>

        </div>

        {/* ================= SECURITY ================= */}
        <div className={`${currentTheme.secondary} p-6 rounded-xl space-y-4`}>
          <div>
            <label className={currentTheme.text}>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) =>
                setFormData((p) => ({ ...p, password: e.target.value }))
              }
              className="w-full px-4 py-2 rounded-lg border"
            />
          </div>

          <div>
            <label className={currentTheme.text}>Confirm Password</label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  confirmPassword: e.target.value,
                }))
              }
              className="w-full px-4 py-2 rounded-lg border"
            />
          </div>
        </div>

        {/* ================= ACTIONS ================= */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 rounded-lg border"
          >
            <ArrowLeft className="inline mr-2" /> Back
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-6 py-3 rounded-lg bg-blue-600 text-white"
          >
            {isLoading ? "Processing..." : "Complete & Get Started"}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default GoogleSignupComplete;
