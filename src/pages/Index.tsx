import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";

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
  return (
    <>
      <Helmet>
        <title>The Resume Pro AI - Professional Resume Builder</title>
        <meta name="description" content="Create professional, ATS-optimized resumes with AI. Our advanced AI technology helps you craft compelling resumes tailored to your industry." />
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
                AI Resume Pro
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Build beautiful, ATS-friendly resumes in minutes. Get expert feedback and land your dream job faster.
            </p>
            <div className="cta-buttons space-x-4">
              <Button asChild size="lg">
                <Link to="/pricing" aria-label="View our pricing plans">View Pricing Plans</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/builder" aria-label="Try our resume builder demo">Try Builder Demo</Link>
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

          <section className="trial-info mt-16 text-center" aria-label="Trial Information">
            <p className="text-gray-600">
              <span role="img" aria-label="sparkles">✨</span> Free trial available with our Premium plan. No credit card required.
            </p>
          </section>
        </main>
      </div>
    </>
  );
};

export default Index;