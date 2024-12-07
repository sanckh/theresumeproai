export interface PricingTierProps {
    name: string;
    price: string;
    tier: string;
    description: string;
    features: string[];
    highlighted?: boolean;
    trialFeatures: ReadonlyArray<'creator' | 'reviewer' | 'cover_letter'>;
    trialDescription?: string;
  }