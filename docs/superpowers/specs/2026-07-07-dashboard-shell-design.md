# Sub-project 2 — Dashboard Shell + Auth + Security

**Date:** 2026-07-07
**Status:** Design approved, awaiting spec review
**Sub-project of:** Business Operations Platform build (see `docs/superpowers/specs/2026-07-06-monorepo-migration-design.md` for umbrella program)
**Depends on:** sub-project 1 (monorepo migration) — shipped on `main`.
**Blocks:** sub-project 3 (data plumbing depth), sub-project 4 (client modules), sub-project 5 (staff modules), sub-project 6 (cross-cutting).

---

## 1. Purpose

Ship a production-grade dashboard shell at `apps/dashboard/` with a complete authentication + authorization + security substrate. The shell renders every module route as a placeholder; real module UIs land in sub-projects 4 and 5. Everything on-screen and every network exchange must be usable, verifiable, and safe by industry-standard measures.

**Success criteria**

- Fresh clone → `npm install && npm run dev` → dashboard renders at `localhost:3001` with seed accounts wired via mocks.
- Login, logout, refresh, 2FA challenge, forgot-password, reset-password all functional against MSW handlers.
- Every mutating request through auth-proxy is CSRF-verified.
- Every response carries the security headers listed in Section 6 including a nonce-based moderate CSP.
- Rate limiting applies to auth endpoints at the Vercel edge.
- Marketing site preservation suite still green.
- Sub-project 2 ships as two squash-merged PRs on `main`: stage 1 (plumbing), stage 2 (UI).

## 2. Constraints (locked during brainstorming)

Every constraint reflects a confirmed decision. Priority order: user > superpowers > default.

| Decision                  | Choice                                                                                                                                                                       | Notes                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Backend location          | Fully separate origin, mocked phase 1                                                                                                                                        | Real backend swap-in flips `NEXT_PUBLIC_USE_MOCKS`.                             |
| Mock delivery             | MSW (Mock Service Worker)                                                                                                                                                    | Same handlers work in browser + tests + SSR.                                    |
| Auth token strategy       | Access token in JS memory + refresh token in HttpOnly cookie                                                                                                                 | Access short-lived (~15 min), refresh 30 d.                                     |
| CORS                      | Hybrid — auth via Next same-origin proxy, data direct with Bearer header                                                                                                     | Backend documents `Access-Control-Allow-Origin` contract.                       |
| CSP                       | Moderate allowlist with nonce                                                                                                                                                | Phase 6 later flips to strict via report-only rollout.                          |
| CSRF                      | `SameSite=Lax` + double-submit token                                                                                                                                         | Custom `X-CSRF-Token` header on mutating auth calls.                            |
| Rate limit                | Backend + Next auth-edge (Upstash Redis) + TanStack Query backoff                                                                                                            | Data endpoints backend-only.                                                    |
| Session mgmt              | Advanced — access refresh + idle timeout + expiry warning + concurrent session limit (infra only)                                                                            | Active-sessions UI in sub-project 4 (Profile).                                  |
| 2FA                       | Full TOTP flow (enrollment + challenge + trust device) behind `NEXT_PUBLIC_2FA_ENABLED` env flag                                                                             | Flag defaults `false` for phase 1 launch; flip to `true` when enrollment ready. |
| RBAC                      | Permission strings, backend-driven                                                                                                                                           | `hasPermission("projects:write")`; never `hasRole()`.                           |
| Route architecture        | Two route groups in one app: `(client)` + `(staff)`                                                                                                                          | Dual-role users toggle via user menu; last-visited persisted per-user cookie.   |
| Sub-project 2 breadth     | Full shell (auth + layouts + sidebar + topbar + Cmd+K + notifications + theme toggle + all module placeholders)                                                              | Real modules deferred to sub-projects 4/5.                                      |
| Default theme             | System preference                                                                                                                                                            | User toggle overrides + persists via cookie.                                    |
| Validation                | Zod schemas in shared `@edss/validation`; backend duplicates same shapes                                                                                                     | Contract-based; not shared code.                                                |
| shadcn phase 1 primitives | Button (upgrade), Dialog, DropdownMenu, Tabs, Sheet, Tooltip, Toast, Command, Avatar, Badge, Skeleton, Separator, ScrollArea, Switch, Checkbox, Input, Label                 | Data-heavy primitives deferred to sub-project 4/5.                              |
| Execution shape           | Two stages: (1) infra plumbing packages + dashboard scaffold + security middleware + MSW + shadcn; (2) UI (auth screens, shell, palette, notifications, module placeholders) | Two squash-merged PRs.                                                          |
| Marketing preservation    | Zero visual or behavioral change to `apps/website/`                                                                                                                          | Playwright preservation suite runs in every stage.                              |

## 3. Target folder architecture

