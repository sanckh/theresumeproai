import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/config/firebase";
import { Loader2, Wand2 } from "lucide-react";
import { UpgradeDialog } from "./UpgradeDialog";
import { CoverLetterFormProps } from "@/interfaces/coverLetterFormProps";
import { saveCoverLetter } from "@/api/coverLetter";
import { decrementTrialUse } from "@/api/subscription";
import { generateCoverLetterAPI } from "@/api/openai";
import { ParsedResume } from "@/interfaces/parsedResume";
import { parseDocument } from "@/utils/documentParser";
import { Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, Save } from "lucide-react";
import { ResumeContent } from "@/interfaces/resumeContent";
import { analytics } from '../config/firebase';
import { logEvent } from 'firebase/analytics';

const SUPPORTED_FILE_TYPES = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "text/plain": "TXT",
} as const;

export default function CoverLetterForm({ resume }: CoverLetterFormProps) {
  const { canUseFeature, subscriptionStatus } = useSubscription();
  const navigate = useNavigate();
  const { user } = useAuth();
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
          if (!user?.uid) {
            throw new Error("User not authenticated");
          }
          const parsed = await parseDocument(selectedFile, user.uid);
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

  const handleGenerateCoverLetter = async () => {
    if (!user?.uid) {
      toast.error("Please sign in to generate a cover letter");
      return;
    }

    if (analytics) {
      logEvent(analytics, 'generate_cover_letter_clicked', {
        subscription_status: hasCareerProAccess ? 'subscribed' : 'trial',
        has_job_url: Boolean(jobUrl),
        resume_source: resumeSource
      });
    }

    if (!jobDescription) {
      toast.error("Please enter a job description");
      return;
    }

    if (!parsedResume && resumeSource === "upload" && !file) {
      toast.error("Please upload your resume first");
      return;
    }

    // First check if user has the correct subscription
    if (hasCareerProAccess) {
      try {
        setIsGenerating(true);
        const coverLetter = await generateCoverLetterAPI(
          user.uid,
          parsedResume,
          jobDescription,
          jobUrl
        );
        setGeneratedCoverLetter(coverLetter);
        toast.success("Cover letter generated successfully!");
      } catch (error) {
        console.error("Error generating cover letter:", error);
        toast.error("Failed to generate cover letter");
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // If no subscription, check for trials
    if (!subscriptionStatus?.trials?.career_pro?.remaining || 
        subscriptionStatus.trials.career_pro.remaining <= 0) {
      setShowUpgradeDialog(true);
      return;
    }

    // Has trials remaining, try to decrement
    try {
      const success = await decrementTrialUse(user.uid, 'career_pro');
      if (!success) {
        setShowUpgradeDialog(true);
        return;
      }

      setIsGenerating(true);
      const coverLetter = await generateCoverLetterAPI(
        user.uid,
        parsedResume,
        jobDescription,
        jobUrl
      );
      setGeneratedCoverLetter(coverLetter);
      toast.success("Cover letter generated successfully!");
    } catch (error) {
      console.error("Error generating cover letter:", error);
      toast.error("Failed to generate cover letter");
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
            onClick={handleGenerateCoverLetter}
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
