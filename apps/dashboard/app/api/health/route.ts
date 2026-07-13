import { NextResponse } from "next/server";

/**
 * P-09: liveness probe. External monitors (Better Stack, Pingdom, Vercel
 * uptime) hit this to confirm the deployment is up and know which commit
 * is serving. Kept auth-free by design; no PII, no cookies read.
 */
export function GET() {
  return NextResponse.json(
    {
      ok: true,
      app: "dashboard",
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      timestamp: new Date().toISOString(),
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
