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
import { saveCoverLetter } from "@/api/coverLetter";
import { decrementTrialUse } from "@/api/subscription";
import { generateCoverLetterWithAI } from "@/utils/openai";

export const CoverLetterForm = ({ resume }: CoverLetterFormProps) => {
  const { canUseFeature, subscriptionStatus } = useSubscription();
  const navigate = useNavigate();
  const hasCareerProAccess = canUseFeature('career_pro');

  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState("");

  const handleGenerate = async () => {
    const userId = auth.currentUser?.uid;
    if (!resume) {
      toast.error("Please select a resume first");
      return;
    }
    if (!jobDescription && !jobUrl) {
      toast.error("Please provide either a job description or URL");
      return;
    }

    try {
      setIsGenerating(true);
      const coverLetter = await generateCoverLetterWithAI(resume.data, jobDescription, jobUrl);
      setGeneratedCoverLetter(coverLetter);
            if (coverLetter) {
        await saveCoverLetter({
          resumeId: resume.id,
          content: coverLetter,
          jobDescription,
          jobUrl
        });
        toast.success("Cover letter generated and saved successfully!");
      }

      if (!hasCareerProAccess && subscriptionStatus?.trials?.career_pro?.remaining > 0) {
        await decrementTrialUse(userId,'career_pro');
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
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <Label>Job Description</Label>
            <Textarea
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => {
                setJobDescription(e.target.value);
                setJobUrl("");
              }}
              disabled={!!jobUrl || isGenerating}
            />
          </div>
          <div>
            <Label>Job URL</Label>
            <Input
              type="url"
              placeholder="Or enter the job posting URL..."
              value={jobUrl}
              onChange={(e) => {
                setJobUrl(e.target.value);
                setJobDescription("");
              }}
              disabled={!!jobDescription || isGenerating}
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || (!jobDescription && !jobUrl)}
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

      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Required</DialogTitle>
            <DialogDescription>
              This feature requires a Career Pro subscription. Would you like to upgrade?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => navigate("/pricing")}>View Plans</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
