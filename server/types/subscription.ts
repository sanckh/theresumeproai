export enum SubscriptionTier {
  NONE = 'none',
  FREE = 'free',
  RESUME_CREATOR = 'resume_creator',
  RESUME_PRO = 'resume_pro',
  CAREER_PRO = 'career_pro'
}

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isActive: boolean;
  subscription_end_date?: string | null;
  hasStartedTrial: boolean;
  trials: {
    creator: { remaining: number };
    reviewer: { remaining: number };
    cover_letter: { remaining: number };
  };
}

export interface SubscriptionFeatures {
  canCreateResume: boolean;
  canReviewResume: boolean;
  canCreateCoverLetter: boolean;
}

export function getSubscriptionFeatures(tier: SubscriptionTier): SubscriptionFeatures {
  switch (tier) {
    case SubscriptionTier.CAREER_PRO:
      return {
        canCreateResume: true,
        canReviewResume: true,
        canCreateCoverLetter: true
      };
    case SubscriptionTier.RESUME_PRO:
      return {
        canCreateResume: true,
        canReviewResume: true,
        canCreateCoverLetter: false
      };
    case SubscriptionTier.RESUME_CREATOR:
      return {
        canCreateResume: true,
        canReviewResume: false,
        canCreateCoverLetter: false
      };
    default:
      return {
        canCreateResume: false,
        canReviewResume: false,
        canCreateCoverLetter: false
      };
  }
}
