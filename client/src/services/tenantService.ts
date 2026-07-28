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
  FacilityApiResponse,
  TenantProfileResponse,
  TenantProfileApiResponse,
  ResetPasswordRequest,
  VerifyPasswordResetRequest,
  VisitRequestResponse,
  OnboardingRequestResponse,
  OnboardingRequestApiResponse,
  VisitRequestListApiResponse,
  VisitRequestApiResponse,
  VoidApiResponse
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

  // submitUpiPayment: async (
  //   id: number,
  //   payload: PaymentUpdateRequest,
  // ): Promise<PaymentResponse> => {
  //   const { data } = await api.post<PaymentResponse>(`/api/payments/${id}/submit-upi`, payload);
  //   return data;
  // },

  submitUpiPayment: async (
  id: number,
  payload: PaymentUpdateRequest,
  screenshot: File
): Promise<PaymentResponse> => {
  const formData = new FormData();

  formData.append(
    "req",
    new Blob(
      [
        JSON.stringify({
          transactionId: payload.transactionId,
          paymentMethod: payload.paymentMethod,
        }),
      ],
      {
        type: "application/json",
      }
    )
  );

  formData.append("paymentProof", screenshot);
  const { data } = await api.post<PaymentResponse>(
    `/api/payments/${id}/submit-upi`,
    formData
  );

  return data;
},

  getFacilities: async (): Promise<FacilityResponse[]> => {
    const { data } = await api.get<FacilityApiResponse>("/api/tenant/facilities");
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch facilities");
    }
    return data.data || [];
  },

  getProfile: async (): Promise<TenantProfileResponse | undefined> => {
    const { data } = await api.get<TenantProfileApiResponse>("/api/tenant/profile");
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch profile");
    }
    return data.data;
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    const response = await api.post("/api/auth/reset-password", data);
    return response.data;
  },

  verifyResetPassword: async (data: VerifyPasswordResetRequest) => {
    const response = await api.post("/api/auth/verify-password-reset", data);
    return response.data;
  },

  getVisitRequests: async (): Promise<VisitRequestResponse[]> => {
    const { data } = await api.get<VisitRequestListApiResponse>("/api/tenant/visit-requests");
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch visit requests");
    }
    return data.data || [];
  },

  getOnboardingRequestByPgId: async (pgId: number): Promise<OnboardingRequestResponse | undefined> => {
    const { data } = await api.get<OnboardingRequestApiResponse>(`/api/tenant/onboarding-requests/${pgId}`);
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch onboarding request");
    }
    return data.data;
  },

  getOnboardingRequestsForPgs: async function (pgIds: number[]): Promise<Record<number, OnboardingRequestResponse>> {
    if (pgIds.length === 0) {
      return {};
    }

    const requests = await Promise.all(
      pgIds.map(async (pgId) => {
        try {
          // Using `this` to call another method within the same service object.
          const data = await this.getOnboardingRequestByPgId(pgId);
          return { pgId, data };
        } catch {
          // If a request for a specific PG fails (e.g., 404 Not Found), we treat it as null.
          return { pgId, data: null };
        }
      })
    );

    const map: Record<number, OnboardingRequestResponse> = {};
    requests.forEach(({ pgId, data }) => {
      if (data) {
        map[pgId] = data;
      }
    });
    return map;
  },

  acceptVisitReschedule: async (id: number): Promise<VisitRequestResponse | undefined> => {
    const { data } = await api.patch<VisitRequestApiResponse>(`/api/tenant/visit-requests/${id}/accept-reschedule`);
    if (!data.success) {
      throw new Error(data.message || "Failed to accept reschedule");
    }
    return data.data;
  },

  completeVisit: async (id: number): Promise<VisitRequestResponse | undefined> => {
    const { data } = await api.patch<VisitRequestApiResponse>(`/api/tenant/visit-requests/${id}/complete`);
    if (!data.success) {
      throw new Error(data.message || "Failed to complete visit");
    }
    return data.data;
  },

  cancelVisit: async (id: number): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.delete<VoidApiResponse>(`/api/tenant/visit-requests/${id}`);
    if (!data.success) {
      throw new Error(data.message || "Failed to cancel visit");
    }
    return { success: true, message: data.message || "Visit cancelled successfully" };
  },
};
