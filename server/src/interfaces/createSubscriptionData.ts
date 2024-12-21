import { Timestamp } from "firebase-admin/firestore";
import { SubscriptionTier } from "../enums/subscriptionTier";

export interface CreateSubscriptionData {
    tier: SubscriptionTier;
    subscription_end_date?: Timestamp | null;
  }