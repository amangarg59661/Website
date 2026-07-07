# Dashboard Shell + Auth + Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `apps/dashboard/` — production-grade Next.js dashboard shell with full auth (login, refresh, 2FA, forgot/reset password), permission-string RBAC, moderate CSP with nonce, CSRF double-submit, edge rate limiting, MSW mock backend, and complete UI shell (sidebar, topbar, command palette, notifications drawer, theme toggle) with every module route as placeholder.

**Architecture:** Two-stage delivery on the sub-project 1 monorepo. Stage 1 lands infra plumbing (four new packages: `@edss/types`, `@edss/validation`, `@edss/api`, `@edss/auth`) plus dashboard scaffold (middleware, providers, auth-proxy route handlers, MSW). Stage 2 lands UI (auth screens, shell components, module placeholders, dashboard Playwright baseline). Each stage = single squash-merged PR.

**Tech Stack:** Next.js 15.1, React 19, TypeScript 5.7, Zustand, TanStack Query 5, Zod, MSW 2, shadcn/ui (cmdk, Radix), Tailwind v4 tokens from `@edss/design-system`, posthog-js (already wired), Upstash Redis (rate limit), Playwright (visual regression).

**Spec:** [docs/superpowers/specs/2026-07-07-dashboard-shell-design.md](../specs/2026-07-07-dashboard-shell-design.md)

---

## File structure — target state

Only new / modified paths listed. Every path is repo-root-relative.

### Stage 1 (plumbing) files

**New packages:**

- `packages/types/{package.json,tsconfig.json,src/{index.ts,api.ts}}`
- `packages/validation/{package.json,tsconfig.json,src/{index.ts,auth.ts,user.ts,api.ts}}`
- `packages/api/{package.json,tsconfig.json,src/{index.ts,client.ts,queries.ts,error.ts}}`
- `packages/auth/{package.json,tsconfig.json,src/{index.ts,store.ts,hooks.ts,guard.tsx,session.ts,2fa.ts,client.ts}}`

**Dashboard scaffold:**

- `apps/dashboard/{package.json,tsconfig.json,eslint.config.mjs,prettier.config.mjs,next.config.mjs,postcss.config.mjs,middleware.ts,components.json,next-env.d.ts}`
- `apps/dashboard/app/{layout.tsx,error.tsx,global-error.tsx,not-found.tsx}`
- `apps/dashboard/app/api/auth/{login,refresh,logout,csrf-token}/route.ts`
- `apps/dashboard/app/api/auth/2fa/verify/route.ts`
- `apps/dashboard/app/api/auth/{forgot-password,reset-password}/route.ts`
- `apps/dashboard/app/api/csp-report/route.ts`
- `apps/dashboard/components/providers/{QueryProvider.tsx,MSWProvider.tsx,AuthProvider.tsx,ToastProvider.tsx}`
- `apps/dashboard/mocks/{browser.ts,node.ts,delay.ts,handlers/{index.ts,auth.ts,users.ts,projects.ts,invoices.ts,tickets.ts,files.ts,notifications.ts},fixtures/{users.ts,permissions.ts}}`
- `apps/dashboard/public/mockServiceWorker.js` (msw init output)
- `apps/dashboard/styles/globals.css`
- `packages/design-system/src/styles/tokens-dark.css` (populated)
- `packages/ui/src/{dialog,dropdown-menu,tabs,sheet,tooltip,toast,command,avatar,badge,skeleton,separator,scroll-area,switch,checkbox,input,label,button-v2}.tsx` (shadcn primitives)

**Root config:**

- `.env.example` (extended)
- `vercel.json` (new)
- `.gitignore` (no change; `.next/` already covers dashboard)

### Stage 2 (UI) files

**Auth screens:**

- `apps/dashboard/app/(auth)/{layout.tsx}`
- `apps/dashboard/app/(auth)/login/page.tsx`
- `apps/dashboard/app/(auth)/login/2fa-challenge/page.tsx`
- `apps/dashboard/app/(auth)/{forgot-password,reset-password}/page.tsx`
- `apps/dashboard/app/(auth)/logout/page.tsx`
- `apps/dashboard/components/auth/{LoginForm,TotpInput,ForgotPasswordForm,ResetPasswordForm,RememberMeCheckbox}.tsx`

**Shell components:**

