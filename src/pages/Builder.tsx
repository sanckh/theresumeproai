import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { ResumeForm } from "@/components/ResumeForm";
import { ResumePreview } from "@/components/ResumePreview";
import { Templates } from "@/components/Templates";
import { ResumeReview } from "@/components/ResumeReview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { saveResumeToDatabase, loadResumeFromDatabase, getAllResumes } from "@/utils/database";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Save, ChevronDown } from "lucide-react";

const STORAGE_KEY = "saved_resume";

interface SavedResume {
  id: string;
  name: string;
  data: {
    fullName: string;
    email: string;
    phone: string;
    summary: string;
    jobs: {
      title: string;
      company: string;
      startDate: string;
      endDate: string;
      description: string;
      location?: string;
    }[];
    education: string;
    skills: string;
  };
  updated_at: string;
}

const Builder = () => {
  const { user } = useAuth();
  const resumeRef = useRef<HTMLDivElement>(null);
  const [resumeData, setResumeData] = useState<SavedResume["data"]>({
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [currentResumeName, setCurrentResumeName] = useState("Untitled Resume");

  // Load saved resumes list when user logs in
  useEffect(() => {
    const loadSavedResumes = async () => {
      if (user?.uid) {
        try {
          const resumes = await getAllResumes(user.uid);
          setSavedResumes(resumes);
          
          // Load most recent resume if none is selected
          if (resumes.length > 0 && !currentResumeId) {
            const mostRecent = resumes[0];
            setCurrentResumeId(mostRecent.id);
            setCurrentResumeName(mostRecent.name);
            setResumeData(mostRecent.data);
            toast.info(`Loaded "${mostRecent.name}"`);
          }
        } catch (error) {
          console.error("Error loading resumes:", error);
          toast.error("Failed to load your resumes");
        }
      }
    };

    loadSavedResumes();
  }, [user?.uid]);

  // Load local storage resume if no user is logged in
  useEffect(() => {
    if (!user?.uid) {
      const savedResume = localStorage.getItem(STORAGE_KEY);
      if (savedResume) {
        setResumeData(JSON.parse(savedResume));
        toast.info("Loaded your previously saved resume");
      }
    }
  }, [user?.uid]);

  const handleSave = async (newName?: string) => {
    try {
      setIsSaving(true);
      
      // Always save to localStorage as backup
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resumeData));

      if (user?.uid) {
        // Save to database if user is logged in
        const name = newName || currentResumeName;
        const savedResume = await saveResumeToDatabase(
          user.uid,
          resumeData,
          name,
          currentResumeId
        );

        // Update current resume info
        setCurrentResumeId(savedResume.id);
        setCurrentResumeName(name);

        // Refresh saved resumes list
        const resumes = await getAllResumes(user.uid);
        setSavedResumes(resumes);

        toast.success(`Saved "${name}" to cloud storage!`);
      } else {
        toast.success("Resume saved to browser storage!");
      }
    } catch (error) {
      console.error("Error saving resume:", error);
      toast.error("Failed to save resume. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadResume = async (resumeId: string) => {
    try {
      if (!user?.uid) return;

      const resume = await loadResumeFromDatabase(user.uid, resumeId);
      if (resume) {
        setResumeData(resume.data);
        setCurrentResumeId(resume.id);
        setCurrentResumeName(resume.name);
        toast.success(`Loaded "${resume.name}"`);
      }
    } catch (error) {
      console.error("Error loading resume:", error);
      toast.error("Failed to load resume");
    }
  };

  const handleSaveAs = async () => {
    const name = prompt("Enter a name for this resume:", currentResumeName);
    if (name) {
      setCurrentResumeName(name);
      await handleSave(name);
    }
  };

  const handleDownload = async () => {
    if (!resumeRef.current || isDownloading) return;

    try {
      setIsDownloading(true);
      toast.info("Preparing your PDF...");

      // Create a clone of the resume preview for better PDF generation
      const resumeElement = resumeRef.current;
      const scale = 2; // Increase quality

      const canvas = await html2canvas(resumeElement, {
        scale: scale,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? "portrait" : "landscape",
        unit: "mm",
      });

      pdf.addImage(
        canvas.toDataURL("image/jpeg", 1.0),
        "JPEG",
        0,
        0,
        imgWidth,
        imgHeight
      );

      // Generate filename based on user's name or default
      const fileName = resumeData.fullName
        ? `${resumeData.fullName.replace(/\s+/g, "_")}_Resume.pdf`
        : "Resume.pdf";

      pdf.save(fileName);
      toast.success("Resume downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Resume Builder</h1>
            {user && (
              <div className="text-sm text-gray-500">
                Working on: {currentResumeName}
              </div>
            )}
          </div>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => setShowTemplates(!showTemplates)}>
              {showTemplates ? "Hide Templates" : "Choose Template"}
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save"}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleSave()}>
                    Save
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSaveAs}>
                    Save As...
                  </DropdownMenuItem>
                  {savedResumes.length > 0 && (
                    <>
                      <DropdownMenuItem className="font-semibold" disabled>
                        Open Resume
                      </DropdownMenuItem>
                      {savedResumes.map((resume) => (
                        <DropdownMenuItem
                          key={resume.id}
                          onClick={() => handleLoadResume(resume.id)}
                        >
                          {resume.name}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" onClick={() => handleSave()} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            )}
            
            <Button 
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? "Generating PDF..." : "Download PDF"}
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
                <div ref={resumeRef}>
                  <ResumePreview data={resumeData} template={selectedTemplate} />
                </div>
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