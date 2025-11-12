/* eslint-disable no-unused-vars */
import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, X, Loader2 } from "lucide-react";
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";


const NewDocumentUploader = React.memo(({ onUploadComplete, onCancel, effectiveTheme }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first!");
    setUploading(true);

    try {
      const token = localStorage.getItem("token"); // ✅ Fetch the saved JWT

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE_URL}/api/document/new`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Attach token for protected route
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      console.log("✅ Upload success:", data);

      onUploadComplete?.(data);
      setFile(null);
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full items-center justify-center ${effectiveTheme.primary}`}>
      {/* 🧾 HEADER */}
      <div
        className={`absolute top-0 left-0 w-full flex items-center justify-between px-4 py-3 border-b ${effectiveTheme.border} ${effectiveTheme.secondary}`}
      >
        <h2 className={`font-semibold text-lg ${effectiveTheme.text}`}>New Document Chat</h2>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onCancel}
          className="text-gray-500 hover:text-red-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>

      {/* 📄 Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center text-center space-y-6 mt-16"
      >
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-400 rounded-2xl p-10 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <FileText className="w-16 h-16 text-green-500 mb-3" />
          <p className={`text-sm ${effectiveTheme.text}`}>
            {file ? (
              <span className="font-medium">{file.name}</span>
            ) : (
              <>Click or drag a document here to upload</>
            )}
          </p>
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </div>

        {/* 🚀 Upload Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!file || uploading}
          onClick={handleUpload}
          className={`${
            effectiveTheme.accent
          } text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 transition ${
            uploading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload & Start Chat
            </>
          )}
        </motion.button>

        <p className="text-xs text-gray-500">
          Supported formats: PDF, DOCX, TXT, XLSX
        </p>
      </motion.div>
    </div>
  );
});

export default NewDocumentUploader;
