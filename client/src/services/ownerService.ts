import { api } from "@/apiClient";
import { ApiResponse } from "@/types/api";
import {
  OnboardingResponse,
  ApproveOnboardingRequestPayload,
  RejectOnboardingRequestPayload,
  BedResponse,
  TenantResponse,
  RoomResponse,
  RoomLegacyResponse,
  TenantRequest,
  RoomRequest,
  BulkBedRequest,
  AssignBedPayload,
  EmergencyContactRequest,
  EmergencyContactResponse,
} from "@/types/owner";

export const ownerService = {
  /**
   * Fetches a list of all onboarding requests for the owner's PG.
   * @returns A promise that resolves to an array of OnboardingResponse objects.
   * @throws An error if the API call fails or the response indicates an error.
   */
  async getOnboardingRequests(): Promise<OnboardingResponse[]> {
    const response = await api.get<ApiResponse<OnboardingResponse[]> | OnboardingResponse[]>("/api/owner/onboarding-requests");
    const data = (response.data as any).data || response.data;
    return Array.isArray(data) ? data : [];
  },

  /**
   * Approves a specific onboarding request.
   * @param id The ID of the onboarding request to approve.
   * @param payload The payload containing optional bedId for assignment.
   * @returns A promise that resolves to the approved OnboardingResponse object.
   * @throws An error if the API call fails or the response indicates an error.
   */
  async approveOnboardingRequest(id: number, payload: ApproveOnboardingRequestPayload): Promise<OnboardingResponse> {
    const response = await api.post<ApiResponse<OnboardingResponse> | OnboardingResponse>(`/api/owner/onboarding-requests/${id}/approve`, payload);
    return (response.data as any).data || response.data;
  },

  /**
   * Rejects a specific onboarding request with a given reason.
   * @param id The ID of the onboarding request to reject.
   * @param payload The payload containing the rejection reason.
   * @returns A promise that resolves to the rejected OnboardingResponse object.
   * @throws An error if the API call fails or the response indicates an error.
   */
  async rejectOnboardingRequest(id: number, payload: RejectOnboardingRequestPayload): Promise<OnboardingResponse> {
    const response = await api.post<ApiResponse<OnboardingResponse> | OnboardingResponse>(`/api/owner/onboarding-requests/${id}/reject`, payload);
    return (response.data as any).data || response.data;
  },

  /**
   * Fetches available beds for a given room.
   * @param roomId The ID of the room to fetch beds for.
   * @returns A promise that resolves to an array of Bed objects.
   * @throws An error if the API call fails or the response indicates an error.
   */
  async getRoomBeds(roomId: number | undefined): Promise<BedResponse[]> {
    if (!roomId) return [];
    const response = await api.get<ApiResponse<BedResponse[]> | BedResponse[]>(`/api/rooms/${roomId}/beds`);
    const data = (response.data as any).data || response.data;
    return Array.isArray(data) ? data : [];
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

  /**
   * Fetches a list of all rooms.
   * @returns A promise that resolves to an array of RoomResponse objects.
   */
  async getRooms(): Promise<RoomResponse[]> {
    // The backend returns a legacy response wrapper, so we type the API call accordingly.
    const response = await api.get<ApiResponse<RoomLegacyResponse[]> | RoomLegacyResponse[]>("/api/rooms");
    const data = (response.data as any).data || response.data;
    if (Array.isArray(data)) {
      return data.map((item: any) => item.room || item);
    }
    return [];
  },

  /**
   * Fetches available beds for a given room (using v1 API path).
   */
  async getBedsByRoom(roomId: number): Promise<BedResponse[]> {
    const response = await api.get<ApiResponse<BedResponse[]> | BedResponse[]>(`/api/v1/beds/room/${roomId}`);
    const data = (response.data as any).data || response.data;
    return Array.isArray(data) ? data : [];
  },

  /**
   * Creates a new tenant.
   */
  async createTenant(payload: TenantRequest | any): Promise<TenantResponse> {
    const response = await api.post<ApiResponse<TenantResponse>>("/api/tenants", payload);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to create tenant");
  },

  /**
   * Fetches a single room by ID.
   */
  async getRoomById(id: number): Promise<RoomResponse> {
    const response = await api.get<ApiResponse<RoomLegacyResponse | RoomResponse>>(`/api/rooms/${id}`);
    const data = (response.data as any).data || response.data;
    return data.room || data;
  },

  /**
   * Fetches all tenants.
   */
  async getAllTenants(): Promise<TenantResponse[]> {
    const response = await api.get<ApiResponse<TenantResponse[]> | TenantResponse[]>("/api/tenants");
    return (response.data as any).data || response.data;
  },

  /**
   * Updates an existing room.
   */
  async updateRoom(id: number, payload: RoomRequest | any): Promise<RoomResponse> {
    const response = await api.put<ApiResponse<RoomResponse> | RoomResponse>(`/api/rooms/${id}`, payload);
    return (response.data as any).data || response.data;
  },

  /**
   * Deletes a room.
   */
  async deleteRoom(id: number): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/api/rooms/${id}`);
    if (response.data && (response.data as any).success === false) {
      throw new Error((response.data as any).message || "Failed to delete room");
    }
  },

  /**
   * Bulk updates bed positions for a specific room (v1).
   */
  async bulkUpdateBeds(roomId: number, payload: BulkBedRequest | any): Promise<BedResponse[]> {
    const response = await api.post<ApiResponse<BedResponse[]> | BedResponse[]>(`/api/v1/beds/room/${roomId}/bulk`, payload);
    return (response.data as any).data || response.data;
  },

  async assignBed(bedId: number, payload: AssignBedPayload): Promise<BedResponse> {
    const response = await api.post<ApiResponse<BedResponse> | BedResponse>(`/api/v1/beds/${bedId}/assign`, payload);
    return (response.data as any).data || response.data;
  },

  async vacateBed(bedId: number): Promise<BedResponse> {
    const response = await api.post<ApiResponse<BedResponse> | BedResponse>(`/api/v1/beds/${bedId}/vacate`);
    return (response.data as any).data || response.data;
  },

  /**
   * Fetches a single tenant by ID.
   */
  async getTenantById(id: number): Promise<TenantResponse> {
    const response = await api.get<ApiResponse<TenantResponse> | TenantResponse>(`/api/tenants/${id}`);
    return (response.data as any).data || response.data;
  },

  /**
   * Updates an existing tenant.
   */
  async updateTenant(id: number, payload: TenantRequest | any): Promise<TenantResponse> {
    const response = await api.put<ApiResponse<TenantResponse> | TenantResponse>(`/api/tenants/${id}`, payload);
    return (response.data as any).data || response.data;
  },

  async getEmergencyContacts(tenantId: number): Promise<EmergencyContactResponse[]> {
    const response = await api.get<ApiResponse<EmergencyContactResponse[]> | EmergencyContactResponse[]>(`/api/tenants/${tenantId}/emergency-contacts`);
    return (response.data as any).data || response.data;
  },

  async addEmergencyContact(tenantId: number, payload: EmergencyContactRequest | any): Promise<{ contact: EmergencyContactResponse }> {
    const response = await api.post<ApiResponse<{ contact: EmergencyContactResponse }> | { contact: EmergencyContactResponse }>(`/api/tenants/${tenantId}/emergency-contacts`, payload);
    return (response.data as any).data || response.data;
  },

  async deleteEmergencyContact(contactId: number): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/api/emergency-contacts/${contactId}`);
    if (response.data && (response.data as any).success === false) {
      throw new Error((response.data as any).message || "Failed to delete emergency contact");
    }
  }
};