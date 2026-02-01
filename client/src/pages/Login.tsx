import { useState } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api } from "@/apiClient";
export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const response = await api.post("/api/auth/login", { email, password, rememberMe });
      const data = response.data;
          
      // Check if password reset is required (newly created tenants)
      if (data.passwordResetRequired) {
        setLocation("/tenant-reset-password");
        return;
      }

      // Otherwise use redirect URL or default to dashboard
      setLocation("/dashboard");
    } catch (err: any) {
      // Axios wraps the error response in `err.response.data`
      const message = err.response?.data?.error || err.message || "Login failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 max-w-md mx-auto">
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
            className="h-32 w-auto mx-auto"
          />
          <p className="text-muted-foreground mt-4">Manage your PG smarter, not harder.</p>
        </div>

        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                  required 
                  className="h-12 bg-background/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-login-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    required 
                    className="h-12 bg-background/50 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-login-password"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <label 
                  className="flex items-center gap-2 cursor-pointer select-none"
                  onClick={() => setRememberMe(!rememberMe)}
                  data-testid="label-remember-me"
                >
                  <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${
                    rememberMe 
                      ? 'bg-primary border-primary' 
                      : 'border-muted-foreground/50 hover:border-primary/50'
                  }`}>
                    {rememberMe && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-primary font-medium hover:underline" data-testid="link-forgot-password">Forgot password?</Link>
              </div>
              <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading} data-testid="button-login-submit">
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
