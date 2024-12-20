import { auth, analytics } from '../config/firebase';
import { logEvent } from 'firebase/analytics';

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = async () => {
  const token = await auth.currentUser?.getIdToken(true);
  if (!token) {
    throw new Error('No authentication token available');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const createCheckoutSession = async (userId: string, priceId: string): Promise<string> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/stripe/create-checkout-session`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, priceId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const { url } = await response.json();
    
    if (analytics) {
      logEvent(analytics, 'begin_checkout', {
        user_id: userId,
        price_id: priceId
      });
    }
    
    return url;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

export const changeSubscription = async (
  userId: string,
  newPriceId: string
): Promise<string> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/subscription/change`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, newPriceId })
    });
    if (!response.ok) {
      throw new Error('Failed to create subscription change session');
    }
    const data = await response.json();
    
    // Track subscription change
    if (analytics) {
      logEvent(analytics, 'subscription_change', {
        user_id: userId,
        new_price_id: newPriceId
      });
    }
    
    return data.url;
  } catch (error) {
    console.error('Error changing subscription:', error);
    throw error;
  }
};