import { SubscriptionTier } from "../enums/subscriptionTier";

export interface CreateSubscriptionData {
    tier: SubscriptionTier;
    subscription_end_date?: string | null;
  }