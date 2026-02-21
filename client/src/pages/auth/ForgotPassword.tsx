import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { authService } from "@/services/authService";
import type { ForgotPasswordRequest, VerifyForgotPasswordRequest } from "@/types/auth";
import { forgotPasswordEmailSchema, resetPasswordSchema } from "@/validations/auth";

type EmailFormValues = z.infer<typeof forgotPasswordEmailSchema>;
type ResetFormValues = z.infer<typeof resetPasswordSchema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Form 1: Email
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(forgotPasswordEmailSchema),
    defaultValues: { email: "" },
  });

  // Form 2: Reset
  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { otp: "", newPassword: "", confirmPassword: "" },
  });

  const onEmailSubmit = async (values: EmailFormValues) => {
    setServerError("");
    setSuccessMessage("");
    
    try {
      const payload: ForgotPasswordRequest = { email: values.email };
      await authService.forgotPassword(payload);
      
      setSuccessMessage("OTP sent to your email and registered phone number");
      setTimeout(() => setStep(2), 1000);
    } catch (err: any) {
      setServerError(err.response?.data?.error || err.message || "Failed to request password reset");
    }
  };

  const onResetSubmit = async (values: ResetFormValues) => {
    setServerError("");
    setSuccessMessage("");

    try {
      const email = emailForm.getValues("email");
      const payload: VerifyForgotPasswordRequest = { 
        email, 
        otp: values.otp, 
        newPassword: values.newPassword 
      };
      
      await authService.verifyForgotPassword(payload);

      setSuccessMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => setLocation("/login"), 2000);
    } catch (err: any) {
      setServerError(err.response?.data?.error || err.message || "Failed to reset password");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-2 text-center relative">
          {step === 2 && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute left-2 top-2"
              onClick={() => setStep(1)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            {step === 1
              ? "Enter your email to receive a password reset code"
              : "Enter the OTP and your new password"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {serverError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-1">
              {serverError}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-1">
              {successMessage}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  autoComplete="email"
                  className="h-12"
                  disabled={emailForm.formState.isSubmitting}
                  {...emailForm.register("email")}
                  data-testid="input-forgot-email"
                />
                {emailForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{emailForm.formState.errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12"
                disabled={emailForm.formState.isSubmitting}
                data-testid="button-forgot-request"
              >
                {emailForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending OTP...
                  </>
                ) : (
                  "Send OTP"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/login")}
              >
                Back to Login
              </Button>
            </form>
          ) : (
            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">OTP Code</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  className="h-12 text-center text-lg tracking-widest font-mono"
                  disabled={resetForm.formState.isSubmitting}
                  {...resetForm.register("otp")}
                  data-testid="input-forgot-otp"
                />
                {resetForm.formState.errors.otp && (
                  <p className="text-xs text-destructive">{resetForm.formState.errors.otp.message}</p>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  Check your email and registered phone for OTP
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-12 pr-10"
                    disabled={resetForm.formState.isSubmitting}
                    {...resetForm.register("newPassword")}
                    data-testid="input-forgot-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {resetForm.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">{resetForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-12 pr-10"
                    disabled={resetForm.formState.isSubmitting}
                    {...resetForm.register("confirmPassword")}
                    data-testid="input-forgot-confirm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {resetForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">{resetForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12"
                disabled={resetForm.formState.isSubmitting}
                data-testid="button-forgot-verify"
              >
                {resetForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep(1);
                  resetForm.reset();
                  setServerError("");
                }}
              >
                Change Email
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
