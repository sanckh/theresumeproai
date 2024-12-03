import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import * as subscriptionService from '../services/subscriptionService';
import { SubscriptionTier } from '../../types/subscription';

export async function getSubscriptionStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.uid;
    const subscription = await subscriptionService.getSubscriptionStatus(userId);
    res.json({ subscription });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
}

export async function createSubscription(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.uid;
    const { tier, duration } = req.body;
    
    if (!tier) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!(tier in SubscriptionTier)) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    const subscription = await subscriptionService.createSubscription(userId, {
      tier: tier as SubscriptionTier,
      subscription_end_date: duration ? new Date(Date.now() + duration * 30 * 24 * 60 * 60 * 1000).toISOString() : null
    });

    res.json({ subscription });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
}

export async function startTrial(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.uid;
    const subscription = await subscriptionService.startTrial(userId);
    res.json({ subscription });
  } catch (error) {
    console.error('Error starting trial:', error);
    res.status(500).json({ error: 'Failed to start trial' });
  }
}

export async function decrementTrialUse(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.uid;
    const subscription = await subscriptionService.decrementTrialUse(userId);
    res.json({ subscription });
  } catch (error) {
    console.error('Error decrementing trial use:', error);
    res.status(500).json({ error: 'Failed to decrement trial use' });
  }
}

export async function cancelSubscription(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.uid;
    const subscription = await subscriptionService.cancelSubscription(userId);
    res.json({ subscription });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
}
