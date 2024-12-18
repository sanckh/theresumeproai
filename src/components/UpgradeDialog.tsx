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
    ? `You've used all your trial credits for ${feature}.`
    : `This feature requires a premium subscription.`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <DialogDescription>
            {description || defaultDescription}
          </DialogDescription>
          
          {feature && (
            <div className="space-y-2">
              <p>
                Upgrade now to {isTrialExpired ? "continue using" : "unlock"} {feature} and get access to all premium features!
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Unlimited access to all features</li>
                <li>Priority support</li>
                <li>Advanced customization options</li>
                <li>Premium templates</li>
              </ul>
            </div>
          )}
        </div>

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
