export interface PricingTierProps {
    name: string;
    price: string;
    tier: string;
    description: string;
    features: string[];
    highlighted?: boolean;
    trialFeatures: ReadonlyArray<'resume_creator' | 'resume_pro' | 'career_pro'>;
    trialDescription?: string;
  }