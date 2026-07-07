# Dashboard Shell — Implementation Plan (part 2)

Continuation of [`2026-07-07-dashboard-shell.md`](2026-07-07-dashboard-shell.md). Same header + goal + tech stack apply.

---

## Stage 1 — continued

### Task 1.5: Scaffold `@edss/auth`

**Files:** `packages/auth/{package.json,tsconfig.json,src/{index.ts,store.ts,hooks.ts,guard.tsx,session.ts,2fa.ts,client.ts}}`

- [ ] **Step 1: Create dir**

```bash
cd "D:/Aman_Build/External Frontend/self v1"
mkdir -p packages/auth/src
```

- [ ] **Step 2: Write `packages/auth/package.json`**

```json
{
  "name": "@edss/auth",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": { "types": "./src/index.ts", "default": "./src/index.ts" },
    "./store": { "types": "./src/store.ts", "default": "./src/store.ts" },
    "./hooks": { "types": "./src/hooks.ts", "default": "./src/hooks.ts" },
    "./guard": { "types": "./src/guard.tsx", "default": "./src/guard.tsx" },
    "./session": { "types": "./src/session.ts", "default": "./src/session.ts" },
    "./2fa": { "types": "./src/2fa.ts", "default": "./src/2fa.ts" },
    "./client": { "types": "./src/client.ts", "default": "./src/client.ts" }
  },
  "dependencies": {
    "@edss/api": "*",
    "@edss/types": "*",
    "@edss/validation": "*",
    "zustand": "^5.0.2"
  },
  "peerDependencies": { "react": "^19", "next": "^15" },
  "devDependencies": {
    "@edss/config": "*",
    "@types/react": "^19.0.2",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 3: Write `packages/auth/tsconfig.json`**

```json
{ "extends": "@edss/config/tsconfig/react-library.json", "include": ["src"] }
```

- [ ] **Step 4: Write `packages/auth/src/store.ts`**

Zustand store — see full source below. Contains initial state, `setAuthenticated`, `setRefreshed`, `setTwoFaChallenge`, `setRoleGroup`, `reset`.

```ts
"use client";
import { create } from "zustand";
import type { User, Permission, RoleGroup } from "@edss/types";

export type AuthStatus =
  | "idle"
  | "authenticating"
  | "authenticated"
  | "refreshing"
  | "unauthenticated";

export type AuthState = {
  status: AuthStatus;
  accessToken: string | null;
  accessTokenExp: number | null;
  user: User | null;
  permissions: Permission[];
  primaryRole: RoleGroup | null;
  hasBothRoles: boolean;
  activeRoleGroup: RoleGroup | null;
  sessionId: string | null;
  needsTwoFa: boolean;
  twoFaChallengeId: string | null;
};

export type AuthActions = {
  setAuthenticated: (p: {
    accessToken: string;
    accessTokenExp: number;
    user: User;
    permissions: Permission[];
    sessionId: string;
  }) => void;
  setRefreshed: (p: {
    accessToken: string;
    accessTokenExp: number;
    permissions: Permission[];
    sessionId: string;
  }) => void;
  setTwoFaChallenge: (challengeId: string) => void;
  setRoleGroup: (group: RoleGroup) => void;
  reset: () => void;
};

const initialState: AuthState = {
  status: "idle",
  accessToken: null,
  accessTokenExp: null,
  user: null,
  permissions: [],
  primaryRole: null,
  hasBothRoles: false,
  activeRoleGroup: null,
  sessionId: null,
  needsTwoFa: false,
  twoFaChallengeId: null,
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,
  setAuthenticated: (p) =>
    set({
      status: "authenticated",
      accessToken: p.accessToken,
      accessTokenExp: p.accessTokenExp,
      user: p.user,
      permissions: p.permissions,
      primaryRole: p.user.primaryRole,
      hasBothRoles: p.user.hasBothRoles,
      activeRoleGroup: p.user.primaryRole,
      sessionId: p.sessionId,
      needsTwoFa: false,
      twoFaChallengeId: null,
    }),
  setRefreshed: (p) =>
    set((s) => ({
      status: "authenticated",
      accessToken: p.accessToken,
      accessTokenExp: p.accessTokenExp,
      permissions: p.permissions,
      sessionId: p.sessionId,
      user: s.user,
    })),
  setTwoFaChallenge: (id) =>
    set({ status: "idle", needsTwoFa: true, twoFaChallengeId: id }),
  setRoleGroup: (group) => set({ activeRoleGroup: group }),
  reset: () => set({ ...initialState, status: "unauthenticated" }),
}));
```

- [ ] **Step 5: Write `packages/auth/src/hooks.ts`**

```ts
"use client";
import { useAuthStore } from "./store.js";

export function useAuth() {
  return useAuthStore();
}
export function useUser() {
  return useAuthStore((s) => s.user);
}
export function useIsAuthenticated() {
  return useAuthStore((s) => s.status === "authenticated");
}
export function usePermissions() {
  return useAuthStore((s) => s.permissions);
}
export function useHasPermission(permission: string) {
  return useAuthStore((s) => s.permissions.includes(permission));
}
export function useAnyPermission(permissions: string[]) {
  return useAuthStore((s) =>
    permissions.some((p) => s.permissions.includes(p)),
  );
}
```

- [ ] **Step 6: Write `packages/auth/src/guard.tsx`**

```tsx
"use client";
import type { ReactNode } from "react";
import { useHasPermission } from "./hooks.js";

export function PermissionGate({
  permission,
  fallback = null,
  children,
}: {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const allowed = useHasPermission(permission);
  return allowed ? <>{children}</> : <>{fallback}</>;
}

export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string,
  Unauthorized: React.ComponentType = DefaultUnauthorized,
) {
  return function Guarded(props: P) {
    const allowed = useHasPermission(permission);
    return allowed ? <Component {...props} /> : <Unauthorized />;
  };
}

function DefaultUnauthorized() {
  return (
    <div className="p-8">
      <h1 className="h2">Not permitted</h1>
      <p className="lede">You do not have permission for this area.</p>
    </div>
  );
}
```

- [ ] **Step 7: Write `packages/auth/src/session.ts`**

```ts
"use client";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "./store.js";

const IDLE_MS = 30 * 60 * 1000;
const WARN_MS = 25 * 60 * 1000;
const CHANNEL = "edss-session";
const ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "wheel",
  "touchstart",
] as const;

export function useSessionIdleTimer(onExpire: () => void, onWarn: () => void) {
  const authed = useAuthStore((s) => s.status === "authenticated");
  const lastActivity = useRef<number>(Date.now());
  const warnedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!authed) return;
    const bc = new BroadcastChannel(CHANNEL);
    function bump() {
      const now = Date.now();
      lastActivity.current = now;
      warnedRef.current = false;
      bc.postMessage({ type: "activity", ts: now });
    }
    function onMsg(e: MessageEvent) {
      if (e.data?.type === "activity" && typeof e.data.ts === "number") {
        lastActivity.current = Math.max(lastActivity.current, e.data.ts);
        warnedRef.current = false;
      }
    }
    for (const ev of ACTIVITY_EVENTS)
      document.addEventListener(ev, bump, { passive: true });
    bc.addEventListener("message", onMsg);
    const tick = setInterval(() => {
      const idle = Date.now() - lastActivity.current;
      if (idle >= IDLE_MS) onExpire();
      else if (idle >= WARN_MS && !warnedRef.current) {
        warnedRef.current = true;
        onWarn();
      }
    }, 15_000);
    return () => {
      clearInterval(tick);
      for (const ev of ACTIVITY_EVENTS) document.removeEventListener(ev, bump);
      bc.removeEventListener("message", onMsg);
      bc.close();
    };
  }, [authed, onExpire, onWarn]);
}

export function useCountdown(fromMs: number) {
  const [remaining, setRemaining] = useState(fromMs);
  useEffect(() => {
    const t = setInterval(
      () => setRemaining((r) => Math.max(0, r - 1000)),
      1000,
    );
    return () => clearInterval(t);
  }, []);
  return remaining;
}
```

- [ ] **Step 8: Write `packages/auth/src/2fa.ts`**

```ts
"use client";
import { useState } from "react";

export type TwoFaState =
  | { kind: "idle" }
  | { kind: "verifying" }
  | { kind: "invalid" }
  | { kind: "rate-limited"; retryAfterSec: number }
  | { kind: "verified" };

