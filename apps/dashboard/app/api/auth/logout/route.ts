import { NextResponse, type NextRequest } from "next/server";
import { forwardToBackend, clearAuthCookies } from "../_proxy";

export async function POST(req: NextRequest) {
  const rt = req.cookies.get("rt")?.value;
  if (rt) {
    await forwardToBackend("/auth/logout", {
      method: "POST",
      body: { refresh_token: rt },
    });
  }
  const res = new NextResponse(null, { status: 204 });
  clearAuthCookies(res);
  return res;
}
