import { api } from "@/apiClient";
import type { AnnouncementResponse, Complaint, ComplaintRequest } from "@/types/tenant";

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
};
