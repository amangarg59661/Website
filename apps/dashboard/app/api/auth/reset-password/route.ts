import { NextResponse, type NextRequest } from "next/server";
import { forwardToBackend } from "../_proxy";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ code: "VALIDATION_FAILED", message: "Bad body" }, { status: 400 });
  }
  return forwardToBackend("/auth/reset-password", { method: "POST", body });
}
