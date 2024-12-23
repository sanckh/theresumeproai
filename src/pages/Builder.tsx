import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { ResumeForm } from "@/components/ResumeForm";
import { ResumePreview } from "@/components/ResumePreview";
import { Templates } from "@/components/Templates";
import { ResumeReview } from "@/components/ResumeReview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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
import { useNavigate, useLocation } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResumeData } from "@/interfaces/resumeData";
import { JobEntry } from "@/interfaces/jobEntry";
import { EducationEntry } from "@/interfaces/educationEntry";
import CoverLetterForm from "@/components/CoverLetterForm";
import { ConditionalAd } from "@/components/googleads/ConditionalAd";

const STORAGE_KEY = "saved_resume";

type SavedResume = ResumeData;

const Builder = () => {
  const { user, loading: authLoading } = useAuth();
  const { canUseFeature, subscriptionStatus } = useSubscription();
  const canCreate = canUseFeature("resume_creator");
  const canReview = canUseFeature("resume_pro");
  const canCoverLetter = canUseFeature("career_pro");
  const navigate = useNavigate();
  const location = useLocation();
  const resumeRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
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

  // Handle template selection from /templates page
  useEffect(() => {
    if (location.state?.template) {
      setSelectedTemplate(location.state.template);
      // Only create new resume if coming from templates page
      if (location.pathname === "/templates") {
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
        setCurrentResumeId(null);
        setCurrentResumeName("Untitled Resume");
        toast.success("Created new resume with selected template");
        // Clear the state to prevent recreation on refresh
        navigate(".", { replace: true });
      }
    }
  }, [location]);

  const hasAnyTrialsRemaining =
    (subscriptionStatus?.trials?.resume_creator?.remaining &&
      subscriptionStatus.trials.resume_creator.remaining > 0) ||
    (subscriptionStatus?.trials?.resume_pro?.remaining &&
      subscriptionStatus.trials.resume_pro.remaining > 0) ||
    (subscriptionStatus?.trials?.career_pro?.remaining &&
      subscriptionStatus.trials.career_pro.remaining > 0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (
      !canCreate &&
      !hasAnyTrialsRemaining &&
      subscriptionStatus?.status !== "active"
    ) {
      toast.message("You've used all your trial credits", {
        description:
          "Make sure to save or download your resume before leaving. Visit our pricing page to continue using all features.",
        duration: 15000,
        action: {
          label: "View Plans",
          onClick: () => navigate("/pricing"),
        },
      });
    }
  }, [canCreate, hasAnyTrialsRemaining, subscriptionStatus?.status, navigate]);

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
          .sort(
            (a, b) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime()
          );

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

  const handleChange = (field: keyof ResumeData["data"], value: unknown) => {
    setResumeData((prev) => {
      // Create a new data object with the updated field
      const newData = {
        ...prev.data,
        [field]: value,
      };

      // Return the complete ResumeData structure
      return {
        ...prev,
        data: newData,
        updated_at: new Date().toISOString(),
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
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            ...resumeData,
            name: currentResumeName,
          })
        );
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

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;

    try {
      setIsDownloading(true);

      const canvas = await html2canvas(previewRef.current, {
        scale: 2, // Higher quality
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

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);

      pdf.save(`${currentResumeName || "resume"}.pdf`);
      toast.success("Resume downloaded successfully!");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download resume");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8 relative">
        <div className="max-w-[1600px] mx-auto relative">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Resume Builder</h1>

            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <Input
                      value={currentResumeName}
                      onChange={(e) => setCurrentResumeName(e.target.value)}
                      onBlur={() => setIsEditingName(false)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && setIsEditingName(false)
                      }
                      className="w-64"
                      autoFocus
                    />
                  ) : (
                    <div className="text-xl font-semibold flex items-center gap-2">
                      {currentResumeName}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditingName(true)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    Download PDF
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        {currentResumeId ? (
                          <span className="max-w-[100px] truncate">
                            {currentResumeName}
                          </span>
                        ) : savedResumes.length > 0 ? (
                          "Select Resume"
                        ) : (
                          "Create New"
                        )}
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
                  <TabsList className="grid w-full grid-cols-3 sm:grid-cols-3">
                    <TabsTrigger
                      value="builder"
                      className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4"
                    >
                      <span className="hidden sm:inline">Resume </span>Builder
                    </TabsTrigger>
                    <TabsTrigger
                      value="review"
                      className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4"
                    >
                      <span className="hidden sm:inline">Resume </span>Review
                    </TabsTrigger>
                    <TabsTrigger
                      value="cover-letter"
                      className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4"
                    >
                      Cover Letter
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent
                    value="builder"
                    className="max-w-[1400px] mx-auto"
                  >
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                      <p className="text-blue-700">
                        For the best experience, we recommend using the resume
                        builder on a desktop or laptop computer.
                      </p>
                    </div>
                    <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,_1fr)_400px] gap-6">
                      <div className="w-full min-w-0">
                        <div className="space-y-4">
                          {showTemplates ? (
                            <>
                              <Templates
                                selectedTemplate={selectedTemplate}
                                onSelectTemplate={(templateId) => {
                                  setSelectedTemplate(templateId);
                                  setShowTemplates(false);
                                }}
                              />
                              <div className="flex justify-end">
                                <Button
                                  onClick={() => setShowTemplates(false)}
                                  className="mr-2"
                                  variant="outline"
                                >
                                  Cancel
                                </Button>
                                <Button onClick={() => setShowTemplates(false)}>
                                  Continue with Selected Template
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between items-center mb-4">
                                <Button
                                  variant="outline"
                                  onClick={() => setShowTemplates(true)}
                                >
                                  Change Template
                                </Button>
                              </div>
                              <ResumeForm
                                data={resumeData.data}
                                onChange={handleChange}
                              />
                            </>
                          )}
                        </div>
                      </div>
                      <div ref={previewRef} className="w-full lg:w-[400px]">
                        <ResumePreview
                          data={resumeData}
                          template={selectedTemplate}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent
                    value="review"
                    className="max-w-[1400px] mx-auto"
                  >
                    <ResumeReview savedResume={resumeData} />
                  </TabsContent>
                  <TabsContent
                    value="cover-letter"
                    className="max-w-[1400px] mx-auto"
                  >
                    <CoverLetterForm resume={resumeData} />
                  </TabsContent>
                </Tabs>
              </div>
              <section className="mb-8 flex justify-center">
                <ConditionalAd adSlot="7871063844" />
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Builder;
