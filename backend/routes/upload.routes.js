import express from 'express';
import multer from 'multer';
import { uploadFileToSupabase } from '../config/supabase.js';
import Attachment from '../models/attachment.model.js';
import Message from '../models/message.model.js';
import Chat from '../models/chat.model.js';
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

    // Optionally create a message referencing this attachment if chatId provided
    const { chatId, text } = req.body || {};
    let message = null;
    if (chatId) {
      // determine type based on mimetype
      let msgType = 'file';
      if (file.mimetype && file.mimetype.startsWith('image/')) msgType = 'image';
      else if (file.mimetype && file.mimetype.startsWith('video/')) msgType = 'video';
      else if (file.mimetype && (file.mimetype.includes('pdf') || file.mimetype.includes('officedocument') || file.mimetype.includes('ms-'))) msgType = 'document';

      message = await Message.create({
        sender: req.user._id,
        content: text || '',
        type: msgType,
        chat: chatId,
        attachments: [attachment._id],
      });

      // populate message for response
      await message.populate('sender', 'name avatar email');
      await message.populate({ path: 'attachments' });

      // Update chat lastMessage
      try {
        await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });
      } catch (e) {
        console.warn('Could not update chat lastMessage for chatId', chatId, e.message);
      }
    }

    res.json({ success: true, attachment, message });
  } catch (err) {
    console.error('Upload route error', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

export default router;