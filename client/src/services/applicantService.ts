import { api } from "@/apiClient";
import type { 
  PgSearchRequest, 
  PgSearchApiResponse, 
  PgSearchResult,
  PgDetailsResponse,
  PgDetailsApiResponse,
  VisitRequestResponse,
  VisitRequestListApiResponse,
  VisitRequestApiResponse,
  CreateVisitRequest,
  BedResponse,
  BedListApiResponse,
  AmenityResponse,
  RoomDetailsResponse,
  RoomDetailsApiResponse,
  OnboardingRequestResponse,
  OnboardingRequestApiResponse
} from "@/types/applicant";

export const applicantService = {
  /**
   * Get all amenities
   */
  getAmenities: async (activeOnly: boolean = true): Promise<AmenityResponse[]> => {
    try {
      const { data } = await api.get<AmenityResponse[]>(`/api/amenities?activeOnly=${activeOnly}`);
      return data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || "Failed to fetch amenities");
    }
  },

  /**
   * Search for PGs based on various filters including location, amenities, and PG type.
   */
  searchPgs: async (filters: PgSearchRequest): Promise<PgSearchResult[]> => {
    try {
      const { data } = await api.post<PgSearchApiResponse | PgSearchResult[]>(
        `/api/applicant/search`,
        filters
      );
      
      // Safely handle API wrapper response, if standard wrapper is returned
      if (data && typeof data === "object" && "success" in data) {
        if (!(data as PgSearchApiResponse).success) {
          throw new Error((data as PgSearchApiResponse).message || "Failed to search PGs");
        }
        return (data as PgSearchApiResponse).data || [];
      }
      
      // Fallback if backend returns the raw array instead of wrapper
      return (data as PgSearchResult[]) || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || "Failed to search PGs");
    }
  },

  /**
   * Get PG Details by ID
   */
  getPgDetails: async (pgId: number): Promise<PgDetailsResponse> => {
    try {
      const { data } = await api.get<PgDetailsApiResponse | PgDetailsResponse>(
        `/api/applicant/pgs/${pgId}`
      );
      
      if (data && typeof data === "object" && "success" in data) {
        if (!(data as PgDetailsApiResponse).success) {
          throw new Error((data as PgDetailsApiResponse).message || "Failed to fetch PG details");
        }
        return (data as PgDetailsApiResponse).data as PgDetailsResponse;
      }
      
      return data as PgDetailsResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || "Failed to fetch PG details");
    }
  },

  /**
   * Get user's visit requests
   */
  getVisitRequests: async (): Promise<VisitRequestResponse[]> => {
    try {
      const { data } = await api.get<VisitRequestListApiResponse | VisitRequestResponse[]>(
        `/api/tenant/visit-requests`
      );
      
      if (data && typeof data === "object" && "success" in data) {
        if (!(data as VisitRequestListApiResponse).success) {
          throw new Error((data as VisitRequestListApiResponse).message || "Failed to fetch visit requests");
        }
        return (data as VisitRequestListApiResponse).data || [];
      }
      
      return (data as VisitRequestResponse[]) || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || "Failed to fetch visit requests");
    }
  },

  /**
   * Create a new visit request
   */
  createVisitRequest: async (requestData: CreateVisitRequest): Promise<VisitRequestResponse> => {
    try {
      const { data } = await api.post<VisitRequestApiResponse | VisitRequestResponse>(
        `/api/tenant/visit-requests`,
        requestData
      );
      
      if (data && typeof data === "object" && "success" in data) {
        if (!(data as VisitRequestApiResponse).success) {
          throw new Error((data as VisitRequestApiResponse).message || "Failed to create visit request");
        }
        return (data as VisitRequestApiResponse).data as VisitRequestResponse;
      }
      
      return data as VisitRequestResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || "Failed to create visit request");
    }
  },

  /**
   * Get bed positions for a specific room
   */
  getRoomBeds: async (roomId: number): Promise<BedResponse[]> => {
    try {
      const { data } = await api.get<BedListApiResponse | BedResponse[]>(
        `/api/rooms/${roomId}/beds`
      );
      
      if (data && typeof data === "object" && "success" in data) {
        if (!(data as BedListApiResponse).success) {
          throw new Error((data as BedListApiResponse).message || "Failed to fetch room beds");
        }
        return (data as BedListApiResponse).data || [];
      }
      
      return (data as BedResponse[]) || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || "Failed to fetch room beds");
    }
  },

  /**
   * Get Room Details by ID for an applicant/tenant.
   */
  getRoomDetails: async (roomId: number): Promise<RoomDetailsResponse> => {
    try {
      const { data } = await api.get<RoomDetailsApiResponse | RoomDetailsResponse>(
        `/api/tenant/rooms/${roomId}`
      );
      
      if (data && typeof data === "object" && "success" in data) {
        if (!(data as RoomDetailsApiResponse).success) {
          throw new Error((data as RoomDetailsApiResponse).message || "Failed to fetch room details");
        }
        return (data as RoomDetailsApiResponse).data as RoomDetailsResponse;
      }
      
      return data as RoomDetailsResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || "Failed to fetch room details");
    }
  },

  /**
   * Create a new onboarding request.
   */
  createOnboardingRequest: async (formData: FormData): Promise<OnboardingRequestResponse> => {
    try {
      const { data } = await api.post<OnboardingRequestApiResponse | OnboardingRequestResponse>(
        `/api/tenant/onboarding-requests`,
        formData
      );
      
      if (data && typeof data === "object" && "success" in data) {
        if (!(data as OnboardingRequestApiResponse).success) {
          throw new Error((data as OnboardingRequestApiResponse).message || "Failed to create onboarding request");
        }
        return (data as OnboardingRequestApiResponse).data as OnboardingRequestResponse;
      }
      
      return data as OnboardingRequestResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || "Failed to create onboarding request");
    }
  },
};