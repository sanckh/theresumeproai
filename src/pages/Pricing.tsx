import { Header } from "@/components/Header";
import { PricingTier } from "@/components/pricing/PricingTier";
import { useSubscription } from "@/contexts/SubscriptionContext";

export function Pricing() {
  const { subscriptionStatus } = useSubscription();

  const pricingTiers = [
    {
      name: "Resume Creator",
      price: "$4.99",
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
      trialFeatures: ['creator', 'reviewer', 'cover_letter'] as const,
      trialDescription: "Try all features once for free",
    },
    {
      name: "Resume Pro",
      price: "$9.99",
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
      trialFeatures: ['creator', 'reviewer', 'cover_letter'] as const,
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
      trialFeatures: ['creator', 'reviewer', 'cover_letter'] as const,
      trialDescription: "Try all features once for free",
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
            Start with a free trial. No credit card required.
          </p>
          {/* Debug information */}
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-sm">
            <pre className="whitespace-pre-wrap">
              Has Started Trial: {JSON.stringify(subscriptionStatus?.hasStartedTrial, null, 2)}
            </pre>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier) => (
            <PricingTier key={tier.tier} {...tier} />
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
}

export default Pricing;