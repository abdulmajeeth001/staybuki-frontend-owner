import { components } from "@/types/api";

// Type aliases for API schemas
export type OnboardingResponse = components["schemas"]["OnboardingRequestResponseDto"];
export type BedResponse = components["schemas"]["BedResponseDto"];

// Payloads for mutations
export type ApproveOnboardingRequestPayload = {
  bedId?: number;
};

export type RejectOnboardingRequestPayload = {
  reason: string;
};

// The TenantHistory interface is part of the OnboardingRequestResponseDto,
// but if it were standalone, it would be defined like this:
export type TenantHistory = components["schemas"]["TenantHistoryDto"];

// Assuming ApiResponse is defined in types/api.ts
declare module "@/types/api" {
  export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
    details?: any;
  }
}