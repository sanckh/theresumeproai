import { db } from '../../firebase_options';
import { SubscriptionTier } from '../enums/subscriptionTier';
import { logToFirestore } from '../services/logs_service';
import { FieldValue } from 'firebase-admin/firestore';

(async () => {
  // Current time as a numeric timestamp (for logging comparisons)
  const now = new Date().getTime();
  // Current time as an ISO string (for Firestore query)
  const nowISO = new Date().toISOString();

  let processedCount = 0;

  const subscriptionsWithEndDateSnapshot = await db
    .collection('subscriptions')
    .where('is_active', '==', true)
    .get();

  if (!subscriptionsWithEndDateSnapshot.empty) {
    const subscriptionData = subscriptionsWithEndDateSnapshot.docs[0].data();
    const subscriptionEndDateStr = subscriptionData.subscription_end_date; // ISO string
    const subscriptionEndMs = new Date(subscriptionEndDateStr).getTime();

    console.log('Comparing subscription_end_date to now:', subscriptionEndMs, now);

    if (subscriptionEndMs <= now) {
      console.log('The subscription has expired.');
    } else if (subscriptionEndMs === now) {
      console.log('The subscription ends today.');
    } else {
      console.log('The subscription is still active.');
    }
  } else {
    console.log('No active subscriptions found to compare.');
  }

  try {
    // Query Firestore using ISO strings for lexicographical comparison
    // This will only work correctly if subscription_end_date is stored
    // as a properly formatted ISO 8601 string (like "2024-12-17T20:36:51.000Z").
    const subscriptionsSnapshot = await db
      .collection('subscriptions')
      .where('is_active', '==', true)
      .where('subscription_end_date', '<=', nowISO)
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
          renewal_date: null
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

    process.exit(1); // Exit with failure code for debugging in Render logs
  }
})();
