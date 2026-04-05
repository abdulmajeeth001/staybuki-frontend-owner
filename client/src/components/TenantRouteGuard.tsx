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
  console.log("TenantRouteGuard", { userType: user?.userType, isLoading, requiresOnboarding, path: window.location.pathname });
  useEffect(() => {
    if (isLoading) return;

    // 1. If not logged in, go to login
    if (!user) {
      setLocation("/login");
      return;
    }

    const userType = (user.userType || "").toLowerCase().trim();

    // 2. User is a tenant
    if (userType === "tenant") {
      // A user with userType "tenant" inherently has a PG and is onboarded.
      if (!requiresOnboarding && !window.location.pathname.startsWith('/pg/')) {
        setLocation("/tenant-dashboard");
      }
    } 
    // 3. User is still an applicant
    else if (userType === "applicant" && requiresOnboarding) {
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