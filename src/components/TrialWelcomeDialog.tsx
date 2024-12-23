import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Gift, Download, Save } from "lucide-react";

interface TrialWelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrialWelcomeDialog = ({
  isOpen,
  onClose,
}: TrialWelcomeDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Welcome to Your Free Trial!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <DialogDescription>
            You now able to use all of our premium features 3 times each for free.
          </DialogDescription>

          <div className="space-y-2">
            <h3 className="font-semibold">Here's what you can do:</h3>
            <ul className="list-inside list-disc space-y-1">
              <li>Create custom resumes with our AI-powered builder</li>
              <li>Generate tailored cover letters</li>
              <li>Get expert resume reviews and suggestions</li>
              <li>Access premium resume templates</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Quick Tips:</h3>
            <ul className="list-inside list-disc space-y-1">
              <li>Click "Build Resume" to start creating your resume</li>
              <li>
                Click your user icon in the top right to:
                <ul className="ml-6 list-inside list-disc space-y-1">
                  <li>View your trial/subscription status</li>
                  <li>Report any problems you encounter</li>
                  <li>Access your document history (coming soon)</li>
                  <li>Manage your account settings</li>
                </ul>
              </li>
            </ul>
          </div>

          <div className="text-sm text-muted-foreground space-y-4">
            <p>
              Need help? Click your user icon and select "Report a Problem" to reach our support team.
            </p>
            
            <p>
              Thank you for starting your free trial! Here are some tips to make the most of it:
            </p>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Download className="h-4 w-4 mt-1 flex-shrink-0" />
                <p>Remember to download your enhanced resumes and cover letters - they'll be available even after your trial ends!</p>
              </div>
              <div className="flex items-start gap-2">
                <Save className="h-4 w-4 mt-1 flex-shrink-0" />
                <p>Save your work frequently to keep track of your progress.</p>
              </div>
            </div>

            <p>
              Enjoying the service? Don't forget to subscribe to keep access to all premium features and unlimited usage!
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Get Started</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
