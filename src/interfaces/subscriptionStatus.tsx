import { SubscriptionTier } from "@/enums/subscriptionTierEnum";

export interface SubscriptionStatus {
    isActive: boolean;
    tier: SubscriptionTier;
    expiresAt?: string;
    cancelAtPeriodEnd?: boolean;
    trials: {
      creator: { remaining: number };
      reviewer: { remaining: number };
      cover_letter: { remaining: number };
    };
    hasStartedTrial: boolean;
  }