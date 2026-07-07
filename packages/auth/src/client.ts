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
  ResetPasswordInput,
} from "@edss/validation/auth";
import { useAuthStore } from "./store.js";

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

export async function refreshAccessToken(): Promise<boolean> {
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
  const parsed = refreshResponseSchema.parse(body);
  useAuthStore.getState().setRefreshed({
    accessToken: parsed.access_token,
    accessTokenExp: parsed.access_token_exp,
    permissions: parsed.permissions,
    sessionId: parsed.session_id,
  });
  return true;
}

export async function logout(): Promise<void> {
  try {
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
  input: ResetPasswordInput,
): Promise<void> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrfHeader() },
    body: JSON.stringify(input),
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
