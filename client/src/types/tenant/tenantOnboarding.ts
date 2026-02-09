export interface TenantOnboardingStatusResponse {
  isOnboarded: boolean;
  pgId: number | null;
  pgName: string | null;
}