import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { startTrial } from "@/api/subscription";

type TrialType = 'creator' | 'reviewer' | 'cover_letter';

interface TrialStatus {
  used: boolean;
  remaining: number;
}

interface TrialsStatus {
  creator: TrialStatus;
  reviewer: TrialStatus;
  cover_letter: TrialStatus;
}

interface PricingTierProps {
  name: string;
  price: string;
  tier: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  trialFeatures: readonly TrialType[];
  trials: TrialsStatus;
  trialDescription?: string;
}

export const PricingTier: React.FC<PricingTierProps> = ({
  name,
  price,
  tier,
  description,
  features,
  highlighted = false,
  trialFeatures,
  trials,
  trialDescription,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshSubscription } = useSubscription();

  const hasUnusedTrials = trialFeatures.some(
    feature => !trials[feature].used && trials[feature].remaining > 0
  );

  const getTrialDestination = (features: readonly TrialType[]): string => {
    if (features.includes('creator')) return '/builder';
    if (features.includes('reviewer')) return '/review';
    if (features.includes('cover_letter')) return '/cover-letter';
    return '/builder';
  };

  const getTrialSuccessMessage = (features: readonly TrialType[]): string => {
    const featureMessages = features
      .filter(feature => !trials[feature].used && trials[feature].remaining > 0)
      .map(feature => {
        switch (feature) {
          case 'creator': return 'create one resume';
          case 'reviewer': return 'review one resume';
          case 'cover_letter': return 'create one cover letter';
          default: return '';
        }
      })
      .filter(Boolean);

    return `Trial started! You can now ${featureMessages.join(' and ')}.`;
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Please sign in to continue");
      navigate("/auth");
      return;
    }

    // If trial is available and not used, start trial for all available features
    if (hasUnusedTrials) {
      try {
        // Start trials for all unused features
        for (const feature of trialFeatures) {
          if (!trials[feature].used && trials[feature].remaining > 0) {
            await startTrial(user.uid, feature);
          }
        }
        
        await refreshSubscription();
        toast.success(getTrialSuccessMessage(trialFeatures));
        navigate(getTrialDestination(trialFeatures));
        return;
      } catch (error) {
        console.error("Error starting trial:", error);
        toast.error("Failed to start trial. Please try again.");
        return;
      }
    }

    // Navigate to subscription confirmation for paid subscription
    navigate("/subscription-confirm", {
      state: {
        tier: {
          name,
          price,
          tier,
          description,
          features,
        },
      },
    });
  };

  return (
    <div
      className={`p-8 rounded-lg ${
        highlighted
          ? "border-2 border-primary bg-primary/5 shadow-lg relative"
          : "border border-border bg-white"
      } flex flex-col h-full animate-fade-up`}
    >
      {highlighted && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="secondary">
          Most Popular
        </Badge>
      )}
      {hasUnusedTrials && (
        <Badge className="absolute -top-3 right-4" variant="default">
          Try Features Free
        </Badge>
      )}
      <h3 className="text-2xl font-bold">{name}</h3>
      <div className="mt-4 flex items-baseline">
        <span className="text-4xl font-bold">{price}</span>
        <span className="ml-2 text-gray-600">/month</span>
      </div>
      <p className="mt-4 text-gray-600">{description}</p>
      <ul className="mt-6 space-y-4 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button className="mt-8 w-full" onClick={handleSubscribe}>
        {hasUnusedTrials ? "Start Free Trial" : "Subscribe Now"}
      </Button>
      {hasUnusedTrials && (
        <p className="mt-4 text-sm text-center text-gray-600">
          One-time trial, no credit card required
        </p>
      )}
    </div>
  );
};
