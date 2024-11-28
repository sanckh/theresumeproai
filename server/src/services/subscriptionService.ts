import { db } from '../../firebase_options';

export interface SubscriptionStatus {
  tier: 'free' | 'premium' | 'pro';
  status?: string;
  has_used_creator_trial: boolean;
  has_used_reviewer_trial: boolean;
}

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const subscriptionDoc = await db.collection('subscriptions').doc(userId).get();
  
  if (!subscriptionDoc.exists) {
    return {
      tier: 'free',
      has_used_creator_trial: false,
      has_used_reviewer_trial: false
    };
  }

  const data = subscriptionDoc.data();
  return {
    tier: data?.tier || 'free',
    status: data?.status,
    has_used_creator_trial: data?.has_used_creator_trial || false,
    has_used_reviewer_trial: data?.has_used_reviewer_trial || false
  };
}

export async function updateTrialStatus(
  userId: string, 
  trialType: 'creator' | 'reviewer'
): Promise<void> {
  const update = trialType === 'creator' 
    ? { has_used_creator_trial: true }
    : { has_used_reviewer_trial: true };
    
  await db.collection('subscriptions').doc(userId).set(update, { merge: true });
}
