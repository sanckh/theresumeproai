import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { resendVerificationEmail } from "@/api/auth";
import { logEvent } from "firebase/analytics";
import { analytics } from "@/config/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";

const baseSchema = {
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
};

const signUpSchema = z.object({
  ...baseSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const signInSchema = z.object(baseSchema);

type SignUpFormData = z.infer<typeof signUpSchema>;
type SignInFormData = z.infer<typeof signInSchema>;
type FormData = SignUpFormData | SignInFormData;

interface AuthFormProps {
  isSignUp: boolean;
  onToggleMode: () => void;
}

const defaultValues = {
  email: "",
  password: "",
  confirmPassword: "",
};

export const AuthForm = ({ isSignUp, onToggleMode }: AuthFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp, user, resetPassword, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    defaultValues,
    mode: "onChange",
  });

  // Reset form when switching modes
  useEffect(() => {
    form.reset(defaultValues);
  }, [isSignUp, form]);

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      toast.success("Verification email sent! Please check your inbox.");
    } catch (error) {
      toast.error("Failed to resend verification email. Please try again.");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling up to parent form
    
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }
    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      toast.success("Password reset email sent! Please check your inbox.");
      setResetEmail("");
    } catch (error) {
      const errorCode = (error as { code?: string }).code;
      let errorMessage = "Failed to send reset email";
      
      switch(errorCode) {
        case 'auth/user-not-found':
          errorMessage = "No account found with this email address";
          break;
        case 'auth/invalid-email':
          errorMessage = "Please enter a valid email address";
          break;
      }
      toast.error(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      navigate("/");
    } catch (error) {
      const errorCode = (error as { code?: string }).code;
      let errorMessage = "Failed to sign in with Google";
      
      switch(errorCode) {
        case 'auth/popup-closed-by-user':
          errorMessage = "Sign in cancelled";
          break;
        case 'auth/popup-blocked':
          errorMessage = "Pop-up blocked by browser. Please allow pop-ups and try again";
          break;
      }
      toast.error(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (isSignUp) {
        const { error, confirmEmail } = await signUp(data.email, data.password);
        if (!error && analytics) {
          logEvent(analytics, 'sign_up', {
            method: 'email',
            user_id: user?.uid
          });
        }
        if (error) {
          // Handle Firebase auth errors
          const errorCode = (error as { code?: string }).code;
          let errorMessage = error.message;
          
          switch(errorCode) {
            case 'auth/email-already-in-use':
              errorMessage = 'This email is already registered. Please sign in instead.';
              break;
            case 'auth/invalid-email':
              errorMessage = 'Please enter a valid email address.';
              break;
            case 'auth/weak-password':
              errorMessage = 'Password is too weak. Please choose a stronger password.';
              break;
          }
          toast.error(errorMessage);
        } else if (confirmEmail) {
          toast.message(
            "Account created successfully! ",
            {
              description: "Please check your email to verify your account before signing in.",
              duration: 10000,
              className: "bg-primary/10 border-primary text-lg",
              action: {
                label: "Resend Email",
                onClick: handleResendVerification
              }
            }
          );
          onToggleMode(); // Switch to sign in mode
          form.reset(defaultValues);
        } else {
          toast.success("Account created successfully!");
          navigate("/");
        }
      } else {
        try {
          await signIn(data.email, data.password);
          toast.success("Signed in successfully!");
          navigate("/");
        } catch (error) {
          // Handle Firebase auth errors for sign in
          const errorCode = (error as { code?: string }).code;
          let errorMessage = (error as Error).message;
          
          switch(errorCode) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
              errorMessage = 'Invalid email or password.';
              break;
            case 'auth/user-disabled':
              errorMessage = 'This account has been disabled.';
              break;
            case 'auth/too-many-requests':
              errorMessage = 'Too many failed attempts. Please try again later.';
              break;
            case 'auth/invalid-email':
              errorMessage = 'Please enter a valid email address.';
              break;
          }
          if (error.message.includes('verify your email')) {
            toast.error(
              <div>
                {errorMessage}
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal underline ml-2"
                  onClick={handleResendVerification}
                >
                  Resend verification email
                </Button>
              </div>
            );
          } else {
            toast.error(errorMessage);
          }
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication error");
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="Enter your email" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isSignUp && (
            <div className="flex justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 font-normal"
                  >
                    Forgot password?
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                      Enter your email address and we'll send you a link to reset your password.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <FormLabel htmlFor="resetEmail">Email</FormLabel>
                      <Input
                        id="resetEmail"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <DialogClose asChild>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setResetEmail("");
                          }}
                        >
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button type="submit" disabled={resetLoading}>
                        {resetLoading ? "Sending..." : "Send Reset Link"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {isSignUp && (
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button type="submit" className="w-full">
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>

          {/* Hide divider and Google sign-in on mobile devices */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                "Signing in..."
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </div>
              )}
            </Button>
          </div>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => {
                form.reset(defaultValues);
                onToggleMode();
              }}
              className="text-sm"
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};