import { useSubscription } from '@/contexts/SubscriptionContext';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const COMPLETED_ROUTES = [
  '/',
  '/builder',
  '/pricing',
  '/templates',
];

export const ConditionalAutoAds: React.FC = () => {
  const { subscriptionStatus, loading } = useSubscription();
  const location = useLocation();
  
  useEffect(() => {
    if (loading) return;

    if (
      (subscriptionStatus?.tier && subscriptionStatus.tier !== 'free') ||
      !COMPLETED_ROUTES.includes(location.pathname)
    ) {
      try {
        const adElements = document.querySelectorAll('.adsbygoogle');
        adElements.forEach(el => el.remove());
      } catch (error) {
        console.error('Error removing ads:', error);
      }
    }
  }, [loading, subscriptionStatus, location.pathname]);

  return null;
};
