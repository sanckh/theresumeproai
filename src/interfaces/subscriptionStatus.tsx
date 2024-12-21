import { Timestamp } from '@google-cloud/firestore';
import { SubscriptionTier } from '../enums/subscriptionTierEnum';

export interface SubscriptionStatus {
    status: 'none' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
    tier: SubscriptionTier;
    subscription_end_date?: Timestamp;
    trials: {
      resume_creator: { remaining: number };
      resume_pro: { remaining: number };
      career_pro: { remaining: number };
    };
    hasStartedTrial: boolean;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    updated_at?: string;
    renewal_date?: string;
    is_active: boolean;
}