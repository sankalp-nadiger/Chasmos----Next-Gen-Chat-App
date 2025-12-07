
/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Paperclip, FileText, X, Loader2, FileSearch } from "lucide-react";

const DocumentChat = ({ selectedDocument, setSelectedDocument, effectiveTheme }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const token = localStorage.getItem("token") || "";

  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat history
  useEffect(() => {
    if (!selectedDocument?._id) return;

    let isMounted = true;
    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/document/${selectedDocument._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch document");
        const doc = await res.json();

        if (!isMounted) return;

        setSelectedDocument((prev) => ({ ...doc, fileLink: doc.fileUrl }));

        const formatted = (doc.questions || []).flatMap((q) => [
          { id: `q-${Math.random().toString(36).slice(2)}`, text: q.question, sender: "user" },
          { id: `a-${Math.random().toString(36).slice(2)}`, text: q.answer, sender: "ai" },
        ]);

        setMessages((prev) => (prev.length === 0 ? formatted : prev));
      } catch (err) {
        console.error("History error:", err);
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    };
    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [selectedDocument?._id]);

  // Send message to AI
  const sendMessageToAI = useCallback(
    async (question) => {
      if (!selectedDocument?._id) {
        alert("Select or upload a document first.");
        return;
      }

      const userMsg = { id: `u-${Date.now()}`, text: question, sender: "user" };
      const aiPlaceholder = { id: `ai-p-${Date.now()}`, text: "Thinking...", sender: "ai", status: "pending" };

      setMessages((prev) => [...prev, userMsg, aiPlaceholder]);
      setProcessing(true);

      try {
        const res = await fetch(`${API_BASE_URL}/api/document/${selectedDocument._id}/process`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question }),
        });

        if (!res.ok) throw new Error("AI processing failed");

        const data = await res.json();
        const aiAnswer = data?.answer ?? "No answer received";

        setMessages((prev) =>
          prev.map((m) => (m.id === aiPlaceholder.id ? { ...m, text: aiAnswer, sender: "ai", status: "done" } : m))
        );
      } catch (err) {
        console.error("AI error:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiPlaceholder.id ? { ...m, text: "Failed to get answer", sender: "ai", status: "error" } : m
          )
        );
        alert("AI error occurred");
      } finally {
        setProcessing(false);
      }
    },
    [API_BASE_URL, selectedDocument, token]
  );

  const handleSend = useCallback(async () => {
    const q = messageInput.trim();
    if (!q) return;
    setMessageInput("");
    await sendMessageToAI(q);
  }, [messageInput, sendMessageToAI]);

  // Upload document
  const uploadDocument = useCallback(
    async (file) => {
      if (!file) return;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API_BASE_URL}/api/document/new`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();
        setSelectedDocument({
          ...data.document,
          localFile: file,
          fileLink: data.document?.fileUrl,
        });
        setMessages([]); // clear messages for new doc
      } catch (err) {
        console.error("Upload failed:", err);
        alert("Upload error");
      } finally {
        setUploading(false);
      }
    },
    [API_BASE_URL, token, setSelectedDocument]
  );

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadDocument(file);
    e.target.value = "";
  };

  // View document
  const handleViewFile = () => {
    const fileObj = selectedDocument?.localFile;
    const fileUrl = selectedDocument?.fileLink || selectedDocument?.fileUrl;

    if (fileObj) return window.open(URL.createObjectURL(fileObj), "_blank");
    if (fileUrl) return window.open(fileUrl, "_blank");
    alert("No file available to preview");
  };

  return (
    <div className={`flex flex-col h-full relative rounded-xl overflow-hidden ${effectiveTheme?.primary ?? ""}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${effectiveTheme?.border ?? ""} ${effectiveTheme?.secondary ?? ""}`}>
        <div>
          <h2 className={`font-semibold text-lg ${effectiveTheme?.text ?? ""}`}>
            {selectedDocument?.fileName || selectedDocument?.originalName || "Document Chat"}
          </h2>
          <p className="text-xs text-gray-500">
            {selectedDocument ? "Chatting with uploaded document" : "Upload or select a document to start"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleViewFile}
            className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-all duration-200 ${effectiveTheme?.accent} text-white shadow-sm hover:opacity-90 active:scale-95`}
          >
            <FileSearch size={16} className="opacity-90" />
            View Document
          </button>
          <button className="text-gray-500 hover:text-red-500" onClick={() => setSelectedDocument(null)}>
            <X />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loadingHistory ? (
          <div className="flex justify-center text-gray-400 py-10">
            <Loader2 className="animate-spin" /> Loading history...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            <FileText className="mx-auto mb-3" size={40} />
            <div>No messages yet.</div>
            <div className="text-sm mt-2">Begin asking questions.</div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`my-2 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`px-4 py-2 rounded-lg max-w-[70%] ${msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}>
                {msg.text}
                {msg.status === "pending" && <span className="ml-2 text-xs italic"> …</span>}
                {msg.status === "error" && <div className="text-xs text-red-600 mt-1">Failed to get answer</div>}
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input / Upload */}
      <div className={`p-4 border-t flex items-center gap-2 ${effectiveTheme?.secondary ?? ""}`}>
        <input ref={fileInputRef} type="file" accept=".pdf,image/*,.doc,.docx,.txt" hidden onChange={handleFileChange} />
        <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-gray-100" title="Upload document">
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip />}
        </button>
        <input
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 px-3 py-2 rounded-lg border text-black"
          placeholder={selectedDocument ? "Ask something about this document..." : "Upload/select a document first"}
          disabled={!selectedDocument || processing}
        />
        <button
          onClick={handleSend}
          disabled={!selectedDocument || processing || !messageInput.trim()}
          className={`p-2 rounded-full text-white ${processing ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:opacity-90"}`}
          title="Send"
        >
          {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send />}
        </button>
      </div>
    </div>
  );
};

export default DocumentChat;
