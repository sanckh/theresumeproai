import { SubscriptionTier } from '../enums/subscriptionTierEnum';

export const STRIPE_PRICE_IDS = {
  RESUME_CREATOR: import.meta.env.VITE_STRIPE_PRICE_RESUME_CREATOR,
  RESUME_PRO: import.meta.env.VITE_STRIPE_PRICE_RESUME_PRO,
  CAREER_PRO: import.meta.env.VITE_STRIPE_PRICE_CAREER_PRO
} as const;

export const getTierFromPriceId = (priceId: string | null): SubscriptionTier => {
  switch (priceId) {
    case STRIPE_PRICE_IDS.RESUME_CREATOR:
      return SubscriptionTier.RESUME_CREATOR;
    case STRIPE_PRICE_IDS.RESUME_PRO:
      return SubscriptionTier.RESUME_PRO;
    case STRIPE_PRICE_IDS.CAREER_PRO:
      return SubscriptionTier.CAREER_PRO;
    default:
      return SubscriptionTier.FREE;
  }
};

export const getPriceIdFromTier = (tier: SubscriptionTier): string | null => {
  switch (tier) {
    case SubscriptionTier.RESUME_CREATOR:
      return STRIPE_PRICE_IDS.RESUME_CREATOR;
    case SubscriptionTier.RESUME_PRO:
      return STRIPE_PRICE_IDS.RESUME_PRO;
    case SubscriptionTier.CAREER_PRO:
      return STRIPE_PRICE_IDS.CAREER_PRO;
    default:
      return null;
  }
};
