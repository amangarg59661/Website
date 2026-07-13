import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/contact/schema";
import { env } from "@/config/env";

/**
 * C-3: marketing contact endpoint is now a thin BFF that forwards to the
 * backend inquiry API. The backend owns:
 *   - persistence in relationship.inquiries,
 *   - the staff-triage signal (relationship.inquiry_submitted),
 *   - the auto thank-you email to the submitter
 *     (relationship.inquiry_acknowledged → Resend via notifications).
 *
 * The previous inline Resend call + PII console.log fallback are removed
 * (frontend audit finding C-09). A missing API_BASE now fails visibly
 * instead of silently persisting PII to server logs.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

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

  // Honeypot — pretend to succeed, drop silently.
  if (parsed.data.company && parsed.data.company.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const { name, email, phone, meetingTime, message } = parsed.data;

  if (!API_BASE) {
    // C-09 fix: fail loudly instead of the previous PII-console.log path.
    // A missing API_BASE is a deployment misconfiguration, not a dev
    // convenience — the submitter would see success while their PII
    // never reached the backend.
    console.error("[contact] NEXT_PUBLIC_API_BASE is not configured");
    return NextResponse.json(
      { error: "Contact form is temporarily unavailable. Please email us directly." },
      { status: 503 },
    );
  }

  // Forward to backend. Backend owns rate-limit + persistence + auto email.
  const message_ = [message, "", `Preferred meeting time: ${meetingTime}`].join("\n");

  let backendRes: Response;
  try {
    backendRes = await fetch(`${API_BASE}/inquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        service: "marketing_contact",
        message: message_,
        source: "marketing_website",
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Delivery failed. Please email us directly." },
      { status: 502 },
    );
  }

  if (backendRes.status === 429) {
    return NextResponse.json(
      { error: "Too many inquiries from your network. Please try again shortly." },
      { status: 429 },
    );
  }

  if (!backendRes.ok) {
    // Do not include the backend body — it may echo validation details we
    // don't want to leak. Log a redacted line for ops.
    console.error("[contact] backend inquiry failed", backendRes.status);
    return NextResponse.json(
      { error: "We could not accept your inquiry. Please try again shortly." },
      { status: backendRes.status >= 500 ? 502 : 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
