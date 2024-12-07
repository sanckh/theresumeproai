import { SubscriptionTier } from "../../types/subscription";

export interface CreateSubscriptionData {
    tier: SubscriptionTier;
    subscription_end_date?: string | null;
  }