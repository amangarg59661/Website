"use client";

import {
  apiErrorSchema,
  loginResponseSchema,
  refreshResponseSchema,
} from "@edss/validation/api";
import type {
  LoginInput,
  TwoFactorInput,
  ForgotPasswordInput,
} from "@edss/validation/auth";

type ResetPasswordSubmit = { token: string; new_password: string };
import { useAuthStore } from "./store";

function readCsrfCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf=([^;]+)/u);
  const raw = match?.[1];
  return raw ? decodeURIComponent(raw) : null;
}

async function ensureCsrfCookie(): Promise<void> {
  if (readCsrfCookie()) return;
  await fetch("/api/auth/csrf-token", {
    method: "GET",
    credentials: "same-origin",
  });
}

function csrfHeader(): Record<string, string> {
  const t = readCsrfCookie();
  return t ? { "X-CSRF-Token": t } : {};
}

export async function login(input: LoginInput) {
  await ensureCsrfCookie();
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrfHeader() },
    body: JSON.stringify(input),
    credentials: "same-origin",
  });
  const body: unknown = await res.json();
  if (!res.ok) {
    const parsed = apiErrorSchema.safeParse(body);
    throw new Error(
      parsed.success ? parsed.data.message : `HTTP ${res.status}`,
    );
  }
  const parsed = loginResponseSchema.parse(body);
  const store = useAuthStore.getState();
  if (parsed.needs_2fa) {
    store.setTwoFaChallenge(parsed.two_fa_challenge_id);
    return {
      needsTwoFa: true as const,
      challengeId: parsed.two_fa_challenge_id,
    };
  }
  store.setAuthenticated({
    accessToken: parsed.access_token,
    accessTokenExp: parsed.access_token_exp,
    user: parsed.user,
    permissions: parsed.permissions,
    sessionId: parsed.session_id,
  });
  return { needsTwoFa: false as const };
}

export async function verify2FA(input: TwoFactorInput) {
  await ensureCsrfCookie();
  const res = await fetch("/api/auth/2fa/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrfHeader() },
    body: JSON.stringify(input),
    credentials: "same-origin",
  });
  const body: unknown = await res.json();
  if (!res.ok) {
    const parsed = apiErrorSchema.safeParse(body);
    throw new Error(
      parsed.success ? parsed.data.message : `HTTP ${res.status}`,
    );
  }
  const parsed = loginResponseSchema.parse(body);
  if (parsed.needs_2fa)
    throw new Error("Unexpected needs_2fa on verify response.");
  useAuthStore.getState().setAuthenticated({
    accessToken: parsed.access_token,
    accessTokenExp: parsed.access_token_exp,
    user: parsed.user,
    permissions: parsed.permissions,
    sessionId: parsed.session_id,
  });
}

/**
 * S-17: preflight the CSRF cookie before firing a refresh. Without this, a
 * tab left open longer than the csrf cookie's 24h Max-Age but shorter than
 * the rt cookie's 30d Max-Age would 403 on the refresh, silently logging
 * the user out mid-session. safeParse guards against a valid-2xx but
 * unexpected-shape body — the old .parse() threw and mimicked SESSION_EXPIRED.
 */
export async function refreshAccessToken(): Promise<boolean> {
  await ensureCsrfCookie();
  useAuthStore.setState({ status: "refreshing" });
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: csrfHeader(),
    credentials: "same-origin",
  });
  if (!res.ok) {
    useAuthStore.getState().reset();
    return false;
  }
  const body: unknown = await res.json();
  const parsed = refreshResponseSchema.safeParse(body);
  if (!parsed.success) {
    useAuthStore.getState().reset();
    return false;
  }
  useAuthStore.getState().setRefreshed({
    accessToken: parsed.data.access_token,
    accessTokenExp: parsed.data.access_token_exp,
    permissions: parsed.data.permissions,
    sessionId: parsed.data.session_id,
  });
  return true;
}

export async function logout(): Promise<void> {
  try {
    await ensureCsrfCookie();
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: csrfHeader(),
      credentials: "same-origin",
    });
  } finally {
    useAuthStore.getState().reset();
  }
}

export async function requestPasswordReset(
  input: ForgotPasswordInput,
): Promise<void> {
  await ensureCsrfCookie();
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrfHeader() },
    body: JSON.stringify(input),
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function confirmPasswordReset(
  input: ResetPasswordSubmit,
): Promise<void> {
  await ensureCsrfCookie();
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrfHeader() },
    body: JSON.stringify(input),
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
