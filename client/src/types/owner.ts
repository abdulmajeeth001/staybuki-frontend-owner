import { components } from "@/types/api";

// Type aliases for API schemas
export type OnboardingResponse = components["schemas"]["OnboardingRequestResponseDto"];
export type BedResponse = components["schemas"]["BedResponseDto"];
export type TenantResponse = components["schemas"]["TenantResponseDto"];
export type RoomLegacyResponse = components["schemas"]["RoomLegacyResponseDto"];
export type RoomResponse = components["schemas"]["RoomResponseDto"];
export type RoomRequest = components["schemas"]["RoomRequestDto"];
export type TenantRequest = components["schemas"]["TenantRequestDto"];
export type EmergencyContactRequest = components["schemas"]["EmergencyContactRequestDto"];
export type EmergencyContactResponse = components["schemas"]["EmergencyContactResponseDto"];
export type BulkBedRequest = components["schemas"]["BulkBedRequestDto"];

// Payloads for mutations
export type ApproveOnboardingRequestPayload = {
  bedId?: number;
};

export type RejectOnboardingRequestPayload = {
  reason: string;
};

export type AssignBedPayload = {
  tenantId: number;
};

export type DeleteTenantPayload = {
  ownerFeedback?: string;
  rating?: number;
  behaviorTags?: string[];
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