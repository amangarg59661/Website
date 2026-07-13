import { NextResponse, type NextRequest } from "next/server";
import { forwardToBackend } from "../_proxy";

/**
 * S-10: reset endpoint returns 200 `{ ok: true }` on any 2xx/4xx from
 * upstream. The UI shows a generic success message. If the token was
 * invalid, the user re-requests via forgot-password — no enumeration.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ code: "VALIDATION_FAILED", message: "Bad body" }, { status: 400 });
  }
  const upstream = await forwardToBackend("/auth/reset-password", { method: "POST", body });
  if (upstream.status >= 500 || upstream.status === 502) {
    return upstream;
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
