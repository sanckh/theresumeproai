import { Header } from "@/components/Header";
import { PricingTier } from "@/components/pricing/PricingTier";
import { useSubscription } from "@/contexts/SubscriptionContext";

export function Pricing() {
  const { subscriptionStatus } = useSubscription();
  
  const pricingTiers = [
    {
      name: "Resume Creator",
      price: "$7.99",
      tier: "resume_creator",
      description: "Perfect for creating your first resume",
      features: [
        "AI Resume Builder",
        "Try all features once for free (trial)",
        "Multiple resume templates",
        "Export to PDF",
        "ATS-friendly format",
        "Real-time AI suggestions",
      ],
      trialFeatures: ['resume_creator', 'resume_pro', 'career_pro'] as const,
      trialDescription: "Try all features once for free",
    },
    {
      name: "Resume Pro",
      price: "$11.99",
      tier: "resume_pro",
      description: "Advanced resume building and review",
      features: [
        "Everything in Resume Creator",
        "Try all features once for free (trial)",
        "AI Resume Review",
        "Keyword optimization",
        "Detailed feedback",
        "Improvement suggestions",
        "Industry-specific tips",
      ],
      highlighted: true,
      trialFeatures: ['resume_creator', 'resume_pro', 'career_pro'] as const,
      trialDescription: "Try all features once for free",
    },
    {
      name: "Career Pro",
      price: "$14.99",
      tier: "career_pro",
      description: "Complete career document solution",
      features: [
        "Everything in Resume Pro",
        "Try all features once for free (trial)",
        "AI Cover Letter Generator",
        "Multiple cover letter templates",
        "Industry-specific cover letters",
        "Matching resume & cover letter designs",
      ],
      trialFeatures: ['resume_creator', 'resume_pro', 'career_pro'] as const,
      trialDescription: "Try all features once for free",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container px-4 py-16 mx-auto">
        {subscriptionStatus?.tier !== 'free' && (
          <div className="mb-12 p-4 rounded-lg bg-primary/5 border border-primary/10">
            <h2 className="text-xl font-semibold mb-2">Current Subscription</h2>
            <p className="text-muted-foreground">
              You are currently on the {subscriptionStatus?.tier.replace('_', ' ').toUpperCase()} plan.
              {subscriptionStatus?.renewal_date && (
                <span> Your next billing date is {new Date(subscriptionStatus.renewal_date).toLocaleDateString()}.</span>
              )}
            </p>
          </div>
        )}
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">Simple, Transparent Pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your career journey. All plans include a free trial of premium features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingTiers.map((tier) => (
            <PricingTier key={tier.tier} {...tier} />
          ))}
        </div>

        <div className="mt-16 max-w-3xl mx-auto">
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-8 text-center">
            <h3 className="text-xl font-semibold mb-3">Our Pricing Promise</h3>
            <p className="text-muted-foreground">
              We believe in transparent pricing with no hidden fees. All plans include unlimited exports 
              and updates. Not satisfied? Get a full refund within the first 30 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pricing;