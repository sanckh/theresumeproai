import { useSubscription } from '@/contexts/SubscriptionContext';
import { GoogleAd } from './GoogleAd';
import type { GoogleAdProps } from '@/interfaces/googleAdProps';

export const ConditionalAd: React.FC<GoogleAdProps> = (props) => {
  const { subscriptionStatus, loading } = useSubscription();
  
  // Don't show ad while subscription status is loading
  if (loading) {
    return null;
  }
  
  // Show ad only if user has no subscription or is on free tier
  if (!subscriptionStatus?.tier || subscriptionStatus.tier === 'free') {
    return <GoogleAd {...props} />;
  }

  return null;
};
