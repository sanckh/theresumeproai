import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { AuthForm } from "@/components/auth/AuthForm";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto p-6 space-y-6">
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