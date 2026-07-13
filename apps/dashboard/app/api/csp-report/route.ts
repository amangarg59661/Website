import { NextResponse, type NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

/**
 * P-10 + S-19: CSP violation sink.
 * - 8 KB body cap so a malicious POST can't blow up log storage.
 * - Zod-free structured log (kept dep-light); Sentry hook lands when wired.
 * - Optional Upstash rate limit at 30/min per IP+UA so the endpoint is
 *   not a public log-write / DoS amplifier.
 * - No CSRF check — browsers legitimately cannot attach the CSRF header
 *   to a CSP report.
 */

const MAX_BODY_BYTES = 8 * 1024;
const HAS_REDIS = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = HAS_REDIS ? Redis.fromEnv() : null;
const cspLimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "1 m"), prefix: "rl:csp" })
  : null;

function clientKey(req: NextRequest): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0";
  const ua = req.headers.get("user-agent") ?? "";
  return `${ip}|${ua.slice(0, 64)}`;
}

export async function POST(req: NextRequest) {
  if (cspLimit) {
    const r = await cspLimit.limit(clientKey(req));
    if (!r.success) return new NextResponse(null, { status: 429 });
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  const rawBody = await req.text();
  const body = rawBody.slice(0, MAX_BODY_BYTES);

  // Placeholder for Sentry wiring (P-08); today, structured console output.
  // Kept out of the caller's critical path — always returns 204.
  console.warn(
    JSON.stringify({
      event: "csp_violation",
      at: new Date().toISOString(),
      ip: clientKey(req).split("|")[0],
      report: body,
    }),
  );

  return new NextResponse(null, { status: 204 });
}
