import express from 'express';
import multer from 'multer';
import { uploadFileToSupabase } from '../config/supabase.js';
import Attachment from '../models/attachment.model.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer(); // memory storage

router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const bucket = process.env.SUPABASE_BUCKET || 'documents';
    const publicUrl = await uploadFileToSupabase(file, bucket, 'uploads/');

    const attachment = await Attachment.create({
      fileUrl: publicUrl,
      fileType: file.mimetype,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploader: req.user._id,
    });

    res.json({ success: true, attachment });
  } catch (err) {
    console.error('Upload route error', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

export default router;
