import { onSchedule } from 'firebase-functions/v2/scheduler';
import { db } from '../../firebase_options';
import { SubscriptionTier } from '../enums/subscriptionTier';
import { logToFirestore } from '../services/logs_service';
import { FieldValue } from 'firebase-admin/firestore';

export const checkExpiredSubscriptions = onSchedule(
  {
    schedule: process.env.EXPIRATION_CRON || '0 0 * * *',
    timeZone: 'America/Chicago',
  },
  async () => {
    const now = new Date().getTime();
    let processedCount = 0;

    try {
      const subscriptionsSnapshot = await db
        .collection('subscriptions')
        .where('is_active', '==', true)
        .where('subscription_end_date', '<=', now)
        .get();

      if (subscriptionsSnapshot.empty) {
        console.log('No expired subscriptions found.');
        return;
      }

      // Map subscription references for batch processing
      const expiredSubscriptions = subscriptionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ref: db.collection('subscriptions').doc(doc.id),
      }));

      // Process in batches of 500
      const BATCH_LIMIT = 500;
      for (let i = 0; i < expiredSubscriptions.length; i += BATCH_LIMIT) {
        const batch = db.batch();
        const subset = expiredSubscriptions.slice(i, i + BATCH_LIMIT);

        subset.forEach(({ ref }) => {
          batch.update(ref, {
            tier: SubscriptionTier.FREE,
            status: 'expired',
            is_active: false,
            updated_at: FieldValue.serverTimestamp(),
          });
        });

        await batch.commit();
        processedCount += subset.length;
      }

      // Log the operation
      await logToFirestore({
        eventType: 'INFO',
        message: 'Expired subscriptions deactivated',
        data: { count: processedCount },
        timestamp: new Date().toISOString(),
      });

      console.log(`${processedCount} subscriptions deactivated.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error deactivating expired subscriptions:', error);

      // Log the error
      await logToFirestore({
        eventType: 'ERROR',
        message: 'Error checking expired subscriptions',
        data: { error: errorMessage },
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }
);
