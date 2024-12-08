import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";
import { auth } from "@/config/firebase";
import { Loader2, Wand2 } from "lucide-react";
import { UpgradeDialog } from "./UpgradeDialog";
import { CoverLetterFormProps } from "@/interfaces/coverLetterFormProps";
import { saveCoverLetter } from "@/api/coverLetter";
import { decrementTrialUse } from "@/api/subscription";
import { generateCoverLetterWithAI, ParsedResume } from "@/utils/openai";
import { parseDocument } from "@/utils/documentParser";
import { Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, Save } from "lucide-react";
import { ResumeContent } from "@/interfaces/resumeContent";

const SUPPORTED_FILE_TYPES = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "text/plain": "TXT",
} as const;

export const CoverLetterForm = ({ resume }: CoverLetterFormProps) => {
  const { canUseFeature, subscriptionStatus } = useSubscription();
  const navigate = useNavigate();
  const hasCareerProAccess = canUseFeature('career_pro');

  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeSource, setResumeSource] = useState<"upload" | "saved">(resume ? "saved" : "upload");
  
  useEffect(() => {
    if ( !hasCareerProAccess) {
      navigate('/pricing');
    }
  }, [hasCareerProAccess, navigate]);

  useEffect(() => {
    if (resume) {
      const parsed: ParsedResume = {
        sections: {
          "Personal Information": `${resume.data.fullName}\n${resume.data.email}\n${resume.data.phone}`,
          "Summary": resume.data.summary,
          "Experience": resume.data.jobs.map(job => 
            `${job.title} at ${job.company}\n${job.description || ''}\n${job.duties?.join('\n') || ''}`
          ).join('\n\n'),
          "Education": resume.data.education.map(edu =>
            `${edu.degree} at ${edu.institution}\n${edu.startDate} - ${edu.endDate}`
          ).join('\n\n'),
          "Skills": resume.data.skills
        },
        metadata: {
          totalSections: 5,
          sectionsList: ["Personal Information", "Summary", "Experience", "Education", "Skills"]
        }
      };
      setParsedResume(parsed);
    }
  }, [resume]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type in SUPPORTED_FILE_TYPES) {
        try {
          setIsUploading(true);
          setFile(selectedFile);
          const parsed = await parseDocument(selectedFile);
          setParsedResume(parsed);

          toast.success(`${selectedFile.name} uploaded successfully!`);
          setResumeSource("upload");
        } catch (error) {
          console.error("Error parsing document:", error);
          toast.error("Error parsing document. Please try again.");
          setFile(null);
          setParsedResume(null);
        } finally {
          setIsUploading(false);
        }
      } else {
        toast.error(
          `Unsupported file type. Please upload a ${Object.values(
            SUPPORTED_FILE_TYPES
          ).join(", ")} file.`
        );
        event.target.value = "";
      }
    }
  };

  const handleGenerate = async () => {
    const userId = auth.currentUser?.uid;
    const activeResume = resumeSource === "upload" ? parsedResume : resume?.data;

    if (!activeResume) {
      toast.error(resumeSource === "upload" 
        ? "Please upload a resume first" 
        : "Please select a saved resume first"
      );
      return;
    }

    if (!hasCareerProAccess) {
      setShowUpgradeDialog(true);
      return;
    }

    if (!jobDescription && !jobUrl) {
      toast.error("Please provide either a job description or URL");
      return;
    }

    try {
      setIsGenerating(true);
      toast.info("Generating your cover letter...");

      // Decrement trial use if applicable
      if (!hasCareerProAccess && subscriptionStatus?.trials?.career_pro?.remaining > 0) {
        await decrementTrialUse(userId, 'career_pro');
      }

      const coverLetter = await generateCoverLetterWithAI(
        activeResume,
        jobDescription,
        jobUrl
      );
      setGeneratedCoverLetter(coverLetter);
      
      if (coverLetter) {
        await saveCoverLetter({
          resumeId: resumeSource === "saved" ? resume?.id || 'uploaded' : 'uploaded',
          content: coverLetter,
          jobDescription,
          jobUrl
        });
        toast.success("Cover letter generated and saved successfully!");
      }
    } catch (error) {
      console.error("Error generating cover letter:", error);
      toast.error("Failed to generate cover letter. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Card className="p-6 space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-blue-700">
            Create a tailored cover letter by providing your resume and job details. You can either upload a new resume or use one of your saved resumes. 
            Our AI will analyze the job requirements and your experience to generate a compelling cover letter that highlights your relevant qualifications.
          </p>
        </div>

        <div className="grid gap-6">
          <Tabs value={resumeSource} onValueChange={(value) => setResumeSource(value as "upload" | "saved")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <FileUp className="h-4 w-4" />
                Upload Resume
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Use Saved Resume
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="mt-4">
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                {isUploading && (
                  <Alert className="mt-4">
                    <AlertDescription>
                      Processing your resume... This may take a few moments.
                    </AlertDescription>
                  </Alert>
                )}
              </Card>
            </TabsContent>
            
            <TabsContent value="saved" className="mt-4">
              <Card className="p-4">
                {resume ? (
                  <Alert>
                    <AlertDescription>
                      Using saved resume: {resume.name}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertDescription>
                      No resume selected. Please select a resume from the dropdown in the top menu.
                    </AlertDescription>
                  </Alert>
                )}
              </Card>
            </TabsContent>
          </Tabs>

          <div className="grid w-full gap-4">
            <div className="space-y-4">
              <div>
                <Label>Job Description</Label>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here"
                />
              </div>
              <div className="text-center font-medium">OR</div>
              <div>
                <Label>Job URL</Label>
                <Input
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="Enter the job posting URL"
                />
              </div>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            className="w-full"
            disabled={isGenerating || isUploading || (!parsedResume && resumeSource === "upload")}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Cover Letter
              </>
            )}
          </Button>
        </div>
      </Card>

      {generatedCoverLetter && (
        <Card className="p-4">
          <div className="space-y-4">
            <Label>Generated Cover Letter</Label>
            <Textarea
              value={generatedCoverLetter}
              onChange={(e) => setGeneratedCoverLetter(e.target.value)}
              className="min-h-[400px]"
            />
          </div>
        </Card>
      )}

      {showUpgradeDialog && (
        <UpgradeDialog
          isOpen={showUpgradeDialog}
          onClose={() => setShowUpgradeDialog(false)}
          feature="cover letter generation"
          isTrialExpired={subscriptionStatus?.trials?.career_pro?.remaining === 0}
        />
      )}
    </div>
  );
};
