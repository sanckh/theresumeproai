import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import * as subscriptionService from '../services/subscriptionService';
import { SubscriptionTier, TrialType } from '../interfaces/subscription';

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
    const { trialType } = req.body;
    
    if (!trialType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['creator', 'reviewer', 'cover_letter'].includes(trialType)) {
      return res.status(400).json({ error: 'Invalid trial type' });
    }

    const subscription = await subscriptionService.startTrial(userId, trialType as TrialType);
    res.json({ subscription });
  } catch (error) {
    if (error instanceof Error && error.message === 'Trial already used') {
      return res.status(400).json({ error: 'Trial already used' });
    }
    console.error('Error starting trial:', error);
    res.status(500).json({ error: 'Failed to start trial' });
  }
}

export async function decrementTrialUse(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.uid;
    const { trialType } = req.body;
    
    if (!trialType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['creator', 'reviewer', 'cover_letter'].includes(trialType)) {
      return res.status(400).json({ error: 'Invalid trial type' });
    }

    const subscription = await subscriptionService.decrementTrialUse(userId, trialType as TrialType);
    res.json({ subscription });
  } catch (error) {
    if (error instanceof Error && error.message === 'No remaining trial uses') {
      return res.status(400).json({ error: 'No remaining trial uses' });
    }
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
