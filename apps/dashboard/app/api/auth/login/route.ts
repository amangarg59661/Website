import { NextResponse, type NextRequest } from "next/server";
import { forwardToBackend, setAuthCookies } from "../_proxy";

type BackendLoginResponse =
  | {
      needs_2fa: false;
      access_token: string;
      access_token_exp: number;
      refresh_token: string;
      user: unknown;
      permissions: string[];
      session_id: string;
    }
  | { needs_2fa: true; two_fa_challenge_id: string };

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ code: "VALIDATION_FAILED", message: "Bad body" }, { status: 400 });
  }
  const upstream = await forwardToBackend("/auth/login", { method: "POST", body });
  if (upstream.status !== 200) return upstream;
  const backendBody = (await upstream.json()) as BackendLoginResponse;
  const res = NextResponse.json(
    backendBody.needs_2fa
      ? {
          needs_2fa: true,
          two_fa_challenge_id: backendBody.two_fa_challenge_id,
        }
      : {
          needs_2fa: false,
          access_token: backendBody.access_token,
          access_token_exp: backendBody.access_token_exp,
          user: backendBody.user,
          permissions: backendBody.permissions,
          session_id: backendBody.session_id,
        },
    { status: 200 },
  );
  if (!backendBody.needs_2fa) setAuthCookies(res, backendBody.refresh_token);
  return res;
}
