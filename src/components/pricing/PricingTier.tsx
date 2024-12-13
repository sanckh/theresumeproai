import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PricingTierProps } from "@/interfaces/pricingTierProps";
import { changeSubscription, createCheckoutSession } from "@/api/stripe";
import { STRIPE_PRICE_IDS } from "@/config/stripeClient";

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
    
    const currentTierValue = getTierValue(subscriptionStatus?.tier || 'free');
    const thisTierValue = getTierValue(tier);
    
    if (subscriptionStatus?.tier === tier) return "Current Plan";
    
    if (thisTierValue > currentTierValue) return "Upgrade Plan";
    
    return "Downgrade Plan";
  };

  const getTierValue = (tier: string): number => {
    switch (tier) {
      case 'career_pro': return 3;
      case 'resume_pro': return 2;
      case 'resume_creator': return 1;
      default: return 0; // FREE
    }
  };

  const isCurrentPlan = subscriptionStatus?.tier === tier;
  const buttonText = getButtonText();

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Please sign in to continue");
      navigate("/auth");
      return;
    }
  
    try {
      // If user hasn't started trial yet
      if (!subscriptionStatus?.hasStartedTrial) {
        await startTrialFromContext();
        await refreshSubscription();
        toast.success("Trial started!");
        navigate('/builder');
        return;
      }
  
      // If user already has a subscription, use the change subscription flow
      if (subscriptionStatus?.tier !== 'free') {
        const sessionUrl = await changeSubscription(user.uid, STRIPE_PRICE_IDS[tier.toUpperCase() as keyof typeof STRIPE_PRICE_IDS]);
        window.location.href = sessionUrl;
        return;
      }
  
      // Otherwise, create a new subscription
      const priceId = STRIPE_PRICE_IDS[tier.toUpperCase() as keyof typeof STRIPE_PRICE_IDS];
      if (!priceId) {
        throw new Error('Invalid price ID for tier');
      }
      const checkoutUrl = await createCheckoutSession(user.uid, priceId);
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Error handling subscription:", error);
      toast.error("Failed to process subscription request");
    }
  };

  return (
    <article
      className={`relative rounded-2xl border p-8 ${
        highlighted
          ? "border-primary/50 bg-primary/5 shadow-lg"
          : "border-border bg-card"
      } flex flex-col h-full`}
      role="region"
      aria-labelledby={`pricing-tier-${tier}`}
    >
      {highlighted && (
        <Badge className="absolute -top-2 -right-2 px-3" aria-label="Most popular plan">
          Most Popular
        </Badge>
      )}
      {isCurrentPlan && (
        <>
          <Badge variant="secondary" className="absolute -top-2 -left-2 px-3" aria-label="Your current plan">
            Current Plan
          </Badge>
          {subscriptionStatus?.renewal_date && (
            <p className="mt-2 text-sm text-muted-foreground" role="status">
              Renews on {new Date(subscriptionStatus.renewal_date).toLocaleDateString()}
            </p>
          )}
        </>
      )}
      
      <div className="flex-grow">
        <header>
          <h3 id={`pricing-tier-${tier}`} className="text-2xl font-bold">{name}</h3>
          <div className="mt-4 flex items-baseline" aria-label="Pricing information">
            <span className="text-4xl font-bold tracking-tight" aria-label={`${price} dollars`}>{price}</span>
            <span className="ml-2 text-sm text-muted-foreground">per month</span>
          </div>
          <p className="mt-4 text-muted-foreground">{description}</p>
        </header>

        {trialDescription && (
          <p className="mt-4 text-sm text-primary font-medium" role="note" aria-label="Trial information">
            {trialDescription}
          </p>
        )}

        <ul 
          className="mt-8 space-y-4" 
          aria-label={`Features included in the ${name} plan`}
        >
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        className="w-full mt-8"
        size="lg"
        variant={highlighted ? "default" : "outline"}
        disabled={isCurrentPlan}
        onClick={handleSubscribe}
        aria-label={`${buttonText} - ${name} plan at ${price} per month`}
      >
        {buttonText}
      </Button>
    </article>
  );
};
