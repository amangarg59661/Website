import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://api.edss.example";

export async function forwardToBackend(
  path: string,
  init: {
    method: "POST" | "GET";
    body?: unknown;
    forwardCookieHeader?: string | null;
  },
): Promise<NextResponse> {
  let backendRes: Response;
  try {
    backendRes = await fetch(`${API_BASE}${path}`, {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init.forwardCookieHeader ? { Cookie: init.forwardCookieHeader } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    return NextResponse.json(
      { code: "NETWORK_ERROR", message: "Upstream unreachable." },
      { status: 502 },
    );
  }
  const raw = await backendRes.text();
  const body = raw ? (JSON.parse(raw) as unknown) : {};
  return NextResponse.json(body, { status: backendRes.status });
}

export function setAuthCookies(res: NextResponse, refreshToken: string): void {
  res.cookies.set("rt", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 30 * 24 * 3600,
  });
}

export function clearAuthCookies(res: NextResponse): void {
  res.cookies.set("rt", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 0,
  });
  res.cookies.set("csrf", "", {
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
