import { analytics } from '../config/firebase';
import { logEvent } from 'firebase/analytics';
import { AdEventParams } from '@/interfaces/adEventParams';
import { RevenueEventParams } from '@/interfaces/revenueEventParams';
import { AdEventType } from '@/types/adEventType';
import { ConversionStep } from '@/types/conversionStep';
import { ConversionParams } from '@/interfaces/conversionParams';

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

export const trackUserSignUp = (method: string, userId?: string) => {
  if (analytics) {
    trackConversion({
      step: 'sign_up',
      method,
      userId
    });
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
    
    trackConversion({
      step: 'subscription_purchase',
      value: params.value,
      tier: params.items[0]?.item_name
    });
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

// Conversion Funnel Tracking
export const trackConversion = (params: ConversionParams) => {
  if (analytics) {
    logEvent(analytics, 'conversion_step', {
      ...params,
      timestamp: new Date().toISOString()
    });
  }
};

// Trial Tracking
export const trackTrialStart = (userId: string, tier: string) => {
  if (analytics) {
    trackConversion({
      step: 'trial_start',
      userId,
      tier
    });
  }
};
