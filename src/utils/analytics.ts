import { analytics } from '../config/firebase';
import { logEvent } from 'firebase/analytics';

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
