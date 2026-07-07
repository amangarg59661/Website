import { NextResponse, type NextRequest } from "next/server";
import { forwardToBackend, setAuthCookies, clearAuthCookies } from "../_proxy";

type BackendRefreshResponse = {
  access_token: string;
  access_token_exp: number;
  refresh_token: string;
  permissions: string[];
  session_id: string;
};

export async function POST(req: NextRequest) {
  const rt = req.cookies.get("rt")?.value;
  if (!rt) {
    const bad = NextResponse.json(
      { code: "SESSION_EXPIRED", message: "No refresh token." },
      { status: 401 },
    );
    clearAuthCookies(bad);
    return bad;
  }
  const upstream = await forwardToBackend("/auth/refresh", {
    method: "POST",
    body: { refresh_token: rt },
  });
  if (upstream.status !== 200) {
    const failed = NextResponse.json((await upstream.json()) as unknown, {
      status: upstream.status,
    });
    clearAuthCookies(failed);
    return failed;
  }
  const backendBody = (await upstream.json()) as BackendRefreshResponse;
  const res = NextResponse.json(
    {
      access_token: backendBody.access_token,
      access_token_exp: backendBody.access_token_exp,
      permissions: backendBody.permissions,
      session_id: backendBody.session_id,
    },
    { status: 200 },
  );
  setAuthCookies(res, backendBody.refresh_token);
  return res;
}
