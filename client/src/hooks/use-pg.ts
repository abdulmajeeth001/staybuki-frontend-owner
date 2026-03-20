import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/apiClient";
import { useCallback } from "react";
import { useUser } from "./use-user";

export interface PG {
  id: number;
  pgName: string;
  pgAddress?: string;
  pgLocation?: string;
  latitude?: string;
  longitude?: string;
  imageUrl?: string;
  totalRooms?: number;
  rentPaymentDate?: number;
  registrationNumber?: string;
  registrationDocumentUrl?: string;
  fssaiCertificateUrl?: string;
  isPrimary?: boolean;
  ownerId: number;
  createdAt?: string;
}

export function usePG(enabled: boolean = true) {
  const queryClient = useQueryClient();
  const { user, isLoading: isUserLoading } = useUser();
  
  // Strictly enforce that only owners can fetch PG data
  const canFetch = enabled && !isUserLoading && user?.userType === "owner";

  // Fetch current PG with caching
  const { 
    data: pg = null, 
    isLoading, 
    error: pgError 
  } = useQuery<PG | null>({
    queryKey: ["current-pg"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/pg");
        return res.data;
      } catch (err: any) {
        if (err.response?.status === 404 || err.response?.status === 401) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 30, // Data remains fresh for 30 minutes
    retry: false,
    enabled: canFetch,
  });

  // Fetch all PGs with caching
  const { 
    data: allPgs = [], 
    isLoading: isAllPgsLoading,
    error: allPgsError
  } = useQuery<PG[]>({
    queryKey: ["all-pgs"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/pg/all");
        return res.data || [];
      } catch (err: any) {
        if (err.response?.status === 404 || err.response?.status === 401) {
          return [];
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: false,
    enabled: canFetch,
  });

  const selectPG = useCallback(async (pgId: number) => {
    try {
      const res = await api.post(`/api/pg/select/${pgId}`);
      const data = res.data;
      
      // Update cache immediately
      queryClient.setQueryData(["current-pg"], data.pg);
      
      // Invalidate queries to refresh data for new PG context
      const keysToInvalidate = [
        "tenants", "rooms", "payments", "notifications", "dashboard",
        "available-tenants", "active-rooms", "/api/visit-requests", "/api/onboarding-requests"
      ];
      
      await Promise.all(keysToInvalidate.map(key => 
        queryClient.invalidateQueries({ queryKey: [key] })
      ));
      
      return data.pg;
    } catch (err) {
      console.error("Error selecting PG:", err);
      throw err;
    }
  }, [queryClient]);

  const createPG = useCallback(async (values: { 
    pgName: string; 
    pgAddress: string; 
    pgLocation: string; 
    latitude?: string;
    longitude?: string;
    imageUrl?: string | null;
    totalRooms?: number;
    pgType?: string;
    registrationNumber?: string;
    registrationDocumentUrl?: string;
    registrationDocumentFile?: File | null;
    fssaiCertificateUrl?: string;
    fssaiCertificateFile?: File | null;
    pgImageFile?: File | null;
    amenityIds?: number[];
  }) => {
    try {
      const formData = new FormData();

      const cleanUrl = (url?: string | null) => url ? url.split('?')[0] : url;

      // 1. Separate the File from the metadata
      const { pgImageFile, registrationDocumentFile, fssaiCertificateFile, imageUrl, registrationDocumentUrl, fssaiCertificateUrl, ...restMetadata } = values;

      // 2. Append the DTO as a JSON Blob
      // This allows Spring's @RequestPart to map it to your DTO class
      const pgMetadata = {
        ...restMetadata,
        ...(imageUrl !== undefined && { imageUrl: cleanUrl(imageUrl) }),
        ...(registrationDocumentUrl !== undefined && { registrationDocumentUrl: cleanUrl(registrationDocumentUrl) }),
        ...(fssaiCertificateUrl !== undefined && { fssaiCertificateUrl: cleanUrl(fssaiCertificateUrl) })
      };
      formData.append("pgData", new Blob([JSON.stringify(pgMetadata)], {
        type: 'application/json'
      }));

      // 3. Append the binary image file if it exists
      if (pgImageFile) {
        formData.append("pgImageFile", pgImageFile); // Matches @RequestPart("file") in Spring
      }
      if (registrationDocumentFile) {
        formData.append("registrationDoc", registrationDocumentFile);
      }
      if (fssaiCertificateFile) {
        formData.append("fssaiCert", fssaiCertificateFile);
      }

      // 4. Send the request
      // Axios automatically sets 'multipart/form-data' when it sees FormData
      const res = await api.post("/api/pg", formData);
      const data = res.data;
      
      queryClient.setQueryData(["current-pg"], data);
      queryClient.invalidateQueries({ queryKey: ["all-pgs"] });

      return data;
    } catch (err: any) {
      console.error("Error creating PG:", err);
      // In Spring Boot, errors usually come back in err.response.data.error
      throw new Error(err.response?.data?.error || "Failed to create PG");
    }
  }, [queryClient]);

  const updatePG = useCallback(async (pgId: number, values: Omit<Partial<PG>, "imageUrl"> & { 
    amenityIds?: number[], 
    pgType?: string,
    imageUrl?: string | null,
    pgImageFile?: File | null,
    registrationDocumentFile?: File | null,
    fssaiCertificateFile?: File | null
  }) => {
    try {
      const formData = new FormData();
      const cleanUrl = (url?: string | null) => url ? url.split('?')[0] : url;
      const { pgImageFile, registrationDocumentFile, fssaiCertificateFile, imageUrl, registrationDocumentUrl, fssaiCertificateUrl, ...restMetadata } = values;

      const pgMetadata = {
        ...restMetadata,
        ...(imageUrl !== undefined && { imageUrl: cleanUrl(imageUrl) }),
        ...(registrationDocumentUrl !== undefined && { registrationDocumentUrl: cleanUrl(registrationDocumentUrl) }),
        ...(fssaiCertificateUrl !== undefined && { fssaiCertificateUrl: cleanUrl(fssaiCertificateUrl) })
      };
      formData.append("pgData", new Blob([JSON.stringify(pgMetadata)], {
        type: 'application/json'
      }));

      if (pgImageFile) {
        formData.append("pgImageFile", pgImageFile);
      }
      if (registrationDocumentFile) {
        formData.append("registrationDoc", registrationDocumentFile);
      }
      if (fssaiCertificateFile) {
        formData.append("fssaiCert", fssaiCertificateFile);
      }

      const res = await api.put(`/api/pg/${pgId}`, formData);
      const data = res.data;
      
      // If we updated the currently selected PG, update its cache
      const currentPg = queryClient.getQueryData<PG>(["current-pg"]);
      if (currentPg?.id === pgId) {
        queryClient.setQueryData(["current-pg"], data);
      }
      queryClient.invalidateQueries({ queryKey: ["all-pgs"] });
      
      return data;
    } catch (err: any) {
      console.error("Error updating PG:", err);
      throw new Error(err.response?.data?.error || "Failed to update PG");
    }
  }, [queryClient]);

  const deletePG = useCallback(async (pgId: number) => {
    try {
      const res = await api.delete(`/api/pg/${pgId}`);
      const data = res.data;
      
      if (data.newActivePg) {
        queryClient.setQueryData(["current-pg"], data.newActivePg);
      } else {
        const currentPg = queryClient.getQueryData<PG>(["current-pg"]);
        if (currentPg?.id === pgId) {
          queryClient.setQueryData(["current-pg"], null);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["all-pgs"] });
      
      return true;
    } catch (err: any) {
      console.error("Error deleting PG:", err);
      throw new Error(err.response?.data?.error || "Failed to delete PG");
    }
  }, [queryClient]);

  const setPrimaryPG = useCallback(async (pgId: number) => {
    try {
      const res = await api.post(`/api/pg/${pgId}/set-primary`);
      const data = res.data;
      
      queryClient.setQueryData(["current-pg"], data.pg);
      queryClient.invalidateQueries({ queryKey: ["all-pgs"] });

      // Invalidate queries to refresh data for new PG context
      const keysToInvalidate = [
        "tenants", "rooms", "payments", "notifications", "dashboard"
      ];
      await Promise.all(keysToInvalidate.map(key => 
        queryClient.invalidateQueries({ queryKey: [key] })
      ));
      
      return data.pg;
    } catch (err: any) {
      console.error("Error setting primary PG:", err);
      throw new Error(err.response?.data?.error || "Failed to set primary PG");
    }
  }, [queryClient]);

  const refetch = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["current-pg"] }),
      queryClient.invalidateQueries({ queryKey: ["all-pgs"] })
    ]);
  }, [queryClient]);

  return { 
    pg, 
    allPgs: canFetch ? allPgs : [],
    isLoading: isUserLoading || (canFetch && isLoading), 
    isAllPgsLoading: isUserLoading || (canFetch && isAllPgsLoading),
    error: (pgError as any)?.message || (allPgsError as any)?.message || null, 
    selectPG,
    createPG,
    updatePG,
    deletePG,
    setPrimaryPG,
    refetch
  };
}
