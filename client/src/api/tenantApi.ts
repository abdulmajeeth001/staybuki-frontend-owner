import { api } from "@/apiClient";
import {
  TenantOnboardingStatusResponse,
  TenantDashboardResponse,
} from "@/types/tenant";

export const tenantApi = {
  /** Get onboarding status */
  getOnboardingStatus: async () => {
    const { data } = await api.get<TenantOnboardingStatusResponse>(
      "/api/tenant/onboarding-status"
    );
    return data;
  },

  /** Get tenant dashboard */
  getDashboard: async () => {
    const { data } = await api.get<TenantDashboardResponse>(
      "/api/tenant/dashboard"
    );
    return data;
  },
};