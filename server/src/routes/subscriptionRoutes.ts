import express from 'express';
import { getSubscriptionStatusForUser, updateUserTrialStatus } from '../controllers/subscriptionController';

const router = express.Router();

// Get user's subscription status
router.get('/status/:userId', getSubscriptionStatusForUser);

// Update user's trial status
router.post('/trial', updateUserTrialStatus);

export default router;
