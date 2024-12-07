import express from 'express';
import { createCheckoutSessionForUser, handleWebhookMethod, getSubscriptionStatusForUser, cancelSubscriptionForUser } from '../controllers/stripeController';

const router = express.Router();

router.post('/create-checkout-session', createCheckoutSessionForUser);

// Webhook needs raw body, so we use express.raw middleware specifically for this route
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhookMethod
);

router.get('/subscription-status/:userId', getSubscriptionStatusForUser);
router.post('/cancel-subscription', cancelSubscriptionForUser);
export default router;
