import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from "./AuthContext";
import { decrementTrialUse, getSubscriptionStatus, startTrial, SubscriptionStatus } from "../api/subscription";
import { SubscriptionTier } from '@/enums/subscriptionEnum';

interface SubscriptionContextType {
  subscriptionStatus: SubscriptionStatus | null;
  loading: boolean;
  error: string | null;
  tier?: SubscriptionTier;
  canUseFeature: (feature: string) => boolean;
  startTrial: () => Promise<void>;
  decrementTrialUse: (feature: 'creator' | 'reviewer' | 'cover_letter') => Promise<void>;
  refreshSubscription: () => Promise<void>;
  checkSubscription: () => Promise<boolean>;
}

const defaultSubscriptionStatus: SubscriptionStatus = {
  tier: SubscriptionTier.FREE,
  isActive: false,
  hasStartedTrial: false,
  trials: {
    creator: { remaining: 0 },
    reviewer: { remaining: 0 },
    cover_letter: { remaining: 0 }
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
        console.log('No user, setting default subscription status');
        setSubscriptionStatus(defaultSubscriptionStatus);
        return;
      }

      console.log('Refreshing subscription status for user:', user.uid);
      const status = await getSubscriptionStatus(user.uid);
      console.log('Got subscription status:', status);
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
    console.log('Auth state changed, current user:', auth.user?.uid);
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('User logged in, refreshing subscription');
        refreshSubscription();
      } else {
        console.log('User logged out, setting default status');
        setSubscriptionStatus(defaultSubscriptionStatus);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const canUseFeature = (feature: string): boolean => {
    if (!subscriptionStatus) return false;

    const { tier, isActive, hasStartedTrial, trials } = subscriptionStatus;
    
    console.log('Checking feature access:', {
      feature,
      tier,
      isActive,
      hasStartedTrial,
      trials,
    });

    // First check if user has remaining trial uses
    if (hasStartedTrial && trials) {
      const featureKey = feature as keyof typeof trials;
      console.log('Trial check:', {
        featureKey,
        remainingUses: trials[featureKey]?.remaining
      });
      if (trials[featureKey]?.remaining > 0) {
        return true;
      }
    }

    // If no trial uses left or not on trial, check subscription
    console.log('Subscription check:', { tier, feature, isActive });
    if (isActive) {
      switch (tier) {
        case SubscriptionTier.CAREER_PRO:
          return true;
        case SubscriptionTier.RESUME_PRO:
          return feature !== 'cover_letter';
        case SubscriptionTier.RESUME_CREATOR:
          return feature === 'creator';
        default:
          return false;
      }
    }

    return false;
  };

  const handleStartTrial = async () => {
    try {
      if (!user) throw new Error('User not authenticated');

      const status = await startTrial(user.uid);
      setSubscriptionStatus(status);
      setError(null);
    } catch (err) {
      setError('Failed to start trial');
      console.error('Error starting trial:', err);
      throw err;
    }
  };

  const handleDecrementTrialUse = async (feature: 'creator' | 'reviewer' | 'cover_letter') => {
    try {
      if (!user) throw new Error('User not authenticated');

      const status = await decrementTrialUse(user.uid, feature);
      setSubscriptionStatus(status);
      setError(null);
    } catch (err) {
      setError('Failed to update trial usage');
      console.error('Error updating trial usage:', err);
      throw err;
    }
  };

  const checkSubscription = async () => {
    try {
      if (!user) {
        return false;
      }
      
      const status = await getSubscriptionStatus(user.uid);
      return status.isActive && status.tier !== SubscriptionTier.FREE;
    } catch (err) {
      console.error('Error checking subscription:', err);
      return false;
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
        startTrial: handleStartTrial,
        decrementTrialUse: handleDecrementTrialUse,
        refreshSubscription,
        checkSubscription
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
