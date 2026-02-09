// src/types/auth.ts

// 1. The specific actions the backend can return
export type LoginAction = 
  | "GO_TO_DASHBOARD"
  | "COMPLETE_ONBOARDING"
  | "WAIT_FOR_APPROVAL"
  | "RESOLVE_REJECTION"
  | "ACCOUNT_DEACTIVATED"
  | "RESET_PASSWORD";

// 2. The User Profile structure
export interface UserProfile {
  id: number;
  email: string;
  name: string;
  userType: "owner" | "tenant" | "admin" | "applicant";
}

// 3. Tenant specific details (optional)
export interface TenantProfile {
  tenantId: number | null;
  pgId: number | null;
  onboardingStatus: "onboarded" | "not_onboarded" | "pending";
  status: string | null;
}

// 4. The main API Response structure
export interface AuthResponse {
  success: boolean;
  user: UserProfile;
  action: LoginAction;
  accessToken?: string;       // Optional because rejected users might not get tokens
  refreshToken?: string;
  message?: string;           // Error reason (e.g. "PG Rejected due to...")
  tenantProfile?: TenantProfile; 
}