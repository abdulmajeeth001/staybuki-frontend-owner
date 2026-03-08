import { api } from "@/apiClient";
import type { 
  AnnouncementResponse, 
  Complaint, 
  ComplaintRequest,
  TenantPaymentResponse,
  OwnerUpiResponse,
  PaymentUpdateRequest,
  PaymentResponse,
  RoomResponse,
  RoomApiResponse,
  PgResponse,
  PgApiResponse,
  FacilityResponse,
  FacilityApiResponse
} from "@/types/tenant";

export const tenantService = {
  getAnnouncements: async () => {
    const { data } = await api.get<AnnouncementResponse[]>("/api/announcements/tenant");
    return data;
  },

  getRoomDetails: async (): Promise<RoomResponse | undefined> => {
    const { data } = await api.get<RoomApiResponse>("/api/tenant/room");
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch room details");
    }
    return data.data;
  },

  getTenantPg: async (): Promise<PgResponse | undefined> => {
    const { data } = await api.get<PgApiResponse>("/api/tenant/pg");
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch PG details");
    }
    return data.data;
  },

  getComplaints: async (): Promise<Complaint[]> => {
    const response = await api.get<Complaint[]>("/api/tenant/complaints");
    return response.data;
  },

  createComplaint: async (data: ComplaintRequest): Promise<Complaint> => {
    const response = await api.post<Complaint>("/api/complaints", data);
    return response.data;
  },

  getPayments: async (): Promise<TenantPaymentResponse[]> => {
    const response = await api.get<TenantPaymentResponse[]>("/api/tenant/payments");
    return response.data;
  },

  getOwnerUpi: async (): Promise<OwnerUpiResponse> => {
    const response = await api.get<OwnerUpiResponse>("/api/tenant/owner-upi");
    return response.data;
  },

  updatePayment: async (id: number, data: PaymentUpdateRequest): Promise<PaymentResponse> => {
    const response = await api.put<PaymentResponse>(`/api/payments/${id}`, data);
    return response.data;
  },

  initiateCashPayment: async (id: number): Promise<PaymentResponse> => {
    const { data } = await api.post<PaymentResponse>(`/api/payments/${id}/initiate-cash`);
    return data;
  },

  submitUpiPayment: async (
    id: number,
    payload: PaymentUpdateRequest
  ): Promise<PaymentResponse> => {
    const { data } = await api.post<PaymentResponse>(`/api/payments/${id}/submit-upi`, payload);
    return data;
  },

  getFacilities: async (): Promise<FacilityResponse[]> => {
    const { data } = await api.get<FacilityApiResponse>("/api/tenant/facilities");
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch facilities");
    }
    return data.data || [];
  },
};
