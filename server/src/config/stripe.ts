import { SubscriptionTier } from '../../../src/enums/subscriptionEnum';

export const STRIPE_CONFIG = {
  priceIds: {
    [SubscriptionTier.RESUME_CREATOR]: process.env.STRIPE_PRICE_RESUME_CREATOR,
    [SubscriptionTier.RESUME_PRO]: process.env.STRIPE_PRICE_RESUME_PRO,
    [SubscriptionTier.CAREER_PRO]: process.env.STRIPE_PRICE_CAREER_PRO,
  },
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};
