import { Header } from "@/components/Header";
import { PricingTier } from "@/components/pricing/PricingTier";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Helmet } from "react-helmet-async";

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
    <>
      <Helmet>
        <title>Pricing Plans - The Resume Pro AI</title>
        <meta 
          name="description" 
          content="Choose from our flexible pricing plans starting at $7.99/month. Create professional resumes with AI-powered tools, ATS optimization, and expert feedback." 
        />
        <meta name="keywords" content="resume builder pricing, AI resume pricing, professional resume service cost, resume writing pricing" />
        <link rel="canonical" href="https://theresumeproai.com/pricing" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "PriceSpecification",
            "name": "The Resume Pro AI Pricing",
            "description": "Professional resume building service with AI-powered features",
            "priceRange": "$7.99 - $14.99",
            "offers": pricingTiers.map(tier => ({
              "@type": "Offer",
              "name": tier.name,
              "price": tier.price.replace('$', ''),
              "priceCurrency": "USD",
              "description": tier.description
            }))
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-16 mx-auto" role="main">
          {subscriptionStatus?.tier !== 'free' && (
            <section 
              className="mb-12 p-4 rounded-lg bg-primary/5 border border-primary/10"
              aria-label="Current Subscription Status"
              role="status"
            >
              <h2 className="text-xl font-semibold mb-2">Current Subscription</h2>
              <p className="text-muted-foreground">
                You are currently on the {subscriptionStatus?.tier.replace('_', ' ').toUpperCase()} plan.
                {subscriptionStatus?.renewal_date && (
                  <span> Your next billing date is {new Date(subscriptionStatus.renewal_date).toLocaleDateString()}.</span>
                )}
              </p>
            </section>
          )}
          
          <section className="text-center mb-12" aria-labelledby="pricing-heading">
            <h1 id="pricing-heading" className="text-4xl font-bold tracking-tight">Simple, Transparent Pricing</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your career journey. All plans include a free trial of premium features.
            </p>
          </section>

          <section 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto"
            aria-label="Pricing Plans"
          >
            {pricingTiers.map((tier) => (
              <PricingTier key={tier.tier} {...tier} />
            ))}
          </section>

          <section 
            className="mt-16 max-w-3xl mx-auto"
            aria-labelledby="pricing-promise"
          >
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-8 text-center">
              <h2 id="pricing-promise" className="text-xl font-semibold mb-3">Our Pricing Promise</h2>
              <p className="text-muted-foreground">
                We believe in transparent pricing with no hidden fees. All plans include unlimited exports 
                and updates. Not satisfied? Get a full refund within the first 30 days.
              </p>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

export default Pricing;