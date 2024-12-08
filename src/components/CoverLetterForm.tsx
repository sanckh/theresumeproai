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
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CoverLetterFormProps } from "@/interfaces/coverLetterFormProps";

export const CoverLetterForm = ({ savedResume }: CoverLetterFormProps) => {
  const { canUseFeature, subscriptionStatus } = useSubscription();
  const navigate = useNavigate();
  const hasCareerProAccess = canUseFeature('career_pro');

  useEffect(() => {
    if (!hasCareerProAccess) {
      navigate('/pricing');
    }
  }, [hasCareerProAccess, navigate]);

  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState("");

  const handleGenerate = async () => {
    if (!savedResume) {
      toast.error("Please select a resume first");
      return;
    }
    if (!jobDescription && !jobUrl) {
      toast.error("Please provide either a job description or job URL");
      return;
    }
    const userId = auth.currentUser?.uid;
    if (!userId) {
      toast.error("Please sign in to generate a cover letter");
      return;
    }
    if (!hasCareerProAccess) {
      setShowUpgradeDialog(true);
      return;
    }
    if (subscriptionStatus?.hasStartedTrial && subscriptionStatus.trials?.career_pro?.remaining !== undefined) {
      if (subscriptionStatus.trials.career_pro.remaining <= 0) {
        setShowUpgradeDialog(true);
        return;
      }
      try {
        await decrementTrialUse(userId, 'career_pro');
      } catch (error) {
        console.error('Error decrementing trial:', error);
        setShowUpgradeDialog(true);
        return;
      }
    }
    setIsGenerating(true);
    try {
      const response = await fetch("/api/cover-letters/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeData: savedResume.data,
          jobDescription,
          jobUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate cover letter");
      }

      const data = await response.json();
      setGeneratedCoverLetter(data.coverLetter);
      toast.success("Cover letter generated successfully!");
    } catch (error) {
      console.error("Error generating cover letter:", error);
      toast.error("Failed to generate cover letter. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedCoverLetter) {
      toast.error("Please generate a cover letter first");
      return;
    }

    try {
      // TODO: Call the API to save cover letter
      const response = await fetch("/api/save-cover-letter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeId: savedResume?.id,
          coverLetter: generatedCoverLetter,
          jobDescription,
          jobUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save cover letter");
      }

      toast.success("Cover letter saved successfully!");
    } catch (error) {
      console.error("Error saving cover letter:", error);
      toast.error("Failed to save cover letter. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-blue-700">
            Create a tailored cover letter in seconds! Input either a job URL or paste the job description below. 
            Our AI will generate a professional cover letter that matches your resume to the job requirements.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Selected Resume</Label>
            <div className="text-gray-600">
              {savedResume ? savedResume.name : "No resume selected"}
            </div>
          </div>

          <div>
            <Label htmlFor="jobUrl">Job Posting URL</Label>
            <Input
              id="jobUrl"
              value={jobUrl}
              onChange={(e) => {
                setJobUrl(e.target.value);
                // Clear job description if URL is being entered
                if (e.target.value) {
                  setJobDescription("");
                }
              }}
              placeholder="https://example.com/job-posting"
              disabled={!!jobDescription}
            />
          </div>

          <div className="flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <div>
            <Label htmlFor="jobDescription">Job Description</Label>
            <Textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => {
                setJobDescription(e.target.value);
                // Clear job URL if description is being entered
                if (e.target.value) {
                  setJobUrl("");
                }
              }}
              placeholder="Paste the job description here..."
              rows={8}
              disabled={!!jobUrl}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || (!jobDescription && !jobUrl) || !savedResume}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Cover Letter"
            )}
          </Button>
        </div>
      </Card>

      {generatedCoverLetter && (
        <Card className="p-6">
          <div className="space-y-4">
            <Label>Generated Cover Letter</Label>
            <Textarea
              value={generatedCoverLetter}
              onChange={(e) => setGeneratedCoverLetter(e.target.value)}
              rows={12}
              className="font-serif"
            />
            <Button onClick={handleSave} className="w-full">
              Save Cover Letter
            </Button>
          </div>
        </Card>
      )}

      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to Career Pro</DialogTitle>
            <DialogDescription>
              Generate professional cover letters customized to each job posting with AI.
              Upgrade now to unlock this feature!
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => navigate('/pricing')}>View Plans</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
