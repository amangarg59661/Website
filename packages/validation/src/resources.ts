import { z } from "zod";
import { paginationSchema } from "./api";

/**
 * Backend resource schemas mirrored from the audit-remediation branch
 * (backend `main` at commit 1ce234b post-M-01). Every field name is
 * derived from the Java DTO under the global Jackson SNAKE_CASE
 * strategy — where a Java field would collide (e.g. `needsTwoFa` →
 * `needs_two_fa`) the backend record carries a `@JsonProperty` override.
 *
 * These schemas are additive-tolerant: unknown fields on the wire pass
 * through untouched. Consumers should never rely on absent fields
 * because backend can add optional fields freely.
 */

const isoDateSchema = z.string();

// ------------------------------------------------------------------
// Notifications  —  GET /notifications (paginated)
// ------------------------------------------------------------------
export const notificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  severity: z.enum(["info", "success", "warning", "critical"]),
  title: z.string(),
  body: z.string(),
  read: z.boolean(),
  created_at: isoDateSchema,
  href: z.string().nullable().optional(),
  event_type: z.string().nullable().optional(),
});
export const notificationListSchema = paginationSchema(notificationSchema);
export const unreadCountSchema = z.object({ count: z.number() });

// ------------------------------------------------------------------
// Projects  —  GET /projects  +  GET /projects/{id}
// ------------------------------------------------------------------
export const projectPhaseSchema = z.enum([
  "discussion",
  "contract_pending",
  "contract_signed",
  "onboarding_scheduled",
  "onboarding_complete",
  "advance_invoiced",
  "assets_pending",
  "assets_received",
  "in_progress",
  "client_review",
  "final_submission",
  "final_invoiced",
  "maintenance",
  "closed",
]);
export const projectSchema = z.object({
  id: z.string().uuid(),
  owner_user_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  phase: projectPhaseSchema,
  billing_model: z.enum(["per_milestone", "whole_project"]).nullable(),
  maintenance_duration_days: z.number().nullable(),
  maintenance_starts_at: isoDateSchema.nullable(),
  maintenance_ends_at: isoDateSchema.nullable(),
  total_amount_minor: z.number().nullable(),
  currency: z.string().nullable(),
  created_at: isoDateSchema,
  updated_at: isoDateSchema,
});
export const projectListSchema = paginationSchema(projectSchema);

// ------------------------------------------------------------------
// Invoices  —  GET /invoices
// ------------------------------------------------------------------
export const invoiceSchema = z.object({
  id: z.string().uuid(),
  client_user_id: z.string().uuid(),
  project_id: z.string().uuid().nullable(),
  milestone_id: z.string().uuid().nullable(),
  number: z.string(),
  amount_minor: z.number(),
  currency: z.string(),
  status: z.enum(["issued", "paid", "voided"]),
  provider: z.enum(["stripe", "razorpay", "manual"]),
  provider_payment_intent_id: z.string().nullable(),
  payment_link: z.string().nullable(),
  issued_at: isoDateSchema.nullable(),
  due_at: isoDateSchema.nullable(),
  paid_at: isoDateSchema.nullable(),
  created_at: isoDateSchema,
});
export const invoiceListSchema = paginationSchema(invoiceSchema);

// ------------------------------------------------------------------
// Tickets  —  GET /tickets
// ------------------------------------------------------------------
export const ticketPrioritySchema = z.enum(["low", "normal", "high", "urgent"]);
export const ticketStatusSchema = z.enum([
  "open",
  "in_progress",
  "waiting",
  "resolved",
  "closed",
]);
export const ticketSchema = z.object({
  id: z.string().uuid(),
  raised_by_user_id: z.string().uuid(),
  project_id: z.string().uuid().nullable(),
  subject: z.string(),
  description: z.string().nullable(),
  priority: ticketPrioritySchema,
  status: ticketStatusSchema,
  assignee_user_id: z.string().uuid().nullable(),
  is_maintenance: z.boolean(),
  created_at: isoDateSchema,
  updated_at: isoDateSchema,
});
export const ticketListSchema = paginationSchema(ticketSchema);

// ------------------------------------------------------------------
// Files  —  GET /files
// ------------------------------------------------------------------
export const fileKindSchema = z.enum([
  "project_asset",
  "milestone_deliverable",
  "general",
]);
export const fileSchema = z.object({
  id: z.string().uuid(),
  owner_user_id: z.string().uuid(),
  name: z.string(),
  size_bytes: z.number(),
  mime_type: z.string(),
  storage_key: z.string(),
  bucket: z.string(),
  project_id: z.string().uuid().nullable(),
  milestone_id: z.string().uuid().nullable(),
  kind: fileKindSchema,
  created_at: isoDateSchema,
});
export const fileListSchema = paginationSchema(fileSchema);

// ------------------------------------------------------------------
// Sessions + trusted devices + MFA (self-service settings surface)
// ------------------------------------------------------------------
export const sessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  user_agent: z.string().nullable(),
  ip_address: z.string().nullable(),
  created_at: isoDateSchema,
  last_active_at: isoDateSchema.nullable(),
  is_current: z.boolean().optional(),
});
export const sessionListSchema = z.object({ sessions: z.array(sessionSchema) });

export const trustedDeviceSchema = z.object({
  id: z.string().uuid(),
  user_agent: z.string().nullable(),
  ip: z.string().nullable(),
  created_at: isoDateSchema,
  expires_at: isoDateSchema,
});
export const trustedDeviceListSchema = z.object({
  devices: z.array(trustedDeviceSchema),
});

export const mfaMethodSchema = z.object({
  method_type: z.enum(["totp", "whatsapp_otp", "backup_code"]),
  enabled: z.boolean(),
  phone_e164: z.string().nullable().optional(),
  enrolled_at: isoDateSchema.nullable(),
});
export const mfaMethodListSchema = z.object({
  methods: z.array(mfaMethodSchema),
});

// Inferred TS types — consumers import these instead of writing their own.
export type Notification = z.infer<typeof notificationSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
export type Ticket = z.infer<typeof ticketSchema>;
export type FileRecord = z.infer<typeof fileSchema>;
export type SessionRow = z.infer<typeof sessionSchema>;
export type TrustedDeviceRow = z.infer<typeof trustedDeviceSchema>;
export type MfaMethod = z.infer<typeof mfaMethodSchema>;
