import { useState } from "react";
import { Header } from "@/components/Header";
import { Templates as TemplateGrid } from "@/components/Templates";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ConditionalAd } from "@/components/googleads/ConditionalAd";

const Templates = () => {
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate("/builder", { state: { template: selectedTemplate } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Choose Your Template</h1>
          <p className="text-gray-600 mb-8">
            Select a template that best suits your professional style. All our templates
            are designed to be ATS-friendly and fully customizable.
          </p>
          
          <TemplateGrid
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
          />

          <div className="mt-8 flex justify-end">
            <Button onClick={handleContinue} size="lg">
              Continue with Selected Template
            </Button>
          </div>
          <section className="mb-8 flex justify-center">
            <ConditionalAd adSlot="3368712053" />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Templates;