import * as z from "zod";
import { USER_TYPES } from "@/constants/routes";

// export const loginSchema = z.object({
//   email: z.string().email("Please enter a valid email address"),
//   password: z.string().min(1, "Password is required"),
//   rememberMe: z.boolean().default(false),
// });

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email or Mobile Number is required")
    .refine((value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const mobileRegex = /^[6-9]\d{9}$/;

      return emailRegex.test(value) || mobileRegex.test(value);
    }, {
      message: "Please enter a valid Email or Mobile Number",
    }),

  password: z.string().min(1, "Password is required"),

  rememberMe: z.boolean().default(false),
});

export const forgotPasswordEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  otp: z.string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must be numbers only"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const registerSchema = z.object({
  userType: z.enum([USER_TYPES.OWNER, USER_TYPES.TENANT, USER_TYPES.ADMIN]),
  name: z.string().min(2, "Name is required"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number"),
  email: z.string().email("Invalid email address"),
  gender: z.enum(["male", "female", "other"]).optional(),
  
  // Owner specific fields
  pgName: z.string().optional(),
  pgAddress: z.string().optional(),
  pgLocation: z.string().optional(),
  latitude: z.union([z.string(), z.number()]).optional(),
  longitude: z.union([z.string(), z.number()]).optional(),
  imageUrl: z.string().optional(),
  totalRooms: z.string().optional(), // Input as string, converted on submit
  pgType: z.enum(["common", "boys", "girls"]).optional(),
  registrationNumber: z.string().optional(),
  registrationDocumentUrl: z.string().optional(),
  fssaiCertificateUrl: z.string().optional(),
  amenityIds: z.array(z.number()).default([]),
  
  // Security
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).superRefine((data, ctx) => {
  // Conditional Validation based on User Type
  if (data.userType !== USER_TYPES.OWNER && !data.gender) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Gender is required",
      path: ["gender"],
    });
  }
  
  if (data.userType === USER_TYPES.OWNER) {
    if (!data.pgName) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "PG Name is required", path: ["pgName"] });
    if (!data.pgType) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "PG Type is required", path: ["pgType"] });
  }

  if (data.password !== data.confirmPassword) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Passwords do not match", path: ["confirmPassword"] });
  }
});
