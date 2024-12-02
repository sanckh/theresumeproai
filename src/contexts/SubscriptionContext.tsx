import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from "./AuthContext";
import { decrementTrialUse, getSubscriptionStatus, startTrial, SubscriptionStatus, SubscriptionTier, TrialType } from "../api/subscription";

interface SubscriptionContextType {
  subscriptionStatus: SubscriptionStatus | null;
  loading: boolean;
  error: string | null;
  tier?: SubscriptionTier;
  canUseFeature: (feature: string) => boolean;
  canUseTrial: (trialType: TrialType) => boolean;
  startTrial: (trialType: TrialType) => Promise<void>;
  decrementTrialUse: (trialType: TrialType) => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const defaultSubscriptionStatus: SubscriptionStatus = {
  tier: 'resume_creator',
  status: 'inactive',
  trials: {
    creator: { used: false, remaining: 1 },
    reviewer: { used: false, remaining: 1 },
    cover_letter: { used: false, remaining: 1 }
  }
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSubscription = async () => {
    try {
      if (!user) {
        setSubscriptionStatus(defaultSubscriptionStatus);
        return;
      }

      const status = await getSubscriptionStatus(user.uid);
      setSubscriptionStatus(status);
      setError(null);
    } catch (err) {
      setError('Failed to fetch subscription status');
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const auth = useAuth();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        refreshSubscription();
      } else {
        setSubscriptionStatus(defaultSubscriptionStatus);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const canUseFeature = (feature: string): boolean => {
    if (!subscriptionStatus) return false;

    const { tier, status } = subscriptionStatus;
    if (status === 'active') {
      switch (tier) {
        case 'career_pro':
          return true;
        case 'resume_pro':
          return feature !== 'cover_letter';
        case 'resume_creator':
          return feature === 'creator';
        default:
          return false;
      }
    }

    // Check trial availability if subscription is not active
    if (feature === 'creator') {
      return subscriptionStatus.trials.creator.remaining > 0;
    } else if (feature === 'reviewer') {
      return subscriptionStatus.trials.reviewer.remaining > 0;
    } else if (feature === 'cover_letter') {
      return subscriptionStatus.trials.cover_letter.remaining > 0;
    }

    return false;
  };

  const canUseTrial = (trialType: TrialType): boolean => {
    if (!subscriptionStatus) return false;
    return subscriptionStatus.trials[trialType].remaining > 0;
  };

  const handleStartTrial = async (trialType: TrialType) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const status = await startTrial(user.uid, trialType);
      setSubscriptionStatus(status);
      setError(null);
    } catch (err) {
      setError('Failed to start trial');
      console.error('Error starting trial:', err);
      throw err;
    }
  };

  const handleDecrementTrialUse = async (trialType: TrialType) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const status = await decrementTrialUse(user.uid, trialType);
      setSubscriptionStatus(status);
      setError(null);
    } catch (err) {
      setError('Failed to update trial usage');
      console.error('Error updating trial usage:', err);
      throw err;
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionStatus,
        loading,
        error,
        tier: subscriptionStatus?.tier, 
        canUseFeature,
        canUseTrial,
        startTrial: handleStartTrial,
        decrementTrialUse: handleDecrementTrialUse,
        refreshSubscription
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
