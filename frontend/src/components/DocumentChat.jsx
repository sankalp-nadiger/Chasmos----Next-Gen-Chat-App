/* eslint-disable no-unused-vars */
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Image,
  FileText,
  Camera,
  X,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DocumentChat = React.memo(
  ({
    selectedDocument,
    setSelectedDocument,
    effectiveTheme,
  }) => {
    const [messageInput, setMessageInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [uploading, setUploading] = useState(false);

    const chatEndRef = useRef(null);
    const attachmentMenuRef = useRef(null);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

    // 🔹 Auto scroll when new message added
    useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // 🔹 Input handlers
    const handleInputChange = useCallback((e) => {
      setMessageInput(e.target.value);
    }, []);

    const handleKeyPress = useCallback(
      (e) => {
        if (e.key === "Enter" && messageInput.trim()) {
          handleSendMessage();
        }
      },
      [messageInput]
    );

    const handleSendMessage = useCallback(() => {
      if (!messageInput.trim()) return;
      const newMsg = { text: messageInput, sender: "user" };
      setMessages((prev) => [...prev, newMsg]);
      setMessageInput("");
    }, [messageInput]);

    // 🔹 Attachment menu
    const toggleAttachmentMenu = useCallback(() => {
      setShowAttachmentMenu((prev) => !prev);
    }, []);

    // 🔹 Upload document or image
    const handleFileUpload = useCallback((type) => {
      if (type === "document") fileInputRef.current?.click();
      else if (type === "image") imageInputRef.current?.click();
      setShowAttachmentMenu(false);
    }, []);

   const handleFileChange = useCallback(
  async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("document", file);

      const res = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const newDoc = await res.json();

      console.log("📦 Uploaded Document:", newDoc);

      const formattedDate = new Date(newDoc?.createdAt).toLocaleString();

      const fileMessage = {
        text:
          type === "image"
            ? `📷 Uploaded image: ${file.name}`
            : `📄 Uploaded document: ${file.name}`,
        sender: "user",
        fileUrl: newDoc?.fileUrl || "",
        date: formattedDate || "No date available",
      };

      setMessages((prev) => [...prev, fileMessage]);
    } catch (err) {
      console.error(err);
      alert("Failed to upload. Try again.");
    } finally {
      setUploading(false);
    }
  },
  []
);


    // 🔹 Close attachment menu on outside click
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          attachmentMenuRef.current &&
          !attachmentMenuRef.current.contains(event.target)
        ) {
          setShowAttachmentMenu(false);
        }
      };
      if (showAttachmentMenu) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [showAttachmentMenu]);

    return (
      <div
        className={`flex flex-col h-full relative rounded-xl overflow-hidden ${effectiveTheme.primary}`}
      >
        {/* 🧾 HEADER */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${effectiveTheme.border} ${effectiveTheme.secondary}`}
        >
          <div className="flex flex-col">
            <h2 className={`font-semibold text-lg ${effectiveTheme.text}`}>
              {selectedDocument?.fileName || "Document Chat"}
            </h2>
            <p className="text-xs text-gray-500">
              {selectedDocument
                ? "Active document chat"
                : "Upload or select a document to begin"}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSelectedDocument(null)}
            className="text-gray-500 hover:text-red-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* 💬 CHAT MESSAGES */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
              <FileText className="w-12 h-12 mb-3 opacity-70" />
              <p>No messages yet. Start chatting or upload a file!</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${
                    msg.sender === "user"
                      ? `${effectiveTheme.accent} text-white`
                      : `${effectiveTheme.secondary} ${effectiveTheme.text}`
                  }`}
                >
                  {msg.text}
                  {msg.fileUrl && (
                    <a
                      href={msg.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs underline mt-1 opacity-80"
                    >
                      View File
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* 📨 INPUT BAR */}
        <div
          className={`${effectiveTheme.secondary} p-4 border-t ${effectiveTheme.border} relative`}
        >
          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
            onChange={(e) => handleFileChange(e, "document")}
            style={{ display: "none" }}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, "image")}
            style={{ display: "none" }}
          />

          <div className="flex items-center space-x-3">
            {/* 📎 Attachments */}
            <div className="relative" ref={attachmentMenuRef}>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.95 }}
              >
                <Paperclip
                  className={`w-6 h-6 ${effectiveTheme.textSecondary} cursor-pointer hover:${effectiveTheme.text} transition-colors`}
                  onClick={toggleAttachmentMenu}
                />
              </motion.div>

              <AnimatePresence>
                {showAttachmentMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute -top-28 left-0 ${effectiveTheme.secondary} border ${effectiveTheme.border} rounded-xl shadow-lg p-3 z-50`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Document Upload */}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="cursor-pointer flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900"
                        onClick={() => handleFileUpload("document")}
                      >
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Document
                        </p>
                      </motion.div>

                      {/* Image Upload */}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="cursor-pointer flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900"
                        onClick={() => handleFileUpload("image")}
                      >
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <Image className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Image
                        </p>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input Field */}
            <div
              className={`flex-1 ${effectiveTheme.inputBg} rounded-lg px-4 py-2 flex items-center`}
            >
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className={`flex-1 bg-transparent ${effectiveTheme.text} placeholder-gray-400 focus:outline-none`}
              />
            </div>

            {/* Send / Uploading */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={uploading}
              onClick={handleSendMessage}
              className={`${effectiveTheme.accent} p-2 rounded-full text-white hover:opacity-90 transition ${
                uploading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    );
  }
);

export default DocumentChat;
