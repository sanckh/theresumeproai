import { SubscriptionTier } from "@/enums/subscriptionTierEnum";

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  status: string;
  hasStartedTrial: boolean;
  renewal_date?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  trials: {
    resume_creator: { remaining: number };
    resume_pro: { remaining: number };
    career_pro: { remaining: number };
  };
}
