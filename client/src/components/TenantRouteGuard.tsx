import { useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";

interface TenantRouteGuardProps {
  children: React.ReactNode;
  requiresOnboarding?: boolean;
}

export function TenantRouteGuard({ children, requiresOnboarding = false }: TenantRouteGuardProps) {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading) return;

    // 1. If not logged in, go to login
    if (!user) {
      setLocation("/login");
      return;
    }

    // 2. Extract onboarding status (Matches your Java Response Logic)
    // We assume your Java DTO fix provides this inside the user object
    const isOnboarded = user.tenantProfile?.onboardingStatus === "onboarded" && user.tenantProfile?.status === "active";

    // 3. User is a tenant
    if (user.userType === "tenant") {
      if (requiresOnboarding && !isOnboarded) {
        // Trying to access dashboard but NOT onboarded
        setLocation("/tenant-search-pgs");
      } else if (!requiresOnboarding && isOnboarded && !window.location.pathname.startsWith('/pg/')) {
        // Trying to access search but ALREADY onboarded (except for specific PG detail views)
        setLocation("/tenant-dashboard");
      }
    } 
    // 4. User is still an applicant
    else if (user.userType === "applicant" && requiresOnboarding) {
      setLocation("/tenant-search-pgs");
    }
    
  }, [isLoading, user, requiresOnboarding, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return user ? <>{children}</> : null;
}