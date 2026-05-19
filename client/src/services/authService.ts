import { api } from "@/apiClient";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  VerifyOtpRequest,
  UserResponse,
  AmenityResponse,
  PgFileUploadResponse,
  ForgotPasswordRequest,
  VerifyForgotPasswordRequest,
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
   * Get current authenticated user
   */
  getCurrentUser: async (config?: any) => {
    const { data } = await api.get("/api/auth/me", config);
    return data;
  },

  /**
   * Refresh access token
   */
  refreshToken: async () => {
    const { data } = await api.post<LoginResponse>(
      "/api/auth/refresh"
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
  forgotPassword: async (payload: ForgotPasswordRequest) => {
    await api.post("/api/auth/forgot-password", payload);
  },

  /**
   * Verify forgot password with OTP
   */
  verifyForgotPassword: async (payload: VerifyForgotPasswordRequest) => {
    await api.post("/api/auth/verify-forgot-password", payload);
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
  register: async (payload: RegisterRequest, registrationDoc?: File, fssaiCert?: File, pgImageFile?: File) => {
    const formData = new FormData();
    // The backend @RequestPart("req") expects a JSON Blob
    formData.append("req", new Blob([JSON.stringify(payload)], { type: "application/json" }));

    if (registrationDoc) {
      formData.append("registrationDoc", registrationDoc);
    }
    if (fssaiCert) {
      formData.append("fssaiCert", fssaiCert);
    }
    if (pgImageFile) {
      formData.append("pgImageFile", pgImageFile);
    }

    await api.post("/api/auth/register", formData);
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
    const { data } = await api.get<AmenityResponse[]>("/api/amenities");
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