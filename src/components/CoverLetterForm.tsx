import { useState, useEffect, useRef } from "react";
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
import { Loader2, Wand2, Download } from "lucide-react";
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
import { getSubscriptionStatus } from '@/api/subscription';
import { downloadTextAsFile } from "@/utils/downloadUtils";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const SUPPORTED_FILE_TYPES = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "text/plain": "TXT",
} as const;

export default function CoverLetterForm({ resume }: CoverLetterFormProps) {
  const { canUseFeature, hasSubscriptionAccess, subscriptionStatus, refreshSubscription } = useSubscription();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasCareerProAccess = canUseFeature('career_pro');
  const hasAnyTrialsRemaining = (subscriptionStatus?.trials?.resume_creator?.remaining > 0) || 
    (subscriptionStatus?.trials?.resume_pro?.remaining > 0) || 
    (subscriptionStatus?.trials?.career_pro?.remaining > 0);

  const [resumeSource, setResumeSource] = useState<"upload" | "saved">("saved");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

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

  const handleGenerateLetter = async () => {
    if (!user?.uid) {
      toast.error("Please sign in to generate a cover letter");
      return;
    }

    if (analytics) {
      const subscription_type = subscriptionStatus?.tier || 'FREE';
      logEvent(analytics, 'generate_cover_letter_clicked', {
        subscription_type,
        has_job_url: Boolean(jobTitle),
        resume_source: resumeSource
      });
    }

    if (!jobDescription && !jobTitle) {
      toast.error("Please enter either a job description or a job title");
      return;
    }

    if (!parsedResume && resumeSource === "upload" && !file) {
      toast.error("Please upload your resume first");
      return;
    }

    if (hasCareerProAccess) {
      console.log("User has Career Pro access");
      // Only use trial if they don't have subscription access
      if (!hasSubscriptionAccess('career_pro')) {
        console.log("Using trial access...");
        // Check if they have trials remaining first
        if (!subscriptionStatus?.trials?.career_pro?.remaining || 
            subscriptionStatus.trials.career_pro.remaining <= 0) {
          setShowUpgradeDialog(true);
          return;
        }

        try {
          const success = await decrementTrialUse(user.uid, 'career_pro');
          if (!success) {
            setShowUpgradeDialog(true);
            return;
          }
        } catch (error) {
          console.error("Error decrementing trial:", error);
          toast.error("Failed to use trial");
          return;
        }
      }

      try {
        setIsGenerating(true);
        const coverLetter = await generateCoverLetterAPI(
          user.uid,
          parsedResume,
          jobDescription,
          jobTitle
        );
        setGeneratedLetter(coverLetter);
        toast.success("Cover letter generated successfully!");
        await refreshSubscription();
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
        jobTitle
      );
      setGeneratedLetter(coverLetter);
      toast.success("Cover letter generated successfully!");
      await refreshSubscription();
    } catch (error) {
      console.error("Error generating cover letter:", error);
      toast.error("Failed to generate cover letter");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant={resumeSource === "upload" ? "default" : "outline"}
          className="flex-1 gap-2"
          onClick={() => setResumeSource("upload")}
        >
          <FileUp className="h-4 w-4" />
          Upload Resume
        </Button>
        <Button
          variant={resumeSource === "saved" ? "default" : "outline"}
          className="flex-1 gap-2"
          onClick={() => setResumeSource("saved")}
          disabled={!resume}
        >
          <Save className="h-4 w-4" />
          Use Saved Resume
        </Button>
      </div>

      {resumeSource === "upload" && (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, DOC, DOCX, TXT
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={Object.keys(SUPPORTED_FILE_TYPES).join(",")}
                onChange={handleFileUpload}
              />
              {isUploading && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </div>
              )}
              {file && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="flex-1 truncate">{file.name}</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setParsedResume(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {resumeSource === "saved" && resume && (
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="font-medium">Using your saved resume</h3>
            <p className="text-sm text-gray-600">
              We'll use the information from your resume to help generate a matching cover letter.
            </p>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="Enter the company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                placeholder="Enter the job title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the job description here"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="h-32"
              />
            </div>
          </div>
        </Card>

        <Button
          onClick={handleGenerateLetter}
          className="w-full gap-2"
          disabled={!parsedResume || isGenerating || (!companyName && !jobTitle && !jobDescription)}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Generate Cover Letter
            </>
          )}
        </Button>

        {generatedLetter && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Generated Cover Letter</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTextAsFile(generatedLetter, 'cover-letter.txt')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              <Textarea
                value={generatedLetter}
                onChange={(e) => setGeneratedLetter(e.target.value)}
                className="h-96 font-serif"
              />
            </div>
          </Card>
        )}
      </div>

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
