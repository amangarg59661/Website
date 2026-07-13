import { NextResponse } from "next/server";
import { applySchema } from "@/lib/careers/apply-schema";

/**
 * C-4: marketing → backend BFF for job applications. Forwards to
 * POST {NEXT_PUBLIC_API_BASE}/careers/{slug}/apply. Backend enforces
 * rate limits, uniqueness (max 3 applications per email per posting)
 * and fires the auto thank-you email via the outbox.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const buckets = new Map<string, { count: number; reset: number }>();
const LIMIT = 3;
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

const SLUG_PATTERN = /^[a-z0-9](-?[a-z0-9])*$/;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug || !SLUG_PATTERN.test(slug) || slug.length > 120) {
    return NextResponse.json({ error: "Invalid role slug." }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  if (!allow(ip)) {
    return NextResponse.json(
      { error: "Too many applications. Please try again in a minute." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = applySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the fields.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Honeypot — silently succeed for bots.
  if (parsed.data.company && parsed.data.company.length > 0) {
    return NextResponse.json({ ok: true });
  }

  if (!API_BASE) {
    console.error("[apply] NEXT_PUBLIC_API_BASE is not configured");
    return NextResponse.json(
      { error: "Application form is temporarily unavailable. Please email us directly." },
      { status: 503 },
    );
  }

  const { applicantName, applicantEmail, applicantPhone, resumeUrl, coverLetter } = parsed.data;

  let backendRes: Response;
  try {
    backendRes = await fetch(`${API_BASE}/careers/${encodeURIComponent(slug)}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicantName,
        applicantEmail,
        applicantPhone: applicantPhone || undefined,
        resumeUrl: resumeUrl || undefined,
        coverLetter,
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
      { error: "Too many applications from your network. Please try again shortly." },
      { status: 429 },
    );
  }

  if (backendRes.status === 404) {
    return NextResponse.json(
      { error: "This role is no longer accepting applications." },
      { status: 404 },
    );
  }

  if (!backendRes.ok) {
    // Surface the backend's validation message when it's a 4xx so the
    // user sees "you have already applied for this role" etc. Redact for
    // 5xx to avoid leaking internal detail.
    if (backendRes.status < 500) {
      const body = (await backendRes.json().catch(() => ({}))) as { message?: string };
      return NextResponse.json(
        { error: body.message ?? "We could not accept your application." },
        { status: backendRes.status },
      );
    }
    console.error("[apply] backend failed", backendRes.status);
    return NextResponse.json(
      { error: "We could not accept your application. Please try again shortly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
