import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from "./AuthContext";
import { decrementTrialUse, getSubscriptionStatus, startTrial, SubscriptionStatus } from "../api/subscription";
import { SubscriptionTier } from 'server/types/subscription';

interface SubscriptionContextType {
  subscriptionStatus: SubscriptionStatus | null;
  loading: boolean;
  error: string | null;
  tier?: SubscriptionTier;
  canUseFeature: (feature: string) => boolean;
  startTrial: () => Promise<void>;
  decrementTrialUse: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
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

    const { tier, isActive, hasStartedTrial } = subscriptionStatus;
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

    // Check trial availability if subscription is not active
    return hasStartedTrial;
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

  const handleDecrementTrialUse = async () => {
    try {
      if (!user) throw new Error('User not authenticated');

      const status = await decrementTrialUse(user.uid);
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
