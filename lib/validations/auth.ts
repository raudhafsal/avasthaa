import { z } from "zod";

// Maldives mobile numbers: 7 digits, no leading 0, conventionally start
// with 7 or 9. Stored/sent to Supabase in full E.164 (+960XXXXXXX).
const maldivesPhoneLocal = z
  .string()
  .trim()
  .regex(/^[79]\d{6}$/, "invalid_phone");

export function toE164(localPhone: string) {
  return `+960${localPhone}`;
}

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: maldivesPhoneLocal,
  email: z.string().trim().email().optional().or(z.literal("")),
});

export const loginPhoneSchema = z.object({
  phone: maldivesPhoneLocal,
});

export const loginEmailSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export const verifyOtpSchema = z.object({
  phone: maldivesPhoneLocal,
  code: z.string().length(6, "invalid_code").regex(/^\d{6}$/, "invalid_code"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "mismatch",
    path: ["confirmPassword"],
  });

export const profileSetupSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  islandId: z.string().uuid("required"),
  addressLine: z.string().trim().min(3).max(200),
});
