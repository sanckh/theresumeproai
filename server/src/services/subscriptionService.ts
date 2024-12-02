import { db } from '../../firebase_options';
import { SubscriptionStatus, SubscriptionTier, TrialType } from '../interfaces/subscription';

interface CreateSubscriptionData {
  tier: SubscriptionTier;
  subscription_end_date?: string | null;
}

interface TrialData {
  trialType: TrialType;
  remainingUses: number;
}

const defaultTrials = {
  creator: { used: false, remaining: 1 },
  reviewer: { used: false, remaining: 1 },
  cover_letter: { used: false, remaining: 1 }
};

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const userDoc = await db.collection('subscriptions').doc(userId).get();
  const trialDoc = await db.collection('trials').doc(userId).get();

  if (!userDoc.exists) {
    return {
      tier: SubscriptionTier.RESUME_CREATOR,
      status: 'inactive',
      trials: defaultTrials
    };
  }

  const userData = userDoc.data();
  const trialData = trialDoc.exists ? trialDoc.data() : null;

  // Map the Firebase trial data to our frontend format
  const trials = {
    creator: {
      used: trialData?.creator?.remainingUses === 0,
      remaining: trialData?.creator?.remainingUses ?? (trialDoc.exists ? 0 : 1)
    },
    reviewer: {
      used: trialData?.reviewer?.remainingUses === 0,
      remaining: trialData?.reviewer?.remainingUses ?? (trialDoc.exists ? 0 : 1)
    },
    cover_letter: {
      used: trialData?.cover_letter?.remainingUses === 0,
      remaining: trialData?.cover_letter?.remainingUses ?? (trialDoc.exists ? 0 : 1)
    }
  };

  return {
    tier: userData?.tier || SubscriptionTier.RESUME_CREATOR,
    status: userData?.status || 'inactive',
    subscription_end_date: userData?.subscription_end_date,
    trials
  };
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

  return getSubscriptionStatus(userId);
}

export async function startTrial(
  userId: string,
  trialType: TrialType
): Promise<SubscriptionStatus> {
  const trialRef = db.collection('trials').doc(userId);
  const trialDoc = await trialRef.get();

  if (trialDoc.exists) {
    const trialData = trialDoc.data() as Record<TrialType, TrialData>;
    if (trialData[trialType]?.remainingUses === 0) {
      throw new Error('Trial already used');
    }
  }

  const updateData = trialDoc.exists ? {
    [trialType]: {
      trialType,
      remainingUses: 1,
      started_at: new Date().toISOString()
    }
  } : {
    creator: { trialType: 'creator', remainingUses: 1 },
    reviewer: { trialType: 'reviewer', remainingUses: 1 },
    cover_letter: { trialType: 'cover_letter', remainingUses: 1 },
    [trialType]: {
      trialType,
      remainingUses: 1,
      started_at: new Date().toISOString()
    }
  };

  await trialRef.set(updateData, { merge: true });
  return getSubscriptionStatus(userId);
}

export async function decrementTrialUse(
  userId: string,
  trialType: TrialType
): Promise<SubscriptionStatus> {
  const trialRef = db.collection('trials').doc(userId);
  const trialDoc = await trialRef.get();

  if (!trialDoc.exists) {
    await trialRef.set({
      creator: { trialType: 'creator', remainingUses: 1 },
      reviewer: { trialType: 'reviewer', remainingUses: 1 },
      cover_letter: { trialType: 'cover_letter', remainingUses: 1 }
    });
    return decrementTrialUse(userId, trialType); // Retry after initialization
  }

  const trialData = trialDoc.data() as Record<TrialType, TrialData>;
  if (!trialData[trialType] || trialData[trialType].remainingUses === 0) {
    throw new Error('No remaining trial uses');
  }

  await trialRef.update({
    [`${trialType}.remainingUses`]: trialData[trialType].remainingUses - 1,
    [`${trialType}.last_used`]: new Date().toISOString()
  });

  return getSubscriptionStatus(userId);
}

export async function cancelSubscription(userId: string): Promise<SubscriptionStatus> {
  await db.collection('subscriptions').doc(userId).update({
    status: 'inactive',
    updated_at: new Date().toISOString()
  });

  return getSubscriptionStatus(userId);
}
