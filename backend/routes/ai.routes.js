import express from "express";
import {
  processAIChat,
  processDocumentWithAI,
  getConversationHistory,
  clearConversationHistory,
  extractTextFromImage
} from "../controllers/ai.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import multer from "multer";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs for AI processing
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed for AI processing!'), false);
    }
  }
});

// AI Chat endpoints
router.route("/chat")
  .post(protect, processAIChat);

// Document processing with AI
router.route("/process-document")
  .post(protect, upload.single('document'), processDocumentWithAI);

// OCR text extraction
router.route("/ocr")
  .post(protect, upload.single('image'), extractTextFromImage);

// Conversation history management
router.route("/history/:chatId")
  .get(protect, getConversationHistory)
  .delete(protect, clearConversationHistory);

export default router;