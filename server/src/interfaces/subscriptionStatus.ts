import { SubscriptionTier } from "../enums/subscriptionTier";

export interface SubscriptionStatus {
    tier: SubscriptionTier;
    isActive: boolean;
    subscription_end_date?: string | null;
    hasStartedTrial: boolean;
    trials: {
      creator: { remaining: number };
      reviewer: { remaining: number };
      cover_letter: { remaining: number };
    };
  }