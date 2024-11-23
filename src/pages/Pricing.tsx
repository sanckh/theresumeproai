import { Header } from "@/components/Header";
import { PricingTier } from "@/components/pricing/PricingTier";
import { useSubscription } from "@/contexts/SubscriptionContext";

const Pricing = () => {
  const { tier, hasUsedCreatorTrial, hasUsedReviewerTrial } = useSubscription();
  
  const tiers = [
    {
      name: "Free",
      price: "Free",
      description: "Try our basic features",
      features: [
        "1 basic resume template",
        "Download as PDF",
        "Real-time preview",
        "Basic ATS compatibility check",
      ],
    },
    {
      name: "Premium Creator",
      price: "$9.99",
      priceId: "price_premium_creator",
      description: "Perfect for creating resumes",
      features: [
        "All Free features",
        "10+ premium templates",
        "AI-powered content suggestions",
        "Advanced ATS optimization",
        "Unlimited resume versions",
        "Priority support",
      ],
      highlighted: true,
      trialType: "creator" as const,
    },
    {
      name: "Premium Reviewer",
      price: "$9.99",
      priceId: "price_premium_reviewer",
      description: "Perfect for reviewing resumes",
      features: [
        "All Free features",
        "AI-powered resume analysis",
        "Detailed feedback",
        "Improvement suggestions",
        "Industry-specific tips",
        "Priority support",
      ],
      trialType: "reviewer" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold mb-6">
            Choose the Perfect Plan for Your Career Journey
          </h1>
          <p className="text-xl text-gray-600">
            All plans include our core features. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <PricingTier key={tier.name} {...tier} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-secondary/30 p-6 rounded-lg max-w-2xl mx-auto">
            <h3 className="font-semibold mb-2">Our Pricing Promise</h3>
            <p className="text-gray-600">
              We believe in transparent pricing with no hidden fees. All prices include unlimited exports 
              and updates. Not satisfied? Get a full refund within the first 30 days.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;