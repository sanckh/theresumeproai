import Stripe from 'stripe';
import { db } from '../../firebase_options';
import { logToFirestore } from './logs_service';
import { STRIPE_CONFIG } from '../config/stripe';
import { getTierFromPriceId } from '../config/stripe';
import { SubscriptionStatus } from '../interfaces/subscriptionStatus';
import { SubscriptionTier } from '../enums/subscriptionTier';

const stripe = new Stripe(STRIPE_CONFIG.STRIPE_API_KEY!, {
  apiVersion: '2022-11-15',
});

export async function createCheckoutSession(priceId: string, userId: string): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${STRIPE_CONFIG.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${STRIPE_CONFIG.FRONTEND_URL}/pricing`,
    client_reference_id: userId,
    metadata: {
      userId,
    },
  });

  return session.url!;
}

export function constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    STRIPE_CONFIG.STRIPE_WEBHOOK_SECRET!
  );
}

export async function handleWebhook(payload: string | Buffer, signature: string): Promise<Stripe.Event> {
  console.log('Received Stripe webhook event');
  const event = constructWebhookEvent(payload, signature);

  console.log('Processing webhook event type:', event.type);
  
  switch (event.type) {
    case 'checkout.session.completed':
      console.log('Checkout session completed, processing...');
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      console.log('Checkout session processed successfully');
      break;
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      console.log('Subscription update event, processing...');
      await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
      break;
    case 'invoice.payment_failed':
      await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
      break;
    case 'invoice.paid':
      { console.log('Invoice paid event, processing...');
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        await handleSubscriptionUpdate(subscription);
      }
      break; }
    default:
      await logToFirestore({
        eventType: 'WARNING',
        message: `Unhandled webhook event type: ${event.type}`,
        data: { eventType: event.type },
        timestamp: new Date().toISOString(),
      });
  }
  return event;
}

export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.client_reference_id;
  if (!userId) {
    throw new Error('No userId found in session');
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  const priceId = subscription.items.data[0].price.id;

  await updateSubscriptionInFirestore(userId, subscription, priceId);
}

export async function handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;
  const userId = await findUserIdByCustomerId(customerId);
  
  if (!userId) {
    throw new Error('No user found for customer');
  }

  const priceId = subscription.items.data[0].price.id;
  await updateSubscriptionInFirestore(userId, subscription, priceId);
}

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const userDoc = await db.collection('subscriptions').doc(userId).get();

  if (!userDoc.exists) {
    return {
      tier: SubscriptionTier.FREE,
      status: 'canceled',  
      hasStartedTrial: false,
      renewal_date: null,
      trials: {
        resume_creator: { remaining: 0 },
        resume_pro: { remaining: 0 },
        career_pro: { remaining: 0 }
      }
    };
  }

  const data = userDoc.data();
  return {
    tier: data?.tier || SubscriptionTier.FREE,
    status: data?.stripeSubscriptionId ? (data?.status || 'canceled') : 'canceled',
    subscription_end_date: data?.subscription_end_date,
    renewal_date: data?.renewal_date,
    hasStartedTrial: data?.hasStartedTrial || false,
    trials: {
      resume_creator: { remaining: data?.resume_creator?.remaining || 0 },
      resume_pro: { remaining: data?.resume_pro?.remaining || 0 },
      career_pro: { remaining: data?.career_pro?.remaining || 0 }
    },
    stripeSubscriptionId: data?.stripeSubscriptionId,
    stripeCustomerId: data?.stripeCustomerId,
    updated_at: data?.updated_at
  };
}

export async function cancelSubscription(userId: string): Promise<void> {
  const subscriptionDoc = await db.collection('subscriptions').doc(userId).get();
  if (!subscriptionDoc.exists) {
    throw new Error('No subscription found');
  }

  const data = subscriptionDoc.data();
  if (!data?.stripeSubscriptionId) {
    throw new Error('No Stripe subscription ID found');
  }

  // Update the subscription to cancel at period end instead of immediate cancellation
  const subscription = await stripe.subscriptions.update(data.stripeSubscriptionId, {
    cancel_at_period_end: true
  });

  // Update Firestore with the cancellation status but keep the renewal date
  await updateSubscriptionInFirestore(
    userId,
    subscription,
    data.priceId || null
  );
}

async function findUserIdByCustomerId(customerId: string): Promise<string | null> {
  const querySnapshot = await db.collection('subscriptions').where('stripeCustomerId', '==', customerId).get();
  
  if (querySnapshot.empty) {
    return null;
  }

  return querySnapshot.docs[0].id;
}

async function updateSubscriptionInFirestore(
  userId: string, 
  subscription: Stripe.Subscription | null,
  priceId: string | null
): Promise<void> {
  const subscriptionRef = db.collection('subscriptions').doc(userId);
  const currentData = (await subscriptionRef.get()).data();

  const data = subscription ? {
    tier: getTierFromPriceId(priceId),
    status: subscription.status,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer,
    renewal_date: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  } : {
    tier: SubscriptionTier.FREE,
    status: 'none',
    // Preserve historical IDs
    stripeSubscriptionId: currentData?.stripeSubscriptionId || null,
    stripeCustomerId: currentData?.stripeCustomerId || null,
    renewal_date: '',
    updated_at: new Date().toISOString(),
  };

  // Log to Firestore
  await logToFirestore({
    eventType: 'INFO',
    message: subscription ? 'Subscription status updated' : 'Subscription cancelled',
    data: {
      userId,
      status: data.status,
      tier: data.tier,
      ...(subscription ? { subscription_id: subscription.id } : {})
    },
    timestamp: new Date().toISOString(),
  });

  await subscriptionRef.set(data, { merge: true });
}

export async function createSubscriptionChangeSession(
  userId: string,
  newPriceId: string
): Promise<string> {
  const subscriptionDoc = await db.collection('subscriptions').doc(userId).get();
  const subscriptionData = subscriptionDoc.data();
  
  if (!subscriptionData?.stripeSubscriptionId) {
    throw new Error('No active subscription found');
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: subscriptionData.stripeCustomerId,
    return_url: `${STRIPE_CONFIG.FRONTEND_URL}/pricing`,
  });

  return session.url;
}
