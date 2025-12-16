import multer from "multer";
import fs from "fs";
import path from "path";

// 📌 Absolute path to uploads folder
const uploadDir = path.join(process.cwd(), "uploads");

// ✅ Auto-create uploads folder if missing
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 📦 Multer storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// 🎯 Export upload middleware
export const upload = multer({ storage });
