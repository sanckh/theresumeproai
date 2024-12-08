import { db } from '../../firebase_options';
import { SubscriptionTier } from '../enums/subscriptionTier';
import { CreateSubscriptionData } from '../interfaces/createSubscriptionData';
import { SubscriptionStatus } from '../interfaces/subscriptionStatus';
import * as stripeService from './stripeService';



const defaultTrials = {
  resume_creator: { used: false, remaining: 1 },
  resume_pro: { used: false, remaining: 1 },
  career_pro: { used: false, remaining: 1 }
};

async function getTrialStatus(userId: string): Promise<{
  hasStartedTrial: boolean;
  trials: {
    resume_creator: { remaining: number };
    resume_pro: { remaining: number };
    career_pro: { remaining: number };
  }
}> {
  const trialDoc = await db.collection('trials').doc(userId).get();

  if (!trialDoc.exists) {
    return {
      hasStartedTrial: false,
      trials: {
        resume_creator: { remaining: 0 },
        resume_pro: { remaining: 0 },
        career_pro: { remaining: 0 }
      }
    };
  }

  const trialData = trialDoc.data();
  return {
    hasStartedTrial: true,
    trials: {
      resume_creator: { remaining: trialData?.resume_creator?.remainingUses ?? 1 },
      resume_pro: { remaining: trialData?.resume_pro?.remainingUses ?? 1 },
      career_pro: { remaining: trialData?.career_pro?.remainingUses ?? 1 }
    }
  };
}

async function getPaidSubscriptionStatus(userId: string): Promise<{
  tier: SubscriptionTier;
  status: string;
  subscription_end_date?: string | null;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  updated_at?: string;
}> {
  const userDoc = await db.collection('subscriptions').doc(userId).get();

  if (!userDoc.exists) {
    return {
      tier: SubscriptionTier.NONE,
      status: 'none'
    };
  }

  const userData = userDoc.data();

  const status = userData?.status;
  const validStatuses = ['active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid'] as const;
  const finalStatus = (validStatuses.includes(status as typeof validStatuses[number]) ? status : 'canceled') as typeof validStatuses[number];

  return {
    tier: userData?.tier || SubscriptionTier.NONE,
    status: finalStatus,
    subscription_end_date: userData?.subscription_end_date,
    stripeSubscriptionId: userData?.stripeSubscriptionId,
    stripeCustomerId: userData?.stripeCustomerId,
    updated_at: userData?.updated_at,
  };
}

export async function getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const [trialStatus, subscriptionStatus] = await Promise.all([
    getTrialStatus(userId),
    getPaidSubscriptionStatus(userId)
  ]);

  // If user has an active paid subscription, it takes precedence over trials
  if (subscriptionStatus.status === 'active') {
    return {
      ...subscriptionStatus,
      hasStartedTrial: trialStatus.hasStartedTrial,
      trials: trialStatus.trials
    } as SubscriptionStatus;
  }

  // If no active subscription but has trials, return trial status
  return {
    tier: SubscriptionTier.FREE,
    status: 'none',
    hasStartedTrial: trialStatus.hasStartedTrial,
    trials: trialStatus.trials
  } as SubscriptionStatus;
}

export async function createSubscription(
  userId: string,
  data: CreateSubscriptionData
): Promise<SubscriptionStatus> {
  await db.collection('subscriptions').doc(userId).set({
    tier: data.tier,
    status: 'active',
    subscription_end_date: data.subscription_end_date,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  return getUserSubscriptionStatus(userId);
}

export async function startTrial(
  userId: string,
): Promise<SubscriptionStatus> {
  const trialRef = db.collection('trials').doc(userId);
  const trialDoc = await trialRef.get();

  if (trialDoc.exists) {
    throw new Error('Trial already used');
  }

  // Initialize all trial types at once
  await trialRef.set({
    resume_creator: { remainingUses: 1, started_at: new Date().toISOString() },
    resume_pro: { remainingUses: 1, started_at: new Date().toISOString() },
    career_pro: { remainingUses: 1, started_at: new Date().toISOString() }
  });

  return getUserSubscriptionStatus(userId);
}

export async function decrementTrialUse(
  userId: string,
  feature: 'resume_creator' | 'resume_pro' | 'career_pro'
): Promise<SubscriptionStatus> {
  const trialRef = db.collection('trials').doc(userId);
  const trialDoc = await trialRef.get();

  if (!trialDoc.exists) {
    throw new Error('No trial found');
  }

  const trialData = trialDoc.data();
  if (!trialData) {
    throw new Error('No trial data found');
  }

  // Check if the feature exists and has remaining uses
  if (!trialData[feature] || trialData[feature].remainingUses <= 0) {
    throw new Error('No remaining trial uses for this feature');
  }

  // Only decrement the specific feature being used
  await trialRef.update({
    [`${feature}.remainingUses`]: trialData[feature].remainingUses - 1,
    [`${feature}.last_used`]: new Date().toISOString()
  });

  return getUserSubscriptionStatus(userId);
}

export async function cancelSubscription(userId: string): Promise<SubscriptionStatus> {
  // Cancel the subscription in Stripe, which will also update our database
  try {
    await stripeService.cancelSubscription(userId);
  } catch (error) {
    if (error instanceof Error && error.message.includes('No Stripe subscription ID found')) {
      await db.collection('subscriptions').doc(userId).update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
        trials: {
          resume_creator: { remaining: 0 },
          resume_pro: { remaining: 0 },
          career_pro: { remaining: 0 }
        }
      });
    } else {
      throw error;
    }
  }

  return getUserSubscriptionStatus(userId);
}
