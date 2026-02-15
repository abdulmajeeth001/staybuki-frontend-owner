import { api } from "@/apiClient";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  VerifyOtpRequest,
  UserResponse,
  AmenityResponse,
  PgFileUploadResponse,
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

  /**
   * Register a new user
   */
  register: async (payload: RegisterRequest) => {
    await api.post("/api/auth/register", payload);
  },

  /**
   * Verify OTP for registration
   */
  verifyOtp: async (payload: VerifyOtpRequest) => {
    const { data } = await api.post<UserResponse>("/api/auth/verify-otp", payload);
    return data;
  },

  /**
   * Get all amenities
   */
  getAmenities: async () => {
    const { data } = await api.get<AmenityResponse[]>("/api/common/registration/amenities");
    return data;
  },

  /**
   * Upload FSSAI certificate
   */
  uploadFssaiCertificate: async (formData: FormData) => {
    const { data } = await api.post<PgFileUploadResponse>(
      "/api/pg/upload-fssai-certificate",
      formData
    );
    return data;
  },

  /**
   * Upload Registration Document
   */
  uploadRegistrationDocument: async (formData: FormData) => {
    const { data } = await api.post<PgFileUploadResponse>(
      "/api/pg/upload-registration-document",
      formData
    );
    return data;
  },
};