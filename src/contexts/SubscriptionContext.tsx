import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subscription) {
        setTier(subscription.tier);
        setHasUsedCreatorTrial(subscription.has_used_creator_trial || false);
        setHasUsedReviewerTrial(subscription.has_used_reviewer_trial || false);
      } else {
        setTier('free');
        setHasUsedCreatorTrial(false);
        setHasUsedReviewerTrial(false);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
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