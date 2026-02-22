import { api } from "@/apiClient";
import type { 
  AnnouncementResponse, 
  Complaint, 
  ComplaintRequest,
  TenantPaymentResponseDto,
  OwnerUpiResponseDto,
  PaymentUpdateRequestDto,
  PaymentResponseDto
} from "@/types/tenant";

export const tenantService = {
  getAnnouncements: async () => {
    const { data } = await api.get<AnnouncementResponse[]>("/api/announcements/tenant");
    return data;
  },

  getComplaints: async (): Promise<Complaint[]> => {
    const response = await api.get<Complaint[]>("/api/tenant/complaints");
    return response.data;
  },

  createComplaint: async (data: ComplaintRequest): Promise<Complaint> => {
    const response = await api.post<Complaint>("/api/complaints", data);
    return response.data;
  },

  getPayments: async (): Promise<TenantPaymentResponseDto[]> => {
    const response = await api.get<TenantPaymentResponseDto[]>("/api/tenant/payments");
    return response.data;
  },

  getOwnerUpi: async (): Promise<OwnerUpiResponseDto> => {
    const response = await api.get<OwnerUpiResponseDto>("/api/tenant/owner-upi");
    return response.data;
  },

  updatePayment: async (id: number, data: PaymentUpdateRequestDto): Promise<PaymentResponseDto> => {
    const response = await api.put<PaymentResponseDto>(`/api/payments/${id}`, data);
    return response.data;
  },
};
