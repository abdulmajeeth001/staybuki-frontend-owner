import { api } from "@/apiClient";
import type {
  LoginRequest,
  LoginResponse,
} from "@/types/auth";

export const authService = {
  /**
   * Login user
   */
  login: async (payload: LoginRequest) => {
    const { data } = await api.post<LoginResponse>(
      "/api/auth/login",
      payload
    );

    return data;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: string) => {
    const { data } = await api.post<LoginResponse>(
      "/api/auth/refresh-token",
      { refreshToken }
    );

    return data;
  },

  /**
   * Logout user
   */
  logout: async () => {
    await api.post("/api/auth/logout");
  },

  /**
   * Forgot password
   */
  forgotPassword: async (email: string) => {
    await api.post("/api/auth/forgot-password", { email });
  },

  /**
   * Reset password
   */
  resetPassword: async (token: string, newPassword: string) => {
    await api.post("/api/auth/reset-password", {
      token,
      newPassword,
    });
  },
};