import { NextResponse, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const HAS_REDIS = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = HAS_REDIS ? Redis.fromEnv() : null;
const loginLimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "15 m"), prefix: "rl:login" })
  : null;
const refreshLimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "1 m"), prefix: "rl:refresh" })
  : null;
const twofaLimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "15 m"), prefix: "rl:2fa" })
  : null;
const forgotLimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 h"), prefix: "rl:forgot" })
  : null;

const PUBLIC_ROUTES = ["/login", "/login/2fa-challenge", "/forgot-password", "/reset-password"];
const AUTH_PROXY_ROUTES = [
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/auth/2fa/verify",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

function buildCsp(nonce: string): string {
  const apiOrigin = process.env.API_BASE_ORIGIN ?? "https://api.edss.example";
  const wsOrigin = process.env.WS_BASE_ORIGIN ?? "wss://api.edss.example";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://eu.i.posthog.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://eu.i.posthog.com https://images.unsplash.com https://cdn.elitedigital.studio",
    "font-src 'self' data:",
    `connect-src 'self' https://eu.i.posthog.com ${apiOrigin} ${wsOrigin}`,
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
    "report-uri /api/csp-report",
  ].join("; ");
}

const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-DNS-Prefetch-Control": "off",
};

function applyHeaders(res: NextResponse, nonce: string): NextResponse {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
  res.headers.set("Content-Security-Policy", buildCsp(nonce));
  return res;
}

function clientKey(req: NextRequest): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0";
  const ua = req.headers.get("user-agent") ?? "";
  return `${ip}|${ua.slice(0, 64)}`;
}

async function checkRateLimit(
  rl: Ratelimit | null,
  key: string,
): Promise<{ ok: boolean; retryAfter: number }> {
  if (!rl) return { ok: true, retryAfter: 0 };
  const r = await rl.limit(key);
  return {
    ok: r.success,
    retryAfter: r.success ? 0 : Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)),
  };
}

function isAuthRoute(pathname: string): boolean {
  return (
    pathname === "/" || PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  );
}

function redirect(req: NextRequest, path: string): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = path;
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const { pathname } = req.nextUrl;

  const key = clientKey(req);
  if (req.method === "POST") {
    let limitResult: { ok: boolean; retryAfter: number } | null = null;
    if (pathname === "/api/auth/login") limitResult = await checkRateLimit(loginLimit, key);
    else if (pathname === "/api/auth/refresh")
      limitResult = await checkRateLimit(refreshLimit, `${key}|refresh`);
    else if (pathname === "/api/auth/2fa/verify")
      limitResult = await checkRateLimit(twofaLimit, `${key}|2fa`);
    else if (pathname === "/api/auth/forgot-password")
      limitResult = await checkRateLimit(forgotLimit, `${key}|forgot`);
    if (limitResult && !limitResult.ok) {
      const res = new NextResponse(
        JSON.stringify({
          code: "RATE_LIMITED",
          message: "Too many attempts. Try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(limitResult.retryAfter),
          },
        },
      );
      return applyHeaders(res, nonce);
    }
  }

  if (
    ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) &&
    AUTH_PROXY_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))
  ) {
    if (pathname !== "/api/auth/csrf-token") {
      const header = req.headers.get("x-csrf-token");
      const cookie = req.cookies.get("csrf")?.value;
      if (!header || !cookie || header !== cookie) {
        const res = new NextResponse(
          JSON.stringify({ code: "CSRF_MISMATCH", message: "CSRF token mismatch." }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
        return applyHeaders(res, nonce);
      }
    }
  }

  if (
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/mockServiceWorker.js")
  ) {
    const hasRt = req.cookies.has("rt");
    if (!hasRt && !isAuthRoute(pathname)) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return applyHeaders(NextResponse.redirect(url), nonce);
    }
    if (hasRt && pathname === "/login") {
      return applyHeaders(redirect(req, "/overview"), nonce);
    }
    if (pathname === "/") {
      return applyHeaders(redirect(req, hasRt ? "/overview" : "/login"), nonce);
    }
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  return applyHeaders(res, nonce);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|mockServiceWorker.js).*)"],
};
