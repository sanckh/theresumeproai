import { SubscriptionTier } from 'server/types/subscription';
import { auth } from '../config/firebase';

export interface SubscriptionStatus {
  isActive: boolean;
  tier: SubscriptionTier;
  expiresAt?: string;
  cancelAtPeriodEnd?: boolean;
  trials: {
    creator: { remaining: number };
    reviewer: { remaining: number };
    cover_letter: { remaining: number };
  };
  hasStartedTrial: boolean;
}

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
    console.log("Got subscription status:", data);
    return data.subscription;
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw error;
  }
};

export const startTrial = async (userId: string): Promise<SubscriptionStatus> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/subscription/trial/start`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId })
    });
    if (!response.ok) {
      throw new Error('Failed to start trial');
    }
    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Error starting trial:', error);
    throw error;
  }
};

export const decrementTrialUse = async (
  userId: string,
  feature: 'creator' | 'reviewer' | 'cover_letter'
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
      method: 'POST',
      headers,
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }
    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};