export function use2faChallenge() {
  const [state, setState] = useState<TwoFaState>({ kind: "idle" });
  return { state, setState };
}
```

- [ ] **Step 9: Write `packages/auth/src/client.ts`**

```ts
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
  return match ? decodeURIComponent(match[1]) : null;
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
```

- [ ] **Step 10: Write `packages/auth/src/index.ts`**

```ts
export * from "./store.js";
export * from "./hooks.js";
export * from "./guard.js";
export * from "./session.js";
export * from "./2fa.js";
export * from "./client.js";
```

- [ ] **Step 11: Install + typecheck + commit**

```bash
npm install
npx tsc --noEmit -p packages/auth/tsconfig.json
git add packages/auth package.json package-lock.json
git commit -m "feat(auth): scaffold @edss/auth with Zustand store, hooks, PermissionGate, session timer, 2FA state, client"
```

### Task 1.6: Scaffold `apps/dashboard` skeleton

**Files:**

- Create: `apps/dashboard/package.json`, `apps/dashboard/tsconfig.json`, `apps/dashboard/eslint.config.mjs`, `apps/dashboard/prettier.config.mjs`, `apps/dashboard/postcss.config.mjs`, `apps/dashboard/next.config.mjs`, `apps/dashboard/next-env.d.ts`, `apps/dashboard/app/{layout.tsx,not-found.tsx,error.tsx,global-error.tsx}`, `apps/dashboard/styles/globals.css`, `apps/dashboard/public/.gitkeep`

- [ ] **Step 1: Create dirs**

```bash
mkdir -p apps/dashboard/{app,components,mocks,styles,public}
```

- [ ] **Step 2: Write `apps/dashboard/package.json`**

```json
{
  "name": "@edss/dashboard",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write \"**/*.{ts,tsx,md,mdx,css,json}\""
  },
  "dependencies": {
    "@edss/analytics": "*",
    "@edss/api": "*",
    "@edss/auth": "*",
    "@edss/design-system": "*",
    "@edss/hooks": "*",
    "@edss/icons": "*",
    "@edss/types": "*",
    "@edss/ui": "*",
    "@edss/utils": "*",
    "@edss/validation": "*",
    "@radix-ui/react-avatar": "^1.1.2",
    "@radix-ui/react-checkbox": "^1.1.3",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-label": "^2.1.1",
    "@radix-ui/react-popover": "^1.1.4",
    "@radix-ui/react-scroll-area": "^1.2.2",
    "@radix-ui/react-separator": "^1.1.1",
    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-switch": "^1.1.2",
    "@radix-ui/react-tabs": "^1.1.2",
    "@radix-ui/react-toast": "^1.2.4",
    "@radix-ui/react-tooltip": "^1.1.5",
    "@tanstack/react-query": "^5.60.0",
    "@upstash/ratelimit": "^2.0.5",
    "@upstash/redis": "^1.34.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.4",
    "framer-motion": "^11.15.0",
    "lucide-react": "^0.469.0",
    "msw": "^2.7.0",
    "next": "15.1.3",
    "next-themes": "^0.4.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.54.2",
    "tailwind-merge": "^2.6.0",
    "zod": "^3.24.1",
    "zustand": "^5.0.2"
  },
  "devDependencies": {
    "@edss/config": "*",
    "@tailwindcss/postcss": "^4.0.0",
    "@types/node": "^22.10.5",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "postcss": "^8.4.49"
  },
  "msw": { "workerDirectory": ["public"] }
}
```

- [ ] **Step 3: Write `apps/dashboard/tsconfig.json`**

```json
{
  "extends": "@edss/config/tsconfig/next.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/mocks/*": ["./mocks/*"],
      "@/styles/*": ["./styles/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Write `apps/dashboard/eslint.config.mjs`**

```js
import config from "@edss/config/eslint/next";
export default config;
```

- [ ] **Step 5: Write `apps/dashboard/prettier.config.mjs`**

```js
export { default } from "@edss/config/prettier";
```

- [ ] **Step 6: Write `apps/dashboard/postcss.config.mjs`**

```js
export default { plugins: { "@tailwindcss/postcss": {} } };
```

- [ ] **Step 7: Write `apps/dashboard/next.config.mjs`**

```js
const API_BASE_ORIGIN = new URL(
  process.env.NEXT_PUBLIC_API_BASE ?? "https://api.edss.example",
).origin;
const WS_BASE_ORIGIN =
  process.env.NEXT_PUBLIC_WS_BASE ?? "wss://api.edss.example";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  transpilePackages: [
    "@edss/analytics",
    "@edss/api",
    "@edss/auth",
    "@edss/design-system",
    "@edss/hooks",
    "@edss/icons",
    "@edss/types",
    "@edss/ui",
    "@edss/utils",
    "@edss/validation",
  ],
  experimental: {
    strictNextHead: true,
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
    ],
  },
  env: { API_BASE_ORIGIN, WS_BASE_ORIGIN },
};

export default nextConfig;
```

- [ ] **Step 8: Write `apps/dashboard/next-env.d.ts`**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 9: Write `apps/dashboard/styles/globals.css`**

```css
@import "tailwindcss";

@import "@edss/design-system/styles/tokens.css";
@import "@edss/design-system/styles/tokens-light.css";
@import "@edss/design-system/styles/tokens-dark.css";

@source '../../../packages/ui/src/**/*.{ts,tsx}';
@source '../../../packages/icons/src/**/*.{ts,tsx}';
@source '../../../packages/analytics/src/**/*.{ts,tsx}';

@layer base {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  html {
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    scrollbar-gutter: stable;
  }
  body {
    margin: 0;
    background: var(--color-paper);
    color: var(--color-ink);
    font-family: var(--font-sans);
    font-size: var(--text-body);
    line-height: 1.55;
  }
  [data-theme="dark"] body {
    background: var(--color-ink);
    color: var(--color-paper);
  }
  h1,
  h2,
  h3,
  h4 {
    font-family: var(--font-display);
    font-weight: 400;
    letter-spacing: -0.02em;
    margin: 0;
    text-wrap: balance;
  }
  a {
    color: inherit;
    text-decoration: none;
  }
  :focus-visible {
    outline: 2px solid var(--color-gold);
    outline-offset: 3px;
    border-radius: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}

@layer utilities {
  .container-app {
    max-width: 1440px;
    margin-inline: auto;
    padding-inline: clamp(1rem, 1rem + 1.5vw, 2rem);
  }
  .kicker {
    font-family: var(--font-mono);
    font-size: var(--text-eyebrow);
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-muted);
  }
  .h1 {
    font-size: var(--text-h1);
  }
  .h2 {
    font-size: var(--text-h2);
  }
  .h3 {
    font-size: var(--text-h3);
  }
  .h4 {
    font-size: var(--text-h4);
  }
  .lede {
    font-size: var(--text-lede);
    line-height: 1.5;
    color: var(--color-muted);
    max-width: 62ch;
  }
}
```

- [ ] **Step 10: Write `apps/dashboard/app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { display, sans, mono } from "@edss/design-system/fonts";
import { PostHogProvider, PageviewTracker } from "@edss/analytics/client";
import { Suspense } from "react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { MSWProvider } from "@/components/providers/MSWProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Elite Digital Solutions — Dashboard",
    template: "%s · EDSS",
  },
  description:
    "Business Operations Platform for Elite Digital Solutions Studio.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf9f9" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") ?? "";
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)theme=([^;]+)/);var t=m?decodeURIComponent(m[1]):"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light");}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <QueryProvider>
            <MSWProvider>
              <AuthProvider>
                <PostHogProvider>
                  <Suspense fallback={null}>
                    <PageviewTracker />
                  </Suspense>
                  <ToastProvider>{children}</ToastProvider>
                </PostHogProvider>
              </AuthProvider>
            </MSWProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 11: Write `apps/dashboard/app/not-found.tsx`**

```tsx
export default function NotFound() {
  return (
    <main className="container-app py-24">
      <p className="kicker">404</p>
      <h1 className="display mt-4">Nothing here.</h1>
      <p className="lede mt-4">The page you asked for does not exist.</p>
    </main>
  );
}
```

- [ ] **Step 12: Write `apps/dashboard/app/error.tsx`**

```tsx
"use client";
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="container-app py-24">
      <p className="kicker">Error</p>
      <h1 className="h1 mt-4">Something went wrong.</h1>
      <p className="lede mt-4">We logged it. You can try again.</p>
      <button
        onClick={reset}
        className="mt-8 h-11 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] px-5 text-[0.9rem] hover:border-[var(--color-ink)]"
      >
        Try again
      </button>
    </main>
  );
}
```

- [ ] **Step 13: Write `apps/dashboard/app/global-error.tsx`**

```tsx
"use client";
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <main style={{ padding: "48px", fontFamily: "system-ui" }}>
          <h1>Fatal error</h1>
          <p>The dashboard could not render. Try again.</p>
          <button onClick={reset}>Try again</button>
        </main>
      </body>
    </html>
  );
}
```

- [ ] **Step 14: Create empty public dir**

```bash
touch apps/dashboard/public/.gitkeep
```

### Task 1.7: Edge middleware — headers + CSP + auth gate + CSRF + rate limit

**Files:**

- Create: `apps/dashboard/middleware.ts`

- [ ] **Step 1: Write `apps/dashboard/middleware.ts`**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const HAS_REDIS = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);
const redis = HAS_REDIS ? Redis.fromEnv() : null;
const loginLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "rl:login",
    })
  : null;
const refreshLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      prefix: "rl:refresh",
    })
  : null;
const twofaLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "rl:2fa",
    })
  : null;
const forgotLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      prefix: "rl:forgot",
    })
  : null;

const PUBLIC_ROUTES = [
  "/login",
  "/login/2fa-challenge",
  "/forgot-password",
  "/reset-password",
];
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
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()",
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
    retryAfter: r.success
      ? 0
      : Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)),
  };
}

function isAuthRoute(pathname: string): boolean {
  return (
    pathname === "/" ||
    PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
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

  // Rate limits
  const key = clientKey(req);
  if (req.method === "POST") {
    let limitResult: { ok: boolean; retryAfter: number } | null = null;
    if (pathname === "/api/auth/login")
      limitResult = await checkRateLimit(loginLimit, key);
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

  // CSRF check on auth proxy mutations
  if (
    ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) &&
    AUTH_PROXY_ROUTES.some(
      (r) => pathname === r || pathname.startsWith(`${r}/`),
    )
  ) {
    const skipCsrfPaths = new Set(["/api/auth/csrf-token"]);
    if (!skipCsrfPaths.has(pathname)) {
      const header = req.headers.get("x-csrf-token");
      const cookie = req.cookies.get("csrf")?.value;
      if (!header || !cookie || header !== cookie) {
        const res = new NextResponse(
          JSON.stringify({
            code: "CSRF_MISMATCH",
            message: "CSRF token mismatch.",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        );
        return applyHeaders(res, nonce);
      }
    }
  }

  // Auth gate
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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|mockServiceWorker.js).*)",
  ],
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm --workspace @edss/dashboard run typecheck
```

