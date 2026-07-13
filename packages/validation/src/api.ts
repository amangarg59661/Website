import { z } from "zod";
import { userSchema, permissionSchema } from "./user";

export const apiErrorSchema = z.object({
  code: z.enum([
    "INVALID_CREDENTIALS",
    "INVALID_TOTP",
    "SESSION_EXPIRED",
    "SESSION_REVOKED",
    "CSRF_MISMATCH",
    "RATE_LIMITED",
    "FORBIDDEN",
    "NOT_FOUND",
    "VALIDATION_FAILED",
    "INVALID_RESPONSE",
    "NETWORK_ERROR",
    "SERVER_ERROR",
    "UNKNOWN",
  ]),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});

// M-05: available_methods reads which 2FA methods the user has enrolled
// (totp / whatsapp_otp / backup_code). Frontend uses this to drive the
// method picker on /login/2fa-challenge instead of assuming TOTP.
// trusted_device_token (M-06) piggy-backs on the full branch when the
// user opted into remember-me on a prior verify.
export const loginResponseSchema = z.discriminatedUnion("needs_2fa", [
  z.object({
    needs_2fa: z.literal(false),
    access_token: z.string(),
    access_token_exp: z.number(),
    refresh_token: z.string().optional(),
    trusted_device_token: z.string().optional(),
    user: userSchema,
    permissions: z.array(permissionSchema),
    session_id: z.string(),
  }),
  z.object({
    needs_2fa: z.literal(true),
    two_fa_challenge_id: z.string(),
    available_methods: z
      .array(z.enum(["totp", "whatsapp_otp", "backup_code"]))
      .default(["totp"]),
    access_token: z.string().optional(),
    access_token_exp: z.number().optional(),
    user: userSchema.optional(),
    permissions: z.array(permissionSchema).optional(),
    session_id: z.string().optional(),
  }),
]);

export const refreshResponseSchema = z.object({
  access_token: z.string(),
  access_token_exp: z.number(),
  permissions: z.array(permissionSchema),
  session_id: z.string(),
});

export const paginationSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    cursor: z.string().nullable(),
    has_more: z.boolean(),
  });