- `apps/dashboard/components/shell/{Sidebar,Topbar,UserMenu,NotificationsDrawer,PageHeader,EmptyStatePlaceholder}.tsx`
- `apps/dashboard/components/palette/{CommandPalette.tsx,palette-routes.ts}`
- `apps/dashboard/components/theme/{ThemeProvider.tsx,ThemeToggle.tsx,pre-hydration-script.ts}`

**Client route group:**

- `apps/dashboard/app/(client)/layout.tsx`
- `apps/dashboard/app/(client)/{overview,projects,invoices,tickets,files,calendar,notifications,profile,settings}/page.tsx`

**Staff route group:**

- `apps/dashboard/app/(staff)/layout.tsx`
- `apps/dashboard/app/(staff)/{overview,projects,invoices,sales,users,reports,audit-logs,calendar,notifications,settings}/page.tsx`

**Tests:**

- `tests/visual/dashboard/{routes.ts,snapshot.spec.ts}`

---

## Stage 1 — Infrastructure plumbing

### Task 1.1: Feature branch

**Files:** none

- [ ] **Step 1: Branch off main**

```bash
cd "D:/Aman_Build/External Frontend/self v1"
git checkout main && git pull
git checkout -b chore/dashboard-stage-1-plumbing
```

### Task 1.2: Scaffold `@edss/types`

**Files:**

- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`
- Create: `packages/types/src/api.ts`

- [ ] **Step 1: Create directory tree**

```bash
mkdir -p packages/types/src
```

- [ ] **Step 2: Write `packages/types/package.json`**

```json
{
  "name": "@edss/types",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": { "types": "./src/index.ts", "default": "./src/index.ts" },
    "./api": { "types": "./src/api.ts", "default": "./src/api.ts" }
  },
  "devDependencies": {
    "@edss/config": "*",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 3: Write `packages/types/tsconfig.json`**

```json
{
  "extends": "@edss/config/tsconfig/base.json",
  "include": ["src"]
}
```

- [ ] **Step 4: Write `packages/types/src/index.ts`**

```ts
export type Permission = string; // e.g. "projects:read", "projects:write"

export type RoleGroup = "client" | "staff";

export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  primaryRole: RoleGroup;
  hasBothRoles: boolean;
  createdAt: string;
};

export type Session = {
  id: string;
  userId: string;
  createdAt: string;
  lastActiveAt: string;
  userAgent: string;
  ipAddress: string;
};

export type NotificationSeverity = "info" | "success" | "warning" | "critical";

export type Notification = {
  id: string;
  userId: string;
  severity: NotificationSeverity;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  href: string | null;
};

export type ApiErrorCode =
  | "INVALID_CREDENTIALS"
  | "INVALID_TOTP"
  | "SESSION_EXPIRED"
  | "SESSION_REVOKED"
  | "CSRF_MISMATCH"
  | "RATE_LIMITED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "INVALID_RESPONSE"
  | "NETWORK_ERROR"
  | "SERVER_ERROR"
  | "UNKNOWN";

export type ApiErrorBody = {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export * from "./api.js";
```

- [ ] **Step 5: Write `packages/types/src/api.ts`**

```ts
import type { User, Permission, Session } from "./index.js";

export type LoginRequest = {
  email: string;
  password: string;
  remember_me: boolean;
};

export type LoginResponse = {
  access_token: string;
  access_token_exp: number;
  user: User;
  permissions: Permission[];
  session_id: string;
} & ({ needs_2fa: false } | { needs_2fa: true; two_fa_challenge_id: string });

export type RefreshResponse = {
  access_token: string;
  access_token_exp: number;
  permissions: Permission[];
  session_id: string;
};

export type TwoFaVerifyRequest = {
  challenge_id: string;
  code: string;
  remember_device: boolean;
};

export type ForgotPasswordRequest = { email: string };
export type ResetPasswordRequest = { token: string; new_password: string };

export type PaginatedResponse<T> = {
  items: T[];
  cursor: string | null;
  has_more: boolean;
};

export type SessionListResponse = { sessions: Session[] };
```

- [ ] **Step 6: Verify + commit**

```bash
cd "D:/Aman_Build/External Frontend/self v1"
npx tsc --noEmit -p packages/types/tsconfig.json
git add packages/types
git commit -m "feat(types): scaffold @edss/types with User/Session/Notification/ApiError shapes"
```

Expected: tsc exits 0.

### Task 1.3: Scaffold `@edss/validation`

**Files:**

- Create: `packages/validation/package.json`
- Create: `packages/validation/tsconfig.json`
- Create: `packages/validation/src/{index.ts,auth.ts,user.ts,api.ts}`

- [ ] **Step 1: Create dir**

```bash
mkdir -p packages/validation/src
```

- [ ] **Step 2: Write `packages/validation/package.json`**

```json
{
  "name": "@edss/validation",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": { "types": "./src/index.ts", "default": "./src/index.ts" },
    "./auth": { "types": "./src/auth.ts", "default": "./src/auth.ts" },
    "./user": { "types": "./src/user.ts", "default": "./src/user.ts" },
    "./api": { "types": "./src/api.ts", "default": "./src/api.ts" }
  },
  "dependencies": { "zod": "^3.24.1" },
  "devDependencies": {
    "@edss/config": "*",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 3: Write `packages/validation/tsconfig.json`**

```json
{
  "extends": "@edss/config/tsconfig/base.json",
  "include": ["src"]
}
```

- [ ] **Step 4: Write `packages/validation/src/auth.ts`**

```ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password required."),
  remember_me: z.boolean().default(false),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const twoFactorSchema = z.object({
  challenge_id: z.string().min(1),
  code: z.string().regex(/^\d{6}$/u, "Six-digit code."),
  remember_device: z.boolean().default(false),
});
export type TwoFactorInput = z.infer<typeof twoFactorSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email."),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    new_password: z
      .string()
      .min(12, "At least 12 characters.")
      .regex(/[A-Z]/u, "One uppercase letter.")
      .regex(/[a-z]/u, "One lowercase letter.")
      .regex(/\d/u, "One digit.")
      .regex(/[^A-Za-z0-9]/u, "One symbol."),
    confirm: z.string(),
  })
  .refine((v) => v.new_password === v.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
```

- [ ] **Step 5: Write `packages/validation/src/user.ts`**

```ts
import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatarUrl: z.string().url().nullable(),
  primaryRole: z.enum(["client", "staff"]),
  hasBothRoles: z.boolean(),
  createdAt: z.string(),
});

