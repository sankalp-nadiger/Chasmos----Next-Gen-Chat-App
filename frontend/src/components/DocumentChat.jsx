/* eslint-disable no-unused-vars */
// DocumentChat.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Paperclip,
  FileText,
  Image as ImageIcon,
  X,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

/**
 * DocumentChat
 *
 * Props:
 *  - selectedDocument: object | null  (the currently selected document summary or full doc)
 *  - setSelectedDocument: fn          (setter used by parent to change selected document)
 *  - effectiveTheme: object           (your theme classes object)
 *
 * Backend routes used:
 *  - POST  /api/document/new              -> upload (form field "file") -> returns { message, document }
 *  - GET   /api/document/:documentId      -> get full document (with questions array)
 *  - POST  /api/document/:documentId/process -> ask question -> returns { question, answer }
 *
 * Make sure localStorage contains token under "token".
 */
const DocumentChat = ({ selectedDocument, setSelectedDocument, effectiveTheme }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const token = localStorage.getItem("token") || "";

  const [messages, setMessages] = useState([]); // { id?, text, sender: 'user'|'ai', status?: 'pending'|'error' }
  const [messageInput, setMessageInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Utility: scroll to bottom on messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load full document chat history when selectedDocument changes
  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedDocument?._id) {
        setMessages([]); // new chat / no doc selected
        return;
      }

      setLoadingHistory(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/document/${selectedDocument._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("Failed to fetch document:", err);
          alert("Failed to load document chat history");
          setMessages([]);
          return;
        }

        const doc = await res.json();

        // Expect doc.questions = [{ question, answer, createdAt?, ... }]
        const formatted = (doc.questions || []).flatMap((q) => [
          { id: `q-${Math.random().toString(36).slice(2)}`, text: q.question, sender: "user" },
          { id: `a-${Math.random().toString(36).slice(2)}`, text: q.answer, sender: "ai" },
        ]);

        setMessages(formatted);
      } catch (err) {
        console.error("History error:", err);
        alert("Error loading chat history");
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [selectedDocument, API_BASE_URL, token]);

  // Send question to /process endpoint
  const sendMessageToAI = useCallback(
    async (question) => {
      if (!selectedDocument?._id) {
        alert("Select or upload a document first.");
        return;
      }

      // Optimistic UI: add user message + placeholder AI pending message
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

        // If server returns error (500/4xx)
        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          console.error("Process error:", errBody);
          // mark placeholder as error
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiPlaceholder.id ? { ...m, text: "Failed to get answer", sender: "ai", status: "error" } : m
            )
          );
          alert("AI processing failed");
          return;
        }

        const data = await res.json();

        // data shape expected: { question, answer: aiAnswer } (based on your controller)
        const aiAnswer = data?.answer ?? data?.response ?? "No answer received";

        // replace placeholder with real answer
        setMessages((prev) =>
          prev.map((m) => (m.id === aiPlaceholder.id ? { ...m, text: aiAnswer, sender: "ai", status: "done" } : m))
        );

        // update selectedDocument's questions locally (optional)
        // if backend returns updated doc you'd replace selectedDocument with it. We'll fetch fresh history.
        try {
          // re-fetch updated history to keep in sync
          const r2 = await fetch(`${API_BASE_URL}/api/document/${selectedDocument._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (r2.ok) {
            const doc = await r2.json();
            const formatted = (doc.questions || []).flatMap((q) => [
              { id: `q-${Math.random().toString(36).slice(2)}`, text: q.question, sender: "user" },
              { id: `a-${Math.random().toString(36).slice(2)}`, text: q.answer, sender: "ai" },
            ]);
            setMessages(formatted);
          }
        } catch (e) {
          // ignore re-fetch errors
        }
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

  // Upload document (form field name "file" to match backend)
  const uploadDocument = useCallback(
    async (file) => {
      if (!file) return;

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file); // IMPORTANT: backend expects "file"

        const res = await fetch(`${API_BASE_URL}/api/document/new`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          console.error("Upload failed:", err);
          alert("Upload failed");
          return;
        }

        const data = await res.json();

        // Your upload controller earlier returned { message, document: docData }
        // but some versions returned just created doc id — handle both
        const doc = data?.document ?? data?.documentId ? { _id: data.documentId, ...data?.document } : data;

        // If server returned doc under "document" use that, else if server returned created doc id, fetch it
        if (data?.document) {
          setSelectedDocument(data.document);
        } else if (data?.documentId) {
          // fetch full document
          const r = await fetch(`${API_BASE_URL}/api/document/${data.documentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (r.ok) {
            const full = await r.json();
            setSelectedDocument(full);
          } else {
            // fallback: set minimal
            setSelectedDocument({ _id: data.documentId, fileName: file.name });
          }
        } else {
          // fallback: try to use data as doc
          setSelectedDocument(doc);
        }

        // clear messages and load history automatically via useEffect
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
    // reset input so same file can be selected again later
    e.target.value = "";
  };

  // Helper: view file link if available in selectedDocument
  const fileLink = selectedDocument?.fileUrl ?? selectedDocument?.url ?? null;

  return (
    <div className={`flex flex-col h-full relative rounded-xl overflow-hidden ${effectiveTheme?.primary ?? ""}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${effectiveTheme?.border ?? ""} ${effectiveTheme?.secondary ?? ""}`}>
        <div>
          <h2 className={`font-semibold text-lg ${effectiveTheme?.text ?? ""}`}>
            {selectedDocument?.fileName || "Document Chat"}
          </h2>
          <p className="text-xs text-gray-500">
            {selectedDocument ? "Chatting with uploaded document" : "Upload or select a document to start"}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {fileLink && (
            <a
              href={fileLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline mr-2"
            >
              View file
            </a>
          )}

          <button
            className="text-gray-500 hover:text-red-500"
            onClick={() => setSelectedDocument(null)}
            title="Close document chat"
          >
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

      {/* Input / Upload Bar */}
      <div className={`p-4 border-t flex items-center gap-2 ${effectiveTheme?.secondary ?? ""}`}>
        {/* hidden file input */}
        <input ref={fileInputRef} type="file" accept=".pdf,image/*,.doc,.docx,.txt" hidden onChange={handleFileChange} />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-full hover:bg-gray-100"
          title="Upload document"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip />}
        </button>

        <input
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 px-3 py-2 rounded-lg border text-black "
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