```text
self v1/
├── apps/
│   ├── website/                       # unchanged (production marketing site)
│   └── dashboard/                     # new — Next 15 app router
│       ├── app/
│       │   ├── (auth)/
│       │   │   ├── layout.tsx                    # split-screen brand
│       │   │   ├── login/page.tsx
│       │   │   ├── login/2fa-challenge/page.tsx
│       │   │   ├── forgot-password/page.tsx
│       │   │   ├── reset-password/page.tsx
│       │   │   └── logout/page.tsx
│       │   ├── (client)/
│       │   │   ├── layout.tsx                    # sidebar + topbar
│       │   │   ├── overview/page.tsx             # placeholder
│       │   │   ├── projects/page.tsx             # placeholder
│       │   │   ├── invoices/page.tsx             # placeholder
│       │   │   ├── tickets/page.tsx              # placeholder
│       │   │   ├── files/page.tsx                # placeholder
│       │   │   ├── calendar/page.tsx             # placeholder
│       │   │   ├── notifications/page.tsx        # dedicated inbox route
│       │   │   ├── profile/page.tsx              # placeholder
│       │   │   └── settings/page.tsx             # placeholder
│       │   ├── (staff)/
│       │   │   ├── layout.tsx
│       │   │   ├── overview/page.tsx
│       │   │   ├── projects/page.tsx
│       │   │   ├── invoices/page.tsx
│       │   │   ├── sales/page.tsx
│       │   │   ├── users/page.tsx
│       │   │   ├── reports/page.tsx
│       │   │   ├── audit-logs/page.tsx
│       │   │   ├── calendar/page.tsx
│       │   │   ├── notifications/page.tsx
│       │   │   └── settings/page.tsx
│       │   ├── api/
│       │   │   ├── auth/
│       │   │   │   ├── login/route.ts            # proxy → backend
│       │   │   │   ├── refresh/route.ts
│       │   │   │   ├── logout/route.ts
│       │   │   │   ├── 2fa/verify/route.ts
│       │   │   │   ├── forgot-password/route.ts
│       │   │   │   ├── reset-password/route.ts
│       │   │   │   └── csrf-token/route.ts
│       │   │   └── csp-report/route.ts           # CSP violation collector
│       │   ├── layout.tsx                        # root providers stack
│       │   ├── error.tsx
│       │   ├── global-error.tsx
│       │   └── not-found.tsx
│       ├── middleware.ts                         # edge — nonce + headers + auth gate + rate limit
│       ├── components/
│       │   ├── auth/
│       │   │   ├── LoginForm.tsx
│       │   │   ├── TotpInput.tsx
│       │   │   ├── ForgotPasswordForm.tsx
│       │   │   ├── ResetPasswordForm.tsx
│       │   │   └── RememberMeCheckbox.tsx
│       │   ├── shell/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── Topbar.tsx
│       │   │   ├── UserMenu.tsx
│       │   │   ├── NotificationsDrawer.tsx
│       │   │   ├── PageHeader.tsx
│       │   │   └── EmptyStatePlaceholder.tsx
│       │   ├── palette/
│       │   │   ├── CommandPalette.tsx
│       │   │   └── palette-routes.ts             # phase 1 static routes catalog
│       │   ├── theme/
│       │   │   ├── ThemeProvider.tsx
│       │   │   ├── ThemeToggle.tsx
│       │   │   └── pre-hydration-script.ts
│       │   └── providers/
│       │       ├── QueryProvider.tsx
│       │       ├── MSWProvider.tsx
│       │       ├── AuthProvider.tsx
│       │       └── ToastProvider.tsx
│       ├── mocks/
│       │   ├── handlers/
│       │   │   ├── auth.ts
│       │   │   ├── users.ts
│       │   │   ├── projects.ts
│       │   │   ├── invoices.ts
│       │   │   ├── tickets.ts
│       │   │   ├── files.ts
│       │   │   ├── notifications.ts
│       │   │   └── index.ts
│       │   ├── fixtures/
│       │   │   ├── users.ts
│       │   │   └── permissions.ts
│       │   ├── browser.ts                        # setupWorker
│       │   ├── node.ts                           # setupServer
│       │   └── delay.ts                          # network-realistic timing helper
│       ├── public/
│       │   └── mockServiceWorker.js              # msw init output — committed
│       ├── styles/globals.css
│       ├── package.json                          # @edss/dashboard
│       ├── next.config.mjs
│       ├── tsconfig.json
│       ├── eslint.config.mjs
│       ├── prettier.config.mjs
│       ├── postcss.config.mjs
│       └── components.json                       # shadcn config
├── packages/
│   ├── auth/                          # new — token store, RBAC hooks, session, 2FA helpers
│   ├── api/                           # new — fetch client + TanStack Query wrappers + error taxonomy
│   ├── validation/                    # new — Zod schemas + inferred types
│   ├── types/                         # new — shared TS types
│   ├── ui/                            # existing — shadcn primitives added stage 1
│   ├── design-system/                 # existing — tokens-dark.css populated stage 1
│   ├── analytics/                     # existing — dashboard becomes second consumer
│   ├── icons/                         # existing
│   ├── hooks/                         # existing — dashboard consumes
│   ├── utils/                         # existing
│   └── config/                        # existing
├── docs/superpowers/specs/            # this file lives here
├── tests/visual/                      # extended to cover dashboard routes
├── vercel.json                        # new — monorepo project config for two Vercel projects
├── turbo.json                        # unchanged
├── package.json                       # unchanged workspace root
└── README.md                          # updated to mention dashboard
```

