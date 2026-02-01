import { useEffect, useState } from "react";
import { api } from "@/apiClient";

export interface TenantProfile {
  tenantId: number | null;
  pgId: number | null;
  onboardingStatus: "not_onboarded" | "pending" | "onboarded";
  status: "active" | "inactive" | null;
}

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  mobile: string;
  gender?: "male" | "female" | "other" | null;
  userType: "owner" | "tenant" | "admin" | "applicant";
  tenantProfile?: TenantProfile;
}

export function useUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/api/auth/me");
        setUser(res.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          setUser(null);
        } else {
          setError(err.response?.data?.error || err.message || "Failed to fetch user");
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Derived flags for easier access
  const isTenantOnboarded = user?.userType === "tenant" && 
    user?.tenantProfile?.onboardingStatus === "onboarded" &&
    user?.tenantProfile?.status === "active";

  const isTenantNotOnboarded = user?.userType === "tenant" && 
    (!user?.tenantProfile || 
     user?.tenantProfile?.onboardingStatus !== "onboarded" ||
     user?.tenantProfile?.status !== "active");

  const isApplicant = user?.userType === "applicant";

  return { 
    user, 
    isLoading, 
    error,
    isTenantOnboarded,
    isTenantNotOnboarded,
    isApplicant
  };
}
