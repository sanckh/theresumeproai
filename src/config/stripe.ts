import { SubscriptionTier } from '../enums/subscriptionEnum';

export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
  priceIds: {
    [SubscriptionTier.RESUME_CREATOR]: 'price_resume_creator', // Replace with your actual Stripe price ID
    [SubscriptionTier.RESUME_PRO]: 'price_resume_pro',        // Replace with your actual Stripe price ID
    [SubscriptionTier.CAREER_PRO]: 'price_career_pro',        // Replace with your actual Stripe price ID
  }
};
