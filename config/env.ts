import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("https://elitedigital.studio"),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().default("910000000000"),
  CONTACT_EMAIL: z.string().email().default("hello@elitedigital.studio"),
  RESEND_API_KEY: z.string().optional(),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  CONTACT_EMAIL: process.env.CONTACT_EMAIL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
});

if (!parsed.success) {
  console.warn("[env] validation warnings:", parsed.error.flatten().fieldErrors);
}

export const env = parsed.success ? parsed.data : schema.parse({});
