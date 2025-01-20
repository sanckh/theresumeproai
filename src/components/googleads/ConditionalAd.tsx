import { useSubscription } from '@/contexts/SubscriptionContext';
import { useEffect } from 'react';

export const ConditionalAutoAds: React.FC = () => {
  const { subscriptionStatus, loading } = useSubscription();
  
  useEffect(() => {
    if (loading) return;

    if (subscriptionStatus?.tier && subscriptionStatus.tier !== 'free') {
      const adElements = document.querySelectorAll('.adsbygoogle');
      adElements.forEach(el => el.remove());
    }
  }, [loading, subscriptionStatus]);

  return null;
};
