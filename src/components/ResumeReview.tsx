import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { analyzeResume, ParsedResume } from "@/utils/openai";
import { parseDocument } from "@/utils/documentParser";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";
import { decrementTrialUse, getSubscriptionStatus } from "@/api/subscription";
import { auth } from "@/config/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SubscriptionStatus } from '../../server/types/subscription';

interface ResumeAnalysis {
  score: number;
  suggestions: string[];
  strengths: string[];
}

const SUPPORTED_FILE_TYPES = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "text/plain": "TXT",
} as const;

export const ResumeReview = () => {
  const { canUseFeature, subscriptionStatus } = useSubscription();
  const navigate = useNavigate();
  const canReview = canUseFeature('reviewer');

  useEffect(() => {
    if (!canReview) {
      navigate('/pricing');
    }
  }, [canReview, navigate]);

  const [file, setFile] = useState<File | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const {
    data: analysis,
    isLoading,
    refetch,
  } = useQuery<ResumeAnalysis>({
    queryKey: ["resumeAnalysis", file?.name],
    queryFn: async () => {
      if (!parsedResume) return null;
      return analyzeResume(parsedResume);
    },
    enabled: true,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type in SUPPORTED_FILE_TYPES) {
        try {
          setIsUploading(true);
          setFile(selectedFile);
          const parsed = await parseDocument(selectedFile);
          setParsedResume(parsed);

          // Log the sections found by OpenAI
          console.log("\n=== Resume Sections Found ===");
          console.log("Total Sections:", parsed.metadata.totalSections);
          console.log("\nSections List:");
          parsed.metadata.sectionsList.forEach((section, index) => {
            console.log(`${index + 1}. ${section}`);
            console.log("Content:", parsed.sections[section]);
            console.log("-".repeat(50));
          });
          console.log("=".repeat(50));

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

  const handleAnalyze = async () => {
    if (!file) {
      toast.error("Please upload a resume first");
      return;
    }

    try {
      // Check subscription status first
      const userId = auth.currentUser?.uid;
      if (!userId) {
        toast.error("Please sign in to use resume review");
        return;
      }

      // Check if user can use the reviewer feature
      if (!canUseFeature('reviewer')) {
        setShowUpgradeDialog(true);
        return;
      }

      // Only decrement trial use if this is a trial
      if (subscriptionStatus?.hasStartedTrial) {
        await decrementTrialUse(userId, 'reviewer');
      }

      refetch();
    } catch (error) {
      console.error("Error analyzing resume:", error);
      toast.error("Failed to analyze resume. Please try again.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Upload Your Resume</h2>
            <p className="text-sm text-gray-500">
              Supported formats:{" "}
              {Object.values(SUPPORTED_FILE_TYPES).join(", ")}
            </p>
            <div className="flex gap-4">
              <Input
                type="file"
                onChange={handleFileChange}
                accept={Object.keys(SUPPORTED_FILE_TYPES).join(",")}
                disabled={isUploading}
              />
              <Button
                onClick={handleAnalyze}
                disabled={!file || isLoading || isUploading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Analyze
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

          {file && !isUploading && (
            <Alert>
              <Upload className="mr-2 h-4 w-4" />
              <AlertDescription>
                {`${file.name} (${
                  SUPPORTED_FILE_TYPES[
                    file.type as keyof typeof SUPPORTED_FILE_TYPES
                  ]
                }) ready for analysis`}
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
        <Dialog defaultOpen={true} onOpenChange={setShowUpgradeDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Ready for expert resume analysis?</DialogTitle>
              <DialogDescription className="text-base mt-4">
                You've used your trial review. Upgrade to Career Pro to get:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Unlimited resume reviews</li>
                  <li>Expert insights and feedback</li>
                  <li>Industry-specific recommendations</li>
                  <li>Detailed scoring and analysis</li>
                </ul>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-4 mt-6">
              <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
                Maybe Later
              </Button>
              <Button 
                onClick={() => {
                  setShowUpgradeDialog(false);
                  navigate('/pricing', { state: { highlightTier: 'career_pro' } });
                }}
                className="bg-primary hover:bg-primary/90"
              >
                Upgrade Now
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
