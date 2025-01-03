/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useEffect } from 'react';

export const ConditionalAutoAds: React.FC = () => {
  const { subscriptionStatus, loading } = useSubscription();
  
  useEffect(() => {
    if (!loading) {
      if (!subscriptionStatus?.tier || subscriptionStatus.tier === 'free') {
        (window as any).adsbygoogle = (window as any).adsbygoogle || [];
        (window as any).adsbygoogle.push({
          google_ad_client: "ca-pub-6552957595045294",
          enable_page_level_ads: true
        });
      } else {
        const adElements = document.querySelectorAll('.adsbygoogle');
        adElements.forEach(el => el.remove());
      }
    }
  }, [loading, subscriptionStatus]);

  return null;
};

export default ConditionalAutoAds;
