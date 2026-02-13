import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Users, Building2, TrendingUp, Lock } from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src="/logo.png"
              alt="StayBuki" 
              className="h-14 w-auto"
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

            <div className="flex gap-4 pt-4">
              <Button onClick={() => navigate("/register")} size="lg" className="text-lg px-8" data-testid="button-hero-register">
                Get Started
              </Button>
              <Button onClick={() => navigate("/login")} size="lg" variant="outline" className="text-lg px-8" data-testid="button-hero-login">
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
