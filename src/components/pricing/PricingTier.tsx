import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PricingTierProps } from "@/interfaces/pricingTierProps";


export const PricingTier: React.FC<PricingTierProps> = ({
  name,
  price,
  tier,
  description,
  features,
  highlighted = false,
  trialFeatures,
  trialDescription,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startTrial: startTrialFromContext, subscriptionStatus, refreshSubscription } = useSubscription();

  const getButtonText = (): string => {
    if (!user) return "Sign In to Start";
    if (!subscriptionStatus?.hasStartedTrial) return "Start Free Trial";
    return "Upgrade Now";
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Please sign in to continue");
      navigate("/auth");
      return;
    }

    // If trial hasn't been started yet
    if (!subscriptionStatus?.hasStartedTrial) {
      try {
        // Start trial with the first feature, which will initialize all trials
        await startTrialFromContext();
        
        await refreshSubscription();
        
        toast.success("Trial started! You can now try all our features once - create a resume, get AI feedback, and generate a cover letter. Pick your preferred plan after trying everything!");
        navigate('/builder'); 
        return;
      } catch (error) {
        console.error("Error starting trial:", error);
        if (error instanceof Error && error.message.includes('Trial already used')) {
          toast.info("Your trial has already been used. Let's get you upgraded!");
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
          return;
        }
        toast.error("Failed to start trial. Please try again.");
        return;
      }
    }

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
      }`}
    >
      {highlighted && (
        <Badge
          className="absolute -top-3 left-1/2 transform -translate-x-1/2"
          variant="default"
        >
          Most Popular
        </Badge>
      )}

      <h3 className="text-2xl font-bold">{name}</h3>
      <p className="text-3xl font-bold mt-4">{price}</p>
      <p className="text-sm text-muted-foreground mt-2">per month</p>
      <p className="mt-4 text-muted-foreground">{description}</p>

      {trialDescription && (
        <p className="mt-4 text-sm text-primary font-medium">{trialDescription}</p>
      )}

      <ul className="mt-8 space-y-4">
        {features.map((feature) => (
          <li key={feature} className="flex items-start">
            <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        className="w-full mt-8"
        onClick={handleSubscribe}
        variant={highlighted ? "default" : "outline"}
      >
        {getButtonText()}
      </Button>
    </div>
  );
};
