import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";

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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            Starting at $7.99/month
          </Badge>
          <h1 className="text-5xl font-bold mb-6">
            Create Your Professional Resume with{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AI Resume Pro
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Build beautiful, ATS-friendly resumes in minutes. Get expert feedback and land your dream job faster.
          </p>
          <div className="space-x-4">
            <Button asChild size="lg">
              <Link to="/pricing">View Pricing Plans</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/builder">Try Builder Demo</Link>
            </Button>
          </div>

        </div>

        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 bg-white rounded-lg shadow-sm border"
            >
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600">
            ✨ Free trial available with our Premium plan. No credit card required.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;