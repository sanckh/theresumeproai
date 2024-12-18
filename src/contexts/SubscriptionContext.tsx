import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from "./AuthContext";
import { decrementTrialUse, getSubscriptionStatus, startTrial } from "../api/subscription";
import { SubscriptionTier } from '@/enums/subscriptionTierEnum';
import { SubscriptionStatus } from '@/interfaces/subscriptionStatus';
import { TrialWelcomeDialog } from '@/components/TrialWelcomeDialog';

interface SubscriptionContextType {
  subscriptionStatus: SubscriptionStatus | null;
  loading: boolean;
  error: string | null;
  tier?: SubscriptionTier;
  canUseFeature: (feature: string) => boolean;
  hasSubscriptionAccess: (feature: string) => boolean;
  startTrial: () => Promise<void>;
  decrementTrialUse: (feature: 'resume_creator' | 'resume_pro' | 'career_pro') => Promise<void>;
  refreshSubscription: () => Promise<void>;
  checkSubscription: () => Promise<boolean>;
}

const defaultSubscriptionStatus: SubscriptionStatus = {
  tier: SubscriptionTier.FREE,
  status: 'none',
  hasStartedTrial: false,
  trials: {
    resume_creator: { remaining: 0 },
    resume_pro: { remaining: 0 },
    career_pro: { remaining: 0 }
  },
  is_active: false
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTrialWelcome, setShowTrialWelcome] = useState(false);

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

    const { tier, status, hasStartedTrial, trials } = subscriptionStatus;

    // Check trial access first
    if (hasStartedTrial && trials) {
      const featureKey = feature as keyof typeof trials;
      if (trials[featureKey]?.remaining > 0) {
        return true;
      }
    }

    // Then check subscription access
    if (status === 'active') {
      switch (tier) {
        case SubscriptionTier.CAREER_PRO:
          return true;
        case SubscriptionTier.RESUME_PRO:
          return feature !== 'career_pro';
        case SubscriptionTier.RESUME_CREATOR:
          return feature === 'resume_creator';
        default:
          return false;
      }
    }

    return false;
  };

  const hasSubscriptionAccess = (feature: string): boolean => {
    if (!subscriptionStatus || subscriptionStatus.status !== 'active') return false;

    switch (subscriptionStatus.tier) {
      case SubscriptionTier.CAREER_PRO:
        return true;
      case SubscriptionTier.RESUME_PRO:
        return feature !== 'career_pro';
      case SubscriptionTier.RESUME_CREATOR:
        return feature === 'resume_creator';
      default:
        return false;
    }
  };

  const handleStartTrial = async () => {
    try {
      if (!user) return;
      await startTrial(user.uid);
      await refreshSubscription();
      setShowTrialWelcome(true);
    } catch (err) {
      setError('Failed to start trial');
      console.error('Error starting trial:', err);
    }
  };

  const handleDecrementTrialUse = async (feature: 'resume_creator' | 'resume_pro' | 'career_pro') => {
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
      return status.status === 'active' && status.tier !== SubscriptionTier.FREE;
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
        hasSubscriptionAccess,
        startTrial: handleStartTrial,
        decrementTrialUse: handleDecrementTrialUse,
        refreshSubscription,
        checkSubscription
      }}
    >
      {children}
      <TrialWelcomeDialog 
        isOpen={showTrialWelcome} 
        onClose={() => setShowTrialWelcome(false)} 
      />
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
