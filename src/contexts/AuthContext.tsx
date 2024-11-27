import { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import * as authApi from "../api/auth";

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; confirmEmail: boolean }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement token refresh and user session management
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await authApi.signIn(email, password);
      setUser(userCredential.user);
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await authApi.signUp(email, password);
      setUser(userCredential.user);
      return { error: null, confirmEmail: true };
    } catch (error) {
      console.error("Sign up error:", error);
      return { error: error as Error, confirmEmail: false };
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
