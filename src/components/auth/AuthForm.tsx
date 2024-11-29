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
  const { signIn, signUp } = useAuth();
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

  const onSubmit = async (data: FormData) => {
    try {
      if (isSignUp) {
        const { error, confirmEmail } = await signUp(data.email, data.password);
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
          toast.success(
            "Account created successfully! Please check your email to verify your account."
          );
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
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
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
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
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
  );
};