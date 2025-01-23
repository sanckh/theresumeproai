import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { analyzeResumeAPI } from "@/api/openai";
import { ResumeContent } from "@/interfaces/resumeContent";
import { parseDocument } from "@/utils/documentParser";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";
import { decrementTrialUse } from "@/api/subscription";
import { useAuth } from "@/contexts/AuthContext";
import { UpgradeDialog } from "./UpgradeDialog";
import { ResumeAnalysis } from "@/interfaces/resumeAnalysis";
import { ResumeReviewProps } from "@/interfaces/resumeReviewProps";
import { analytics } from '../config/firebase';
import { logEvent } from 'firebase/analytics';
import { FileUp, Save } from "lucide-react";

const SUPPORTED_FILE_TYPES = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "text/plain": "TXT",
} as const;

export const ResumeReview = ({ savedResume }: ResumeReviewProps) => {
  const { canUseFeature, hasSubscriptionAccess, subscriptionStatus, refreshSubscription } = useSubscription();
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasResumeProAccess = canUseFeature('resume_pro');
  const hasCareerProAccess = canUseFeature('career_pro');
  const hasSubscriptionResumeAccess = hasSubscriptionAccess('resume_pro');
  const hasSubscriptionCareerAccess = hasSubscriptionAccess('career_pro');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsedResume, setParsedResume] = useState<ResumeContent | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [shouldAnalyze, setShouldAnalyze] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [resumeSource, setResumeSource] = useState<"upload" | "saved">(savedResume ? "saved" : "upload");

  useEffect(() => {
    if (savedResume) {
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      const parsed: ResumeContent = {
        fullName: savedResume.data.fullName,
        email: savedResume.data.email,
        phone: savedResume.data.phone,
        summary: savedResume.data.summary,
        jobs: savedResume.data.jobs,
        education: savedResume.data.education,
        skills: savedResume.data.skills
      };
      setParsedResume(parsed);
      setShouldAnalyze(false);
      setAnalysis(null);
    }
  }, [savedResume]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type in SUPPORTED_FILE_TYPES) {
        try {
          setIsUploading(true);
          setFile(selectedFile);
          setShouldAnalyze(false); 
          setAnalysis(null);
          if (!user?.uid) {
            throw new Error("User not authenticated");
          }
          const parsed = await parseDocument(selectedFile, user.uid);
          setParsedResume(parsed);

          toast.success(`${selectedFile.name} uploaded successfully!`);
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
        e.target.value = "";
      }
    }
  };

  const handleAnalyzeResume = async () => {
    if (!user?.uid) {
      toast.error("Please sign in to analyze your resume");
      return;
    }

    if (analytics) {
      const subscription_type = subscriptionStatus?.tier || 'FREE';
      logEvent(analytics, 'analyze_resume_clicked', {
        subscription_type,
        source: savedResume ? 'saved_resume' : 'uploaded_file',
        file_type: file?.type
      });
    }

    if (hasResumeProAccess || hasCareerProAccess) {
      if (!hasSubscriptionResumeAccess && !hasSubscriptionCareerAccess) {
        if (!subscriptionStatus?.trials?.resume_pro?.remaining || 
            subscriptionStatus.trials.resume_pro.remaining <= 0) {
          setShowUpgradeDialog(true);
          return;
        }

        try {
          await decrementTrialUse(user.uid, 'resume_pro');
          await refreshSubscription();
        } catch (error) {
          console.error("Error decrementing trial:", error);
          toast.error("Failed to use trial");
          return;
        }
      }

      try {
        setShouldAnalyze(true);
        const result = await analyzeResumeAPI(user.uid, parsedResume);
        setAnalysis(result);
        await refreshSubscription();
        toast.success("Resume analysis completed!");
      } catch (error) {
        console.error("Error analyzing resume:", error);
        toast.error("Failed to analyze resume");
      } finally {
        setShouldAnalyze(false);
      }
      return;
    }

    if (!subscriptionStatus?.trials?.resume_pro?.remaining || 
        subscriptionStatus.trials.resume_pro.remaining <= 0) {
      setShowUpgradeDialog(true);
      return;
    }

    try {
      console.log("Decrementing trial usage...");
      await decrementTrialUse(user.uid, 'resume_pro');
      await refreshSubscription();
      setShouldAnalyze(true);
      const result = await analyzeResumeAPI(user.uid, parsedResume);
      setAnalysis(result);
      toast.success("Resume analysis completed!");
    } catch (error) {
      console.error("Error analyzing resume:", error);
      toast.error("Failed to analyze resume");
    } finally {
      setShouldAnalyze(false);
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
          disabled={!savedResume}
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
                onChange={handleFileChange}
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

      {resumeSource === "saved" && savedResume && (
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="font-medium">Using your saved resume</h3>
            <p className="text-sm text-gray-600">
              We'll analyze the resume you created in the builder.
            </p>
          </div>
        </Card>
      )}

      <Button
        onClick={handleAnalyzeResume}
        className="w-full"
        disabled={isUploading || (!parsedResume && resumeSource === "upload") || shouldAnalyze}
      >
        {shouldAnalyze ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Analyze Resume
          </>
        )}
      </Button>

      {analysis && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">Score:</span>
            <span className="text-lg">{analysis.score}/100</span>
          </div>

          <Alert>
            <AlertDescription>
              <h3 className="font-semibold mb-2">Strengths:</h3>
              <ul className="list-disc pl-4">
                {analysis.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertDescription>
              <h3 className="font-semibold mb-2">Suggestions:</h3>
              <ul className="list-disc pl-4">
                {analysis.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Dialog component */}
      {showUpgradeDialog && (
        <UpgradeDialog
          isOpen={showUpgradeDialog}
          onClose={() => setShowUpgradeDialog(false)}
          feature="resume analysis"
          isTrialExpired={subscriptionStatus?.trials?.resume_pro?.remaining === 0}
        />
      )}
    </div>
  );
};
