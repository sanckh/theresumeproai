import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { toast } from "sonner";

const Success = () => {
  const navigate = useNavigate();
  const { checkSubscription } = useSubscription();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session_id');
    if (!sessionId) {
      navigate('/pricing');
      return;
    }

    // Give Stripe webhook a moment to process
    setTimeout(() => {
      checkSubscription()
        .then(() => {
          setStatus('success');
          toast.success('Your subscription is now active!');
        })
        .catch((error) => {
          console.error('Error checking subscription:', error);
          setStatus('error');
          toast.error('There was an error activating your subscription');
        });
    }, 2000);
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Processing your subscription...</h1>
            <p className="text-gray-600">Please wait while we activate your account.</p>
          </div>
        </main>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Oops! Something went wrong</h1>
            <p className="text-gray-600 mb-8">
              There was an error processing your subscription. Please contact support if this persists.
            </p>
            <Button asChild>
              <Link to="/pricing">Return to Pricing</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Thank you for subscribing!</h1>
          <p className="text-gray-600 mb-8">
            Your subscription is now active. You can start using all premium features.
          </p>
          <div className="space-x-4">
            <Button asChild>
              <Link to="/builder">Start Building</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/templates">Browse Templates</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Success;
