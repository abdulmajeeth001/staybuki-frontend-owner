import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { api } from "@/apiClient";

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Add headers to prevent browser caching of the auth check
        const res = await api.get("/api/auth/me", {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          }
        });
        const data = res.data;

          const currentPath = window.location.pathname;
          
          // If user is authenticated and on a public page, redirect to dashboard
          const publicPaths = ["/", "/login", "/register", "/forgot-password"];
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
      } catch (error) {
        console.error("Auth check failed:", error);
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
