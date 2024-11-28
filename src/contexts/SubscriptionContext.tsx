import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { getSubscriptionStatus, SubscriptionStatus } from "../api/subscription";

type SubscriptionTier = 'free' | 'premium' | 'pro';

type SubscriptionContextType = {
  tier: SubscriptionTier;
  hasUsedCreatorTrial: boolean;
  hasUsedReviewerTrial: boolean;
  checkSubscription: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [hasUsedCreatorTrial, setHasUsedCreatorTrial] = useState(false);
  const [hasUsedReviewerTrial, setHasUsedReviewerTrial] = useState(false);

  const checkSubscription = async () => {
    if (!user) {
      setTier('free');
      setHasUsedCreatorTrial(false);
      setHasUsedReviewerTrial(false);
      return;
    }

    try {
      const subscription = await getSubscriptionStatus(user.uid);
      setTier(subscription.tier);
      setHasUsedCreatorTrial(subscription.has_used_creator_trial);
      setHasUsedReviewerTrial(subscription.has_used_reviewer_trial);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // Set default values on error
      setTier('free');
      setHasUsedCreatorTrial(false);
      setHasUsedReviewerTrial(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

  return (
    <SubscriptionContext.Provider value={{ 
      tier, 
      hasUsedCreatorTrial, 
      hasUsedReviewerTrial, 
      checkSubscription 
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
};
