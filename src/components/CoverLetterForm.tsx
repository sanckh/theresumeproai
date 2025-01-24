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
import { Loader2, Wand2, Download, FileText } from "lucide-react";
import { UpgradeDialog } from "./UpgradeDialog";
import { CoverLetterFormProps } from "@/interfaces/coverLetterFormProps";
import { saveCoverLetter } from "@/api/coverLetter";
import { decrementTrialUse } from "@/api/subscription";
import { generateCoverLetterAPI } from "@/api/openai";
import { ResumeContent } from "@/interfaces/resumeContent";
import { parseDocument } from "@/utils/documentParser";
import { Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, Save } from "lucide-react";
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
  const [parsedResume, setParsedResume] = useState<ResumeContent | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  useEffect(() => {
    if (resume) {
      setParsedResume(resume.data);
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
        has_job_description: Boolean(jobDescription),
        resume_source: resumeSource
      });
    }

    if (!jobDescription && !jobTitle) {
      toast.error("Please enter either a job description or job title");
      return;
    }

    if (!parsedResume && resumeSource === "upload" && !file) {
      toast.error("Please upload your resume first");
      return;
    }

    if (hasCareerProAccess) {
      if (!hasSubscriptionAccess('career_pro')) {
        if (!subscriptionStatus?.trials?.career_pro?.remaining || 
            subscriptionStatus.trials.career_pro.remaining <= 0) {
          setShowUpgradeDialog(true);
          return;
        }

        try {
          const success = await decrementTrialUse(user.uid, 'career_pro');
          if (!success) {
            toast.error("Failed to use trial. Please try again.");
            return;
          }
          await refreshSubscription();
        } catch (error) {
          console.error("Error decrementing trial use:", error);
          toast.error("Failed to use trial. Please try again.");
          return;
        }
      }
    } else {
      setShowUpgradeDialog(true);
      return;
    }

    try {
      setIsGenerating(true);
      const letter = await generateCoverLetterAPI(
        user.uid,
        parsedResume!,
        jobDescription || jobTitle,
        ""
      );
      
      if (!letter) {
        throw new Error("No cover letter was generated");
      }
      
      setGeneratedLetter(letter);
      toast.success("Cover letter generated successfully!");
      
      // Scroll to the generated letter
      setTimeout(() => {
        document.getElementById('generated-letter')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error("Error generating cover letter:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate cover letter. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Using your {resumeSource === "upload" ? "uploaded" : "saved"} resume: <span className="font-medium text-foreground">{resumeSource === "upload" ? file?.name : resume?.name || 'Uploaded Resume'}</span>
        </p>
      </div>

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
            <div>
              <Label>Company Name</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
              />
            </div>

            <div>
              <Label>Job Title</Label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Enter the job title"
              />
            </div>

            <div>
              <Label>Job Description</Label>
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here"
                rows={5}
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
          <Card className="p-6" id="generated-letter">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Generated Cover Letter</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLetter);
                      toast.success("Copied to clipboard!");
                    }}
                  >
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadTextAsFile(generatedLetter, 'cover-letter.txt')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              <Textarea
                value={generatedLetter}
                onChange={(e) => setGeneratedLetter(e.target.value)}
                className="h-96 font-serif whitespace-pre-wrap"
                readOnly
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
