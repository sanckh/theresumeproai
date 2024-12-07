import { Router, raw } from 'express';
import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import {
  getSubscriptionStatus,
  createSubscription,
  startTrial,
  decrementTrialUse,
  cancelSubscription,
  handleStripeWebhook
} from '../controllers/subscriptionController';

const router = Router();


router.post('/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

router.use(authenticateUser);

router.get('/status', getSubscriptionStatus);

router.post('/create', createSubscription);

router.post('/trial/start', startTrial);

router.post('/trial/use', decrementTrialUse);

router.delete('/cancel', cancelSubscription);

export default router;
