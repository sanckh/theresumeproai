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
import { db } from '../../firebase_options';
import { SubscriptionTier } from '../enums/subscriptionTier';
import { logToFirestore } from '../services/logs_service';

const router = Router();

router.post('/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

router.use(authenticateUser);

// Test endpoint for checking expired subscriptions (development only)
if (process.env.NODE_ENV === 'development') {
  router.post('/test/check-expired', async (req, res) => {
    try {
      const now = new Date().toISOString();
      const batch = db.batch();
      const expiredSubscriptions: string[] = [];

      const subscriptionsSnapshot = await db
        .collection('subscriptions')
        .where('is_active', '==', true)
        .where('subscription_end_date', '!=', null)
        .get();

      subscriptionsSnapshot.forEach((doc) => {
        const data = doc.data();
        const endDate = data.subscription_end_date

        if (endDate < now) {
          expiredSubscriptions.push(doc.id);
          const subscriptionRef = db.collection('subscriptions').doc(doc.id);
          batch.update(subscriptionRef, {
            tier: SubscriptionTier.FREE,
            status: 'expired',
            is_active: false,
            updated_at: new Date().toISOString()
          });
        }
      });

      if (expiredSubscriptions.length > 0) {
        await batch.commit();
        await logToFirestore({
          eventType: 'INFO',
          message: 'Expired subscriptions deactivated (manual test)',
          data: {
            expiredSubscriptions,
            count: expiredSubscriptions.length
          },
          timestamp: new Date().toISOString()
        });
      }

      res.json({ 
        success: true, 
        processedCount: expiredSubscriptions.length,
        expiredSubscriptions 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await logToFirestore({
        eventType: 'ERROR',
        message: 'Error checking expired subscriptions (manual test)',
        data: { error: errorMessage },
        timestamp: new Date().toISOString()
      });
      res.status(500).json({ error: errorMessage });
    }
  });
}

router.get('/status', getSubscriptionStatus);

router.post('/create', createSubscription);

router.post('/trial/start', startTrial);

router.post('/trial/use', decrementTrialUse);

router.delete('/cancel', cancelSubscription);

export default router;
