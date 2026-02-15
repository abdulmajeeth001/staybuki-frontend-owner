/**
 * Route paths - centralized for type safety and maintainability
 * Similar to Java constants classes
 */
export const ROUTES = {
  // Auth routes
  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    FORGOT_PASSWORD: "/forgot-password",
    TENANT_RESET_PASSWORD: "/tenant-reset-password",
  },
  // Tenant routes
  TENANT: {
    DASHBOARD: "/tenant-dashboard",
    SETUP_PROFILE: "/tenant/setup-profile",
    SEARCH_PGS: "/tenant-search-pgs",
  },
  // Owner routes
  OWNER: {
    DASHBOARD: "/dashboard",
    ONBOARDING: "/onboarding",
  },
  // Admin routes
  ADMIN: {
    DASHBOARD: "/admin-dashboard",
  },
} as const;

/**
 * Login action types from backend
 * Maps to the "action" field in AuthResponse
 */
export const LOGIN_ACTIONS = {
  RESET_PASSWORD: "RESET_PASSWORD",
  COMPLETE_ONBOARDING: "COMPLETE_ONBOARDING",
  WAIT_FOR_APPROVAL: "WAIT_FOR_APPROVAL",
  RESOLVE_REJECTION: "RESOLVE_REJECTION",
  ACCOUNT_DEACTIVATED: "ACCOUNT_DEACTIVATED",
  GO_TO_DASHBOARD: "GO_TO_DASHBOARD",
} as const;

/**
 * User types
 */
export const USER_TYPES = {
  TENANT: "tenant",
  APPLICANT: "applicant",
  ADMIN: "admin",
  OWNER: "owner",
} as const;
