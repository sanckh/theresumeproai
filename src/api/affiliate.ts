import { AffiliateRequest, CreateAffiliateRequest } from '@/interfaces/affiliateRequest';

const API_URL = import.meta.env.VITE_API_URL;

export const submitAffiliateRequest = async (data: CreateAffiliateRequest): Promise<AffiliateRequest> => {
  try {
    const response = await fetch(`${API_URL}/affiliate/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error submitting affiliate request:', error);
    throw error;
  }
};

export const getAffiliateStatus = async (email: string): Promise<AffiliateRequest | null> => {
  try {
    const response = await fetch(`${API_URL}/affiliate/status/${email}`);
    
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error getting affiliate status:', error);
    throw error;
  }
};
