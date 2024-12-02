import { auth } from '../config/firebase';

const API_URL = import.meta.env.VITE_API_URL;

export type SubscriptionTier = 'free' | 'resume_creator' | 'resume_pro' | 'career_pro';
export type TrialType = 'creator' | 'reviewer' | 'cover_letter';

export interface TrialStatus {
  used: boolean;
  remaining: number;
}

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  status: 'active' | 'inactive' | 'expired';
  subscription_end_date?: string | null;
  trials: {
    creator: TrialStatus;
    reviewer: TrialStatus;
    cover_letter: TrialStatus;
  };
}

const getAuthHeaders = async () => {
  const token = await auth.currentUser?.getIdToken(true); // Force token refresh
  if (!token) {
    throw new Error('Not authenticated');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const getSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/subscription/status`, {
      credentials: 'include',
      headers,
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch subscription status');
    }
    
    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Subscription status error:', error);
    throw error;
  }
};

export const startTrial = async (userId: string, trialType: TrialType): Promise<SubscriptionStatus> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/subscription/trial/start`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ trialType }),
    });

    if (!response.ok) {
      throw new Error('Failed to start trial');
    }

    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Start trial error:', error);
    throw error;
  }
};

export const decrementTrialUse = async (userId: string, trialType: TrialType): Promise<SubscriptionStatus> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/subscription/trial/use`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ trialType }),
    });

    if (!response.ok) {
      throw new Error('Failed to update trial usage');
    }

    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Decrement trial error:', error);
    throw error;
  }
};

export const createSubscription = async (
  userId: string,
  tier: SubscriptionTier,
  duration: number = 1
): Promise<SubscriptionStatus> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/subscription/create`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ tier, duration }),
    });

    if (!response.ok) {
      throw new Error('Failed to create subscription');
    }

    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Create subscription error:', error);
    throw error;
  }
};

export const cancelSubscription = async (userId: string): Promise<SubscriptionStatus> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/subscription/cancel`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Cancel subscription error:', error);
    throw error;
  }
};
