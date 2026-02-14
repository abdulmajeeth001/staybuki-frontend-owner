import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/apiClient";
import { toast } from "sonner";

export function useLogout() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      // Optional: Notify backend (good for analytics or blacklisting if implemented)
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
      // We continue to clear client state even if API fails
    } finally {
      // 1. Clear React Query cache (application state)
      await queryClient.cancelQueries();
      queryClient.removeQueries();
      queryClient.clear();

      // 2. Navigate to login
      setLocation("/login");
      setIsLoggingOut(false);
    }
  };

  return { logout, isLoggingOut };
}