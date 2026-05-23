import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useUser } from "./use-user";
import { ownerService } from "@/services/ownerService";
import { PgProfileResponse } from "@/types/owner";

export type PG = PgProfileResponse;

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
        const data = await ownerService.getPgProfile();
        return data as PG;
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
        const data = await ownerService.getAllPgs();
        return (data as PG[]) || [];
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
      const data = await ownerService.selectPg(pgId);
      const actualPg = (data as any).pg || data;
      
      // 1. Forcefully remove old PG's component data from cache to trigger loading states
      queryClient.removeQueries({
        predicate: (query) => {
          const key = typeof query.queryKey[0] === "string" ? query.queryKey[0] : "";
          // Preserve global application states
          return !["current-pg", "all-pgs", "current-user", "amenities"].includes(key);
        }
      });

      // 2. Update the active PG which will trigger re-renders
      if (actualPg) {
        queryClient.setQueryData(["current-pg"], actualPg);
      }
      
      // 3. Ensure global synchronization
      await queryClient.invalidateQueries();
      
      return actualPg;
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
      const data = await ownerService.createPgProfile(formData);
      
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

      const data = await ownerService.updatePgProfile(pgId, formData);
      
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
      const data = await ownerService.deletePg(pgId);
      
      const newActivePg = (data as any).newActivePg;
      
      // Forcefully remove old PG's component data from cache
      queryClient.removeQueries({
        predicate: (query) => {
          const key = typeof query.queryKey[0] === "string" ? query.queryKey[0] : "";
          return !["current-pg", "all-pgs", "current-user", "amenities"].includes(key);
        }
      });

      if (newActivePg) {
        queryClient.setQueryData(["current-pg"], newActivePg);
      } else {
        const currentPg = queryClient.getQueryData<PG>(["current-pg"]);
        if (currentPg?.id === pgId) {
          queryClient.setQueryData(["current-pg"], null);
        }
      }
      
      await queryClient.invalidateQueries();
      
      return true;
    } catch (err: any) {
      console.error("Error deleting PG:", err);
      throw new Error(err.response?.data?.error || "Failed to delete PG");
    }
  }, [queryClient]);

  const setPrimaryPG = useCallback(async (pgId: number) => {
    try {
      const data = await ownerService.setPrimaryPg(pgId);
      const actualPg = (data as any).pg || data;
      
      // Forcefully remove old PG's component data from cache
      queryClient.removeQueries({
        predicate: (query) => {
          const key = typeof query.queryKey[0] === "string" ? query.queryKey[0] : "";
          return !["current-pg", "all-pgs", "current-user", "amenities"].includes(key);
        }
      });

      if (actualPg) {
        queryClient.setQueryData(["current-pg"], actualPg);
      }
      
      await queryClient.invalidateQueries();

      return actualPg;
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
