import { Timestamp } from "firebase-admin/firestore";
import { SubscriptionTier } from "../enums/subscriptionTier";

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid' | 'none';
  subscription_end_date?: Timestamp | null;
  renewal_date?: string | null;
  hasStartedTrial: boolean;
  trials: {
    resume_creator: { remaining: number };
    resume_pro: { remaining: number };
    career_pro: { remaining: number };
  };
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  updated_at?: string;
  is_active: boolean;
}