Notes:

- `apps/dashboard/` runs on port 3001 in dev (website on 3000). Root `turbo.json` `dev` task starts both when run from root.
- Vercel monorepo: two separate projects share the repo; each has its `Root Directory` set to `apps/website` or `apps/dashboard`. Preview URLs distinct.
- Dashboard consumes every `@edss/*` package; extends `apps/website`'s `transpilePackages` pattern.

## 4. Package boundaries

### `@edss/types` — TS types, no runtime

```
exports:
  ./           barrel: User, Session, Permission, Role, Notification, ApiError
  ./api        API contract types (Req/Resp shapes for every backend endpoint)
peerDependencies: none
```

Shape definitions only. Backend team receives a bundled `.d.ts` and duplicates in their language of choice.

### `@edss/validation` — Zod + inferred types

```
exports:
  ./           barrel
  ./auth       loginSchema, twoFactorSchema, forgotPasswordSchema, resetPasswordSchema
  ./user       userProfileSchema, permissionSchema
  ./api        apiErrorSchema, paginationSchema, apiResponseWrapper
dependencies: zod
```

Every schema exports both the Zod object and the inferred type. Consumed by forms, MSW handlers, `apiFetch` response validation, and eventual backend port.

### `@edss/api` — fetch client + TanStack Query wrappers

```
exports:
  ./           barrel
  ./client     apiFetch, ApiClientConfig, initApiClient
  ./queries    useApiQuery, useApiMutation
  ./error      ApiError class + errorCodeToMessage mapping
peerDependencies: react, @tanstack/react-query
dependencies: @edss/auth, @edss/types, @edss/validation
```

`apiFetch<TResp, TReq>(url, options, opts?: { schema?: ZodType<TResp> })`:

1. Injects `Authorization: Bearer ${accessToken}` from `@edss/auth/store` if token present.
2. Attaches request id header (`X-Request-Id`) for backend correlation.
3. Serializes JSON body with headers.
4. On 401 response: acquires refresh mutex → calls `POST /api/auth/refresh` → on success retries original request once; on refresh failure clears store and rejects with `ApiError('SESSION_EXPIRED')`.
5. On 429 response: parses `Retry-After`, delays that long, retries once (bounded to prevent infinite loops).
6. On other errors: parses body against `apiErrorSchema`, throws `ApiError` with normalized code + message.
7. On 2xx: validates against `schema` if provided; throws `ApiError('INVALID_RESPONSE')` on parse failure.

`useApiQuery` / `useApiMutation`: thin wrappers around TanStack Query defaults:

- `retry: 3, retryDelay: exponential w/ jitter, staleTime: 30_000, gcTime: 300_000`.
- `retryOn: 429 | 5xx`, respect `Retry-After`.
- Error taxonomy piped to `<ToastProvider>` via callback.

### `@edss/auth` — token store, RBAC, session, 2FA

```
exports:
  ./               barrel
  ./store          authStore (Zustand), useAuthStore
  ./hooks          useAuth, useUser, usePermission, useHasPermission, useIsAuthenticated
  ./guard          <PermissionGate>, <RoleGate>, withPermission HOC
  ./session        useSessionIdleTimer, useSessionExpiryWarning, BroadcastChannel sync
  ./2fa            use2faChallenge (state machine hook)
  ./client         login, logout, refreshAccessToken, verify2FA, requestPasswordReset, confirmPasswordReset
peerDependencies: react, next
dependencies: @edss/api (import only auth client from ./client), @edss/types, @edss/validation, zustand
```

State shape (Zustand):

```ts
{
  status: 'idle' | 'authenticating' | 'authenticated' | 'refreshing' | 'unauthenticated';
  accessToken: string | null;
  accessTokenExp: number | null;
  user: User | null;
  permissions: string[];
  primaryRole: 'client' | 'staff' | null;
  hasBothRoles: boolean;
  activeRoleGroup: 'client' | 'staff' | null;
  sessionId: string | null;
  needsTwoFa: boolean;
  twoFaChallengeId: string | null;
}
```

**Circular dependency break:** `@edss/api/client` accepts `getAccessToken: () => string | null` on init. `@edss/auth` calls `initApiClient({ getAccessToken: () => useAuthStore.getState().accessToken })` on app boot. No import cycle.

## 5. Auth flow

### Boot

