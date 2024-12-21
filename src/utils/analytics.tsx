import { AdEventParams } from '@/interfaces/adEventParams';
import { analytics } from '../config/firebase';
import { logEvent } from 'firebase/analytics';
import { RevenueEventParams } from '@/interfaces/revenueEventParams';
import { AdEventType } from '@/types/adEventType';

export const trackPageView = (page_title: string, page_path: string) => {
  if (analytics) {
    logEvent(analytics, 'page_view', {
      page_title,
      page_path
    });
  }
};

export const trackUserEngagement = (engagement_type: string) => {
  if (analytics) {
    logEvent(analytics, 'user_engagement', {
      engagement_type
    });
  }
};

export const trackUserSignUp = (method: string) => {
  if (analytics) {
    logEvent(analytics, 'sign_up', {
      method
    });
  }
};

export const trackUserLogin = (method: string) => {
  if (analytics) {
    logEvent(analytics, 'login', {
      method
    });
  }
};

export const trackAdEvent = (type: AdEventType, params: AdEventParams) => {
  if (analytics) {
    logEvent(analytics, `ad_${type}`, params);
  }
};

export const trackRevenue = (params: RevenueEventParams) => {
  if (analytics) {
    logEvent(analytics, 'purchase', params);
  }
};

export const trackCombinedRevenue = (
  subscriptionRevenue: number,
  adRevenue: number,
  currency = 'USD'
) => {
  if (analytics) {
    logEvent(analytics, 'revenue_metrics', {
      subscription_revenue: subscriptionRevenue,
      ad_revenue: adRevenue,
      total_revenue: subscriptionRevenue + adRevenue,
      currency
    });
  }
};
