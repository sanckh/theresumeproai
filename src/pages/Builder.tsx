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
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Save, ChevronDown, Edit2, Loader2, FileText } from "lucide-react";
import { getAllResumes, getResume, saveResume } from "@/api/resume";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResumeData } from "@/interfaces/resumeData";
import { JobEntry } from "@/interfaces/jobEntry";
import { EducationEntry } from "@/interfaces/educationEntry";
import CoverLetterForm from "@/components/CoverLetterForm";
import { ConditionalAd } from "@/components/googleads/ConditionalAd";

const STORAGE_KEY = "saved_resume";

type SavedResume = ResumeData;

const Builder = () => {
  const { user } = useAuth();
  const { canUseFeature, subscriptionStatus } = useSubscription();
  const canCreate = canUseFeature('resume_creator');
  const canReview = canUseFeature('resume_pro');
  const canCoverLetter = canUseFeature('career_pro');
  const navigate = useNavigate();
  const resumeRef = useRef<HTMLDivElement>(null);
  const [resumeData, setResumeData] = useState<ResumeData>({
    id: "",
    user_id: "",
    name: "",
    data: {
      fullName: "",
      email: "",
      phone: "",
      summary: "",
      jobs: [],
      education: [],
      skills: "",
    },
  });

  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [showTemplates, setShowTemplates] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [currentResumeName, setCurrentResumeName] = useState("Untitled Resume");
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!canCreate) {
      navigate('/pricing');
    }
  }, [canCreate, navigate]);

  // Load saved resumes into dropdown but don't auto-select
  useEffect(() => {
    const loadSavedResumes = async () => {
      if (!user?.uid) return;

      try {
        const resumes = await getAllResumes(user.uid);
        // Convert ResumeData[] to SavedResume[] and sort by updated_at
        const savedResumesList: SavedResume[] = resumes
          .map((resume) => ({
            id: resume.id || "",
            user_id: resume.user_id,
            name: resume.name,
            data: resume.data,
            created_at: resume.created_at || new Date().toISOString(),
            updated_at: resume.updated_at || new Date().toISOString(),
          }))
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        setSavedResumes(savedResumesList);
        
        // Automatically load the most recent resume if available
        if (savedResumesList.length > 0) {
          const mostRecent = savedResumesList[0];
          setCurrentResumeId(mostRecent.id);
          setCurrentResumeName(mostRecent.name);
          await loadResume(mostRecent.id);
        }
      } catch (error) {
        console.error("Error loading resumes:", error);
        toast.error("Failed to load saved resumes");
      }
    };

    loadSavedResumes();
  }, [user]);

  // Load local storage resume if no user is logged in
  useEffect(() => {
    if (!user?.uid) {
      const savedResume = localStorage.getItem(STORAGE_KEY);
      if (savedResume) {
        const parsedData = JSON.parse(savedResume);
        setResumeData({
          id: "",
          user_id: "",
          name: parsedData.name || currentResumeName,
          data: parsedData.data || parsedData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (parsedData.name) {
          setCurrentResumeName(parsedData.name);
        }
        toast.info("Loaded your previously saved resume");
      }
    }
  }, [user, currentResumeName]);

  const handleChange = (field: keyof ResumeData['data'], value: unknown) => {
    setResumeData(prev => {
      // Create a new data object with the updated field
      const newData = {
        ...prev.data,
        [field]: value
      };

      // Return the complete ResumeData structure
      return {
        ...prev,
        data: newData,
        updated_at: new Date().toISOString()
      };
    });
  };

  const loadResume = async (id: string) => {
    if (!user) return;

    try {
      const loadedResume = await getResume(user.uid, id);
      if (loadedResume) {
        setResumeData(loadedResume);
      }
    } catch (error) {
      console.error("Error loading resume:", error);
      toast.error("Failed to load resume");
    }
  };

  const handleSaveResume = async () => {
    if (!user?.uid) {
      // Save to local storage if user is not logged in
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...resumeData,
          name: currentResumeName
        }));
        toast.success("Resume saved to browser storage");
      } catch (error) {
        console.error("Error saving to local storage:", error);
        toast.error("Failed to save resume");
      }
      return;
    }

    setIsSaving(true);
    try {
      const resumeId = await saveResume(
        user.uid,
        resumeData.data,
        currentResumeName,
        currentResumeId || undefined
      );

      setCurrentResumeId(resumeId);
      const updatedResumes = await getAllResumes(user.uid);
      // Convert ResumeData[] to SavedResume[]
      const savedResumesList: SavedResume[] = updatedResumes.map((resume) => ({
        id: resume.id || "",
        user_id: resume.user_id,
        name: resume.name,
        data: resume.data,
        created_at: resume.created_at || new Date().toISOString(),
        updated_at: resume.updated_at || new Date().toISOString(),
      }));
      setSavedResumes(savedResumesList);

      toast.success("Resume saved successfully");
    } catch (error) {
      console.error("Error saving resume:", error);
      toast.error("Failed to save resume");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAs = async () => {
    const newName = prompt("Enter a name for this resume:", currentResumeName);
    if (newName) {
      setCurrentResumeName(newName);
      // Reset current resume ID to create a new resume
      setCurrentResumeId(null);
      await handleSaveResume();
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
      const fileName = resumeData.data.fullName
        ? `${resumeData.data.fullName.replace(/\s+/g, "_")}_Resume.pdf`
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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Resume Builder</h1>

          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                {isEditingName ? (
                  <Input
                    value={currentResumeName}
                    onChange={(e) => setCurrentResumeName(e.target.value)}
                    onBlur={() => setIsEditingName(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                    className="w-64"
                    autoFocus
                  />
                ) : (
                  <h1 className="text-3xl font-bold flex items-center gap-2">
                    {currentResumeName}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditingName(true)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </h1>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={handleSaveResume}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {currentResumeId ? currentResumeName : (savedResumes.length > 0 ? "Select Resume" : "Create New")}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {savedResumes.map((resume) => (
                      <DropdownMenuItem
                        key={resume.id}
                        onClick={() => {
                          setCurrentResumeId(resume.id);
                          setCurrentResumeName(resume.name);
                          loadResume(resume.id);
                          toast.info(`Loaded "${resume.name}"`);
                        }}
                      >
                        {resume.name}
                      </DropdownMenuItem>
                    ))}
                    {savedResumes.length > 0 && (
                      <DropdownMenuItem
                        onClick={() => {
                          setCurrentResumeId(null);
                          setCurrentResumeName("Untitled Resume");
                          setResumeData({
                            id: "",
                            user_id: user?.uid || "",
                            name: "Untitled Resume",
                            data: {
                              fullName: "",
                              email: "",
                              phone: "",
                              summary: "",
                              jobs: [],
                              education: [],
                              skills: "",
                            },
                          });
                          toast.info("Created new resume");
                        }}
                      >
                        Create New Resume
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="space-y-6">
              <Tabs defaultValue="builder">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="builder">Resume Builder</TabsTrigger>
                  <TabsTrigger value="review">Resume Review</TabsTrigger>
                  <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
                </TabsList>
                <TabsContent value="builder" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <ResumeForm
                        data={resumeData.data}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-6">
                      <div ref={resumeRef}>
                        <ResumePreview
                          data={resumeData}
                          template={selectedTemplate}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="review">
                  <ResumeReview savedResume={resumeData} />
                </TabsContent>
                <TabsContent value="cover-letter">
                  <CoverLetterForm resume={resumeData} />
                </TabsContent>
              </Tabs>
            </div>
            <section className="mb-8 flex justify-center">
            <ConditionalAd adSlot="7871063844" />
          </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Builder;