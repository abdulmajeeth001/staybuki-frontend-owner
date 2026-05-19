import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Users, Building2, TrendingUp, Lock, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query"; // Added
import { authService } from "@/services/authService";

export default function Home() {
  const [, navigate] = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // --- 1. SILENT AUTH CHECK ---
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const data = await authService.getCurrentUser();
        return data;
      } catch (err) {
        return null; // Return null if not logged in (401 error)
      }
    },
    retry: false, // Don't retry for the landing page check
    staleTime: 1000 * 60 * 5, // Keep check valid for 5 mins
  });

  // --- 2. AUTO-REDIRECT LOGIC ---
  useEffect(() => {
    // Ensure user is truly authenticated by verifying userType exists
    if (user && user.userType && !isLoading) {
      const userType = user.userType.toLowerCase().trim();
      if (userType === "tenant") {
        navigate("/tenant-dashboard");
      } else if (userType === "admin") {
        navigate("/admin-dashboard");
      } else if (userType === "applicant") {
        navigate("/tenant-search-pgs");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  // If still loading the auth check, we just show the background 
  // to prevent "flickering" of the landing page content for logged-in users.
  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <img src="/logo.png" alt="StayBuki" className="h-16 w-auto animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center shrink-0">
            <img 
              src="/logo.png"
              alt="StayBuki" 
              className="h-10 sm:h-14 w-auto object-contain"
              width={180}
              height={56}
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/login")} variant="outline" data-testid="button-nav-login">
              Login
            </Button>
            <Button onClick={() => navigate("/register")} data-testid="button-nav-register">
              Register
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div>
              <h2 className="text-5xl lg:text-6xl font-bold text-foreground mb-4">
                Manage Your PG <span className="text-primary">Effortlessly</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                StayBuki is a comprehensive PG management solution that helps you handle tenants, payments, maintenance, and more—all in one place.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {deferredPrompt && (
                <Button onClick={handleInstallClick} size="lg" className="text-lg px-8 gap-2 shadow-lg animate-pulse" data-testid="button-hero-install">
                  <Download className="w-5 h-5" />
                  Install App
                </Button>
              )}
              
              <Button onClick={() => navigate("/register")} size="lg" variant={deferredPrompt ? "secondary" : "default"} className="text-lg px-8 shadow-md" data-testid="button-hero-register">
                Get Started
              </Button>
              
              <Button onClick={() => navigate("/login")} size="lg" variant="outline" className="text-lg px-8 bg-background/50" data-testid="button-hero-login">
                Login
              </Button>
            </div>
          </div>

          {/* Right Visual */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-6 space-y-3 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-foreground">Tenant Management</h3>
              <p className="text-sm text-muted-foreground">Track all your tenants with complete profiles and documents</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-3 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-foreground">Payment Tracking</h3>
              <p className="text-sm text-muted-foreground">Monitor rent payments and create payment reminders</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-3 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-foreground">Room Management</h3>
              <p className="text-sm text-muted-foreground">Organize rooms, amenities, and occupancy status</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-3 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-foreground">Secure & Reliable</h3>
              <p className="text-sm text-muted-foreground">Your data is encrypted and backed up securely</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-card/50 backdrop-blur-sm border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">
            Everything You Need to Run Your PG
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-foreground">Dashboard</h3>
              <p className="text-muted-foreground">Get a complete overview of your PG operations with real-time insights</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-foreground">Notifications</h3>
              <p className="text-muted-foreground">Stay updated with payment reminders, complaints, and maintenance alerts</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-foreground">Reports</h3>
              <p className="text-muted-foreground">Generate detailed reports on occupancy, payments, and revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary/5 border-t border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">Ready to Simplify Your PG Management?</h2>
          <p className="text-lg text-muted-foreground mb-8">Join thousands of PG owners using StayBuki to manage their properties efficiently</p>
          <Button onClick={() => navigate("/register")} size="lg" className="text-lg px-12" data-testid="button-cta-register">
            Start Your Free Trial
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-muted-foreground">
          <p>&copy; 2024 StayBuki. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}