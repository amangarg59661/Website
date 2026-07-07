import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password required."),
  remember_me: z.boolean().default(false),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const twoFactorSchema = z.object({
  challenge_id: z.string().min(1),
  code: z.string().regex(/^\d{6}$/u, "Six-digit code."),
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
