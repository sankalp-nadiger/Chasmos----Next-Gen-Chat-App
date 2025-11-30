// routes/document.routes.js
import express from "express";
import {
  uploadDocument,
  processDocument,
  getUserDocuments,
  getDocument,
  deleteDocument,
  testFlaskConnection,
  getAllDocumentChats,   // ✅ new
  getDocumentChatById,
  pinDocument,
  unpinDocument,   // ✅ new
} from "../controllers/document.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import multer from "multer";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/new", protect, upload.single("file"), uploadDocument);
// 🧩 Upload a new document
// 🧩 Ask a new question on an existing document
router.post("/:documentId/process", protect, processDocument);

// 🧩 Get all user documents (summary list)
router.get("/", protect, getUserDocuments);

// 🧩 Get a single document (with full chat)
router.get("/:documentId", protect, getDocument);

// 🧩 Delete a document
router.delete("/:documentId", protect, deleteDocument);

// 🧩 Test Flask server
router.get("/test-flask", testFlaskConnection);

// 🆕 NEW ROUTES
// GET /api/ai/history/document → Fetch all previously chatted documents
router.get("/history/document", protect, getAllDocumentChats);

// GET /api/ai/history/document/:id → Fetch chats for a specific document
router.get("/history/document/:id", protect, getDocumentChatById);
router.post("/:documentId/pin", protect,pinDocument);
router.post("/:documentId/unpin", protect,unpinDocument);

router.get("/pinned",protect, async (req, res) => {
  const pinnedDocs = await Document.find({
    createdBy: req.user._id,
    isPinned: true
  }).sort({ updatedAt: -1 });

  res.json(pinnedDocs);
});


export default router;