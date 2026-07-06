import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/contact/schema";
import { env } from "@/config/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory rate limiter — one bucket per IP, resets every minute.
// Adequate for v1 marketing traffic; swap for KV/Upstash for scale.
const buckets = new Map<string, { count: number; reset: number }>();
const LIMIT = 5;
const WINDOW_MS = 60_000;

function allow(ip: string) {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || b.reset < now) {
    buckets.set(ip, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (b.count >= LIMIT) return false;
  b.count += 1;
  return true;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";

  if (!allow(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the fields.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Honeypot — pretend to succeed, drop silently
  if (parsed.data.company && parsed.data.company.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const { name, email, phone, meetingTime, message } = parsed.data;

  // Resend integration (optional in dev)
  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: `Elite Digital Studio <inquiries@elitedigital.studio>`,
          to: [env.CONTACT_EMAIL],
          reply_to: email,
          subject: `New inquiry — ${name}`,
          text: [
            `Name: ${name}`,
            `Email: ${email}`,
            `Phone: ${phone}`,
            `Preferred meeting time: ${meetingTime}`,
            "",
            "Message:",
            message,
          ].join("\n"),
        }),
      });
      if (!res.ok) {
        console.error("[contact] resend failed", await res.text());
        return NextResponse.json(
          { error: "Delivery failed. Please email us directly." },
          { status: 502 },
        );
      }
    } catch (err) {
      console.error("[contact] resend error", err);
      return NextResponse.json(
        { error: "Delivery failed. Please email us directly." },
        { status: 502 },
      );
    }
  } else {
    // Dev mode: log to server console
    console.info("[contact] inquiry received", {
      name,
      email,
      phone,
      meetingTime,
      message: message.slice(0, 500),
    });
  }

  return NextResponse.json({ ok: true });
}
