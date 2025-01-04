/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useEffect } from 'react';

export const ConditionalAutoAds: React.FC = () => {
  const { subscriptionStatus, loading } = useSubscription();
  
  useEffect(() => {
    if (loading) return;

    // If user has a paid subscription, remove any auto ads
    if (subscriptionStatus?.tier && subscriptionStatus.tier !== 'free') {
      try {
        const adElements = document.querySelectorAll('.adsbygoogle');
        adElements.forEach(el => el.remove());
      } catch (error) {
        console.error('Error removing ads:', error);
      }
    }
  }, [loading, subscriptionStatus]);

  return null;
};
