import type { components } from "@/types/api";

export type AnnouncementResponse = components["schemas"]["AnnouncementResponseDto"];

export type Complaint = components["schemas"]["ComplaintResponseDto"];
export type ComplaintRequest = components["schemas"]["ComplaintRequestDto"];

// Payment Aliases
export type TenantPaymentResponse = components["schemas"]["TenantPaymentResponseDto"];
export type OwnerUpiResponse = components["schemas"]["OwnerUpiResponseDto"];
export type PaymentUpdateRequest = components["schemas"]["PaymentUpdateRequestDto"];
export type PaymentResponse = components["schemas"]["PaymentResponseDto"];

//Tenant Room Aliases
export type RoomResponse = components["schemas"]["RoomResponseDto"];
export type RoomApiResponse = components["schemas"]["ApiResponseRoomResponseDto"];