export const permissionSchema = z.string().regex(/^[a-z_]+:[a-z_*]+$/u);
```

- [ ] **Step 6: Write `packages/validation/src/api.ts`**

```ts
import { z } from "zod";
import { userSchema, permissionSchema } from "./user.js";

export const apiErrorSchema = z.object({
  code: z.enum([
    "INVALID_CREDENTIALS",
    "INVALID_TOTP",
    "SESSION_EXPIRED",
    "SESSION_REVOKED",
    "CSRF_MISMATCH",
    "RATE_LIMITED",
    "FORBIDDEN",
    "NOT_FOUND",
    "VALIDATION_FAILED",
    "INVALID_RESPONSE",
    "NETWORK_ERROR",
    "SERVER_ERROR",
    "UNKNOWN",
  ]),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});

export const loginResponseSchema = z.discriminatedUnion("needs_2fa", [
  z.object({
    needs_2fa: z.literal(false),
    access_token: z.string(),
    access_token_exp: z.number(),
    user: userSchema,
    permissions: z.array(permissionSchema),
    session_id: z.string(),
  }),
  z.object({
    needs_2fa: z.literal(true),
    two_fa_challenge_id: z.string(),
    access_token: z.string().optional(),
    access_token_exp: z.number().optional(),
    user: userSchema.optional(),
    permissions: z.array(permissionSchema).optional(),
    session_id: z.string().optional(),
  }),
]);

export const refreshResponseSchema = z.object({
  access_token: z.string(),
  access_token_exp: z.number(),
  permissions: z.array(permissionSchema),
  session_id: z.string(),
});

export const paginationSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    cursor: z.string().nullable(),
    has_more: z.boolean(),
  });
