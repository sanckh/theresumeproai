import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import Index from "./pages/Index";
import Builder from "./pages/Builder";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";
import Templates from "./pages/Templates";
import History from "./pages/History";
import Success from "./pages/Success";
import SubscriptionConfirm from "./pages/SubscriptionConfirm";
import Settings from "./pages/Settings";
import { trackPageView } from './utils/analytics';
import { useEffect } from 'react';

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SubscriptionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RouteChangeTracker />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/builder" element={<Builder />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/history" element={<History />} />
              <Route path="/success" element={<Success />} />
              <Route path="/subscription-confirm" element={<SubscriptionConfirm />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;