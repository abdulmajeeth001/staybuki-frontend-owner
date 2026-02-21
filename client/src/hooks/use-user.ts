import { useQuery } from "@tanstack/react-query";
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
  const { data: user = null, isLoading, error: queryError } = useQuery<CurrentUser | null>({
    queryKey: ["current-user"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/auth/me");
        return res.data;
      } catch (err: any) {
        if (err.response?.status === 401) {
          return null;
        }
        throw new Error(err.response?.data?.error || err.message || "Failed to fetch user");
      }
    },
    staleTime: 1000 * 60 * 30, // Cache user data for 30 minutes
    retry: false,
  });

  const error = queryError ? (queryError as Error).message : null;

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
