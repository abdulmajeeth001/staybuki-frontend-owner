import { api } from "@/apiClient";
import { ApiResponse } from "@/types/api";
import {
  OnboardingResponse,
  ApproveOnboardingRequestPayload,
  RejectOnboardingRequestPayload,
  BedResponse,
  TenantResponse,
  RoomResponse,
  RoomRequest,
  BulkBedRequest,
} from "@/types/owner";

export const ownerService = {
  /**
   * Fetches a list of all onboarding requests for the owner's PG.
   * @returns A promise that resolves to an array of OnboardingResponse objects.
   * @throws An error if the API call fails or the response indicates an error.
   */
  async getOnboardingRequests(): Promise<OnboardingResponse[]> {
    const response = await api.get<ApiResponse<OnboardingResponse[]>>("/api/owner/onboarding-requests");
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to fetch onboarding requests");
  },

  /**
   * Approves a specific onboarding request.
   * @param id The ID of the onboarding request to approve.
   * @param payload The payload containing optional bedId for assignment.
   * @returns A promise that resolves to the approved OnboardingResponse object.
   * @throws An error if the API call fails or the response indicates an error.
   */
  async approveOnboardingRequest(id: number, payload: ApproveOnboardingRequestPayload): Promise<OnboardingResponse> {
    const response = await api.post<ApiResponse<OnboardingResponse>>(`/api/owner/onboarding-requests/${id}/approve`, payload);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to approve onboarding request");
  },

  /**
   * Rejects a specific onboarding request with a given reason.
   * @param id The ID of the onboarding request to reject.
   * @param payload The payload containing the rejection reason.
   * @returns A promise that resolves to the rejected OnboardingResponse object.
   * @throws An error if the API call fails or the response indicates an error.
   */
  async rejectOnboardingRequest(id: number, payload: RejectOnboardingRequestPayload): Promise<OnboardingResponse> {
    const response = await api.post<ApiResponse<OnboardingResponse>>(`/api/owner/onboarding-requests/${id}/reject`, payload);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to reject onboarding request");
  },

  /**
   * Fetches available beds for a given room.
   * @param roomId The ID of the room to fetch beds for.
   * @returns A promise that resolves to an array of Bed objects.
   * @throws An error if the API call fails or the response indicates an error.
   */
  async getRoomBeds(roomId: number | undefined): Promise<BedResponse[]> {
    const response = await api.get<ApiResponse<BedResponse[]> | BedResponse[]>(`/api/rooms/${roomId}/beds`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to fetch room beds");
  },

  /**
   * Fetches a list of available tenants.
   * @returns A promise that resolves to an array of TenantResponse objects.
   */
  async getAvailableTenants(): Promise<TenantResponse[]> {
    const response = await api.get<ApiResponse<TenantResponse[]> | TenantResponse[]>("/api/tenants/available-tenants");
    return (response.data as any).data || response.data;
  },

  /**
   * Creates a new room.
   * @param payload The room details payload.
   * @returns A promise that resolves to the created RoomResponse.
   */
  async createRoom(payload: RoomRequest): Promise<RoomResponse> {
    const response = await api.post<ApiResponse<RoomResponse> | RoomResponse>("/api/rooms", payload);
    return (response.data as any).data || response.data;
  },

  /**
   * Bulk creates bed positions for a specific room.
   * @param roomId The ID of the room.
   * @param payload The beds details payload.
   * @returns A promise that resolves to an array of created Bed objects.
   */
  async bulkCreateBeds(roomId: number, payload: BulkBedRequest): Promise<BedResponse[]> {
    const response = await api.post<ApiResponse<BedResponse[]> | BedResponse[]>(`/api/rooms/${roomId}/beds/bulk`, payload);
    return (response.data as any).data || response.data;
  },
};