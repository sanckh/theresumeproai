export enum SubscriptionTier {
  FREE = 'free',
  RESUME_CREATOR = 'resume_creator',
  RESUME_PRO = 'resume_pro',
  CAREER_PRO = 'career_pro'
}

export type TrialType = 'creator' | 'reviewer' | 'cover_letter';

export interface TrialStatus {
  used: boolean;
  remaining: number;
}

export interface TrialsStatus {
  creator: TrialStatus;
  reviewer: TrialStatus;
  cover_letter: TrialStatus;
}

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  status: 'active' | 'inactive' | 'expired';
  subscription_end_date?: string | null;
  trials: TrialsStatus;
}

export interface SubscriptionFeatures {
  canCreateResume: boolean;
  canReviewResume: boolean;
  canCreateCoverLetter: boolean;
}

export const getTrialFeaturesByTier = (tier: SubscriptionTier): TrialType[] => {
  switch (tier) {
    case SubscriptionTier.FREE:
      return [];
    case SubscriptionTier.RESUME_CREATOR:
      return ['creator'];
    case SubscriptionTier.RESUME_PRO:
      return ['creator', 'reviewer'];
    case SubscriptionTier.CAREER_PRO:
      return ['creator', 'reviewer', 'cover_letter'];
    default:
      return [];
  }
};

export const getSubscriptionFeatures = (tier: SubscriptionTier): SubscriptionFeatures => {
  switch (tier) {
    case SubscriptionTier.FREE:
      return {
        canCreateResume: false,
        canReviewResume: false,
        canCreateCoverLetter: false,
      };
    case SubscriptionTier.RESUME_CREATOR:
      return {
        canCreateResume: true,
        canReviewResume: false,
        canCreateCoverLetter: false,
      };
    case SubscriptionTier.RESUME_PRO:
      return {
        canCreateResume: true,
        canReviewResume: true,
        canCreateCoverLetter: false,
      };
    case SubscriptionTier.CAREER_PRO:
      return {
        canCreateResume: true,
        canReviewResume: true,
        canCreateCoverLetter: true,
      };
    default:
      return {
        canCreateResume: false,
        canReviewResume: false,
        canCreateCoverLetter: false,
      };
  }
};