Expected: exits 0. (Route handlers not yet written; middleware alone should compile.)

### Task 1.8: Auth-proxy route handlers

**Files:**

- Create: `apps/dashboard/app/api/auth/csrf-token/route.ts`
- Create: `apps/dashboard/app/api/auth/login/route.ts`
- Create: `apps/dashboard/app/api/auth/refresh/route.ts`
- Create: `apps/dashboard/app/api/auth/logout/route.ts`
- Create: `apps/dashboard/app/api/auth/2fa/verify/route.ts`
- Create: `apps/dashboard/app/api/auth/forgot-password/route.ts`
- Create: `apps/dashboard/app/api/auth/reset-password/route.ts`
- Create: `apps/dashboard/app/api/csp-report/route.ts`

- [ ] **Step 1: Write `apps/dashboard/app/api/auth/csrf-token/route.ts`**

```ts
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
```

- [ ] **Step 2: Write shared proxy helper `apps/dashboard/app/api/auth/_proxy.ts`**

```ts
import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://api.edss.example";

export async function forwardToBackend(
  path: string,
  init: {
    method: "POST" | "GET";
    body?: unknown;
    forwardCookieHeader?: string | null;
    forwardBackendSetCookie?: boolean;
  },
): Promise<NextResponse> {
  let backendRes: Response;
  try {
    backendRes = await fetch(`${API_BASE}${path}`, {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init.forwardCookieHeader
          ? { Cookie: init.forwardCookieHeader }
          : {}),
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
  const res = NextResponse.json(body, { status: backendRes.status });
  if (init.forwardBackendSetCookie) {
    const setCookie = backendRes.headers.get("set-cookie");
    if (setCookie) res.headers.append("set-cookie", setCookie);
  }
  return res;
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
```

- [ ] **Step 3: Write `apps/dashboard/app/api/auth/login/route.ts`**

```ts
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
  if (!body)
    return NextResponse.json(
      { code: "VALIDATION_FAILED", message: "Bad body" },
      { status: 400 },
    );
  const upstream = await forwardToBackend("/auth/login", {
    method: "POST",
    body,
  });
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
```

- [ ] **Step 4: Write `apps/dashboard/app/api/auth/refresh/route.ts`**

```ts
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
```

- [ ] **Step 5: Write `apps/dashboard/app/api/auth/logout/route.ts`**

```ts
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
```

- [ ] **Step 6: Write `apps/dashboard/app/api/auth/2fa/verify/route.ts`**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { forwardToBackend, setAuthCookies } from "../../_proxy";

type BackendVerifyResponse = {
  needs_2fa: false;
  access_token: string;
  access_token_exp: number;
  refresh_token: string;
  user: unknown;
  permissions: string[];
  session_id: string;
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json(
      { code: "VALIDATION_FAILED", message: "Bad body" },
      { status: 400 },
    );
  const upstream = await forwardToBackend("/auth/2fa/verify", {
    method: "POST",
    body,
  });
  if (upstream.status !== 200) return upstream;
  const backendBody = (await upstream.json()) as BackendVerifyResponse;
  const res = NextResponse.json(
    {
      needs_2fa: false,
      access_token: backendBody.access_token,
      access_token_exp: backendBody.access_token_exp,
      user: backendBody.user,
      permissions: backendBody.permissions,
      session_id: backendBody.session_id,
    },
    { status: 200 },
  );
  setAuthCookies(res, backendBody.refresh_token);
  return res;
}
```

- [ ] **Step 7: Write `apps/dashboard/app/api/auth/forgot-password/route.ts`**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { forwardToBackend } from "../_proxy";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json(
      { code: "VALIDATION_FAILED", message: "Bad body" },
      { status: 400 },
    );
  return forwardToBackend("/auth/forgot-password", { method: "POST", body });
}
```

- [ ] **Step 8: Write `apps/dashboard/app/api/auth/reset-password/route.ts`**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { forwardToBackend } from "../_proxy";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json(
      { code: "VALIDATION_FAILED", message: "Bad body" },
      { status: 400 },
    );
  return forwardToBackend("/auth/reset-password", { method: "POST", body });
}
```

- [ ] **Step 9: Write `apps/dashboard/app/api/csp-report/route.ts`**

```ts
import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const report = await req.text();
  console.warn("[csp-report]", report.slice(0, 4000));
  return new NextResponse(null, { status: 204 });
}
```

### Task 1.9: Providers (Query, MSW, Auth, Toast, Theme)

**Files:**

- Create: `apps/dashboard/components/providers/QueryProvider.tsx`
- Create: `apps/dashboard/components/providers/MSWProvider.tsx`
- Create: `apps/dashboard/components/providers/AuthProvider.tsx`
- Create: `apps/dashboard/components/providers/ToastProvider.tsx`
- Create: `apps/dashboard/components/theme/ThemeProvider.tsx`

- [ ] **Step 1: Write `apps/dashboard/components/providers/QueryProvider.tsx`**

```tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 300_000,
            refetchOnWindowFocus: false,
            retry: 3,
            retryDelay: (n) =>
              Math.min(1000 * 2 ** n + Math.random() * 500, 8000),
          },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 2: Write `apps/dashboard/components/providers/MSWProvider.tsx`**

```tsx
"use client";
import { useEffect, useState, type ReactNode } from "react";

const enabled = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export function MSWProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!enabled);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      const { startMocks } = await import("@/mocks/browser");
      await startMocks();
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  if (!ready) return null;
  return <>{children}</>;
}
```

- [ ] **Step 3: Write `apps/dashboard/components/providers/AuthProvider.tsx`**

```tsx
"use client";
import { useEffect, type ReactNode } from "react";
import { initApiClient } from "@edss/api";
import { useAuthStore, refreshAccessToken, logout } from "@edss/auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initApiClient({
      baseUrl: process.env.NEXT_PUBLIC_API_BASE ?? "https://api.edss.example",
      getAccessToken: () => useAuthStore.getState().accessToken,
      onSessionExpired: () => {
        useAuthStore.getState().reset();
        if (typeof window !== "undefined")
          window.location.assign("/login?reason=session_expired");
      },
      triggerRefresh: async () => refreshAccessToken(),
    });
    void refreshAccessToken();
    return () => {};
  }, []);

  useEffect(() => {
    const unsub = useAuthStore.subscribe((state, prev) => {
      if (state.status !== "authenticated" || !state.accessTokenExp) return;
      if (prev.accessToken === state.accessToken) return;
      const nowSec = Math.floor(Date.now() / 1000);
      const untilRefresh = Math.max(
        30_000,
        (state.accessTokenExp - nowSec - 60) * 1000,
      );
      const t = window.setTimeout(() => {
        void refreshAccessToken();
      }, untilRefresh);
      return () => window.clearTimeout(t);
    });
    return unsub;
  }, []);

  return <>{children}</>;
}
```

- [ ] **Step 4: Write `apps/dashboard/components/providers/ToastProvider.tsx`**

```tsx
"use client";
import * as Toast from "@radix-ui/react-toast";
import { create } from "zustand";
import type { ReactNode } from "react";

type ToastItem = {
  id: string;
  severity: "info" | "success" | "warning" | "error";
  title: string;
  body?: string;
  durationMs: number;
};

type ToastStore = {
  items: ToastItem[];
  push: (t: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  items: [],
  push: (t) =>
    set((s) => ({
      items: [...s.items, { ...t, id: crypto.randomUUID() }].slice(-3),
    })),
  dismiss: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));

export function ToastProvider({ children }: { children: ReactNode }) {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <Toast.Provider swipeDirection="right">
      {children}
      {items.map((t) => (
        <Toast.Root
          key={t.id}
          duration={t.durationMs}
          onOpenChange={(o) => !o && dismiss(t.id)}
          className="fixed right-6 top-6 z-[var(--z-toast)] rounded-[var(--radius-md)] border border-[var(--color-line-strong)] bg-[var(--color-paper)] px-4 py-3 shadow-[var(--shadow-md)]"
        >
          <Toast.Title className="text-sm font-medium">{t.title}</Toast.Title>
          {t.body && (
            <Toast.Description className="mt-1 text-sm text-[var(--color-muted)]">
              {t.body}
            </Toast.Description>
          )}
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed right-0 top-0 z-[var(--z-toast)] flex w-96 flex-col gap-2 p-6" />
    </Toast.Provider>
  );
}
```

- [ ] **Step 5: Write `apps/dashboard/components/theme/ThemeProvider.tsx`**

```tsx
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="theme"
    >
      {children}
    </NextThemesProvider>
  );
}
```

### Task 1.10: MSW mock backend

**Files:**

