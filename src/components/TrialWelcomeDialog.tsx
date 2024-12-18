import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Welcome to Your Free Trial!
          </DialogTitle>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Thank you for starting your free trial! Here are some tips to make the most of it:
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Download className="h-4 w-4 mt-1" />
                <p className="text-sm text-muted-foreground">Remember to download your enhanced resumes and cover letters - they'll be available even after your trial ends!</p>
              </div>
              <div className="flex items-start gap-2">
                <Save className="h-4 w-4 mt-1" />
                <p className="text-sm text-muted-foreground">Save your work frequently to keep track of your progress.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Enjoying the service? Don't forget to subscribe to keep access to all premium features and unlimited usage!
            </p>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Got it!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
