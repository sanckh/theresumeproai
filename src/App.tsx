import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { ConditionalAutoAds } from "./components/googleads/ConditionalAd";
import Index from "./pages/Index";
import Builder from "./pages/Builder";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";
import Templates from "./pages/Templates";
import History from "./pages/History";
import Success from "./pages/Success";
import SubscriptionConfirm from "./pages/SubscriptionConfirm";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import RefundPolicy from "./pages/RefundPolicy";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { trackPageView } from './utils/analytics';
import { useEffect } from 'react';
import { Footer } from "@/components/Footer";

function App() {
  const queryClient = new QueryClient();

  const RouteChangeTracker = () => {
    const location = useLocation();

    useEffect(() => {
      trackPageView(
        document.title,
        location.pathname
      );
    }, [location]);

    return null;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SubscriptionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen flex flex-col">
                <RouteChangeTracker />
                <Routes>
                  <Route path="/" element={<><ConditionalAutoAds /><Index /></>} />
                  <Route path="/builder" element={<><ConditionalAutoAds /><Builder /></>} />
                  <Route path="/pricing" element={<><ConditionalAutoAds /><Pricing /></>} />
                  <Route path="/templates" element={<><ConditionalAutoAds /><Templates /></>} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/success" element={<Success />} />
                  <Route path="/subscription-confirm" element={<SubscriptionConfirm />} />
                  <Route path="/settings" element={<><ConditionalAutoAds /><Settings /></>} />
                  <Route path="/refund" element={<RefundPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Footer />
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;