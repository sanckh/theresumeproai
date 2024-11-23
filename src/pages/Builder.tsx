import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ResumeForm } from "@/components/ResumeForm";
import { ResumePreview } from "@/components/ResumePreview";
import { Templates } from "@/components/Templates";
import { ResumeReview } from "@/components/ResumeReview";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { saveResumeToDatabase, loadResumeFromDatabase } from "@/utils/database";

const STORAGE_KEY = "saved_resume";

const Builder = () => {
  const { user } = useAuth();
  const [resumeData, setResumeData] = useState({
    fullName: "",
    email: "",
    phone: "",
    summary: "",
    jobs: [],
    education: "",
    skills: "",
  });

  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [showTemplates, setShowTemplates] = useState(false);

  // Load saved resume data on component mount
  useEffect(() => {
    const loadSavedResume = async () => {
      try {
        if (user?.id) {
          // Try to load from database first
          const dbData = await loadResumeFromDatabase(user.id);
          if (dbData) {
            setResumeData(dbData);
            toast.info("Loaded your resume from cloud storage");
            return;
          }
        }

        // Fallback to localStorage
        const savedResume = localStorage.getItem(STORAGE_KEY);
        if (savedResume) {
          setResumeData(JSON.parse(savedResume));
          toast.info("Loaded your previously saved resume");
        }
      } catch (error) {
        console.error("Error loading resume:", error);
        toast.error("Failed to load resume. Please try again.");
      }
    };

    loadSavedResume();
  }, [user?.id]);

  const handleSave = async () => {
    try {
      // Always save to localStorage as backup
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resumeData));

      if (user?.id) {
        // If user is authenticated, also save to database
        await saveResumeToDatabase(user.id, resumeData);
        toast.success("Resume saved successfully to cloud storage!");
      } else {
        toast.success("Resume saved successfully to browser storage!");
      }
    } catch (error) {
      console.error("Error saving resume:", error);
      toast.error("Failed to save resume. Please try again.");
    }
  };

  const handleDownload = () => {
    toast.success("Download started!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Resume Builder</h1>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => setShowTemplates(!showTemplates)}>
              {showTemplates ? "Hide Templates" : "Choose Template"}
            </Button>
            <Button variant="outline" onClick={handleSave}>
              Save
            </Button>
            <Button onClick={handleDownload}>
              Download PDF
            </Button>
          </div>
        </div>

        {showTemplates && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Choose a Template</h2>
            <Templates
              selectedTemplate={selectedTemplate}
              onSelectTemplate={setSelectedTemplate}
            />
          </div>
        )}

        <Tabs defaultValue="builder" className="space-y-8">
          <TabsList>
            <TabsTrigger value="builder">Resume Builder</TabsTrigger>
            <TabsTrigger value="review">Resume Review</TabsTrigger>
          </TabsList>

          <TabsContent value="builder">
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <ResumeForm onUpdate={setResumeData} />
              </div>
              <div className="lg:sticky lg:top-8 space-y-6">
                <ResumePreview data={resumeData} template={selectedTemplate} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="review">
            <ResumeReview />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Builder;