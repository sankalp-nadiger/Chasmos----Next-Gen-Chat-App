import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { 
  getUserProfile, 
  getUserMediaAndDocs 
} from '../controllers/userProfile.controller.js';

const router = express.Router();

// Get user profile details
router.get('/profile/:userId', protect, getUserProfile);

// Get user's shared media, documents, and links
router.get('/media/:userId', protect, getUserMediaAndDocs);

export default router;
