import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { db } from "@/firebase_options";
import { doc, setDoc } from "firebase/firestore";

type PricingTierProps = {
  name: string;
  price: string;
  priceId?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  trialType?: 'creator' | 'reviewer';
};

export const PricingTier = ({
  name,
  price,
  priceId,
  description,
  features,
  highlighted = false,
  trialType,
}: PricingTierProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier, hasUsedCreatorTrial, hasUsedReviewerTrial, checkSubscription } = useSubscription();

  const canUseTrial = trialType === 'creator' 
    ? !hasUsedCreatorTrial 
    : trialType === 'reviewer' 
    ? !hasUsedReviewerTrial 
    : false;

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Please sign in to continue");
      navigate("/auth");
      return;
    }

    if (price === "Free") {
      navigate("/builder");
      return;
    }

    // Handle one-time trial activation
    if (trialType && canUseTrial) {
      try {
        const subscriptionData = {
          tier: 'premium' as const,
          has_used_creator_trial: trialType === 'creator' ? true : hasUsedCreatorTrial,
          has_used_reviewer_trial: trialType === 'reviewer' ? true : hasUsedReviewerTrial,
          updated_at: new Date().toISOString(),
        };

        await setDoc(doc(db, 'subscriptions', user.uid), subscriptionData, { merge: true });

        await checkSubscription();
        toast.success(`${trialType === 'creator' ? 'Creator' : 'Reviewer'} trial activated successfully!`);
        navigate("/builder");
        return;
      } catch (error) {
        console.error('Error activating trial:', error);
        toast.error("Failed to activate trial");
        return;
      }
    }

    // Handle regular subscription
    try {
      toast.loading("Redirecting to checkout...");
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const session = await response.json();
      window.location.href = session.url;
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to initiate checkout");
    }
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
      {trialType && canUseTrial && (
        <Badge className="absolute -top-3 right-4" variant="default">
          Try Once For Free
        </Badge>
      )}
      <h3 className="text-2xl font-bold">{name}</h3>
      <div className="mt-4 flex items-baseline">
        <span className="text-4xl font-bold">{price}</span>
        {price !== "Free" && <span className="ml-2 text-gray-600">/month</span>}
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
        {price === "Free" ? "Get Started" : canUseTrial ? "Try Now" : "Subscribe Now"}
      </Button>
      {trialType && canUseTrial && (
        <p className="mt-4 text-sm text-center text-gray-600">
          One-time trial, no credit card required
        </p>
      )}
    </div>
  );
};
