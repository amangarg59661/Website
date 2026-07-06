import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please share your name."),
  email: z.string().trim().email("Please share a valid email."),
  phone: z
    .string()
    .trim()
    .min(6, "Please share a reachable phone number.")
    .max(24, "Phone number seems too long."),
  meetingTime: z.string().trim().min(3, "Roughly when would you like to meet?"),
  message: z
    .string()
    .trim()
    .min(20, "A few more sentences will help us route your request.")
    .max(2000, "Please keep it under 2000 characters."),
  // honeypot: bots fill this
  company: z.string().max(0).optional().or(z.literal("")),
});

export type ContactPayload = z.infer<typeof contactSchema>;