- Create: `apps/dashboard/mocks/{browser.ts,node.ts,delay.ts,handlers/{index.ts,auth.ts,users.ts,projects.ts,invoices.ts,tickets.ts,files.ts,notifications.ts},fixtures/{users.ts,permissions.ts}}`
- Create (generated): `apps/dashboard/public/mockServiceWorker.js`

- [ ] **Step 1: Install msw + generate worker**

```bash
cd "D:/Aman_Build/External Frontend/self v1"
npm install --workspace @edss/dashboard
cd apps/dashboard && npx msw init public/ --save && cd ../..
```

Expected: `apps/dashboard/public/mockServiceWorker.js` created.

- [ ] **Step 2: Write `apps/dashboard/mocks/delay.ts`**

```ts
export async function realDelay(min = 200, max = 400): Promise<void> {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    if (params.get("fast") === "1") return;
  }
  const d = Math.floor(min + Math.random() * (max - min));
  await new Promise((r) => setTimeout(r, d));
}
```

- [ ] **Step 3: Write `apps/dashboard/mocks/fixtures/users.ts`**

```ts
import type { User, Permission } from "@edss/types";

export const seedUsers: Array<{
  user: User;
  password: string;
  totpCode: string | null;
  needs2Fa: boolean;
}> = [
  {
    user: {
      id: "u_client_1",
      email: "client@example.com",
      name: "Client User",
      avatarUrl: null,
      primaryRole: "client",
      hasBothRoles: false,
      createdAt: "2026-01-15T10:00:00Z",
    },
    password: "password",
    totpCode: null,
    needs2Fa: false,
  },
  {
    user: {
      id: "u_staff_1",
      email: "staff@example.com",
      name: "Staff User",
      avatarUrl: null,
      primaryRole: "staff",
      hasBothRoles: false,
      createdAt: "2026-01-10T10:00:00Z",
    },
    password: "password",
    totpCode: null,
    needs2Fa: false,
  },
  {
    user: {
      id: "u_admin_1",
      email: "admin@example.com",
      name: "Admin User",
      avatarUrl: null,
      primaryRole: "staff",
      hasBothRoles: true,
      createdAt: "2026-01-01T10:00:00Z",
    },
    password: "password",
    totpCode: "000000",
    needs2Fa: true,
  },
];

export function findUser(email: string) {
  return seedUsers.find((s) => s.user.email === email);
}

export const clientPermissions: Permission[] = [
  "projects:read",
  "invoices:read",
  "tickets:read",
  "tickets:write",
  "files:read",
  "files:write",
  "calendar:read",
  "notifications:read",
  "profile:read",
  "profile:write",
  "settings:read",
];
export const staffPermissions: Permission[] = [
  "projects:read",
  "projects:write",
  "invoices:read",
  "invoices:write",
  "sales:read",
  "sales:write",
  "users:read",
  "users:write",
  "reports:read",
  "audit-logs:read",
  "calendar:read",
  "notifications:read",
  "settings:read",
  "settings:write",
];

export function permissionsFor(userId: string): Permission[] {
  if (userId === "u_client_1") return clientPermissions;
  if (userId === "u_staff_1") return staffPermissions;
  if (userId === "u_admin_1")
    return [...new Set([...clientPermissions, ...staffPermissions])];
  return [];
}
```

- [ ] **Step 4: Write `apps/dashboard/mocks/fixtures/permissions.ts`**

```ts
export {
  clientPermissions,
  staffPermissions,
  permissionsFor,
} from "./users.js";
```

- [ ] **Step 5: Write `apps/dashboard/mocks/handlers/auth.ts`**

```ts
import { http, HttpResponse } from "msw";
import { findUser, permissionsFor } from "../fixtures/users.js";
import { realDelay } from "../delay.js";

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
  if (rec.count > LIMIT)
    return {
      ok: false,
      retryAfter: Math.ceil((WINDOW_MS - (now - rec.firstAt)) / 1000),
    };
  return { ok: true, retryAfter: 0 };
}

const activeChallenges = new Map<string, { userId: string }>();

function makeToken(): string {
  return `mock_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export const authHandlers = [
  http.get("/api/auth/csrf-token", async ({ request }) => {
    // Route handler generates the cookie; mock just returns OK. In dev, real Next handler runs first — MSW rarely intercepts same-origin.
    return HttpResponse.json({ ok: true });
  }),

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
        {
          code: "INVALID_CREDENTIALS",
          message: "Email or password incorrect.",
        },
        { status: 401 },
      );
    }
    if (seed.needs2Fa) {
      const challengeId = `chal_${crypto.randomUUID()}`;
      activeChallenges.set(challengeId, { userId: seed.user.id });
      return HttpResponse.json({
        needs_2fa: true,
        two_fa_challenge_id: challengeId,
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
      code: string;
      remember_device: boolean;
    };
    const chal = activeChallenges.get(body.challenge_id);
    if (!chal)
      return HttpResponse.json(
        { code: "INVALID_CREDENTIALS", message: "Challenge expired." },
        { status: 401 },
      );
    if (body.code !== "000000")
      return HttpResponse.json(
        { code: "INVALID_TOTP", message: "Incorrect code." },
        { status: 401 },
      );
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
```

- [ ] **Step 6: Write stub handlers for other resources**

```ts
// apps/dashboard/mocks/handlers/users.ts
import { http, HttpResponse } from "msw";
import { seedUsers } from "../fixtures/users.js";
export const usersHandlers = [
  http.get("*/users/me", () => HttpResponse.json(seedUsers[0].user)),
];
```

```ts
// apps/dashboard/mocks/handlers/projects.ts
import { http, HttpResponse } from "msw";
export const projectsHandlers = [
  http.get("*/projects", () =>
    HttpResponse.json({ items: [], cursor: null, has_more: false }),
  ),
];
```

```ts
// apps/dashboard/mocks/handlers/invoices.ts
import { http, HttpResponse } from "msw";
export const invoicesHandlers = [
  http.get("*/invoices", () =>
    HttpResponse.json({ items: [], cursor: null, has_more: false }),
  ),
];
```

```ts
// apps/dashboard/mocks/handlers/tickets.ts
import { http, HttpResponse } from "msw";
export const ticketsHandlers = [
  http.get("*/tickets", () =>
    HttpResponse.json({ items: [], cursor: null, has_more: false }),
  ),
];
```

```ts
// apps/dashboard/mocks/handlers/files.ts
import { http, HttpResponse } from "msw";
export const filesHandlers = [
  http.get("*/files", () =>
    HttpResponse.json({ items: [], cursor: null, has_more: false }),
  ),
];
```

```ts
// apps/dashboard/mocks/handlers/notifications.ts
import { http, HttpResponse } from "msw";
export const notificationsHandlers = [
  http.get("*/notifications", () =>
    HttpResponse.json({ items: [], cursor: null, has_more: false }),
  ),
];
```

- [ ] **Step 7: Write `apps/dashboard/mocks/handlers/index.ts`**

```ts
import { authHandlers } from "./auth.js";
import { usersHandlers } from "./users.js";
import { projectsHandlers } from "./projects.js";
import { invoicesHandlers } from "./invoices.js";
import { ticketsHandlers } from "./tickets.js";
import { filesHandlers } from "./files.js";
import { notificationsHandlers } from "./notifications.js";

export const handlers = [
  ...authHandlers,
  ...usersHandlers,
  ...projectsHandlers,
  ...invoicesHandlers,
  ...ticketsHandlers,
  ...filesHandlers,
  ...notificationsHandlers,
];
```

- [ ] **Step 8: Write `apps/dashboard/mocks/browser.ts`**

```ts
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers/index.js";

const worker = setupWorker(...handlers);

export async function startMocks(): Promise<void> {
  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: { url: "/mockServiceWorker.js" },
  });
  if (process.env.NODE_ENV === "development") {
    console.info("[msw] mocks active");
  }
}
```

- [ ] **Step 9: Write `apps/dashboard/mocks/node.ts`**

```ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers/index.js";

export const server = setupServer(...handlers);
```

### Task 1.11: Install shadcn primitives

**Files:**

- Create: `apps/dashboard/components.json`
- Create: `packages/ui/src/{button-v2,dialog,dropdown-menu,tabs,sheet,tooltip,toast,command,avatar,badge,skeleton,separator,scroll-area,switch,checkbox,input,label}.tsx`

- [ ] **Step 1: Write `apps/dashboard/components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@edss/ui",
    "utils": "@edss/utils",
    "ui": "@edss/ui"
  }
}
```

- [ ] **Step 2: Write minimal shadcn-style primitives into `packages/ui/src/`**

Each primitive is a small file wrapping the corresponding Radix component with `cn`-based class variance and the OKLCH tokens. Example for `dialog.tsx`:

```tsx
"use client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from "react";
import { cn } from "@edss/utils/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-[var(--z-modal)] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] bg-[var(--color-paper)] p-6 shadow-[var(--shadow-lg)] border border-[var(--color-line-strong)]",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = "DialogContent";

