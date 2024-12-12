import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { analyzeResumeAPI } from "@/api/openai";
import { ParsedResume } from "@/interfaces/parsedResume";
import { parseDocument } from "@/utils/documentParser";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";
import { decrementTrialUse } from "@/api/subscription";
import { useAuth } from "@/contexts/AuthContext";
import { UpgradeDialog } from "./UpgradeDialog";
import { ResumeData } from "@/interfaces/resumeData";
import { ResumeAnalysis } from "@/interfaces/resumeAnalysis";
import { ResumeReviewProps } from "@/interfaces/resumeReviewProps";

const SUPPORTED_FILE_TYPES = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "text/plain": "TXT",
} as const;

export const ResumeReview = ({ savedResume }: ResumeReviewProps) => {
  const { canUseFeature, subscriptionStatus } = useSubscription();
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasResumeProAccess = canUseFeature('resume_pro');
  const hasCareerProAccess = canUseFeature('career_pro');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hasResumeProAccess && !hasCareerProAccess) {
      navigate('/pricing');
    }
  }, [hasResumeProAccess, hasCareerProAccess, navigate]);

  const [file, setFile] = useState<File | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [shouldAnalyze, setShouldAnalyze] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);

  useEffect(() => {
    if (savedResume) {
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      const parsed: ParsedResume = {
        sections: {
          "Personal Information": `${savedResume.data.fullName}\n${savedResume.data.email}\n${savedResume.data.phone}`,
          "Summary": savedResume.data.summary,
          "Experience": savedResume.data.jobs.map(job => 
            `${job.title} at ${job.company}\n${job.description || ''}\n${job.duties?.join('\n') || ''}`
          ).join('\n\n'),
          "Education": savedResume.data.education.map(edu =>
            `${edu.degree} at ${edu.institution}\n${edu.startDate} - ${edu.endDate}`
          ).join('\n\n'),
          "Skills": savedResume.data.skills
        },
        metadata: {
          totalSections: 5,
          sectionsList: ["Personal Information", "Summary", "Experience", "Education", "Skills"]
        }
      };
      setParsedResume(parsed);
      setShouldAnalyze(false);
      setAnalysis(null);
      toast.info(`Resume "${savedResume.name}" loaded successfully`);
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

    if (hasResumeProAccess || hasCareerProAccess) {
      try {
        setShouldAnalyze(true);
        const result = await analyzeResumeAPI(user.uid, parsedResume);
        setAnalysis(result);
        toast.success("Resume analysis completed!");
      } catch (error) {
        console.error("Error analyzing resume:", error);
        toast.error("Failed to analyze resume");
      }
      return;
    }

    if (!subscriptionStatus?.trials?.resume_pro?.remaining || 
        subscriptionStatus.trials.resume_pro.remaining <= 0) {
      setShowUpgradeDialog(true);
      return;
    }

    try {
      const success = await decrementTrialUse(user.uid, 'resume_pro');
      if (!success) {
        setShowUpgradeDialog(true);
        return;
      }

      setShouldAnalyze(true);
      const result = await analyzeResumeAPI(user.uid, parsedResume);
      setAnalysis(result);
      toast.success("Resume analysis completed!");
    } catch (error) {
      console.error("Error analyzing resume:", error);
      toast.error("Failed to analyze resume");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-blue-700">
            Get expert feedback on your resume! Upload your resume below and our AI will analyze it for content, formatting, and ATS optimization. 
            We'll provide detailed suggestions to help you stand out to recruiters and pass applicant tracking systems.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Upload Your Resume</h2>
            <p className="text-sm text-gray-500">
              Supported formats: {Object.values(SUPPORTED_FILE_TYPES).join(", ")}
            </p>
            <div className="flex gap-4">
              <Input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept={Object.keys(SUPPORTED_FILE_TYPES).join(",")}
                disabled={isUploading}
              />
              <Button
                onClick={handleAnalyzeResume}
                disabled={!parsedResume || isUploading}
                className="w-full max-w-sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Analyze Resume
                  </>
                )}
              </Button>
            </div>
          </div>

          {isUploading && (
            <Alert>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <AlertDescription>
                Processing your resume... This may take a few moments.
              </AlertDescription>
            </Alert>
          )}

          {(file || savedResume) && !isUploading && (
            <Alert>
              <Upload className="mr-2 h-4 w-4" />
              <AlertDescription>
                {(file && `${file.name} (${SUPPORTED_FILE_TYPES[file.type as keyof typeof SUPPORTED_FILE_TYPES]})`) || savedResume.name} ready for analysis
              </AlertDescription>
            </Alert>
          )}

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
        </div>
      </Card>

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