```

- [ ] **Step 7: Write `packages/validation/src/index.ts`**

```ts
export * from "./auth.js";
export * from "./user.js";
export * from "./api.js";
```

- [ ] **Step 8: Install + typecheck + commit**

```bash
cd "D:/Aman_Build/External Frontend/self v1"
npm install
npx tsc --noEmit -p packages/validation/tsconfig.json
git add packages/validation package-lock.json
git commit -m "feat(validation): scaffold @edss/validation with Zod schemas + inferred types"
```

### Task 1.4: Scaffold `@edss/api`

**Files:**

- Create: `packages/api/{package.json,tsconfig.json,src/{index.ts,client.ts,queries.ts,error.ts}}`

- [ ] **Step 1: Create dir**

```bash
mkdir -p packages/api/src
```

- [ ] **Step 2: Write `packages/api/package.json`**

```json
{
  "name": "@edss/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": { "types": "./src/index.ts", "default": "./src/index.ts" },
    "./client": { "types": "./src/client.ts", "default": "./src/client.ts" },
    "./queries": { "types": "./src/queries.ts", "default": "./src/queries.ts" },
    "./error": { "types": "./src/error.ts", "default": "./src/error.ts" }
  },
  "dependencies": {
    "@edss/types": "*",
    "@edss/validation": "*"
  },
  "peerDependencies": {
    "react": "^19",
    "@tanstack/react-query": "^5.60.0"
  },
  "devDependencies": {
    "@edss/config": "*",
    "@types/react": "^19.0.2",
    "@tanstack/react-query": "^5.60.0",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 3: Write `packages/api/tsconfig.json`**

```json
{
  "extends": "@edss/config/tsconfig/react-library.json",
  "include": ["src"]
}
```

- [ ] **Step 4: Write `packages/api/src/error.ts`**

```ts
import type { ApiErrorCode, ApiErrorBody } from "@edss/types";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly httpStatus: number;
  readonly details: Record<string, unknown> | undefined;

  constructor(
    code: ApiErrorCode,
    message: string,
    httpStatus: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }

  static fromBody(body: ApiErrorBody, httpStatus: number): ApiError {
    return new ApiError(body.code, body.message, httpStatus, body.details);
  }
}

const MESSAGES: Record<ApiErrorCode, string> = {
  INVALID_CREDENTIALS: "Email or password incorrect.",
  INVALID_TOTP: "That code did not match. Try again.",
  SESSION_EXPIRED: "Your session ended. Please sign in again.",
  SESSION_REVOKED: "Signed out from another device.",
  CSRF_MISMATCH: "Session token mismatch. Refresh and retry.",
  RATE_LIMITED: "Too many attempts. Please wait.",
  FORBIDDEN: "You do not have permission for that.",
  NOT_FOUND: "Not found.",
  VALIDATION_FAILED: "Please check the highlighted fields.",
  INVALID_RESPONSE: "Something unexpected came back. We are investigating.",
  NETWORK_ERROR: "Network issue — check your connection.",
  SERVER_ERROR: "Server error. We are on it.",
  UNKNOWN: "Something went wrong.",
};

export function errorCodeToMessage(code: ApiErrorCode): string {
  return MESSAGES[code];
}
```

- [ ] **Step 5: Write `packages/api/src/client.ts`**

```ts
import type { ZodTypeAny, z } from "zod";
import { apiErrorSchema } from "@edss/validation/api";
import { ApiError } from "./error.js";

export type ApiClientConfig = {
  baseUrl: string;
  getAccessToken: () => string | null;
  onSessionExpired: () => void;
  triggerRefresh: () => Promise<boolean>;
};

let config: ApiClientConfig | null = null;

export function initApiClient(c: ApiClientConfig): void {
  config = c;
}

let refreshPromise: Promise<boolean> | null = null;

async function ensureRefreshed(): Promise<boolean> {
  if (!config) throw new Error("apiClient not initialised");
  if (!refreshPromise) {
    refreshPromise = config.triggerRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export type ApiFetchOptions<
  TSchema extends ZodTypeAny | undefined = undefined,
> = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  schema?: TSchema;
  signal?: AbortSignal;
  skipAuth?: boolean;
  isRetry?: boolean;
};

export async function apiFetch<
  TSchema extends ZodTypeAny | undefined = undefined,
>(
  path: string,
  opts: ApiFetchOptions<TSchema> = {},
): Promise<TSchema extends ZodTypeAny ? z.infer<TSchema> : unknown> {
  if (!config) throw new Error("apiClient not initialised");
  const url = path.startsWith("http") ? path : `${config.baseUrl}${path}`;
  const method = opts.method ?? "GET";

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Request-Id": crypto.randomUUID(),
    ...(opts.headers ?? {}),
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const token = opts.skipAuth ? null : config.getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      credentials: "omit",
      signal: opts.signal,
    });
  } catch (err) {
    if (opts.signal?.aborted) throw err;
    throw new ApiError("NETWORK_ERROR", "Network request failed.", 0);
  }

  if (res.status === 401 && !opts.skipAuth && !opts.isRetry) {
    const refreshed = await ensureRefreshed();
    if (refreshed) return apiFetch(path, { ...opts, isRetry: true });
    config.onSessionExpired();
    throw new ApiError("SESSION_EXPIRED", "Session expired.", 401);
  }

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("Retry-After") ?? "0");
    if (!opts.isRetry && retryAfter > 0 && retryAfter <= 5) {
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return apiFetch(path, { ...opts, isRetry: true });
    }
    throw new ApiError("RATE_LIMITED", "Too many requests.", 429, {
      retry_after: retryAfter,
    });
  }

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      throw new ApiError(
        res.status >= 500 ? "SERVER_ERROR" : "UNKNOWN",
        `HTTP ${res.status}`,
        res.status,
      );
    }
    const parsed = apiErrorSchema.safeParse(body);
    if (parsed.success) throw ApiError.fromBody(parsed.data, res.status);
    throw new ApiError(
      res.status >= 500 ? "SERVER_ERROR" : "UNKNOWN",
      `HTTP ${res.status}`,
      res.status,
    );
  }

  if (res.status === 204) return undefined as never;

  const data: unknown = await res.json();
  if (opts.schema) {
    const parsed = opts.schema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError(
        "INVALID_RESPONSE",
        "Response did not match contract.",
        res.status,
        {
          issues: parsed.error.issues,
        },
      );
    }
    return parsed.data as never;
  }
  return data as never;
}
```

- [ ] **Step 6: Write `packages/api/src/queries.ts`**

```ts
import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { ZodTypeAny, z } from "zod";
import { apiFetch, type ApiFetchOptions } from "./client.js";
import { ApiError } from "./error.js";

export function useApiQuery<TSchema extends ZodTypeAny>(
  key: readonly unknown[],
  path: string,
  schema: TSchema,
  opts?: Omit<
    UseQueryOptions<z.infer<TSchema>, ApiError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<z.infer<TSchema>, ApiError>({
    queryKey: key,
    queryFn: ({ signal }) => apiFetch(path, { schema, signal }),
    retry: (n, err) =>
      n < 3 && err.code !== "SESSION_EXPIRED" && err.code !== "FORBIDDEN",
    retryDelay: (n) => Math.min(1000 * 2 ** n + Math.random() * 500, 8000),
    staleTime: 30_000,
    gcTime: 300_000,
    ...opts,
  });
}

export function useApiMutation<TReq, TResp>(
  fn: (variables: TReq) => Promise<TResp>,
  opts?: UseMutationOptions<TResp, ApiError, TReq>,
) {
  return useMutation<TResp, ApiError, TReq>({
    mutationFn: fn,
    ...opts,
  });
}

export function makeMutationFn<TReq, TSchema extends ZodTypeAny>(
  path: string,
  method: NonNullable<ApiFetchOptions["method"]>,
  schema: TSchema,
): (body: TReq) => Promise<z.infer<TSchema>> {
  return (body: TReq) => apiFetch(path, { method, body, schema });
}
```

- [ ] **Step 7: Write `packages/api/src/index.ts`**

```ts
export {
  apiFetch,
  initApiClient,
  type ApiClientConfig,
  type ApiFetchOptions,
} from "./client.js";
export { ApiError, errorCodeToMessage } from "./error.js";
export { useApiQuery, useApiMutation, makeMutationFn } from "./queries.js";
```

- [ ] **Step 8: Install + typecheck + commit**

```bash
cd "D:/Aman_Build/External Frontend/self v1"
npm install @tanstack/react-query@^5.60.0 --workspace @edss/api
npm install
npx tsc --noEmit -p packages/api/tsconfig.json
git add packages/api package.json package-lock.json
git commit -m "feat(api): scaffold @edss/api with apiFetch (refresh mutex, retry, schema validation) + TanStack Query wrappers"
```

**Note:** Detailed tasks 1.5 through 1.14 plus all of Stage 2 continue in `2026-07-07-dashboard-shell-part2.md` for readability. The two files together are one plan.
