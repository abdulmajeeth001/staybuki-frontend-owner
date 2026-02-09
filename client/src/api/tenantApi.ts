import { api } from "@/apiClient";
import {
  TenantOnboardingStatusResponse,
  TenantDashboardResponse,
} from "@/types/tenant";

export const tenantApi = {
  /** Onboarding status */
  getOnboardingStatus: async (): Promise<TenantOnboardingStatusResponse> => {
    const response = await api.get<TenantOnboardingStatusResponse>(
      "/api/tenant/onboarding-status"
    );
    return response.data;
  },

  /** Tenant dashboard */
  getDashboard: async (): Promise<TenantDashboardResponse> => {
    const response = await api.get<TenantDashboardResponse>(
      "/api/tenant/dashboard"
    );
    return response.data;
  },
};