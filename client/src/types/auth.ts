import type { components } from "@/types/api";

export type LoginRequest = components["schemas"]["LoginRequestDto"];
export type LoginResponse = components["schemas"]["AuthResponseDto"];
export type RegisterRequest = components["schemas"]["UserRequestDto"];
export type VerifyOtpRequest = components["schemas"]["VerifyOtpRequestDto"];
export type UserResponse = components["schemas"]["UserResponseDto"];
export type AmenityResponse = components["schemas"]["AmenityResponseDto"];
export type PgFileUploadResponse = components["schemas"]["PgFileUploadResponseDto"];
export type ForgotPasswordRequest = components["schemas"]["ForgotPasswordRequestDto"];
export type VerifyForgotPasswordRequest = components["schemas"]["VerifyForgotPasswordRequestDto"];
