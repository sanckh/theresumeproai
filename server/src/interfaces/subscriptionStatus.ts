import { SubscriptionTier } from "../enums/subscriptionTier";

export interface SubscriptionStatus {
    tier: SubscriptionTier;
    isActive: boolean;
    subscription_end_date?: string | null;
    hasStartedTrial: boolean;
    trials: {
      resume_creator: { remaining: number };
      resume_pro: { remaining: number };
      career_pro: { remaining: number };
    };
  }