1. Middleware inspects `rt` cookie for any `(client)`/`(staff)` request.
   - Absent → `302 /login?next=<pathname>`.
   - Present → request continues.
2. `<AuthProvider>` mounts; calls `POST /api/auth/refresh`.
   - 200 → hydrate store; schedule silent refresh at `exp - 60s`.
   - 401 → clear cookies (proxy already clears); redirect `/login`.
3. Layouts render; `<PermissionGate>` children evaluate.

### Login

1. `<LoginForm>` receives email + password + remember_me. Zod validates client-side (loginSchema).
2. If `csrf` cookie missing (cold boot / expired), auth client GETs `/api/auth/csrf-token`; cookie set by proxy.
3. Form submits `POST /api/auth/login` with body + `X-CSRF-Token` header.
4. Middleware rate-limit (5/15min per IP+UA hash).
5. Handler forwards to backend `POST ${API_BASE}/auth/login`; validates response w/ Zod.
6. Cookie translation:
   - Backend `Set-Cookie: refresh=<jwt>` → proxy re-issues `Set-Cookie: rt=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=2592000`.
   - Proxy also issues `Set-Cookie: csrf=<token>; Secure; SameSite=Lax; Path=/; Max-Age=86400`.
7. Response body to browser: `{ access_token, access_token_exp, user, permissions, primary_role, has_both_roles, session_id, needs_2fa?, two_fa_challenge_id? }`.
8. On `needs_2fa === true && NEXT_PUBLIC_2FA_ENABLED === 'true'` → router.push(`/login/2fa-challenge?challenge_id=<id>`).
9. Otherwise → hydrate store → router.push based on `primary_role` / dual-role last-visited cookie:
   - client → `/(client)/overview`.
   - staff → `/(staff)/overview`.
   - both → last-visited cookie or `/(client)/overview` default.

### 2FA challenge

Fires only when `NEXT_PUBLIC_2FA_ENABLED === 'true'` AND backend response signals `needs_2fa`.

1. `/login/2fa-challenge` reads `challenge_id` from search params.
2. `<TotpInput>` renders — six-cell code entry, auto-advance, paste-aware, remember-device checkbox.
3. Submit posts `POST /api/auth/2fa/verify { challenge_id, code, remember_device }` with CSRF header.
4. Rate-limited per `challenge_id` (5 tries).
5. On 200 → same cookie set as login step 6-9, redirect to landing.
6. On 401 with `INVALID_TOTP` → inline error, code re-enterable.
7. On 429 → warning message with countdown.

### Refresh

1. `apiFetch` catches 401 on non-auth endpoints.
2. Refresh mutex (single in-flight Promise cached in module scope) prevents parallel refreshes.
3. `POST /api/auth/refresh` (no body; `rt` cookie carries state).
4. Proxy forwards to backend; on success rotates `rt` cookie; returns `{ access_token, access_token_exp, session_id, permissions }`.
5. Client updates store; retries original request once.
6. Second 401 → hard logout: clear store, clear cookies, router.push `/login?reason=session_expired`.

### Logout

1. User clicks Log out in `<UserMenu>` (or session-idle triggers).
2. `POST /api/auth/logout` with CSRF header; body includes `session_id` so backend can invalidate specifically.
3. Proxy forwards to backend; clears `rt` + `csrf` cookies on response.
4. Store reset; router.push `/login`.

### Session idle timeout

- Timer starts at 30 min.
- Warning modal at 25 min: "Your session will end in 5 minutes. Stay signed in? / Log out."
- Activity resets: `pointerdown`, `keydown`, `wheel`, `touchstart` events on document.
- Multi-tab sync: BroadcastChannel `edss-session` message on activity; other tabs reset timer.
- Auto-logout at 30 fires `logout()` flow.

### Session concurrency (infrastructure only phase 1)

- Backend enforces max sessions per user.
- Refresh response includes `session_id`.
- If backend returns `session_revoked` code on refresh → hard logout with `reason=revoked_by_another_device`.
- Active-sessions UI (list + revoke button) lives in Profile module — sub-project 4.

### RBAC gate mechanics

```tsx
<PermissionGate permission="projects:write" fallback={<UpsellCard />}>
  <NewProjectButton />
</PermissionGate>;

useHasPermission("projects:write"); // hook

export default withPermission(ProjectsPage, "projects:read"); // HOC — unauthorized shows 403 page
```

`permissions` array from backend is the single source of truth. Never hardcode role → permission mapping on frontend.

### Password reset (out-of-band)

- `/forgot-password` form (`email`) → `POST /api/auth/forgot-password { email }` → success page ("check your email"); backend rate-limited 3/hr/email + 10/hr/IP.
- `/reset-password?token=...` form (`new_password`, `confirm`) → `POST /api/auth/reset-password { token, new_password }` → on success shows "signed in" and redirects.

## 6. Security substrate

