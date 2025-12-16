import express from 'express';
import { protect } from "../middleware/auth.middleware.js";
import {
  createPoll,
  votePoll,
  getPoll,
  getChatPolls,
  closePoll,
  removeVote
} from '../controllers/poll.controller.js';

const router = express.Router();

// Create a new poll
router.post('/create', protect, createPoll);

// Vote on a poll
router.post('/vote', protect, votePoll);

// Remove a vote
router.post('/remove-vote', protect, removeVote);

// Get poll details
router.get('/:pollId', protect, getPoll);

// Get all polls in a chat
router.get('/chat/:chatId', protect, getChatPolls);

// Close a poll
router.put('/:pollId/close', protect, closePoll);

export default router;
