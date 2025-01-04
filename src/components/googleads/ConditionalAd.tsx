/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useEffect } from 'react';

export const ConditionalAutoAds: React.FC = () => {
  const { subscriptionStatus, loading } = useSubscription();
  
  useEffect(() => {
    // Don't proceed if still loading
    if (loading) return;

    const initializeAds = () => {
      try {
        if (!subscriptionStatus?.tier || subscriptionStatus.tier === 'free') {
          // Safety check to ensure we're not reinitializing if already present
          if (!(window as any).adsbygoogle) {
            (window as any).adsbygoogle = [];
          }
          
          // Check if we already pushed the config
          const existingConfig = (window as any).adsbygoogle.find((ad: any) => 
            ad.google_ad_client === "ca-pub-6552957595045294"
          );
          
          if (!existingConfig) {
            (window as any).adsbygoogle.push({
              google_ad_client: "ca-pub-6552957595045294",
              enable_page_level_ads: true
            });
          }
        } else {
          // Only remove ads if they exist
          const adElements = document.querySelectorAll('.adsbygoogle');
          adElements.forEach(el => {
            try {
              el.remove();
            } catch (removeError) {
              console.error('Error removing ad element:', removeError);
            }
          });
        }
      } catch (error) {
        // Log error but don't let it crash the app
        console.error('Error initializing ads:', error);
      }
    };

    // Delay ad initialization slightly to ensure page is ready
    const timeoutId = setTimeout(initializeAds, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [loading, subscriptionStatus]);

  return null;
};
