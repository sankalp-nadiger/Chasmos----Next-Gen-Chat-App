import express from "express";
import {
  uploadDocument,
  processDocument,
  getUserDocuments,
  getDocument,
  deleteDocument,
  testFlaskConnection,
  getAllDocumentChats,
  getDocumentChatById,
  pinDocument,
  unpinDocument,
  getDocumentProcessingStatus
} from "../controllers/document.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import multer from "multer";

const router = express.Router();

// Configure multer with larger limits
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    fieldSize: 50 * 1024 * 1024 // 50MB for fields
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Supported: PDF, DOC, DOCX, TXT, JPG, PNG, XLS, XLSX'), false);
    }
  }
});

// Upload a new document
router.post("/new", protect, upload.single("file"), uploadDocument);

// Ask a question on an existing document
router.post("/:documentId/process", protect, processDocument);

// Get all user documents (summary list)
router.get("/", protect, getUserDocuments);

// Get a single document (with full chat)
router.get("/:documentId", protect, getDocument);

// Delete a document
router.delete("/:documentId", protect, deleteDocument);

// Test Flask server
router.get("/test-flask", testFlaskConnection);

// Get processing status
router.get("/:documentId/status", protect, getDocumentProcessingStatus);

// Get all previously chatted documents
router.get("/history/document", protect, getAllDocumentChats);

// Get chats for a specific document
router.get("/history/document/:id", protect, getDocumentChatById);

// Pin/unpin document
router.post("/:documentId/pin", protect, pinDocument);
router.post("/:documentId/unpin", protect, unpinDocument);

export default router;