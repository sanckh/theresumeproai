import { Header } from "@/components/Header";
import { Templates as TemplateGrid } from "@/components/Templates";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Templates = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Resume Templates</h1>
            <Button 
              size="lg"
              onClick={() => navigate("/builder")}
              className="bg-primary hover:bg-primary/90"
            >
              Build Your Resume
            </Button>
          </div>
          <p className="text-gray-600 mb-8">
            Browse our collection of professional, ATS-friendly resume templates. 
            Each template is designed to help you stand out while ensuring your resume gets past applicant tracking systems.
          </p>
          
          <TemplateGrid showTemplateNames={true} />
        </div>
      </main>
    </div>
  );
};

export default Templates;