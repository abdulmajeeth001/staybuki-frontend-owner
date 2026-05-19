import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { authService } from "@/services/authService";

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const currentPath = window.location.pathname;
      const publicPaths = ["/", "/login", "/register", "/forgot-password"];

      try {
        // Add headers to prevent browser caching of the auth check
        const data = await authService.getCurrentUser({
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          }
        });

        // If user is authenticated and on a public page, redirect to dashboard
        if (publicPaths.includes(currentPath)) {
          // Redirect based on user type
          if (data.userType === "tenant") {
            setLocation("/tenant-dashboard");
          } else if (data.userType === "admin") {
            setLocation("/admin-dashboard");
          } else if (data.userType === "applicant") {
            setLocation("/tenant-search-pgs");
          } else {
            setLocation("/dashboard");
          }
        }
      } catch (error: any) {
        if (error?.response?.status !== 401 && error?.response?.status !== 403) {
          console.error("Auth check failed:", error);
        }
        if (!publicPaths.includes(currentPath)) {
          setLocation("/login");
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [setLocation]);

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <img 
            src="/logo.png" 
            alt="StayBuki" 
            className="h-32 w-auto mx-auto animate-pulse"
          />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
