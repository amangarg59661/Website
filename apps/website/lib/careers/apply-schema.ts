import { z } from "zod";

/**
 * Marketing-side apply-form validation. Mirrors backend
 * JobApplicationSubmitRequest (application/careers module) so the
 * client can fail-fast before the backend round-trip.
 */
export const applySchema = z.object({
  applicantName: z.string().trim().min(2, "Please share your name."),
  applicantEmail: z.string().trim().email("Please share a valid email."),
  applicantPhone: z
    .string()
    .trim()
    .max(40, "Phone number seems too long.")
    .optional()
    .or(z.literal("")),
  resumeUrl: z
    .string()
    .trim()
    .url("Please share a public link (LinkedIn, PDF, portfolio).")
    .max(2000)
    .optional()
    .or(z.literal("")),
  coverLetter: z
    .string()
    .trim()
    .min(20, "A few more sentences will help us route your application.")
    .max(20_000, "Please keep it under 20,000 characters."),
  // Honeypot — bots fill this.
  company: z.string().max(0).optional().or(z.literal("")),
});

export type ApplyPayload = z.infer<typeof applySchema>;
