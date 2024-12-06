import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { toast } from "sonner";
import { STRIPE_PRICE_IDS } from "../config/stripeClient";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { createCheckoutSession } from "@/api/stripe";

const API_URL = import.meta.env.VITE_API_URL;

interface LocationState {
  tier: {
    name: string;
    price: string;
    description: string;
    features: string[];
  };
}

const SubscriptionConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkSubscription } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);

  const state = location.state as LocationState;
  const selectedTier = state?.tier;

  useEffect(() => {
    if (!selectedTier) {
      navigate("/pricing");
    }
  }, [selectedTier, navigate]);

  if (!selectedTier) {
    return null;
  }

  const handleConfirm = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setIsProcessing(true);
    try {
      // Convert tier name to match STRIPE_PRICE_IDS format (e.g., "Resume Pro" -> "RESUME_PRO")
      const priceIdKey = selectedTier.name.toUpperCase().replace(/\s+/g, '_') as keyof typeof STRIPE_PRICE_IDS;
      console.log('Selected tier:', selectedTier.name);
      console.log('Price ID key:', priceIdKey);
      const priceId = STRIPE_PRICE_IDS[priceIdKey];
      console.log('Price ID:', priceId);
      
      if (!priceId) {
        throw new Error(`No price ID found for tier: ${selectedTier.name}`);
      }
      
      const checkoutUrl = await createCheckoutSession(user.uid, priceId);
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error("Failed to start checkout process. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Confirm Your Subscription</h1>
            <p className="text-gray-600">
              You're about to subscribe to our {selectedTier.name} plan
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b">
              <h2 className="text-xl font-semibold">{selectedTier.name}</h2>
              <span className="text-2xl font-bold">{selectedTier.price}/month</span>
            </div>

            <div>
              <h3 className="font-semibold mb-3">What's included:</h3>
              <ul className="space-y-3">
                {selectedTier.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Subscription Details:</h3>
              <ul className="space-y-2">
                <li>• Billed monthly at {selectedTier.price}</li>
                <li>• Cancel anytime</li>
                <li>• Instant access to all features</li>
              </ul>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? "Processing..." : "Confirm Subscription"}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/pricing")}
                className="flex-1"
              >
                Go Back
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default SubscriptionConfirm;
