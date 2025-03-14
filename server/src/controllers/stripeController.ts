import { Request, Response } from 'express';
import { logToFirestore } from '../services/logs_service';
import {
  createCheckoutSession,
  handleWebhook,
  getSubscriptionStatus,
  cancelSubscription,
  constructWebhookEvent,
  createSubscriptionChangeSession,
  getStripeSession
} from '../services/stripeService';

export const createCheckoutSessionForUser = async (req: Request, res: Response) => {
  try {
    const { priceId, userId } = req.body;

    if (!userId) {
      await logToFirestore({
        eventType: 'ERROR',
        message: 'User ID is required for checkout session',
        data: { priceId },
        timestamp: new Date().toISOString(),
      });
      return res.status(400).json({ error: 'User ID is required' });
    }

    const sessionUrl = await createCheckoutSession(priceId, userId);
    res.json({ url: sessionUrl });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating checkout session:', errorMessage);
    await logToFirestore({
      eventType: 'ERROR',
      message: 'Failed to create checkout session',
      data: { error: errorMessage },
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({ error: errorMessage });
  }
};

export const handleWebhookMethod = async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) {
      await logToFirestore({
        eventType: 'ERROR',
        message: 'Missing stripe-signature header',
        data: {},
        timestamp: new Date().toISOString(),
      });
      return res.status(400).send('Missing stripe-signature header');
    }

    // Handle the webhook event
    await handleWebhook(req.body, sig);
    
    res.json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error processing webhook:', errorMessage);
    await logToFirestore({
      eventType: 'ERROR',
      message: 'Failed to process webhook',
      data: { error: errorMessage },
      timestamp: new Date().toISOString(),
    });
    res.status(400).json({ error: errorMessage });
  }
};

export const getSubscriptionStatusForUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      await logToFirestore({
        eventType: 'ERROR',
        message: 'User ID is required for subscription status',
        data: {},
        timestamp: new Date().toISOString(),
      });
      return res.status(400).json({ error: 'User ID is required' });
    }

    const status = await getSubscriptionStatus(userId);
    res.json(status);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching subscription status:', errorMessage);
    await logToFirestore({
      eventType: 'ERROR',
      message: 'Failed to fetch subscription status',
      data: { error: errorMessage },
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({ error: errorMessage });
  }
};

export const cancelSubscriptionForUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      await logToFirestore({
        eventType: 'ERROR',
        message: 'User ID is required for subscription cancellation',
        data: {},
        timestamp: new Date().toISOString(),
      });
      return res.status(400).json({ error: 'User ID is required' });
    }

    await cancelSubscription(userId);
    
    await logToFirestore({
      eventType: 'INFO',
      message: 'Subscription canceled successfully',
      data: { userId },
      timestamp: new Date().toISOString(),
    });

    res.json({ message: 'Subscription canceled successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error cancelling subscription:', errorMessage);
    await logToFirestore({
      eventType: 'ERROR',
      message: 'Failed to cancel subscription',
      data: { error: errorMessage },
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({ error: errorMessage });
  }
};

export async function createChangeSubscriptionSession(req: Request, res: Response) {
  try {
    const { userId, newPriceId } = req.body;
    const sessionUrl = await createSubscriptionChangeSession(userId, newPriceId);
    res.json({ url: sessionUrl });
  } catch (error) {
    console.error('Error creating subscription change session:', error);
    res.status(500).json({ error: 'Failed to create subscription change session' });
  }
}

export const getSessionDetails = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await getStripeSession(sessionId);
    
    res.json({
      amount: session.amount_total,
      currency: session.currency,
      subscription: {
        priceId: session.line_items?.data[0]?.price?.id,
        productId: session.line_items?.data[0]?.price?.product
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error retrieving session:', errorMessage);
    await logToFirestore({
      eventType: 'ERROR',
      message: 'Failed to retrieve session details',
      data: { error: errorMessage },
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({ error: errorMessage });
  }
};
