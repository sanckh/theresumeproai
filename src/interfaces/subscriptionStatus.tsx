import { SubscriptionTier } from "@/enums/subscriptionTierEnum";

export interface SubscriptionStatus {
    isActive: boolean;
    tier: SubscriptionTier;
    expiresAt?: string;
    cancelAtPeriodEnd?: boolean;
    trials: {
      resume_creator: { remaining: number };
      resume_pro: { remaining: number };
      career_pro: { remaining: number };
    };
    hasStartedTrial: boolean;
  }