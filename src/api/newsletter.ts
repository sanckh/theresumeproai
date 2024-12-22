/* eslint-disable @typescript-eslint/no-explicit-any */
const API_URL = import.meta.env.VITE_API_URL;

interface NewsletterResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const subscribeToNewsletter = async (email: string): Promise<NewsletterResponse> => {
  try {
    const response = await fetch(`${API_URL}/newsletter/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to subscribe to newsletter');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Newsletter error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to subscribe to newsletter'
    };
  }
};
