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

export async function getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const userDoc = await db.collection('subscriptions').doc(userId).get();
  const trialDoc = await db.collection('trials').doc(userId).get();

  // If user has a trial record, they have access to all features
  if (trialDoc.exists) {
    const trialData = trialDoc.data();
    return {
      tier: SubscriptionTier.RESUME_CREATOR,
      isActive: true,
      hasStartedTrial: true,
      trials: {
        creator: { remaining: trialData?.creator?.remainingUses ?? 1 },
        reviewer: { remaining: trialData?.reviewer?.remainingUses ?? 1 },
        cover_letter: { remaining: trialData?.cover_letter?.remainingUses ?? 1 }
      }
    };
  }

  // If user has a paid subscription
  if (userDoc.exists) {
    const userData = userDoc.data();
    const isActive = userData?.status === 'active' || userData?.isActive === true;
    return {
      tier: userData?.tier || SubscriptionTier.NONE,
      isActive,
      subscription_end_date: userData?.subscription_end_date,
      hasStartedTrial: true,
      trials: {
        creator: { remaining: 0 },
        reviewer: { remaining: 0 },
        cover_letter: { remaining: 0 }
      }
    };
  }

  // New user with no trial or subscription
  return {
    tier: SubscriptionTier.NONE,
    isActive: false,
    hasStartedTrial: false,
    trials: {
      creator: { remaining: 0 },
      reviewer: { remaining: 0 },
      cover_letter: { remaining: 0 }
    }
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
