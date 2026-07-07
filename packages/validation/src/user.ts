import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatarUrl: z.string().url().nullable(),
  primaryRole: z.enum(["client", "staff"]),
  hasBothRoles: z.boolean(),
  createdAt: z.string(),
});

export const permissionSchema = z.string().regex(/^[a-z_]+:[a-z_*]+$/u);
