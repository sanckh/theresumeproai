import { db } from '../../firebase_options';
import { SubscriptionTier } from '../enums/subscriptionTier';
import { CreateSubscriptionData } from '../interfaces/createSubscriptionData';
import { SubscriptionStatus } from '../interfaces/subscriptionStatus';
import * as stripeService from './stripeService';

async function getTrialStatus(userId: string): Promise<SubscriptionStatus> {
  const trialDoc = await db.collection('trials').doc(userId).get();

  if (!trialDoc.exists) {
    return {
      hasStartedTrial: false,
      trials: {
        resume_creator: { remaining: 0 },
        resume_pro: { remaining: 0 },
        career_pro: { remaining: 0 }
      },
      tier: SubscriptionTier.FREE,
      status: 'none',
      is_active: false
    };
  }

  const trialData = trialDoc.data();
  if (!trialData?.resume_creator || !trialData?.resume_pro || !trialData?.career_pro) {
    return {
      hasStartedTrial: false,
      trials: {
        resume_creator: { remaining: 3 },
        resume_pro: { remaining: 3 },
        career_pro: { remaining: 3 }
      },
      tier: SubscriptionTier.FREE,
      status: 'none',
      is_active: false
    };
  }

  return {
    hasStartedTrial: true,
    trials: {
      resume_creator: { remaining: trialData.resume_creator.remaining },
      resume_pro: { remaining: trialData.resume_pro.remaining },
      career_pro: { remaining: trialData.career_pro.remaining }
    },
    tier: SubscriptionTier.FREE,
    status: 'none',
    is_active: false
  };
}

async function getPaidSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const subscriptionDoc = await db.collection('subscriptions').doc(userId).get();
  const userData = subscriptionDoc.exists ? subscriptionDoc.data() : null;

  if (!userData) {
    return {
      tier: SubscriptionTier.FREE,
      status: 'none',
      subscription_end_date: null,
      renewal_date: undefined,
      stripeSubscriptionId: undefined,
      stripeCustomerId: undefined,
      updated_at: undefined,
      is_active: false,
      hasStartedTrial: false,
      trials: {
        resume_creator: { remaining: 0 },
        resume_pro: { remaining: 0 },
        career_pro: { remaining: 0 }
      }
    };
  }

  // Determine final status
  let finalStatus = userData.status;
  if (userData.subscription_end_date) {
    const endDate = userData.subscription_end_date.toDate();
    if (endDate < new Date()) {
      finalStatus = 'expired';
    }
  }

  const result = {
    tier: userData.tier || SubscriptionTier.FREE,
    status: finalStatus,
    subscription_end_date: userData.subscription_end_date ? userData.subscription_end_date.toDate() : null,
    renewal_date: userData.renewal_date,
    stripeSubscriptionId: userData.stripeSubscriptionId,
    stripeCustomerId: userData.stripeCustomerId,
    updated_at: userData.updated_at,
    is_active: userData.is_active || false,
    hasStartedTrial: false,
    trials: {
      resume_creator: { remaining: 0 },
      resume_pro: { remaining: 0 },
      career_pro: { remaining: 0 }
    }
  };
  return result;
}

export function mergeSubscriptionStatuses(
  trialStatus: SubscriptionStatus,
  paidStatus: SubscriptionStatus
): SubscriptionStatus {
  // If user has an active paid subscription, use that
  if (paidStatus.is_active) {
    return {
      tier: paidStatus.tier,
      status: paidStatus.status,
      subscription_end_date: paidStatus.subscription_end_date,
      hasStartedTrial: trialStatus.hasStartedTrial,
      trials: trialStatus.trials,
      renewal_date: paidStatus.renewal_date,
      stripeSubscriptionId: paidStatus.stripeSubscriptionId,
      stripeCustomerId: paidStatus.stripeCustomerId,
      is_active: true
    };
  }

  // Otherwise, use trial status with paid subscription info
  return {
    tier: SubscriptionTier.FREE,
    status: paidStatus.status,
    subscription_end_date: paidStatus.subscription_end_date,
    hasStartedTrial: trialStatus.hasStartedTrial,
    trials: trialStatus.trials,
    renewal_date: paidStatus.renewal_date,
    stripeSubscriptionId: paidStatus.stripeSubscriptionId,
    stripeCustomerId: paidStatus.stripeCustomerId,
    is_active: false
  };
}

export async function getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const [trialStatus, paidStatus] = await Promise.all([
    getTrialStatus(userId),
    getPaidSubscriptionStatus(userId)
  ]);

  return mergeSubscriptionStatuses(trialStatus, paidStatus);
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

  await trialRef.set({
    resume_creator: { remaining: 3, started_at: new Date().toISOString() },
    resume_pro: { remaining: 3, started_at: new Date().toISOString() },
    career_pro: { remaining: 3, started_at: new Date().toISOString() }
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
  if (!trialData[feature] || trialData[feature].remaining <= 0) {
    throw new Error('No remaining trial uses for this feature');
  }

  // Only decrement the specific feature being used
  await trialRef.update({
    [`${feature}.remaining`]: trialData[feature].remaining - 1,
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
