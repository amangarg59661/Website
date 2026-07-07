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

export const loginResponseSchema = z.discriminatedUnion("needs_2fa", [
  z.object({
    needs_2fa: z.literal(false),
    access_token: z.string(),
    access_token_exp: z.number(),
    user: userSchema,
    permissions: z.array(permissionSchema),
    session_id: z.string(),
  }),
  z.object({
    needs_2fa: z.literal(true),
    two_fa_challenge_id: z.string(),
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
