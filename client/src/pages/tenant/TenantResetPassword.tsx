import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/apiClient";

export default function TenantResetPassword() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1); // 1: Enter password, 2: Enter OTP
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/api/auth/reset-password", { newPassword, confirmPassword });

      setSuccess("OTP sent to your email and mobile");
      setTimeout(() => setStep(2), 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to request password reset");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (otp.length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/api/auth/verify-password-reset", { newPassword, otp });

      setSuccess("Password reset successfully!");
      setTimeout(() => setLocation("/tenant-dashboard"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Set Your Password</CardTitle>
          <p className="text-sm text-muted-foreground">
            {step === 1
              ? "Create a strong password for your account"
              : "Enter the OTP sent to your email and mobile"}
          </p>
        </CardHeader>

        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleRequestPasswordReset} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    minLength={8}
                    required
                    className="h-12 pr-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    data-testid="input-reset-password"
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
              </div>

              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    minLength={8}
                    required
                    className="h-12 pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    data-testid="input-reset-confirm"
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
              </div>

              <Button
                type="submit"
                className="w-full h-12"
                disabled={isLoading}
                data-testid="button-reset-continue"
              >
                {isLoading ? "Processing..." : "Continue"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <div className="space-y-2">
                <Label>Enter OTP</Label>
                <Input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  required
                  className="h-12 text-center text-lg tracking-widest font-mono"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  data-testid="input-reset-otp"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Check your email and mobile for OTP
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12"
                disabled={isLoading || otp.length !== 6}
                data-testid="button-reset-verify"
              >
                {isLoading ? "Verifying..." : "Verify & Reset"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                }}
              >
                Back
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
