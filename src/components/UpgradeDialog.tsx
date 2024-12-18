import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreditCard } from "lucide-react";

interface UpgradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  feature?: string;
  isTrialExpired?: boolean;
}

export const UpgradeDialog = ({
  isOpen,
  onClose,
  title = "Upgrade Required",
  description,
  feature,
  isTrialExpired = true,
}: UpgradeDialogProps) => {
  const defaultDescription = isTrialExpired
    ? "You've used all your trial credits."
    : "This feature requires a premium subscription.";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-4">
              <div>{description || defaultDescription}</div>
              {feature && (
                <div className="space-y-2">
                  <div>Upgrade now to {isTrialExpired ? "continue using" : "unlock"} {feature} and many more premium features!</div>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Unlimited {feature}</li>
                    <li>Priority support</li>
                    <li>Advanced customization options</li>
                    <li>Premium templates</li>
                  </ul>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          <Button onClick={onClose}>Upgrade Now</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
