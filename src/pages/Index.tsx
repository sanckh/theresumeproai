import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";
import { useEffect } from "react";
import { trackPageView } from "@/utils/analytics";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";

const features = [
  {
    title: "AI-Powered Resume Builder",
    description: "Create professional resumes with smart suggestions and real-time feedback.",
  },
  {
    title: "Resume Review",
    description: "Get instant AI feedback on your existing resume to improve your chances of landing interviews.",
  },
  {
    title: "ATS-Friendly Templates",
    description: "Choose from multiple templates designed to pass Applicant Tracking Systems.",
  },
  {
    title: "Easy Export",
    description: "Download your resume in PDF format, ready to send to employers.",
  },
];

const Index = () => {
  useEffect(() => {
    trackPageView('Index', '/');
  }, []);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { startTrial, subscriptionStatus, refreshSubscription } = useSubscription();

  const handleStartTrial = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      if (!subscriptionStatus?.hasStartedTrial) {
        await startTrial();
        await refreshSubscription();
        toast.success("Trial started! You now have access to all premium features.");
        navigate('/builder');
      } else {
        navigate('/pricing');
      }
    } catch (error) {
      console.error("Error starting trial:", error);
      toast.error("Failed to start trial");
    }
  };

  return (
    <>
      <Helmet>
        <title>The Resume Pro AI - Professional Resume Builder with AI</title>
        <meta 
          name="description" 
          content="Create professional, ATS-optimized resumes with AI technology. Our advanced resume builder helps you craft compelling resumes tailored to your industry." 
        />
        <meta name="keywords" content="AI resume builder, professional resume creator, ATS-friendly resume, career tools, job application helper" />
        <link rel="canonical" href="https://theresumeproai.com" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://theresumeproai.com" />
        <meta property="og:title" content="The Resume Pro AI - Professional Resume Builder" />
        <meta property="og:description" content="Create professional, ATS-optimized resumes with AI technology. Get hired faster with our advanced resume builder." />
        <meta property="og:image" content="https://theresumeproai.com/og-image.jpg" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://theresumeproai.com" />
        <meta name="twitter:title" content="The Resume Pro AI - Professional Resume Builder" />
        <meta name="twitter:description" content="Create professional, ATS-optimized resumes with AI technology. Get hired faster with our advanced resume builder." />
        <meta name="twitter:image" content="https://theresumeproai.com/og-image.jpg" />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "The Resume Pro AI",
            "description": "Professional AI-powered resume builder",
            "url": "https://theresumeproai.com",
            "applicationCategory": "Resume Builder",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "7.99",
              "priceCurrency": "USD",
              "priceValidUntil": "2024-12-31"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "150"
            },
            "featureList": features.map(feature => feature.title)
          })}
        </script>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <Header />
        
        <main className="container mx-auto px-4 py-16" role="main">
          <section className="hero-section text-center max-w-3xl mx-auto" aria-labelledby="hero-heading">
            <Badge variant="secondary" className="mb-4">
              Starting at $7.99/month
            </Badge>
            <h1 id="hero-heading" className="text-5xl font-bold mb-6">
              Create Your Professional Resume with{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Resume Pro AI
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Build beautiful, ATS-friendly resumes in minutes. Get expert feedback and land your dream job faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              {(!user || !subscriptionStatus?.hasStartedTrial) && (
                <Button size="lg" onClick={handleStartTrial} className="w-full sm:w-auto">
                  {!user ? "Sign In to Start Free Trial" : "Start Free Trial"}
                </Button>
              )}
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </section>

          <section className="features mt-16" aria-labelledby="features-heading">
            <h2 id="features-heading" className="sr-only">Our Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="feature-card p-6 bg-white rounded-lg shadow-sm border"
                >
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="newsletter-section mt-16 text-center max-w-2xl mx-auto" aria-labelledby="newsletter-heading">
            <h2 id="newsletter-heading" className="text-2xl font-semibold mb-4">
              Stay Updated
            </h2>
            <p className="text-gray-600 mb-6">
              Get the latest career tips, resume strategies, and job search advice delivered to your inbox. Plus, stay informed about new features and updates on TheResumePro AI.
            </p>
            <div className="flex justify-center">
              <NewsletterSignup />
            </div>
          </section>

          <section className="trial-info mt-16 text-center" aria-label="Trial Information">
            <p className="text-gray-600">
              <span role="img" aria-label="sparkles">✨</span> Free trial available with no credit card required.
            </p>
          </section>
        </main>
      </div>
    </>
  );
};

export default Index;