import { api } from "@/apiClient";
import type { AnnouncementResponse } from "@/types/tenant";

export const tenantService = {
  getAnnouncements: async () => {
    const { data } = await api.get<AnnouncementResponse[]>("/api/announcements/tenant");
    return data;
  },
};
