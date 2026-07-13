import { NextResponse, type NextRequest } from "next/server";
import { forwardToBackend } from "../_proxy";

/**
 * S-10: normalise the response so an attacker cannot distinguish
 * "email exists" from "email not found" via status code, body shape, or
 * timing. On 2xx and 4xx from the backend we always return `{ ok: true }`
 * with 200. Only 5xx / network errors fall through so the UI can show
 * a real error state.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ code: "VALIDATION_FAILED", message: "Bad body" }, { status: 400 });
  }
  const upstream = await forwardToBackend("/auth/forgot-password", { method: "POST", body });
  if (upstream.status >= 500 || upstream.status === 502) {
    return upstream;
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
