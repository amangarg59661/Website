import { http, HttpResponse } from "msw";
import { findUser, permissionsFor } from "../fixtures/users";
import { realDelay } from "../delay";

const attempts = new Map<string, { count: number; firstAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const LIMIT = 5;

function bumpRateLimit(key: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now });
    return { ok: true, retryAfter: 0 };
  }
  rec.count += 1;
  if (rec.count > LIMIT) {
    return {
      ok: false,
      retryAfter: Math.ceil((WINDOW_MS - (now - rec.firstAt)) / 1000),
    };
  }
  return { ok: true, retryAfter: 0 };
}

const activeChallenges = new Map<string, { userId: string }>();

function makeToken(): string {
  return `mock_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export const authHandlers = [
  http.get("/api/auth/csrf-token", () => HttpResponse.json({ ok: true })),

  http.post("*/auth/login", async ({ request }) => {
    await realDelay();
    const body = (await request.json()) as {
      email: string;
      password: string;
      remember_me: boolean;
    };
    if (body.email && bumpRateLimit(body.email).ok === false) {
      return HttpResponse.json(
        {
          code: "RATE_LIMITED",
          message: "Too many login attempts. Wait 15 minutes.",
        },
        { status: 429, headers: { "Retry-After": "900" } },
      );
    }
    const seed = findUser(body.email);
    if (!seed || seed.password !== body.password) {
      return HttpResponse.json(
        { code: "INVALID_CREDENTIALS", message: "Email or password incorrect." },
        { status: 401 },
      );
    }
    if (seed.needs2Fa) {
      const challengeId = `chal_${crypto.randomUUID()}`;
      activeChallenges.set(challengeId, { userId: seed.user.id });
      // M-05 parity: backend echoes the enrolled method set here so the
      // frontend method picker knows what to offer.
      return HttpResponse.json({
        needs_2fa: true,
        two_fa_challenge_id: challengeId,
        available_methods: ["totp"],
      });
    }
    return HttpResponse.json({
      needs_2fa: false,
      access_token: makeToken(),
      access_token_exp: Math.floor(Date.now() / 1000) + 900,
      refresh_token: makeToken(),
      user: seed.user,
      permissions: permissionsFor(seed.user.id),
      session_id: `sess_${crypto.randomUUID()}`,
    });
  }),

  http.post("*/auth/refresh", async ({ request }) => {
    await realDelay(80, 150);
    const body = (await request.json()) as { refresh_token: string };
    if (!body.refresh_token?.startsWith("mock_")) {
      return HttpResponse.json(
        { code: "SESSION_EXPIRED", message: "Session expired." },
        { status: 401 },
      );
    }
    return HttpResponse.json({
      access_token: makeToken(),
      access_token_exp: Math.floor(Date.now() / 1000) + 900,
      refresh_token: makeToken(),
      permissions: permissionsFor("u_admin_1"),
      session_id: `sess_${crypto.randomUUID()}`,
    });
  }),

  http.post("*/auth/logout", async () => {
    await realDelay(100, 200);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("*/auth/2fa/verify", async ({ request }) => {
    await realDelay();
    const body = (await request.json()) as {
      challenge_id: string;
      method: string;
      code: string;
      remember_device: boolean;
    };
    const chal = activeChallenges.get(body.challenge_id);
    if (!chal) {
      return HttpResponse.json(
        { code: "INVALID_CREDENTIALS", message: "Challenge expired." },
        { status: 401 },
      );
    }
    // M-02 parity: backend regex validates the method field.
    if (!["totp", "whatsapp_otp", "backup_code"].includes(body.method)) {
      return HttpResponse.json(
        { code: "VALIDATION_FAILED", message: "Unknown 2FA method." },
        { status: 400 },
      );
    }
    if (body.code !== "000000") {
      return HttpResponse.json(
        { code: "INVALID_TOTP", message: "Incorrect code." },
        { status: 401 },
      );
    }
    const seed = findUser("admin@example.com")!;
    activeChallenges.delete(body.challenge_id);
    return HttpResponse.json({
      needs_2fa: false,
      access_token: makeToken(),
      access_token_exp: Math.floor(Date.now() / 1000) + 900,
      refresh_token: makeToken(),
      user: seed.user,
      permissions: permissionsFor(seed.user.id),
      session_id: `sess_${crypto.randomUUID()}`,
    });
  }),

  http.post("*/auth/forgot-password", async () => {
    await realDelay();
    return HttpResponse.json({ ok: true });
  }),
  http.post("*/auth/reset-password", async () => {
    await realDelay();
    return HttpResponse.json({ ok: true });
  }),
];
