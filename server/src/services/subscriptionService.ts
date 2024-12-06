import { db } from '../../firebase_options';
import { SubscriptionStatus, SubscriptionTier } from '../../types/subscription';

interface CreateSubscriptionData {
  tier: SubscriptionTier;
  subscription_end_date?: string | null;
}

interface TrialData {
  remainingUses: number;
}

const defaultTrials = {
  creator: { used: false, remaining: 1 },
  reviewer: { used: false, remaining: 1 },
  cover_letter: { used: false, remaining: 1 }
};

async function getTrialStatus(userId: string): Promise<{
  hasStartedTrial: boolean;
  trials: {
    creator: { remaining: number };
    reviewer: { remaining: number };
    cover_letter: { remaining: number };
  }
}> {
  const trialDoc = await db.collection('trials').doc(userId).get();

  if (!trialDoc.exists) {
    return {
      hasStartedTrial: false,
      trials: {
        creator: { remaining: 0 },
        reviewer: { remaining: 0 },
        cover_letter: { remaining: 0 }
      }
    };
  }

  const trialData = trialDoc.data();
  return {
    hasStartedTrial: true,
    trials: {
      creator: { remaining: trialData?.creator?.remainingUses ?? 1 },
      reviewer: { remaining: trialData?.reviewer?.remainingUses ?? 1 },
      cover_letter: { remaining: trialData?.cover_letter?.remainingUses ?? 1 }
    }
  };
}

async function getPaidSubscriptionStatus(userId: string): Promise<{
  tier: SubscriptionTier;
  isActive: boolean;
  subscription_end_date?: string | null;
}> {
  const userDoc = await db.collection('subscriptions').doc(userId).get();

  if (!userDoc.exists) {
    return {
      tier: SubscriptionTier.NONE,
      isActive: false
    };
  }

  const userData = userDoc.data();
  const isActive = userData?.status === 'active' || userData?.isActive === true;
  
  return {
    tier: userData?.tier || SubscriptionTier.NONE,
    isActive,
    subscription_end_date: userData?.subscription_end_date
  };
}

export async function getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const [trialStatus, subscriptionStatus] = await Promise.all([
    getTrialStatus(userId),
    getPaidSubscriptionStatus(userId)
  ]);

  // If user has an active trial, they get trial tier access regardless of subscription
  if (trialStatus.trials.creator.remaining > 0) {
    return {
      tier: SubscriptionTier.RESUME_CREATOR,
      isActive: true,
      hasStartedTrial: trialStatus.hasStartedTrial,
      trials: trialStatus.trials
    };
  }

  // Otherwise return their subscription status with empty trial counts
  return {
    ...subscriptionStatus,
    hasStartedTrial: trialStatus.hasStartedTrial,
    trials: trialStatus.trials
  };
}

export async function createSubscription(
  userId: string,
  data: CreateSubscriptionData
): Promise<SubscriptionStatus> {
  await db.collection('subscriptions').doc(userId).set({
    tier: data.tier,
    isActive: true,
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
    creator: { remainingUses: 1, started_at: new Date().toISOString() },
    reviewer: { remainingUses: 1, started_at: new Date().toISOString() },
    cover_letter: { remainingUses: 1, started_at: new Date().toISOString() }
  });

  return getUserSubscriptionStatus(userId);
}

export async function decrementTrialUse(
  userId: string,
  feature: 'creator' | 'reviewer' | 'cover_letter'
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
  await db.collection('subscriptions').doc(userId).update({
    isActive: false,
    updated_at: new Date().toISOString()
  });

  return getUserSubscriptionStatus(userId);
}
