import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { authService } from "@/services/authService";
import type { LoginRequest } from "@/types/auth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const { register, handleSubmit, formState: { isSubmitting, errors }, setValue, watch } = form;
  const rememberMe = watch("rememberMe");

  const onSubmit = async (values: LoginFormValues) => {
    setError("");

    try {
      // Explicitly map form values to the strict LoginRequest type.
      // If the backend API changes (e.g., adds a new required field), TypeScript will error here.
      const requestBody: LoginRequest = {
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
      };

      // 1. Call API with the Interface generic <AuthResponse>
      const data = await authService.login(requestBody); // 'data' is now strictly typed

      // 2. Switch based on the "Action" code from Java
      switch (data.action) {
        
        case "RESET_PASSWORD":
          setLocation("/tenant-reset-password");
          return;

        case "COMPLETE_ONBOARDING":
          // Route to specific setup pages based on role
          if (data.user.userType === "tenant") {
             setLocation("/tenant/setup-profile");
          } else {
             setLocation("/onboarding"); // or "/owner/add-pg"
          }
          return;

        case "WAIT_FOR_APPROVAL":
          // User exists but PG is pending. 
          // You can redirect to a status page OR just show an error message.
          setError("Your account is currently pending admin approval.");
          return;

        case "RESOLVE_REJECTION":
          // Show the specific reason the admin rejected them
          setError(data.message || "Your account was rejected. Please contact support.");
          return;

        case "ACCOUNT_DEACTIVATED":
          setError("Your account has been deactivated.");
          return;

        case "GO_TO_DASHBOARD":
          // 3. Handle Successful Login Routing
          const userType = (data.user?.userType || "").toLowerCase().trim(); 
          console.log("Normalized User Type:", userType); // Debugging line
          if (userType === "tenant") {
            setLocation("/tenant-dashboard");
          } else if (userType === "applicant") {
            setLocation("/tenant-search-pgs");
          } else if (userType === "admin") {
            setLocation("/admin-dashboard");
          } else {
            // Default for Owners
            setLocation("/dashboard");
          }
          return;

        default:
          // Fallback if backend sends a new action frontend doesn't know yet
          console.warn("Unknown login action:", data.action);
          setLocation("/dashboard");
      }

    } catch (err: any) {
      console.error("Login failed", err);

      // Handle actual Network/Server errors (401, 500)
      const errorMessage = 
        err.response?.data?.message || 
        err.response?.data?.error || 
        err.message || 
        "Login failed. Please check your credentials.";
        
      setError(errorMessage);
    } finally {
      // Loading state is handled by react-hook-form's isSubmitting
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4 max-w-md mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full space-y-8"
      >
        <div className="text-center space-y-4">
          <img 
            src="/logo.png"
            alt="StayBuki Logo" 
            className="h-24 sm:h-32 w-auto mx-auto object-contain"
            width={128}
            height={128}
          />
          <p className="text-muted-foreground mt-4">Manage your PG smarter, not harder.</p>
        </div>

        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm" data-testid="error-message">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="owner@example.com" 
                  autoComplete="email"
                  inputMode="email"
                  enterKeyHint="next"
                  className="h-12 bg-background/50"
                  disabled={isSubmitting}
                  {...register("email")}
                  data-testid="input-login-email"
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    autoComplete="current-password"
                    enterKeyHint="go"
                    className="h-12 bg-background/50 pr-10"
                    disabled={isSubmitting}
                    {...register("password")}
                    data-testid="input-login-password"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="rememberMe" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setValue("rememberMe", checked as boolean)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="rememberMe" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <Link href="/forgot-password" className="text-primary font-medium hover:underline" data-testid="link-forgot-password">Forgot password?</Link>
              </div>
              <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isSubmitting} data-testid="button-login-submit">
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          Don't have an account? <Link href="/register" className="text-primary font-medium hover:underline">Start Free Trial</Link>
        </div>
      </motion.div>
    </div>
  );
}
