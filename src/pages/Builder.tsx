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
import { ModernPDFTemplate, ClassicExecutivePDFTemplate, MinimalPDFTemplate } from "@/components/pdf";
import { pdf } from '@react-pdf/renderer';
import jsPDF from "jspdf";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Save, ChevronDown, Edit2, Loader2, FileText, Trash2 } from "lucide-react";
import { getAllResumes, getResume, saveResume, deleteResume } from "@/api/resume";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResumeData } from "@/interfaces/resumeData";
import { JobEntry } from "@/interfaces/jobEntry";
import { EducationEntry } from "@/interfaces/educationEntry";
import CoverLetterForm from "@/components/CoverLetterForm";
import { parseDocument } from "@/utils/documentParser";
import { ResumeContent } from "@/interfaces/resumeContent";

const STORAGE_KEY = "saved_resume";

type SavedResume = ResumeData;

const Builder = () => {
  const { user, loading: authLoading } = useAuth();
  const { canUseFeature, subscriptionStatus, loading: subscriptionLoading } = useSubscription();
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
  const [isUploading, setIsUploading] = useState(false);

  const SUPPORTED_FILE_TYPES = {
    "application/pdf": "PDF",
    "application/msword": "DOC",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
    "text/plain": "TXT",
  } as const;

  useEffect(() => {
    if (location.state?.template) {
      setSelectedTemplate(location.state.template);
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
  }, [user?.uid, authLoading, navigate]);

  useEffect(() => {
    const hasNoFeatureAccess = !canCreate && !canReview && !canCoverLetter;

    if (
      !subscriptionLoading &&
      subscriptionStatus &&
      hasNoFeatureAccess &&
      !hasAnyTrialsRemaining &&
      subscriptionStatus.status !== "active" &&
      subscriptionStatus.hasStartedTrial // Changed to show only if they HAVE started a trial
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
  }, [canCreate, canReview, canCoverLetter, hasAnyTrialsRemaining, subscriptionStatus, navigate, subscriptionLoading]);

  useEffect(() => {
    const loadSavedResumes = async () => {
      if (!user?.uid) return;

      try {
        const resumes = await getAllResumes(user.uid);
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
  }, [user?.uid]);

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
  }, [user?.uid, currentResumeName]);

  const handleChange = (field: keyof ResumeData["data"], value: unknown) => {
    setResumeData((prev) => {
      const newData = {
        ...prev.data,
        [field]: value,
      };
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
      const originalResume = savedResumes.find(resume => resume.id === currentResumeId);
      const isNewName = originalResume && originalResume.name !== currentResumeName;
      
      const saveAsNew = isNewName || !currentResumeId;
      
      const resumeId = await saveResume(
        user.uid,
        resumeData.data,
        currentResumeName,
        saveAsNew ? undefined : currentResumeId
      );

      setCurrentResumeId(resumeId);
      
      const updatedResumes = await getAllResumes(user.uid);
      const savedResumesList: SavedResume[] = updatedResumes.map((resume) => ({
        id: resume.id || "",
        user_id: resume.user_id,
        name: resume.name,
        data: resume.data,
        created_at: resume.created_at || new Date().toISOString(),
        updated_at: resume.updated_at || new Date().toISOString(),
      }));
      setSavedResumes(savedResumesList);

      toast.success(saveAsNew ? "Created new resume" : "Resume updated successfully");
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
      setCurrentResumeId(null);
      await handleSaveResume();
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);

      const TemplateComponent = {
        modern: ModernPDFTemplate,
        classic: ClassicExecutivePDFTemplate,
        minimal: MinimalPDFTemplate,
      }[selectedTemplate];

      const blob = await pdf(
        <TemplateComponent data={resumeData} />
      ).toBlob();

      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentResumeName || "resume"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      toast.success("Resume downloaded successfully!");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download resume");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user?.uid) {
      toast.error("Please sign in to upload a resume");
      return;
    }

    if (!(file.type in SUPPORTED_FILE_TYPES)) {
      toast.error(`Unsupported file type. Please upload a ${Object.values(SUPPORTED_FILE_TYPES).join(", ")} file.`);
      return;
    }

    setIsUploading(true);
    toast.info(
      "Please be patient while we process your resume. We use advanced AI models for the best results, which may take a moment.",
      { duration: 8000 }
    );

    try {
      setCurrentResumeId(null);
      setResumeData({
        id: "",
        user_id: user!.uid,
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

      const parsedResume = await parseDocument(file, user!.uid);
      
      console.log("Raw parsed resume:", parsedResume);

      // Map the parsed resume data directly to our interface
      const mappedData: ResumeContent = {
        fullName: parsedResume.fullName || "",
        email: parsedResume.email || "",
        phone: parsedResume.phone || "",
        summary: parsedResume.summary || "",
        jobs: parsedResume.jobs || [],
        education: parsedResume.education || [],
        skills: parsedResume.skills || ""
      };

      console.log("Final mapped resume data:", mappedData);

      setResumeData({
        id: "",
        user_id: user!.uid,
        name: file.name.replace(/\.[^/.]+$/, ""),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        data: mappedData
      });
      setCurrentResumeName(file.name.replace(/\.[^/.]+$/, ""));
      toast.success("Resume uploaded successfully!");
      
      // Show beta warning toast
      toast.info(
        "Resume upload to builder is in beta. Some manual adjustments may be needed for the best results.", 
        { duration: 6000 } // Show for 6 seconds
      );
    } catch (error) {
      console.error("Error uploading resume:", error);
      toast.error("Failed to upload resume. Please try again.");
    } finally {
      setIsUploading(false);
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
                      onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
                      className="w-48"
                      autoFocus
                    />
                  ) : (
                    <h1
                      className="text-2xl font-semibold cursor-pointer"
                      onClick={() => setIsEditingName(true)}
                    >
                      {currentResumeName}
                    </h1>
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
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("resume-upload")?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Upload Resume
                        </>
                      )}
                    </Button>
                    <Badge 
                      variant="default" 
                      className="absolute -top-2 -right-2 bg-blue-500 hover:bg-blue-600"
                    >
                      New!
                    </Badge>
                    <input
                      type="file"
                      id="resume-upload"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
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
                          className="flex items-center justify-between"
                        >
                          <span
                            className="flex-1 cursor-pointer"
                            onClick={() => {
                              setCurrentResumeId(resume.id);
                              setCurrentResumeName(resume.name);
                              loadResume(resume.id);
                              toast.info(`Loaded "${resume.name}"`);
                            }}
                          >
                            {resume.name}
                          </span>
                          <Trash2
                            className="h-4 w-4 text-red-500 hover:text-red-700 cursor-pointer ml-2"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to delete "${resume.name}"?`)) {
                                try {
                                  await deleteResume(user!.uid, resume.id);
                                  
                                  // If we're currently viewing this resume, clear it
                                  if (currentResumeId === resume.id) {
                                    setCurrentResumeId(null);
                                    setCurrentResumeName("Untitled Resume");
                                    setResumeData({
                                      id: "",
                                      user_id: user!.uid,
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
                                  }
                                  
                                  // Refresh the resumes list
                                  const updatedResumes = await getAllResumes(user!.uid);
                                  setSavedResumes(updatedResumes);
                                  toast.success(`Deleted "${resume.name}"`);
                                } catch (error) {
                                  console.error("Error deleting resume:", error);
                                  toast.error("Failed to delete resume");
                                }
                              }
                            }}
                          />
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
                    <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,_1fr)_400px] xl:grid-cols-[minmax(0,_1fr)_600px] gap-6">
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
                                showTemplateNames
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
                      <div ref={previewRef} className="w-full lg:w-[400px] xl:w-[600px]">
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Builder;