### Response headers (edge middleware — every request)

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
X-DNS-Prefetch-Control: off
```

### Content Security Policy (moderate + nonce)

Generated per request in `middleware.ts`:

```
default-src 'self';
script-src 'self' 'nonce-{RANDOM}' 'strict-dynamic' https://eu.i.posthog.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://eu.i.posthog.com https://images.unsplash.com https://cdn.elitedigital.studio;
font-src 'self' data:;
connect-src 'self' https://eu.i.posthog.com {API_BASE_ORIGIN} {WS_BASE_ORIGIN};
frame-src 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
report-uri /api/csp-report;
```

- Nonce = `crypto.randomUUID()` per request, base64url-encoded.
- Injected via request header `x-nonce`; Next 15 auto-propagates to `<Script>` tags via `nonce` prop.
- `experimental.strictNextHead: true` in `next.config.mjs` ensures Next's own inline scripts pick up nonce.
- `strict-dynamic` allows nonce'd bootstrap scripts to load additional chunks they trust.
- `{API_BASE_ORIGIN}` and `{WS_BASE_ORIGIN}` are substituted at request time from `process.env.NEXT_PUBLIC_API_BASE` / `NEXT_PUBLIC_WS_BASE`.
- `/api/csp-report` route logs violations; phase 1 writes to console + PostHog event `csp_violation`; sub-project 6 wires Sentry.
- `style-src 'unsafe-inline'` documented workaround for Next 15 inline critical CSS; sub-project 6 pursues strict via report-only.

### CORS strategy (hybrid, per Q5)

- Auth endpoints → same-origin via Next proxy. No CORS involved from browser perspective.
- Data endpoints → direct calls to `${API_BASE}`. `fetch(url, { credentials: 'omit', headers: { Authorization: 'Bearer <token>' } })`.
- Backend contract for data endpoints (documented for backend team, not enforced by frontend):
  ```
  Access-Control-Allow-Origin: https://app.edss.example   # exact; no wildcard
  Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
  Access-Control-Allow-Headers: Authorization, Content-Type, X-Request-Id
  Access-Control-Max-Age: 600
  Vary: Origin
  ```
- No cookies cross-origin → no `Access-Control-Allow-Credentials`.

### CSRF (Lax + double-submit)

- `csrf` cookie: JS-readable, `Secure`, `SameSite=Lax`, path `/`, 24h expiry, rotates on refresh.
- Value: 32 random bytes → base64url.
- Issued on demand at `/api/auth/csrf-token` cold boot; rotated by `/api/auth/refresh` and `/api/auth/login` responses.
- Client auth adapter reads via `document.cookie`, sets `X-CSRF-Token` on every mutating request to `/api/auth/*`.
- Middleware compares header to cookie for POST/PUT/PATCH/DELETE on `/api/auth/*`; mismatch → 403 `CSRF_MISMATCH`.
- Data endpoints don't use CSRF: no cookies cross-origin, Bearer token isn't CSRF-vulnerable.

### Rate limiting

Auth endpoints (Vercel Edge Middleware + Upstash Redis sliding window):

- `POST /api/auth/login` — 5 / 15min / (IP + UA hash).
- `POST /api/auth/refresh` — 60 / min / IP.
- `POST /api/auth/2fa/verify` — 5 / challenge_id.
- `POST /api/auth/forgot-password` — 3 / hour / email + 10 / hour / IP.
- `POST /api/auth/reset-password` — 10 / hour / IP.

Data endpoints: backend concern. Client honors `Retry-After` via `apiFetch` retry logic. TanStack Query default retry: 3 attempts, exponential (1s, 2s, 4s) with jitter.

### Cookie flag matrix

```
rt=<jwt>;   HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=2592000
csrf=<tok>;           Secure; SameSite=Lax; Path=/;         Max-Age=86400
theme=system|light|dark;      Secure; SameSite=Lax; Path=/; Max-Age=31536000
last_role_group=client|staff; Secure; SameSite=Lax; Path=/; Max-Age=31536000
```

### Input validation

- Every form: Zod on submit; fields validated on blur, error placement below field.
- Every request body: Zod validated before send; parse failure → client-side error toast, no network call.
- Every response body: Zod validated when schema provided to `apiFetch`; parse failure → `ApiError('INVALID_RESPONSE')` + PostHog event `api_contract_violation` for observability.
- Backend duplicates same validation (contract-based, not shared code).

### Auth token safety

- Access token: memory only (Zustand). Never persisted. Dies on tab close.
- Refresh token: `HttpOnly`, unreachable from JS. Only sent on `/api/auth` requests.
- No token in URLs.
- No token in localStorage/sessionStorage.
- PostHog capture: never includes tokens; scrubbed via property allowlist.

## 7. UI shell

### Design language

Extends "Executive Minimalist" (marketing) but pivots to product register (impeccable `product.md` bias). Not a landing page. Design serves the tool.

- Palette: charcoal + paper base. Gold reserved for state (unread badge, active nav pill, focus ring, hover accent) — same ≤10% ceiling.
- Radii: 2-6px. No pills for structural elements.
- No glassmorphism. No gradient text. No side-stripe borders. No universal kicker eyebrows.
- Motion budget: 180ms micro, 320ms panel enter, 220ms overlay. `useReducedMotion()` respected on every animated element.

### Dark mode

- Default = system preference (locked Q13).
- `tokens-dark.css` populated in stage 1 of this sub-project. Values built from OKLCH ink ramp, contrast verified (body ≥4.5:1, large text ≥3:1) per impeccable + WCAG.
- Applied via `[data-theme="dark"]` selector on `<html>`.
- Pre-hydration inline script (nonced) reads `theme` cookie and applies class before React paints to avoid FOUC.
- Theme cookie: `system` (default) / `light` / `dark`.

### Layout — client + staff shell

Same topology, different sidebar contents.

```
┌────────────────────────────────────────────────────────────────────┐
│ Topbar 56px sticky                                                 │
│  Wordmark   Cmd+K search       [role chip]  🔔 unread  Avatar ▼   │
├─────────┬──────────────────────────────────────────────────────────┤
│         │                                                          │
│ Sidebar │                                                          │
│ 240px   │  Main content (page.tsx render slot)                     │
│ desktop │                                                          │
│         │                                                          │
│ Sheet   │  Container: max-w-[1440px] centered under 1440px         │
│ mobile  │                                                          │
│         │                                                          │
└─────────┴──────────────────────────────────────────────────────────┘
```

### Component roster

- `Sidebar` — 240px desktop, `Sheet` mobile; sections divided by hairlines with kicker headings ("Overview", "Work", "Admin", "Account"); nav items 40px h, icon (16px lucide) + label + optional badge; active tint via `bg-[color-mix(in oklch, var(--color-gold) 10%, transparent)]` + gold text.
- `Topbar` — sticky, border-bottom hairline; role chip only for dual-role users.
- `UserMenu` — shadcn DropdownMenu, portal-rendered. Contents: avatar+name+email header, Profile, Settings, Keyboard shortcuts, Theme submenu (System/Light/Dark), separator, Log out.
- `NotificationsDrawer` — shadcn Sheet, 380px right-side, tabs (All / Unread / Mentions); empty state phase 1; realtime hook stubbed.
- `CommandPalette` — shadcn Command (cmdk), Cmd+K / Ctrl+K; groups (Navigate / Quick actions / Recent); fuzzy match; phase 1 catalog hardcoded from `palette-routes.ts`.
- `ThemeToggle` — three-state (System/Light/Dark), cookie-persisted.
- `PageHeader` — reusable module page shell: title, breadcrumb, optional actions.
- `EmptyStatePlaceholder` — module placeholder body: neutral copy + CTA.
- Auth screens (`(auth)/layout.tsx`): two-column split ≥1024px (60% form + 40% brand surface), single-column stacked below.

### Motion policy

- Sidebar sheet slide: 320ms ease-out-quart.
- Toast enter/exit: 180ms / 120ms scale-fade.
- Command palette enter: 220ms fade + slight scale.
- Notifications drawer slide: 320ms.
- Modal (idle warning) enter: 220ms.
- All animations respect `prefers-reduced-motion: reduce` — crossfade only, 0ms scale/slide.

### Responsive breakpoints

- Mobile (<768px): bottom nav (5 top-level entries) + hamburger opens Sheet sidebar; topbar collapses to Wordmark + Cmd+K + user menu.
- Tablet (768-1023px): sidebar collapses to 56px icon-only, hover to expand.
- Desktop (≥1024px): full 240px sidebar.

### Accessibility floor

- Focus rings 2px gold on every interactive.
- Skip-to-content link at document start.
- Keyboard: Cmd+K (palette), Cmd+, (settings), Cmd+\ (sidebar collapse), ? (shortcuts help modal), Esc (close overlays).
- All icons declared `aria-hidden` when decorative or given `aria-label` when semantic.
- `aria-live` on toast root and notifications drawer status.
- Screen reader focus moved to main region on route change.

## 8. MSW mock strategy

### Setup

- `mocks/browser.ts` — `setupWorker(...handlers)`; started in `<MSWProvider>` when `NEXT_PUBLIC_USE_MOCKS === 'true'`.
- `mocks/node.ts` — `setupServer(...handlers)`; used by Vitest + Playwright.
- `public/mockServiceWorker.js` — generated once via `npx msw init public/`; committed.

### Env flag

- `NEXT_PUBLIC_USE_MOCKS=true` — MSW active. Default in dev.
- `NEXT_PUBLIC_USE_MOCKS=false` — MSW disabled. Prod default, real backend consumed.

Real backend swap requires only env flip. Zero code change.

### Seeded accounts (fixtures/users.ts)

| Email                | Password   | Primary role | Both roles | 2FA on                |
| -------------------- | ---------- | ------------ | ---------- | --------------------- |
| `client@example.com` | `password` | client       | no         | no                    |
| `staff@example.com`  | `password` | staff        | no         | no                    |
| `admin@example.com`  | `password` | staff        | yes        | yes (code = `000000`) |

### Rate-limit sim

MSW auth handler tracks attempts in module-scoped counter; returns 429 + `Retry-After: 300` after limit. Reset on server restart. Playwright bypass: handler exempts if `x-test-mode: e2e` header (dev only).

### Delay sim

- Auth handlers: 200-400ms via `delay('real')`.
- Data handlers: 100-800ms.
- URL flag `?fast=1` → 0 delay.

### Dev-mode banner

Bottom-right floating chip when mocks active:

> Mock backend active · click for seed accounts

Click opens dialog listing seeded emails + `password`; auto-fill button per row. Dismissible per session (sessionStorage). Never renders when `NEXT_PUBLIC_USE_MOCKS=false`.

## 9. Analytics

Dashboard consumes existing `@edss/analytics` package. Additions:

- `identify(userId, { role: primary_role, has_both_roles })` fires post-auth.
- New typed events (added to `@edss/analytics/events.ts`):
  - `dashboard.login_succeeded { role, has_both_roles, needed_2fa }`
  - `dashboard.login_failed { code }`
  - `dashboard.2fa_verified { challenge_id }`
  - `dashboard.session_idle_warning_shown`
  - `dashboard.session_auto_logout`
  - `dashboard.role_group_switched { from, to }`
  - `dashboard.command_palette_opened`
  - `dashboard.command_palette_action_selected { action_id }`
  - `dashboard.theme_toggled { theme }`
  - `dashboard.notification_drawer_opened`
  - `csp_violation { blocked_uri, directive }`
  - `api_contract_violation { url, code }`

Never captures PII (email, name). User id (opaque) + role only.

Session recording remains opt-in, disabled phase 1.

## 10. Environment variables

Root `.env.example` gains:

```
# Dashboard
NEXT_PUBLIC_API_BASE=https://api.edss.example
NEXT_PUBLIC_WS_BASE=wss://api.edss.example
NEXT_PUBLIC_USE_MOCKS=true
NEXT_PUBLIC_2FA_ENABLED=false

# Rate limit — Upstash Redis (Vercel edge)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# CSP report — logs also flow to PostHog phase 1; Sentry wires later in sub-project 6
CSP_REPORT_LOG_LEVEL=info
```

Dashboard's `apps/dashboard/next.config.mjs` reads them.

## 11. Verification per stage

Every stage ends with `npm run typecheck lint build` green plus the visual suite and manual smoke below.

### Stage 1 — plumbing verification

Automated:

- `npx turbo run typecheck lint build` from root — green.
- New Vitest suite for `@edss/api` refresh mutex + retry semantics — 100% pass.
- MSW handler contract test — every handler response parses through its Zod schema.
- Middleware smoke: unauthenticated `curl -I http://localhost:3001/overview` → 302 to `/login`.
- Headers smoke: `curl -I http://localhost:3001/login` → every header from Section 6 present.

Manual (dev):

- Fresh `npm install` + `npm run dev` → dashboard root renders empty `<div>` (placeholder).
- MSW banner visible in bottom-right when `NEXT_PUBLIC_USE_MOCKS=true`.
- shadcn components installed but not yet rendered on screen — verify via a temporary test route.

### Stage 2 — UI verification

Automated:

- All Stage 1 checks pass.
- Marketing preservation Playwright suite passes (existing 24 baselines unchanged).
- New dashboard Playwright suite baseline captures — 8 primary routes × 2 viewports × 3 themes (system, light, dark) = 48 snapshots.
- Accessibility axe scan on every dashboard route — no violations at "critical" or "serious".

Manual smoke:

1. Land `/login` — form renders, focus in email field.
2. Login `client@example.com / password` → `/overview` client shell.
3. Login `staff@example.com / password` → `/overview` staff shell.
4. Login `admin@example.com / password` → 2FA challenge → `000000` → landing (dual-role default).
5. Page reload mid-session → shell re-renders without login prompt.
6. Idle 25 min → warning modal; 30 min → auto-logout.
7. `Cmd+K` → palette opens, arrow-key nav, Enter navigates.
8. Theme toggle (System / Light / Dark) → applies immediately; reload persists.
9. Sidebar collapses at ≤767px; hamburger opens Sheet.
10. As client-only user, direct-navigate `/(staff)/overview` → 403 page.
11. Chrome DevTools: `access_token` NOT in localStorage/sessionStorage; `rt` NOT visible in `document.cookie`.
12. Network tab on `POST /api/auth/login`: `X-CSRF-Token` header present, response `Set-Cookie` includes `HttpOnly`, `Secure`, `SameSite=Lax`.
13. Force-fail login 6 times → 429 with countdown.
14. Log out → redirected to `/login`, `document.cookie` cleared of `rt`.

CSP smoke:

- Load `/login` with DevTools Console open — zero CSP violations.
- Load `/overview` (authenticated) — zero violations.
- Temporarily add inline `<script>alert(1)</script>` to a page — verify block, verify report received at `/api/csp-report`.

## 12. Risks and mitigations

Ranked by likelihood × impact.

1. **CSP nonce + Next 15 hydration.** Missing nonce on Next's own scripts = white screen. Mitigation: `experimental.strictNextHead: true`; verify every dev build with strict CSP; keep report-only fallback strategy ready.
2. **MSW service worker + Next HMR.** Stale worker after code change. Mitigation: unregister on hot reload via `worker.stop()` in provider cleanup; document in `apps/dashboard/README.md`.
3. **Cross-origin cookie subdomain scope.** If cookies eventually shared across `app.edss.example` + `api.edss.example`, `Domain=.edss.example` required. Phase 1 uses same-origin proxy so no cross-domain cookies. Documented as tech debt in Section 15.
4. **Zustand + React 19 Suspense.** Store must be created inside Provider (not module-level singleton) for SSR safety. Mitigation: pattern enforced in `@edss/auth/store` with lint rule for module-level Zustand imports.
5. **Refresh race under concurrent 401s.** Multiple parallel API calls receiving 401 at once triggers duplicate refresh calls, backend rejects duplicates. Mitigation: refresh mutex in `apiFetch`, tested in Vitest.
6. **shadcn Radix `<style>` at runtime.** Radix injects style tags on portal render; without nonce they violate CSP. Mitigation: verified Radix supports the `nonce` prop; global `NonceProvider` passes it via context to every portal.
7. **PostHog + CSP.** PostHog JS SDK loads `array.js` from `eu.i.posthog.com`; allowlisted in `script-src`. No inline scripts injected by PostHog when using SDK properly.
8. **Rate-limit false positives in E2E.** Playwright test suite hitting login N times per run trips the limit. Mitigation: MSW handler exempts on `x-test-mode: e2e` header (dev only); Playwright configured to send it.
9. **Session idle across tabs.** Activity in one tab doesn't reset others. Mitigation: BroadcastChannel `edss-session` sync of last-activity ts.
10. **Vercel monorepo deployment.** Two projects one repo — first-time setup. Mitigation: `vercel.json` with `git.deploymentEnabled` per branch; documented in root README.
11. **Theme FOUC.** React paints before cookie read → light flash on dark preference. Mitigation: pre-hydration inline script (nonced) reads cookie + applies class before hydration.
12. **PostHog CSP `report-uri` conflict.** Some CSP report endpoints must not themselves be blocked. Mitigation: `/api/csp-report` is same-origin, first-party route — always allowed by `connect-src 'self'`.

## 13. Rollback plan

- Each of the two stages is a single squash-merged PR.
- If Stage 2 regresses marketing snapshots, revert Stage 2 PR — dashboard remains at Stage 1 (infra only) on `main`.
- If Stage 1 breaks builds, revert Stage 1 PR — repo returns to sub-project 1 completion state.
- No force-push to main.

## 14. Definition of done

- Repo layout matches Section 3 exactly.
- Four new packages exist with the exports listed in Section 4.
- `apps/dashboard/` renders at `localhost:3001` in dev and passes every Section 11 manual smoke.
- Every header in Section 6 present in the middleware output for every response.
- MSW active in dev with the seeded accounts working per Section 8.
- Playwright preservation suite (marketing) still green.
- New dashboard Playwright suite baseline captured (48 snapshots).
- Two squash-merged PRs on `main`.
- Vercel dashboard project set up with the correct `Root Directory` = `apps/dashboard`.

## 15. Out of scope (deferred sub-projects)

- Real module content (Overview data, Projects list/detail, Invoices, Tickets, Files, Calendar, Notifications inbox real content, Profile) → sub-project 4 (client) / 5 (staff).
- WebSocket wiring for realtime notifications and tickets → sub-project 6.
- Active-sessions UI (list + revoke) → sub-project 4 (Profile).
- 2FA enrollment UI (QR + recovery codes) → sub-project 4 (Profile) or 6.
- File upload provider abstraction → sub-project 4 (Files).
- Global cross-entity search index for Cmd+K (real data, fuzzy over projects/users/invoices) → sub-project 6.
- Audit log module UI + backend contract → sub-project 5.
- Reports module UI (placeholder only per master prompt) → sub-project 5.
- Consent banner for PostHog EU → sub-project 6.
- Storybook + Chromatic setup → cross-cutting sub-project.
- Sentry error reporting integration → cross-cutting sub-project.
- Legal login (Google/Apple SSO) → future.
- Strict CSP promotion (from moderate) → sub-project 6 (report-only rollout monitored).
- Cross-subdomain cookie scoping for shared session across marketing + dashboard → future backend integration decision.
