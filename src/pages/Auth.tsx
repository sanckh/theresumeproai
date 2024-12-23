import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { AuthForm } from "@/components/auth/AuthForm";
import { useSearchParams } from "react-router-dom";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    const signupParam = searchParams.get("signup");
    if (signupParam === "true") {
      setIsSignUp(true);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <Header />
      <main className="w-full max-w-7xl mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto p-6 space-y-6 bg-white">
          <h1 className="text-2xl font-bold text-center">
            {isSignUp ? "Create an Account" : "Sign In"}
          </h1>
          <AuthForm isSignUp={isSignUp} onToggleMode={() => setIsSignUp(!isSignUp)} />
        </Card>
      </main>
    </div>
  );
};

export default Auth;