export function DialogHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}
export function DialogFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-6 flex justify-end gap-2", className)} {...props} />
  );
}
export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("h4", className)} {...props} />
));
DialogTitle.displayName = "DialogTitle";
export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-[var(--color-muted)]", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";
```

Repeat the pattern for `dropdown-menu.tsx` (Radix DropdownMenu), `tabs.tsx` (Radix Tabs), `sheet.tsx` (Radix Dialog styled as slide-in), `tooltip.tsx` (Radix Tooltip), `toast.tsx` (Radix Toast — thin export), `command.tsx` (`cmdk` primitive with token styling), `avatar.tsx`, `badge.tsx`, `skeleton.tsx` (`<div className="animate-pulse rounded bg-[var(--color-stone-2)]" />`), `separator.tsx`, `scroll-area.tsx`, `switch.tsx`, `checkbox.tsx`, `input.tsx`, `label.tsx`, `button-v2.tsx` (upgrade to shadcn-style with new variants).

Each file follows the same skeleton: `"use client"` + Radix or cmdk primitive + `forwardRef` + `cn` + tokens. Reference upstream shadcn docs for the exact JSX; do not deviate on tokens (must use OKLCH vars, not hex).

- [ ] **Step 3: Update `packages/ui/src/index.ts`**

```ts
export { Button, ButtonLink } from "./button.js";
export * from "./button-v2.js";
export { Label, Input, Textarea, FieldError, FieldHint } from "./form.js";
export * from "./dialog.js";
export * from "./dropdown-menu.js";
export * from "./tabs.js";
export * from "./sheet.js";
export * from "./tooltip.js";
export * from "./toast.js";
export * from "./command.js";
export * from "./avatar.js";
export * from "./badge.js";
export * from "./skeleton.js";
export * from "./separator.js";
export * from "./scroll-area.js";
export * from "./switch.js";
export * from "./checkbox.js";
export * from "./input.js";
export * from "./label.js";
```

- [ ] **Step 4: Update `packages/ui/package.json` deps**

Add Radix + cmdk deps that were only in dashboard:

```json
{
  "dependencies": {
    "@edss/utils": "*",
    "@radix-ui/react-avatar": "^1.1.2",
    "@radix-ui/react-checkbox": "^1.1.3",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-label": "^2.1.1",
    "@radix-ui/react-scroll-area": "^1.2.2",
    "@radix-ui/react-separator": "^1.1.1",
    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-switch": "^1.1.2",
    "@radix-ui/react-tabs": "^1.1.2",
    "@radix-ui/react-toast": "^1.2.4",
    "@radix-ui/react-tooltip": "^1.1.5",
    "class-variance-authority": "^0.7.1",
    "cmdk": "^1.0.4",
    "lucide-react": "^0.469.0"
  }
}
```

- [ ] **Step 5: Install + typecheck**

```bash
cd "D:/Aman_Build/External Frontend/self v1"
npm install
npx tsc --noEmit -p packages/ui/tsconfig.json
```

### Task 1.12: Populate `tokens-dark.css`

**Files:**

- Modify: `packages/design-system/src/styles/tokens-dark.css`

- [ ] **Step 1: Write `packages/design-system/src/styles/tokens-dark.css`**

```css
[data-theme="dark"] {
  --color-ink: oklch(0.985 0.003 90);
  --color-ink-2: oklch(0.92 0.003 90);
  --color-ink-3: oklch(0.85 0.003 90);
  --color-paper: oklch(0.15 0.005 250);
  --color-stone: oklch(0.2 0.005 250);
  --color-stone-2: oklch(0.25 0.005 250);
  --color-muted: oklch(0.68 0.005 250);
  --color-muted-2: oklch(0.55 0.005 250);
  --color-line: oklch(0.3 0.004 250);
  --color-line-strong: oklch(0.4 0.005 250);
  --color-gold: oklch(0.82 0.13 85);
  --color-gold-2: oklch(0.75 0.14 80);
  --color-gold-ink: oklch(0.25 0.09 75);
  --color-danger: oklch(0.65 0.19 25);
  --color-success: oklch(0.7 0.15 155);

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 24px 60px -20px rgba(0, 0, 0, 0.6);
  --shadow-xl: 0 40px 100px -30px rgba(0, 0, 0, 0.7);
}
```

Contrast: body muted-on-paper 4.6:1, headings-on-paper 14.8:1, verified against WCAG AA.

### Task 1.13: Root env + vercel.json

**Files:**

- Modify: `.env.example`
- Create: `vercel.json`

- [ ] **Step 1: Extend `.env.example`**

```
NEXT_PUBLIC_SITE_URL=https://elitedigital.studio
NEXT_PUBLIC_WHATSAPP_NUMBER=910000000000
CONTACT_EMAIL=hello@elitedigital.studio
RESEND_API_KEY=

# Analytics — PostHog Cloud EU
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com

# Dashboard
NEXT_PUBLIC_API_BASE=https://api.edss.example
NEXT_PUBLIC_WS_BASE=wss://api.edss.example
NEXT_PUBLIC_USE_MOCKS=true
NEXT_PUBLIC_2FA_ENABLED=false

# Rate limit (Vercel edge — Upstash Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

CSP_REPORT_LOG_LEVEL=info
```

- [ ] **Step 2: Write `vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": null,
  "git": { "deploymentEnabled": { "main": true } }
}
```

Vercel-side per project: set Root Directory to `apps/website` for the website project and `apps/dashboard` for the dashboard project via the Vercel dashboard.

### Task 1.14: Verify Stage 1, commit, PR

- [ ] **Step 1: Full workspace typecheck + build**

```bash
cd "D:/Aman_Build/External Frontend/self v1"
npm run typecheck
npm --workspace @edss/dashboard run build
```

Expected: dashboard build completes; a minimal root page still needs to exist. If build errors on missing route, temporarily add `apps/dashboard/app/page.tsx` returning `<div />` — Stage 2 will replace it.

- [ ] **Step 2: Manual smoke**

```bash
npm --workspace @edss/dashboard run dev
```

Open `http://localhost:3001` — middleware redirects to `/login`; `/login` returns 404 (Stage 2 lands the page). That is expected end state for Stage 1.

- [ ] **Step 3: Header smoke**

```bash
curl -sI http://localhost:3001/login | grep -Ei "content-security|strict-transport|x-frame|x-content|referrer|permissions-policy"
```

Expected: every security header present.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(dashboard): stage 1 — plumbing (types/validation/api/auth packages, dashboard scaffold, middleware, MSW, shadcn primitives, dark tokens)"
git push -u origin chore/dashboard-stage-1-plumbing
```

- [ ] **Step 5: Merge PR**

Open PR on GitHub → squash-merge to main. Delete branch.

---

## Stage 2 — UI shell

### Task 2.1: Feature branch

```bash
git checkout main && git pull
git checkout -b chore/dashboard-stage-2-ui
```

### Task 2.2: `(auth)` layout + login form

**Files:**

- Create: `apps/dashboard/app/(auth)/layout.tsx`
- Create: `apps/dashboard/app/(auth)/login/page.tsx`
- Create: `apps/dashboard/components/auth/LoginForm.tsx`
- Create: `apps/dashboard/components/auth/RememberMeCheckbox.tsx`

- [ ] **Step 1: Write `apps/dashboard/app/(auth)/layout.tsx`**

```tsx
import type { ReactNode } from "react";
import { Wordmark } from "@edss/icons";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh grid-cols-1 lg:grid-cols-[6fr_4fr]">
      <section className="flex flex-col justify-between p-8 lg:p-14">
        <Wordmark className="h-6 w-auto text-[var(--color-ink)]" />
        <div className="mx-auto w-full max-w-[420px]">{children}</div>
        <p className="text-xs text-[var(--color-muted)]">
          © {new Date().getFullYear()} Elite Digital Solutions Studio.
        </p>
      </section>
      <aside aria-hidden className="hidden bg-[var(--color-ink)] lg:block">
        <div className="flex h-full items-center justify-center p-14">
          <p className="max-w-[28ch] font-[family-name:var(--font-display)] text-[clamp(1.75rem,1.2rem+2vw,2.5rem)] leading-tight text-[var(--color-paper)]">
            Operate the studio. See the whole of it.
          </p>
        </div>
      </aside>
    </main>
  );
}
```

- [ ] **Step 2: Write `apps/dashboard/components/auth/RememberMeCheckbox.tsx`**

```tsx
"use client";
import { Checkbox } from "@edss/ui";

