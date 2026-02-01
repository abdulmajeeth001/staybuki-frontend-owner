import { useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";

interface TenantRouteGuardProps {
  children: React.ReactNode;
  requiresOnboarding?: boolean;
}

export function TenantRouteGuard({ children, requiresOnboarding = false }: TenantRouteGuardProps) {
  const [location, setLocation] = useLocation();
  const { user, isLoading, isTenantOnboarded, isApplicant } = useUser();

  useEffect(() => {
    // Wait for user to load
    if (isLoading) return;
    
    // If user is not authenticated after loading, redirect to login
    if (!user) {
      setLocation("/");
      return;
    }

    // If route requires NOT being onboarded (applicant-only routes like search)
    if (requiresOnboarding === false) {
      // Only applicants and non-onboarded tenants should access these routes
      if (user.userType === "tenant" && isTenantOnboarded) {
        // Only ONBOARDED tenants should be redirected to dashboard
        setLocation("/tenant-dashboard");
      }
    } 
    // If route requires being onboarded (tenant-only routes like dashboard)
    else if (requiresOnboarding === true) {
      // Only onboarded tenants should access these routes
      if (user.userType === "applicant") {
        // Applicant trying to access tenant-only pages
        setLocation("/tenant-search-pgs");
      } else if (user.userType === "tenant" && !isTenantOnboarded) {
        // Not onboarded tenant trying to access dashboard
        setLocation("/tenant-search-pgs");
      }
    }
  }, [isLoading, user, isTenantOnboarded, isApplicant, requiresOnboarding, setLocation]);

  // Show loading state while user is being fetched
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, don't render anything (redirect happens in useEffect)
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
