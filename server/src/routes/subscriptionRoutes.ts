import { Router } from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import {
  getSubscriptionStatus,
  createSubscription,
  startTrial,
  decrementTrialUse,
  cancelSubscription
} from '../controllers/subscriptionController';

const router = Router();

// All subscription routes require authentication
router.use(authenticateUser);

// Get subscription status
router.get('/status', getSubscriptionStatus);

// Create or update subscription
router.post('/create', createSubscription);

// Trial management
router.post('/trial/start', startTrial);
router.post('/trial/use', decrementTrialUse);

// Cancel subscription
router.delete('/cancel', cancelSubscription);

export default router;