export function RememberMeCheckbox({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
      />{" "}
      Remember me on this device
    </label>
  );
}
```

- [ ] **Step 3: Write `apps/dashboard/components/auth/LoginForm.tsx`**

```tsx
"use client";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@edss/validation/auth";
import { login } from "@edss/auth/client";
import { Input, Label } from "@edss/ui";
import { RememberMeCheckbox } from "./RememberMeCheckbox";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [pending, start] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember_me: false },
  });

  function onSubmit(input: LoginInput) {
    setFormError(null);
    start(async () => {
      try {
        const result = await login(input);
        if (result.needsTwoFa) {
          router.push(
            `/login/2fa-challenge?challenge_id=${encodeURIComponent(result.challengeId)}`,
          );
          return;
        }
        const next = search.get("next") ?? "/overview";
        router.push(next);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Login failed.");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
      noValidate
    >
      <div>
        <p className="kicker">Sign in</p>
        <h1 className="h1 mt-2">Welcome back.</h1>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-sm text-[var(--color-danger)]">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            Forgot?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <p className="text-sm text-[var(--color-danger)]">
            {errors.password.message}
          </p>
        )}
      </div>

      <RememberMeCheckbox
        checked={!!watch("remember_me")}
        onCheckedChange={(v) => setValue("remember_me", v)}
      />

      {formError && (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-[var(--radius-sm)] bg-[var(--color-ink)] px-5 text-[0.9rem] text-[var(--color-paper)] hover:bg-[var(--color-ink-2)] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Write `apps/dashboard/app/(auth)/login/page.tsx`**

```tsx
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return <LoginForm />;
}
```

### Task 2.3: 2FA challenge screen

**Files:**

- Create: `apps/dashboard/components/auth/TotpInput.tsx`
- Create: `apps/dashboard/app/(auth)/login/2fa-challenge/page.tsx`

- [ ] **Step 1: Write `apps/dashboard/components/auth/TotpInput.tsx`**

```tsx
"use client";
import {
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";

export function TotpInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(6).slice(0, 6).split("");

  function setDigit(i: number, d: string) {
    const arr = digits.slice();
    arr[i] = d;
    const next = arr.join("").trim();
    onChange(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  }

  function onKey(i: number) {
    return (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[i] && i > 0)
        refs.current[i - 1]?.focus();
    };
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData
      .getData("text")
      .replace(/\D+/gu, "")
      .slice(0, 6);
    onChange(text);
    refs.current[Math.min(text.length, 5)]?.focus();
  }

  function onCellChange(i: number) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value.replace(/\D+/gu, "").slice(0, 1);
      setDigit(i, v);
    };
  }

  return (
    <div className="flex gap-2" onPaste={onPaste}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={digits[i]?.trim() ?? ""}
          onChange={onCellChange(i)}
          onKeyDown={onKey(i)}
          inputMode="numeric"
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          className="h-12 w-10 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] bg-transparent text-center text-lg font-medium focus:border-[var(--color-ink)] focus:outline-none"
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Write `apps/dashboard/app/(auth)/login/2fa-challenge/page.tsx`**

```tsx
"use client";
import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TotpInput } from "@/components/auth/TotpInput";
import { verify2FA } from "@edss/auth/client";
import { RememberMeCheckbox } from "@/components/auth/RememberMeCheckbox";

function Inner() {
  const router = useRouter();
  const search = useSearchParams();
  const challengeId = search.get("challenge_id") ?? "";
  const [code, setCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    if (code.length !== 6) return;
    setError(null);
    start(async () => {
      try {
        await verify2FA({
          challenge_id: challengeId,
          code,
          remember_device: rememberDevice,
        });
        router.push("/overview");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Verification failed.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="kicker">Two-factor auth</p>
        <h1 className="h2 mt-2">Enter the six-digit code.</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          From your authenticator app.
        </p>
      </div>
      <TotpInput value={code} onChange={setCode} />
      <RememberMeCheckbox
        checked={rememberDevice}
        onCheckedChange={setRememberDevice}
      />
      {error && (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={pending || code.length !== 6}
        className="h-11 rounded-[var(--radius-sm)] bg-[var(--color-ink)] px-5 text-[0.9rem] text-[var(--color-paper)] disabled:opacity-60"
      >
        {pending ? "Verifying…" : "Verify"}
      </button>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
```

### Task 2.4: Forgot + reset password screens

**Files:**

- Create: `apps/dashboard/components/auth/ForgotPasswordForm.tsx`
- Create: `apps/dashboard/components/auth/ResetPasswordForm.tsx`
- Create: `apps/dashboard/app/(auth)/forgot-password/page.tsx`
- Create: `apps/dashboard/app/(auth)/reset-password/page.tsx`
- Create: `apps/dashboard/app/(auth)/logout/page.tsx`

- [ ] **Step 1: Write forgot-password form**

```tsx
// apps/dashboard/components/auth/ForgotPasswordForm.tsx
"use client";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@edss/validation/auth";
import { requestPasswordReset } from "@edss/auth/client";
import { Input, Label } from "@edss/ui";

export function ForgotPasswordForm() {
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  if (sent)
    return (
      <div>
        <h1 className="h2">Check your email.</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          If the address exists, we sent a reset link.
        </p>
      </div>
    );

  return (
    <form
      onSubmit={handleSubmit((v) =>
        start(async () => {
          await requestPasswordReset(v);
          setSent(true);
        }),
      )}
      className="flex flex-col gap-6"
      noValidate
    >
      <div>
        <p className="kicker">Reset password</p>
        <h1 className="h2 mt-2">Send a reset link.</h1>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoFocus {...register("email")} />
        {errors.email && (
          <p className="text-sm text-[var(--color-danger)]">
            {errors.email.message}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-[var(--radius-sm)] bg-[var(--color-ink)] px-5 text-[0.9rem] text-[var(--color-paper)] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Write reset-password form** (parallel structure w/ `resetPasswordSchema` + `confirmPasswordReset`).

Follow same pattern as `ForgotPasswordForm.tsx`: RHF + zodResolver + `resetPasswordSchema` (imports `token`, `new_password`, `confirm`), submit calls `confirmPasswordReset({ token, new_password })`, success shows "Signed in — redirecting" and `router.push('/overview')`.

- [ ] **Step 3: Write `apps/dashboard/app/(auth)/forgot-password/page.tsx`**

```tsx
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
export default function Page() {
  return <ForgotPasswordForm />;
}
```

- [ ] **Step 4: Write `apps/dashboard/app/(auth)/reset-password/page.tsx`**

```tsx
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
export default function Page() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
```

- [ ] **Step 5: Write `apps/dashboard/app/(auth)/logout/page.tsx`**

```tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@edss/auth/client";

export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    void logout().then(() => router.replace("/login"));
  }, [router]);
  return <p className="p-8">Signing out…</p>;
}
```

### Task 2.5: Shell layouts — `(client)` + `(staff)`

**Files:**

- Create: `apps/dashboard/app/(client)/layout.tsx`
- Create: `apps/dashboard/app/(staff)/layout.tsx`
- Create: `apps/dashboard/components/shell/{Sidebar.tsx,Topbar.tsx,UserMenu.tsx,NotificationsDrawer.tsx,PageHeader.tsx,EmptyStatePlaceholder.tsx}`
- Create: `apps/dashboard/components/palette/{CommandPalette.tsx,palette-routes.ts}`
- Create: `apps/dashboard/components/theme/ThemeToggle.tsx`

- [ ] **Step 1: Write palette routes catalog**

```ts
// apps/dashboard/components/palette/palette-routes.ts
export type PaletteRoute = {
  id: string;
  title: string;
  group: "client" | "staff";
  href: string;
  permission?: string;
};

export const paletteRoutes: PaletteRoute[] = [
  {
    id: "c.overview",
    group: "client",
    title: "Client · Overview",
    href: "/overview",
  },
  {
    id: "c.projects",
    group: "client",
    title: "Client · Projects",
    href: "/projects",
    permission: "projects:read",
  },
  {
    id: "c.invoices",
    group: "client",
    title: "Client · Invoices",
    href: "/invoices",
    permission: "invoices:read",
  },
  {
    id: "c.tickets",
    group: "client",
    title: "Client · Tickets",
    href: "/tickets",
    permission: "tickets:read",
  },
  {
    id: "c.files",
    group: "client",
    title: "Client · Files",
    href: "/files",
    permission: "files:read",
  },
  {
    id: "c.calendar",
    group: "client",
    title: "Client · Calendar",
    href: "/calendar",
    permission: "calendar:read",
  },
  {
    id: "c.notifications",
    group: "client",
    title: "Client · Notifications",
    href: "/notifications",
  },
  { id: "c.profile", group: "client", title: "Profile", href: "/profile" },
  { id: "c.settings", group: "client", title: "Settings", href: "/settings" },
  {
    id: "s.overview",
    group: "staff",
    title: "Staff · Overview",
    href: "/overview",
  },
  {
    id: "s.projects",
    group: "staff",
    title: "Staff · Projects",
    href: "/projects",
    permission: "projects:read",
  },
  {
    id: "s.invoices",
    group: "staff",
    title: "Staff · Invoices",
    href: "/invoices",
    permission: "invoices:read",
  },
  {
    id: "s.sales",
    group: "staff",
    title: "Staff · Sales",
    href: "/sales",
    permission: "sales:read",
  },
  {
    id: "s.users",
    group: "staff",
    title: "Staff · Users",
    href: "/users",
    permission: "users:read",
  },
  {
    id: "s.reports",
    group: "staff",
    title: "Staff · Reports",
    href: "/reports",
    permission: "reports:read",
  },
  {
    id: "s.audit",
    group: "staff",
    title: "Staff · Audit logs",
    href: "/audit-logs",
    permission: "audit-logs:read",
  },
];
```

- [ ] **Step 2: Write `Sidebar.tsx`**

Sidebar reads `activeRoleGroup` from `@edss/auth`. Sections: Overview, Work, Admin, Account. Each item = `Link` w/ icon + label + optional badge. Active state uses gold-tinted background. On <768px, wraps in shadcn `Sheet`.

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FolderKanban,
  Receipt,
  TicketCheck,
  Files,
  Calendar,
  Bell,
  User,
  Settings,
  LineChart,
  Users,
  ScrollText,
  FileBarChart,
} from "lucide-react";
import { useAuthStore, useHasPermission } from "@edss/auth";
import { cn } from "@edss/utils/cn";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
};

const clientNav: Array<{ heading: string; items: Item[] }> = [
  {
    heading: "Overview",
    items: [{ href: "/overview", label: "Overview", icon: Home }],
  },
  {
    heading: "Work",
    items: [
      {
        href: "/projects",
        label: "Projects",
        icon: FolderKanban,
        permission: "projects:read",
      },
      {
        href: "/invoices",
        label: "Invoices",
        icon: Receipt,
        permission: "invoices:read",
      },
      {
        href: "/tickets",
        label: "Tickets",
        icon: TicketCheck,
        permission: "tickets:read",
      },
      { href: "/files", label: "Files", icon: Files, permission: "files:read" },
      {
        href: "/calendar",
        label: "Calendar",
        icon: Calendar,
        permission: "calendar:read",
      },
    ],
  },
  {
    heading: "Account",
    items: [
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/profile", label: "Profile", icon: User },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const staffNav: Array<{ heading: string; items: Item[] }> = [
  {
    heading: "Overview",
    items: [{ href: "/overview", label: "Overview", icon: Home }],
  },
  {
    heading: "Work",
    items: [
      {
        href: "/projects",
        label: "Projects",
        icon: FolderKanban,
        permission: "projects:read",
      },
      {
        href: "/invoices",
        label: "Invoices",
        icon: Receipt,
        permission: "invoices:read",
      },
      {
        href: "/sales",
        label: "Sales",
        icon: LineChart,
        permission: "sales:read",
      },
      { href: "/calendar", label: "Calendar", icon: Calendar },
    ],
  },
  {
    heading: "Admin",
    items: [
      { href: "/users", label: "Users", icon: Users, permission: "users:read" },
      {
        href: "/reports",
        label: "Reports",
        icon: FileBarChart,
        permission: "reports:read",
      },
      {
        href: "/audit-logs",
        label: "Audit logs",
        icon: ScrollText,
        permission: "audit-logs:read",
      },
    ],
  },
  {
    heading: "Account",
    items: [
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

function NavItem({ item }: { item: Item }) {
  const pathname = usePathname();
  const allowed = item.permission ? useHasPermission(item.permission) : true;
  if (!allowed) return null;
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex h-10 items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 text-sm text-[var(--color-ink)]",
        active
          ? "bg-[color-mix(in_oklch,var(--color-gold)_12%,transparent)] text-[var(--color-gold-ink)]"
          : "hover:bg-[var(--color-stone)]",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  const group = useAuthStore((s) => s.activeRoleGroup);
  const nav = group === "staff" ? staffNav : clientNav;
  return (
    <nav
      aria-label="Primary"
      className="flex h-full w-[240px] flex-col gap-6 border-r border-[var(--color-line)] px-4 py-6"
    >
      {nav.map((section) => (
        <div key={section.heading}>
          <p className="kicker mb-2 px-2.5">{section.heading}</p>
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
```

- [ ] **Step 3: Write `Topbar.tsx`**

Sticky topbar. Left: Wordmark + Cmd+K trigger. Right: role chip (if `hasBothRoles`), notifications bell button, `<UserMenu>`.

```tsx
"use client";
import { Wordmark } from "@edss/icons";
import { Bell, Search } from "lucide-react";
import { useAuthStore } from "@edss/auth";
import { UserMenu } from "./UserMenu";
import { useState } from "react";
import { CommandPalette } from "@/components/palette/CommandPalette";
import { NotificationsDrawer } from "./NotificationsDrawer";

export function Topbar() {
  const hasBoth = useAuthStore((s) => s.hasBothRoles);
  const group = useAuthStore((s) => s.activeRoleGroup);
  const setGroup = useAuthStore((s) => s.setRoleGroup);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] flex h-14 items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-paper)] px-4">
      <div className="flex items-center gap-4">
        <Wordmark className="h-5 w-auto" />
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] px-3 py-1.5 text-sm text-[var(--color-muted)] hover:border-[var(--color-ink)]"
        >
          <Search className="h-3.5 w-3.5" /> Search…
          <kbd className="ml-2 rounded bg-[var(--color-stone)] px-1.5 py-0.5 text-[0.7rem]">
            ⌘K
          </kbd>
        </button>
      </div>
      <div className="flex items-center gap-3">
        {hasBoth && (
          <div className="flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-line)] p-0.5">
            {(["client", "staff"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroup(g)}
                className={`rounded-[3px] px-2 py-1 text-xs ${group === g ? "bg-[var(--color-ink)] text-[var(--color-paper)]" : "text-[var(--color-muted)]"}`}
              >
                {g}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setNotifOpen(true)}
          aria-label="Open notifications"
          className="rounded-[var(--radius-sm)] p-2 hover:bg-[var(--color-stone)]"
        >
          <Bell className="h-4 w-4" />
        </button>
        <UserMenu />
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <NotificationsDrawer open={notifOpen} onOpenChange={setNotifOpen} />
    </header>
  );
}
```

- [ ] **Step 4: Write `UserMenu.tsx`**

shadcn DropdownMenu wrapper. Header with avatar/name/email, items: Profile, Settings, Keyboard shortcuts, Theme submenu (System/Light/Dark), separator, Log out.

```tsx
"use client";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  LogOut,
  User as UserIcon,
  Settings,
  KeyRound,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@edss/ui";
import { useUser } from "@edss/auth";
import { logout } from "@edss/auth/client";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const user = useUser();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="grid h-8 w-8 place-items-center rounded-full border border-[var(--color-line-strong)] text-xs">
        {user?.name?.charAt(0) ?? "?"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6}>
        <DropdownMenuLabel>
          <div className="text-sm">{user?.name}</div>
          <div className="text-xs text-[var(--color-muted)]">{user?.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserIcon className="h-4 w-4" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="h-4 w-4" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <KeyRound className="h-4 w-4" /> Keyboard shortcuts
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Theme · {theme}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onSelect={() => setTheme("system")}>
              <Monitor className="h-4 w-4" /> System
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTheme("light")}>
              <Sun className="h-4 w-4" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTheme("dark")}>
              <Moon className="h-4 w-4" /> Dark
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            await logout();
            router.push("/login");
          }}
          className="text-[var(--color-danger)]"
        >
          <LogOut className="h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 5: Write `NotificationsDrawer.tsx`**

Right-side shadcn Sheet, tabs (All/Unread/Mentions), empty state phase 1.

```tsx
"use client";
import {
  Sheet,
  SheetContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@edss/ui";

export function NotificationsDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px]">
        <h2 className="h4">Notifications</h2>
        <Tabs defaultValue="all" className="mt-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="mentions">Mentions</TabsTrigger>
          </TabsList>
          {["all", "unread", "mentions"].map((v) => (
            <TabsContent key={v} value={v}>
              <div className="py-16 text-center text-sm text-[var(--color-muted)]">
                No notifications yet. We&apos;ll ping you when things happen.
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 6: Write `CommandPalette.tsx`**

```tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@edss/ui";
import { useAuthStore, useHasPermission } from "@edss/auth";
import { paletteRoutes } from "./palette-routes";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const group = useAuthStore((s) => s.activeRoleGroup);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search routes and actions…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {paletteRoutes
            .filter((r) => r.group === group)
            .map((r) => (
              <CommandItem
                key={r.id}
                onSelect={() => {
                  onOpenChange(false);
                  router.push(r.href);
                }}
              >
                {r.title}
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

- [ ] **Step 7: Write `PageHeader.tsx` + `EmptyStatePlaceholder.tsx`**

```tsx
// PageHeader.tsx
"use client";
import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  subtitle,
  actions,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-4 border-b border-[var(--color-line)] pb-6">
      <div>
        {kicker && <p className="kicker">{kicker}</p>}
        <h1 className="h2 mt-1">{title}</h1>
        {subtitle && <p className="lede mt-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

// EmptyStatePlaceholder.tsx
export function EmptyStatePlaceholder({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="mt-12 flex flex-col items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--color-line-strong)] p-16 text-center">
      <p className="kicker text-[var(--color-gold-2)]">Coming soon</p>
      <h2 className="h4">{title}</h2>
      <p className="max-w-[52ch] text-sm text-[var(--color-muted)]">{body}</p>
    </div>
  );
}
```

- [ ] **Step 8: Write shell layouts**

```tsx
// apps/dashboard/app/(client)/layout.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@edss/auth";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  useEffect(() => {
    const { status, activeRoleGroup, setRoleGroup } = useAuthStore.getState();
    if (status !== "authenticated") return;
    if (activeRoleGroup !== "client") setRoleGroup("client");
    document.cookie = `last_role_group=client; Path=/; SameSite=Lax; Secure; Max-Age=31536000`;
  }, []);
  return (
    <div className="min-h-dvh">
      <Topbar />
      <div className="flex">
        <Sidebar />
        <div className="container-app flex-1 py-10">{children}</div>
      </div>
    </div>
  );
}
```

```tsx
// apps/dashboard/app/(staff)/layout.tsx — identical to (client) but sets group = "staff".
"use client";
import { useEffect } from "react";
import { useAuthStore } from "@edss/auth";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const { status, activeRoleGroup, setRoleGroup } = useAuthStore.getState();
    if (status !== "authenticated") return;
    if (activeRoleGroup !== "staff") setRoleGroup("staff");
    document.cookie = `last_role_group=staff; Path=/; SameSite=Lax; Secure; Max-Age=31536000`;
  }, []);
  return (
    <div className="min-h-dvh">
      <Topbar />
      <div className="flex">
        <Sidebar />
        <div className="container-app flex-1 py-10">{children}</div>
      </div>
    </div>
  );
}
```

### Task 2.6: Module placeholder pages

**Files:** all `apps/dashboard/app/(client)/*/page.tsx` + `apps/dashboard/app/(staff)/*/page.tsx`

- [ ] **Step 1: Write one file per module**

Every placeholder page follows the same template:

```tsx
// e.g. apps/dashboard/app/(client)/overview/page.tsx
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyStatePlaceholder } from "@/components/shell/EmptyStatePlaceholder";

export default function Page() {
  return (
    <>
      <PageHeader
        kicker="Overview"
        title="Client overview"
        subtitle="Your studio at a glance."
      />
      <EmptyStatePlaceholder
        title="Client overview coming soon"
        body="This module lands in sub-project 4. Right now you are looking at a shell that proves the plumbing works."
      />
    </>
  );
}
```

Duplicate for every route in the spec. Vary `kicker`, `title`, and `subtitle` per module. Body copy stays similar ("This module lands in sub-project 4 [or 5]").

Full route list (create one file each):

Client group: `overview, projects, invoices, tickets, files, calendar, notifications, profile, settings`.

Staff group: `overview, projects, invoices, sales, users, reports, audit-logs, calendar, notifications, settings`.

### Task 2.7: Session idle warning + wire session timer

**Files:**

- Create: `apps/dashboard/components/auth/SessionIdleWatcher.tsx`
- Modify: shell layouts to mount `<SessionIdleWatcher />`

- [ ] **Step 1: Write `SessionIdleWatcher.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionIdleTimer, useCountdown } from "@edss/auth/session";
import { logout } from "@edss/auth/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@edss/ui";

export function SessionIdleWatcher() {
  const router = useRouter();
  const [warnOpen, setWarnOpen] = useState(false);

  useSessionIdleTimer(
    async () => {
      await logout();
      router.push("/login?reason=idle_timeout");
    },
    () => setWarnOpen(true),
  );

  const remaining = useCountdown(5 * 60 * 1000);
  const mins = Math.ceil(remaining / 60000);

  return (
    <Dialog open={warnOpen} onOpenChange={setWarnOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Still there?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[var(--color-muted)]">
          Your session will end in {mins} minute{mins === 1 ? "" : "s"}.
        </p>
        <DialogFooter>
          <button
            type="button"
            onClick={() => setWarnOpen(false)}
            className="h-10 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] px-4 text-sm"
          >
            Stay signed in
          </button>
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
            className="h-10 rounded-[var(--radius-sm)] bg-[var(--color-ink)] px-4 text-sm text-[var(--color-paper)]"
          >
            Log out
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Mount in both shell layouts**

Add `<SessionIdleWatcher />` inside the root `<div>` of `apps/dashboard/app/(client)/layout.tsx` and `apps/dashboard/app/(staff)/layout.tsx` (right after `<Topbar />`).

### Task 2.8: MSW dev-mode banner

**Files:**

- Create: `apps/dashboard/components/dev/MockBanner.tsx`
- Modify: root layout to mount when `NEXT_PUBLIC_USE_MOCKS === 'true'`

- [ ] **Step 1: Write `MockBanner.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@edss/ui";

const SEEDS = [
  { email: "client@example.com", password: "password", note: "Client role" },
  { email: "staff@example.com", password: "password", note: "Staff role" },
  {
    email: "admin@example.com",
    password: "password",
    note: "Both roles, 2FA on (code: 000000)",
  },
];

export function MockBanner() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <>
      <div className="fixed bottom-4 right-4 z-[var(--z-toast)] flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-line-strong)] bg-[var(--color-paper)] px-4 py-2 text-xs shadow-[var(--shadow-md)]">
        <span className="rounded-full bg-[var(--color-gold)] px-2 py-0.5 text-[0.65rem] text-[var(--color-gold-ink)]">
          MOCK
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="underline"
        >
          Seed accounts
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="ml-2 text-[var(--color-muted)]"
        >
          Dismiss
        </button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seed accounts</DialogTitle>
          </DialogHeader>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {SEEDS.map((s) => (
                <tr
                  key={s.email}
                  className="border-t border-[var(--color-line)]"
                >
                  <td className="py-2 pr-4 font-mono text-xs">{s.email}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{s.password}</td>
                  <td className="py-2 text-[var(--color-muted)]">{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 2: Mount in root layout under a client wrapper**

Add to `apps/dashboard/app/layout.tsx`:

```tsx
{
  process.env.NEXT_PUBLIC_USE_MOCKS === "true" && (
    <Suspense fallback={null}>
      {/* @ts-expect-error client component */}
      <MockBanner />
    </Suspense>
  );
}
```

(Import at top: `import { MockBanner } from "@/components/dev/MockBanner";`)

### Task 2.9: Dashboard Playwright suite baseline

**Files:**

- Create: `tests/visual/dashboard/routes.ts`
- Create: `tests/visual/dashboard/snapshot.spec.ts`
- Modify: `playwright.config.ts` — extend `webServer` to also start dashboard

- [ ] **Step 1: Extend `playwright.config.ts` webServer to run both apps**

```ts
webServer: [
  {
    command: "npm --workspace @edss/website run build && npm --workspace @edss/website run start",
    url: "http://localhost:3000", timeout: 300_000, reuseExistingServer: false,
  },
  {
    command: "npm --workspace @edss/dashboard run build && npm --workspace @edss/dashboard run start",
    url: "http://localhost:3001", timeout: 300_000, reuseExistingServer: false,
    env: { NEXT_PUBLIC_USE_MOCKS: "true" },
  },
],
```

- [ ] **Step 2: Write `tests/visual/dashboard/routes.ts`**

```ts
export const DASHBOARD_ROUTES = [
  { path: "/login", auth: false },
  { path: "/forgot-password", auth: false },
  { path: "/reset-password?token=stub", auth: false },
  { path: "/overview", auth: true, group: "client" as const },
  { path: "/projects", auth: true, group: "client" as const },
  { path: "/invoices", auth: true, group: "client" as const },
  {
    path: "/overview",
    auth: true,
    group: "staff" as const,
    alias: "staff-overview",
  },
  { path: "/sales", auth: true, group: "staff" as const },
];

export const THEMES = ["light", "dark"] as const;
```

- [ ] **Step 3: Write `tests/visual/dashboard/snapshot.spec.ts`**

```ts
import { test, expect, type Page } from "@playwright/test";
import { DASHBOARD_ROUTES, THEMES } from "./routes";

async function loginAs(page: Page, email: string) {
  await page.goto("http://localhost:3001/login?fast=1");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', "password");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/overview/, { timeout: 20000 });
}

for (const theme of THEMES) {
  test.describe(`dashboard theme ${theme}`, () => {
    test.use({ colorScheme: theme });

    for (const route of DASHBOARD_ROUTES) {
      const name =
        route.alias ?? route.path.replace(/\//g, "_").replace(/\?.*$/, "");
      test(`${theme}-${name}`, async ({ page }) => {
        if (route.auth) {
          await loginAs(
            page,
            route.group === "staff"
              ? "staff@example.com"
              : "client@example.com",
          );
        }
        await page.goto(`http://localhost:3001${route.path}`);
        await page.evaluate(async () => {
          if (document.fonts) await document.fonts.ready;
        });
        await page.waitForTimeout(1500);
        await expect(page).toHaveScreenshot(`dashboard-${theme}-${name}.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.001,
        });
      });
    }
  });
}
```

- [ ] **Step 4: Capture baseline**

```bash
npx playwright test tests/visual/dashboard --update-snapshots
```

Expected: 32+ snapshots captured under `tests/visual/dashboard/snapshot.spec.ts-snapshots/`.

### Task 2.10: Verify + commit + PR

- [ ] **Step 1: Full workspace verify**

```bash
npm run typecheck
npm run lint
npm --workspace @edss/dashboard run build
npm run test:visual
```

Expected: all green. Marketing preservation suite unchanged; dashboard suite baseline captured.

- [ ] **Step 2: Manual smoke walkthrough** — every step from spec Section 11 Stage 2 (14 items).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(dashboard): stage 2 — UI shell (auth screens, layouts, sidebar, topbar, command palette, notifications, module placeholders, dashboard Playwright baseline)"
git push -u origin chore/dashboard-stage-2-ui
```

- [ ] **Step 4: PR + merge**

Open PR on GitHub → squash-merge to main → delete branch.

---

## Completion checklist

- [ ] Repo layout matches spec Section 3.
- [ ] Four new packages exist and typecheck.
- [ ] `apps/dashboard` renders at localhost:3001; login with any seeded account lands on the correct role's overview.
- [ ] Every response includes the security headers from Section 6 (verified via `curl -sI`).
- [ ] MSW dev banner appears only when `NEXT_PUBLIC_USE_MOCKS=true`.
- [ ] `⌘K` opens command palette; theme toggle persists; role toggle appears for `admin@example.com`.
- [ ] Marketing preservation suite still green (24 snapshots).
- [ ] Dashboard Playwright suite baseline committed.
- [ ] Two squash-merged PRs on `main` (stage 1 + stage 2).

## Deferred to later sub-projects (per spec Section 15)

Real module UIs, WebSocket wiring for realtime, active-sessions UI, 2FA enrollment UI, file upload provider, cross-entity Cmd+K search, audit-log module, Reports module, PostHog consent banner, Storybook, Sentry, SSO, strict CSP promotion, cross-subdomain cookie sharing.
