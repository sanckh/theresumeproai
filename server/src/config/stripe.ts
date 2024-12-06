import { SubscriptionTier } from '../../types/subscription';

export const STRIPE_CONFIG = {
  STRIPE_API_KEY: process.env.STRIPE_API_KEY,
  FRONTEND_URL: process.env.FRONTEND_URL,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  priceIds: {
    [SubscriptionTier.RESUME_CREATOR]: process.env.STRIPE_PRICE_RESUME_CREATOR,
    [SubscriptionTier.RESUME_PRO]: process.env.STRIPE_PRICE_RESUME_PRO,
    [SubscriptionTier.CAREER_PRO]: process.env.STRIPE_PRICE_CAREER_PRO,
  }
};

export const getTierFromPriceId = (priceId: string | null): SubscriptionTier => {
  if (!priceId) return SubscriptionTier.FREE;
  
  const priceIds = STRIPE_CONFIG.priceIds;
  if (priceId === priceIds[SubscriptionTier.RESUME_CREATOR]) {
    return SubscriptionTier.RESUME_CREATOR;
  }
  if (priceId === priceIds[SubscriptionTier.RESUME_PRO]) {
    return SubscriptionTier.RESUME_PRO;
  }
  if (priceId === priceIds[SubscriptionTier.CAREER_PRO]) {
    return SubscriptionTier.CAREER_PRO;
  }
  return SubscriptionTier.FREE;
};
