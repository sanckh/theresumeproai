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
import { Save, ChevronDown, Edit2 } from "lucide-react";
import { getAllResumes, getResume, saveResume } from "@/api/resume";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResumeData } from "@/interfaces/resumeData";
import { JobEntry } from "@/interfaces/jobEntry";
import { EducationEntry } from "@/interfaces/educationEntry";

const STORAGE_KEY = "saved_resume";

type SavedResume = ResumeData;

const Builder = () => {
  const { user } = useAuth();
  const { canUseFeature, subscriptionStatus } = useSubscription();
  const canCreate = canUseFeature('resume_creator');
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

  // If user is not signed in, redirect to sign in page
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

  // Load saved resumes list when user logs in
  useEffect(() => {
    const loadSavedResumes = async () => {
      if (!user?.uid) return; // Don't load resumes if no user

      try {
        const resumes = await getAllResumes(user.uid);
        // Convert ResumeData[] to SavedResume[]
        const savedResumesList: SavedResume[] = resumes.map((resume) => ({
          id: resume.id || "",
          user_id: resume.user_id,
          name: resume.name,
          data: resume.data,
          created_at: resume.created_at || new Date().toISOString(),
          updated_at: resume.updated_at || new Date().toISOString(),
        }));
        setSavedResumes(savedResumesList);

        // Load most recent resume if none is selected
        if (savedResumesList.length > 0 && !currentResumeId) {
          const mostRecent = savedResumesList[0];
          setCurrentResumeId(mostRecent.id);
          setCurrentResumeName(mostRecent.name);
          setResumeData({
            id: mostRecent.id,
            user_id: mostRecent.user_id,
            name: mostRecent.name,
            data: mostRecent.data,
            created_at: mostRecent.created_at,
            updated_at: mostRecent.updated_at,
          });
          toast.info(`Loaded "${mostRecent.name}"`);
        }
      } catch (error) {
        console.error("Error loading resumes:", error);
        toast.error("Failed to load saved resumes");
      }
    };

    loadSavedResumes();
  }, [user, currentResumeId]);

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

  const handleChange = (field: string, value: unknown) => {
    setResumeData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value
      }
    }));
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
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Resume Builder</h1>
            {user && (
              <div className="text-sm text-gray-500 flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border hover:border-gray-400 transition-colors">
                <span className="font-medium">Working on:</span>
                {isEditingName ? (
                  <Input
                    className="w-48 h-8 inline-block"
                    value={currentResumeName}
                    onChange={(e) => setCurrentResumeName(e.target.value)}
                    onBlur={async () => {
                      setIsEditingName(false);
                      if (user?.uid) {
                        await handleSaveResume();
                      }
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        setIsEditingName(false);
                        if (user?.uid) {
                          await handleSaveResume();
                        }
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <div
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => setIsEditingName(true)}
                  >
                    <span className="font-medium text-gray-900">
                      {currentResumeName}
                    </span>
                    <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                )}
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
                  <DropdownMenuItem onClick={() => handleSaveResume()}>
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
                          onClick={() => loadResume(resume.id)}
                        >
                          {resume.name}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                onClick={() => handleSaveResume()}
                disabled={isSaving}
              >
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
                <ResumeForm
                  data={resumeData.data}
                  onChange={handleChange}
                />
              </div>
              <div className="lg:sticky lg:top-8 space-y-6">
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
            <ResumeReview />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Builder;