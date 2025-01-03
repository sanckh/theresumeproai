import { SubscriptionTier } from '@/enums/subscriptionTierEnum';
import { analytics, auth } from '../config/firebase';
import { SubscriptionStatus } from '@/interfaces/subscriptionStatus';
import { logEvent } from 'firebase/analytics';
import { trackTrialStart } from '@/utils/analytics';
const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = async () => {
  const token = await auth.currentUser?.getIdToken(true);
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
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      throw new Error('Failed to get subscription status');
    }
    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw error;
  }
};

export const startTrial = async (tier: string): Promise<void> => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_URL}/subscription/trial/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ tier })
    });

    if (!response.ok) {
      throw new Error('Failed to start trial');
    }

    // Track trial start
    if (auth.currentUser?.uid) {
      trackTrialStart(auth.currentUser.uid, tier);
    }
  } catch (error) {
    console.error('Error starting trial:', error);
    throw error;
  }
};

export const decrementTrialUse = async (
  userId: string,
  feature: 'resume_creator' | 'resume_pro' | 'career_pro'
): Promise<SubscriptionStatus> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/subscription/trial/use`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, feature })
    });
    if (!response.ok) {
      throw new Error('Failed to decrement trial use');
    }
    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Error decrementing trial use:', error);
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
      body: JSON.stringify({ userId, tier, duration }),
    });
    if (!response.ok) {
      throw new Error('Failed to create subscription');
    }
    const data = await response.json();
    
    if (analytics) {
      logEvent(analytics, 'subscription_created', {
        user_id: userId,
        tier: tier,
        duration: duration
      });
    }
    
    return data.subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

export const cancelSubscription = async (userId: string): Promise<SubscriptionStatus> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/subscription/cancel`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }
    const data = await response.json();
    
    if (analytics) {
      logEvent(analytics, 'subscription_cancelled', {
        user_id: userId
      });
    }
    
    return data.subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};
