import { auth } from '../config/firebase';

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
    return url;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};
