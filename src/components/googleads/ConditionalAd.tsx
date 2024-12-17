import { useSubscription } from '@/contexts/SubscriptionContext';
import { GoogleAd } from './GoogleAd';
import type { GoogleAdProps } from '@/interfaces/googleAdProps';

export const ConditionalAd: React.FC<GoogleAdProps> = (props) => {
  const { subscriptionStatus } = useSubscription();
  
  // Show ad if subscription status is undefined (still loading) or user is on free tier
  if (!subscriptionStatus?.tier || subscriptionStatus.tier === 'free') {
    return <GoogleAd {...props} />;
  }

  return null;
};
