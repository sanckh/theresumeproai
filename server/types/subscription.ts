import { SubscriptionTier } from "../src/enums/subscriptionTier";
import { SubscriptionFeatures } from "../src/interfaces/subscriptionFeatures";



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
