/* eslint-disable @typescript-eslint/no-explicit-any */
interface NewsletterSubscriptionResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class NewsletterService {
  private readonly apiKey: string;
  private readonly publicationId: string;

  constructor() {
    const apiKey = process.env.BEEHIIV_API_KEY;
    const publicationId = process.env.BEEHIIV_PUBLICATION_KEY;

    if (!apiKey || !publicationId) {
      throw new Error('Newsletter service configuration missing');
    }

    this.apiKey = apiKey;
    this.publicationId = publicationId;
  }

  async subscribeToNewsletter(email: string): Promise<NewsletterSubscriptionResponse> {
    try {
      const response = await fetch(
        `https://api.beehiiv.com/v2/publications/${this.publicationId}/subscriptions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            email,
            reactivateExisting: false,
            sendWelcomeEmail: false,
            utmSource: "website",
            utmMedium: "organic",
            utmCampaign: "signup_form"
          })
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.errors?.[0]?.message || 'Failed to subscribe to newsletter');
      }

      return { success: true, data };
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to subscribe to newsletter'
      };
    }
  }
}
