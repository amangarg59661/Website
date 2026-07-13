import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password required."),
  remember_me: z.boolean().default(false),
});
export type LoginInput = z.infer<typeof loginSchema>;

// M-02: backend TwoFaVerifyRequest requires `method` (@NotBlank + regex
// "totp|whatsapp_otp|backup_code"). Frontend was omitting it; every verify
// was 400ing with VALIDATION_FAILED. `method` defaults to "totp" so the
// existing 6-digit-code UX is a no-op change for TOTP users. WhatsApp OTP
// + backup code flows will surface a method picker once their UI lands.
export const twoFactorMethodSchema = z.enum([
  "totp",
  "whatsapp_otp",
  "backup_code",
]);
export type TwoFactorMethod = z.infer<typeof twoFactorMethodSchema>;

export const twoFactorSchema = z.object({
  challenge_id: z.string().min(1),
  method: twoFactorMethodSchema.default("totp"),
  code: z.string().min(6, "Six-digit code.").max(32, "Code too long."),
  remember_device: z.boolean().default(false),
});
export type TwoFactorInput = z.infer<typeof twoFactorSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email."),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    new_password: z
      .string()
      .min(12, "At least 12 characters.")
      .regex(/[A-Z]/u, "One uppercase letter.")
      .regex(/[a-z]/u, "One lowercase letter.")
      .regex(/\d/u, "One digit.")
      .regex(/[^A-Za-z0-9]/u, "One symbol."),
    confirm: z.string(),
  })
  .refine((v) => v.new_password === v.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
