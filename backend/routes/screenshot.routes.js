import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { uploadScreenshot, getScreenshots, deleteScreenshot } from "../controllers/screenshot.controller.js";
import multer from "multer";

const router = express.Router();

// Configure multer for screenshot uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Routes
router.post("/upload", protect, upload.single('screenshot'), uploadScreenshot);
router.get("/", protect, getScreenshots);
router.delete("/:screenshotId", protect, deleteScreenshot);

export default router;
