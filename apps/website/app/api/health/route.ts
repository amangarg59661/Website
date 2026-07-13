import { NextResponse } from "next/server";

/**
 * P-09: liveness probe on the marketing site. Same shape as the dashboard
 * probe so uptime dashboards can group both apps.
 */
export function GET() {
  return NextResponse.json(
    {
      ok: true,
      app: "website",
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      timestamp: new Date().toISOString(),
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
