import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { getGoogleContacts } from '../controllers/contact.controller.js';

const router = express.Router();

// GET /api/sync/google-contacts -> return stored google contacts
router.get('/google-contacts', protect, getGoogleContacts);

export default router;
