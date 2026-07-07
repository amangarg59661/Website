import { NextResponse } from "next/server";

function generateCsrfToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/u, "");
}

export async function GET() {
  const token = generateCsrfToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set("csrf", token, {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });
  return res;
}
