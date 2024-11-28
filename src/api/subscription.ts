const API_URL = import.meta.env.VITE_API_URL;

export type SubscriptionStatus = {
  tier: 'free' | 'premium' | 'pro';
  status?: string;
  has_used_creator_trial: boolean;
  has_used_reviewer_trial: boolean;
};

export const getSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus> => {
  const response = await fetch(`${API_URL}/subscription/status/${userId}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch subscription status');
  }
  
  const data = await response.json();
  return data;
};

export const updateTrialStatus = async (userId: string, trialType: 'creator' | 'reviewer'): Promise<void> => {
  const response = await fetch(`${API_URL}/subscription/trial`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ userId, trialType }),
  });

  if (!response.ok) {
    throw new Error('Failed to update trial status');
  }
};

export const cancelSubscription = async (userId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/stripe/cancel-subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to cancel subscription');
  }
};
