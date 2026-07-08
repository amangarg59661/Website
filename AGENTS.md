# AGENTS.md — Repo map for AI agents

Comprehensive reference for AI agents (or humans acting like one) working on this monorepo. Written after sub-projects 1 and 2 shipped. Every section reflects the actual state on `main`, not the specs.

Repo: **SelfHosted_V1** at https://github.com/amangarg59661/SelfHosted_V1
Local root: `D:\Aman_Build\External Frontend\self v1`
Umbrella: Turborepo monorepo hosting the Elite Digital Solutions Studio marketing site and Business Operations Platform dashboard.

---

## 0. Fastest orient

```
npm install                                       # install workspace
npm --workspace @edss/website  run dev            # marketing on :3000
npm --workspace @edss/dashboard run dev           # dashboard on :3001 (NEXT_PUBLIC_USE_MOCKS=true for MSW)
npm run typecheck                                 # turbo → per-workspace tsc
npm run build                                     # turbo → build both apps
npm run test:visual                               # Playwright preservation snapshots (marketing)
```

Seeded dashboard accounts (mock backend active):

| Email                | Password   | Role   | 2FA                |
| -------------------- | ---------- | ------ | ------------------ |
| `client@example.com` | `password` | client | off                |
| `staff@example.com`  | `password` | staff  | off                |
| `admin@example.com`  | `password` | both   | on (code `000000`) |

---

## 1. Sub-project status

**Sub-project 1 — Monorepo migration** (SHIPPED). Marketing site relocated to `apps/website/`. Seven shared packages extracted. Turborepo scaffolded. `@edss/analytics` wired PostHog Cloud EU into marketing.

**Sub-project 2 — Dashboard shell + auth + security** (SHIPPED). `apps/dashboard/` at port 3001. Four new packages: `@edss/types`, `@edss/validation`, `@edss/api`, `@edss/auth`. Edge middleware with CSP nonce + security headers + CSRF + rate limits. Eight auth-proxy route handlers. MSW mock backend. Complete UI shell (auth screens, sidebar, topbar, command palette, notifications drawer, theme toggle, 19 module placeholders).

**Deferred to later sub-projects:**

- Sub-project 3 — deeper data plumbing (may or may not need its own — much of the plumbing is already in `@edss/api`).
- Sub-project 4 — client modules (real content for `/client/*` routes).
- Sub-project 5 — staff modules (real content for `/staff/*` routes).
- Sub-project 6 — cross-cutting (WebSockets, consent banner, Sentry, strict CSP promotion, Storybook).

Specs and plans in `docs/superpowers/`:

- `specs/2026-07-06-monorepo-migration-design.md`
- `plans/2026-07-06-monorepo-migration.md`
- `specs/2026-07-07-dashboard-shell-design.md`
- `plans/2026-07-07-dashboard-shell.md`
- `plans/2026-07-07-dashboard-shell-part2.md`

---

## 2. Repo layout

```
self v1/
├── apps/
│   ├── website/                       # marketing site (production, port 3000)
│   └── dashboard/                     # dashboard (port 3001)
├── packages/
│   ├── analytics/                     # PostHog wrapper
│   ├── api/                           # apiFetch + refresh mutex + TanStack Query
│   ├── auth/                          # Zustand store + hooks + guards + session + 2FA + client
│   ├── config/                        # ESLint / TS / Prettier presets
│   ├── design-system/                 # tokens + fonts + motion constants
│   ├── hooks/                         # useMediaQuery, useReducedMotion, useInViewOnce
│   ├── icons/                         # Wordmark, Monogram, LogoMark + lucide re-export surface
│   ├── types/                         # TS-only User, Session, ApiError, api-contract types
│   ├── ui/                            # Button, ButtonLink, Form primitives + shadcn primitives
│   ├── utils/                         # cn, formatDate, formatDateShort, absoluteUrl, pad
│   └── validation/                    # Zod schemas (auth/user/api)
├── docs/
│   ├── superpowers/                   # specs + plans for each sub-project
│   ├── architecture.md                # website architecture
│   ├── design-system.md               # Executive Minimalist token reference
│   ├── motion.md
│   ├── accessibility.md
│   ├── performance.md
│   ├── seo.md
│   ├── audit.md
│   └── optimization-report.md
├── tests/visual/                      # Playwright preservation suite (marketing)
├── scratchpad/                        # gitignored — baselines, ephemera
├── AGENTS.md                          # THIS FILE
├── README.md                          # monorepo intro
├── package.json                       # workspaces + turbo scripts
├── turbo.json                         # pipeline
├── tsconfig.json                      # root stub
├── playwright.config.ts               # webServer starts marketing
├── vercel.json                        # monorepo Vercel config
├── .env.example                       # all env vars
└── .husky/pre-commit                  # lint-staged prettier
```

---

## 3. Packages — one section each

Every package listed here uses raw TS (no build) + Next `transpilePackages`. Every `package.json` has `"type": "module"` and typed subpath `exports`. Internal relative imports do NOT use `.js` extensions (Next 15 webpack resolves TS sources directly and `.js` breaks resolution in some packages).

### 3.1 `@edss/config`

Shared tooling only. No runtime code. Consumers extend or re-export.

Exports:

```
./eslint/base                   → base ESLint flat config with type-imports + unused-vars rules
./eslint/next                   → extends base + next/core-web-vitals + next/typescript
./tsconfig/base.json            → strict, target ES2022, moduleResolution=bundler, noUncheckedIndexedAccess
./tsconfig/next.json            → extends base + jsx=preserve + plugins=[next]
./tsconfig/react-library.json   → extends base + jsx=react-jsx + declaration=true
./prettier                      → semi:true, singleQuote:false, printWidth:100, tabWidth:2, prettier-plugin-tailwindcss
```

Every other package + both apps consume from here.

### 3.2 `@edss/design-system`

Tokens + fonts + motion. `sideEffects: ["*.css"]`.

Exports:

```
.                        → { display, sans, mono, easings, durationsMs, durationsSec } (barrel)
./fonts                  → { display, sans, mono } — next/font Fraunces + IBM Plex Sans + Geist Mono
./motion                 → { easings, durationsMs, durationsSec }
./styles/tokens.css      → mode-agnostic @theme block (OKLCH colors, type scale, spacing, radii, shadows, motion tokens, z-index)
./styles/tokens-light.css  → placeholder — base tokens already assume light
./styles/tokens-dark.css → [data-theme="dark"] overrides — OKLCH ink-ramp inversion (dashboard-only consumer)
```

Key TS symbols:

- `easings.outQuart = [0.22, 1, 0.36, 1]` — Framer Motion tuple.
- `easings.outExpo = [0.16, 1, 0.3, 1]`
- `durationsMs = { fast: 180, default: 320, slow: 640, cinematic: 1200 }`
- `durationsSec = durationsMs / 1000` for Framer.

Font CSS variables (bound by next/font at build):

- `--font-display-provider` (Fraunces)
- `--font-sans-provider` (IBM Plex Sans)
- `--font-mono-provider` (Geist Mono)

Rendered via `<html className={${display.variable} ${sans.variable} ${mono.variable}}>` — see `apps/*/app/layout.tsx`.

### 3.3 `@edss/utils`

Pure functions. `sideEffects: false`. No React.

Exports:

```
./cn         → cn(...inputs: ClassValue[]) → tailwind-merge over clsx
./format     → formatDate, formatDateShort, absoluteUrl, pad
.            → barrel of the above
```

`absoluteUrl(path, base?)` reads `process.env.NEXT_PUBLIC_SITE_URL` fallback to `https://elitedigital.studio`.

### 3.4 `@edss/hooks`

Client-only React hooks. `"use client"` in every file. `sideEffects: false`.

Exports:

```
./useMediaQuery    → useMediaQuery(query: string): boolean
./useReducedMotion → useReducedMotion(): boolean  (delegates to useMediaQuery)
./useInViewOnce    → useInViewOnce<T extends HTMLElement>(threshold = 0.15): { ref, inView }
.                  → barrel
```

Note: marketing site's `useReducedMotion` still comes from `framer-motion` at call sites; this package's version is available for dashboard consumers.

### 3.5 `@edss/icons`

Brand SVGs + narrow lucide re-export surface. `sideEffects: false`.

Exports:

```
.          → { Wordmark, Monogram, LogoMark } (React components with SVGProps<SVGSVGElement>)
./lucide   → { ArrowUpRight, ArrowRight, ArrowDown, ChevronDown, ChevronRight, Check, Minus, Plus, X }
```

`LogoMark({ label, className })` renders label text using `--font-display`.

### 3.6 `@edss/analytics`

PostHog wrapper. Both apps consume.

Exports:

```
./client   → { PostHogProvider, PageviewTracker, captureEvent }
./server   → { captureServerEvent(distinctId, event, properties) }
./events   → { EventName, EventPropsFor<N>, WebsiteEvent }
.          → barrel
```

Behavior:

- `PostHogProvider` initializes `posthog-js` in `useEffect` when `NEXT_PUBLIC_POSTHOG_KEY` is set. Skips init if key absent or `navigator.doNotTrack === "1"`. Guards against StrictMode double-init with `useRef` flag.
- `PageviewTracker` requires `<Suspense>` boundary; captures `$pageview` on `pathname`/`searchParams` change.
- `captureEvent<N>(name, props)` is the typed event API.
- Server helper builds a `PostHog` node client, flushes immediately (`flushAt:1, flushInterval:0`), and shuts down after each call.

Typed events (add here when needed):

```ts
type WebsiteEvent =
  | {
      name: "contact_form_submitted";
      props: { topic: string; source_page: string };
    }
  | { name: "whatsapp_cta_clicked"; props: { source_page: string } }
  | { name: "portfolio_case_opened"; props: { slug: string } }
  | { name: "service_detail_opened"; props: { slug: string } }
  | { name: "journal_post_opened"; props: { slug: string } };
```

Env: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` (default `https://eu.i.posthog.com`).

### 3.7 `@edss/ui`

Cross-app UI primitives. Hand-rolled Button + Form (from marketing) plus shadcn-style primitives.

Exports:

```
./button            → { Button, ButtonLink }
./form              → { Label as LabelClassic, Input as InputClassic, Textarea, FieldError, FieldHint }
./input             → { Input }               (shadcn-style, 44px height, tokened)
./label             → { Label }               (Radix Label)
./checkbox          → { Checkbox }            (Radix Checkbox + Check icon)
./dialog            → { Dialog, DialogTrigger, DialogPortal, DialogClose, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription }
./sheet             → { Sheet, SheetTrigger, SheetClose, SheetPortal, SheetContent } (side: "left"|"right", cva)
./tabs              → { Tabs, TabsList, TabsTrigger, TabsContent }
./dropdown-menu     → { DropdownMenu, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent }
./command           → { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } (cmdk)
.                   → barrel of all
```

`Button` variants (`class-variance-authority`):

- `intent`: `primary` | `gold` | `ghost` | `onInk` | `onInkFilled`
- `size`: `sm` (36 h) | `md` (44 h, default) | `lg` (56 h)
- `withArrow` prop appends `ArrowUpRight` icon
- `ButtonLink` wraps `next/link` or a bare anchor when `external`

All primitives use OKLCH CSS variables from `@edss/design-system/styles/tokens.css`. Never hardcode hex.

Deferred shadcn primitives (not yet added, add when a consumer needs them): `avatar`, `badge`, `skeleton`, `separator`, `scroll-area`, `switch`, `toast`, `tooltip`, `button-v2` (upgraded Button variant). Follow the existing pattern (Radix or cmdk + `cn` + tokens).

### 3.8 `@edss/types`

TS-only. Backend contract types.

Symbols (`.` export):

- `Permission = string` (e.g. `"projects:read"`)
- `RoleGroup = "client" | "staff"`
- `User = { id, email, name, avatarUrl, primaryRole: RoleGroup, hasBothRoles, createdAt }`
- `Session = { id, userId, createdAt, lastActiveAt, userAgent, ipAddress }`
- `NotificationSeverity = "info" | "success" | "warning" | "critical"`
- `Notification = { id, userId, severity, title, body, read, createdAt, href }`
- `ApiErrorCode` (see Section 6.5)
- `ApiErrorBody = { code, message, details? }`

Subpath `./api`:

- `LoginRequest`, `LoginResponse` (discriminated on `needs_2fa`), `RefreshResponse`, `TwoFaVerifyRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest`, `PaginatedResponse<T>`, `SessionListResponse`.

### 3.9 `@edss/validation`

Zod schemas + inferred types. Consumers: forms, MSW handlers, `apiFetch` response validation, `@edss/auth/client`.

Exports:

```
./auth   → { loginSchema, LoginInput, twoFactorSchema, TwoFactorInput,
             forgotPasswordSchema, ForgotPasswordInput,
             resetPasswordSchema, ResetPasswordInput }
./user   → { userSchema, permissionSchema }
./api    → { apiErrorSchema, loginResponseSchema, refreshResponseSchema, paginationSchema<T> }
.        → barrel
```

Key contract highlights:

- `loginSchema.password` requires min 1 char (client). Backend enforces strength.
- `resetPasswordSchema.new_password` requires ≥12 chars + uppercase + lowercase + digit + symbol. Enforced client-side; backend duplicates.
- `resetPasswordSchema` has a `confirm` field for UI double-entry; API client accepts a narrower `{ token, new_password }` (see 3.10).
- `loginResponseSchema` is a `z.discriminatedUnion("needs_2fa", ...)` — 2FA branch has only `two_fa_challenge_id` + no tokens.

### 3.10 `@edss/api`

Fetch wrapper + TanStack Query wrappers.

Exports:

```
./client   → { apiFetch, initApiClient, ApiClientConfig, ApiFetchOptions }
./queries  → { useApiQuery, useApiMutation, makeMutationFn }
./error    → { ApiError, errorCodeToMessage }
.          → barrel
```

`ApiClientConfig`:

```ts
{
  baseUrl: string;                              // NEXT_PUBLIC_API_BASE
  getAccessToken: () => string | null;          // reads @edss/auth store
  onSessionExpired: () => void;                 // resets store + navigates /login
  triggerRefresh: () => Promise<boolean>;       // calls /api/auth/refresh (Next proxy)
}
```

`initApiClient` must run once at boot. Done by `apps/dashboard/components/providers/AuthProvider.tsx`.

`apiFetch<Schema>(path, opts)` behavior:

1. Composes `Authorization: Bearer ${accessToken}` when a token is available and `skipAuth !== true`.
2. Injects `X-Request-Id: crypto.randomUUID()` on every call.
3. Sets `credentials: "omit"` — bearer only, no cookies cross-origin.
4. On 401 (not a retry, not `skipAuth`): calls `ensureRefreshed()` which holds a module-scoped promise so concurrent 401s share one refresh. If refresh succeeds, retries once. If refresh fails, invokes `onSessionExpired()` and throws `ApiError("SESSION_EXPIRED")`.
5. On 429: if `Retry-After` ≤ 5s and this is not a retry, sleeps then retries once. Otherwise throws `ApiError("RATE_LIMITED", …, { retry_after })`.
6. Non-OK responses parse body against `apiErrorSchema`; if valid, throws `ApiError.fromBody`; if invalid, throws generic 500/UNKNOWN.
7. On 2xx: if `opts.schema` provided, parses; throws `ApiError("INVALID_RESPONSE", …)` on parse failure.

`useApiQuery(key, path, schema, opts?)` — TanStack Query wrapper with retry 3 (except SESSION_EXPIRED/FORBIDDEN), exponential backoff w/ jitter, staleTime 30s, gcTime 300s.

`useApiMutation(fn, opts?)` — thin wrapper.

`makeMutationFn(path, method, schema)` — factory returning a body-taking fn calling `apiFetch`.

`ApiError`:

```ts
new ApiError(code: ApiErrorCode, message: string, httpStatus: number, details?)
ApiError.fromBody(body: ApiErrorBody, httpStatus)
errorCodeToMessage(code): string  // user-facing copy per code
```

### 3.11 `@edss/auth`

Auth state + client + guards + session + 2FA state machine.

Exports:

```
./store    → { useAuthStore, AuthState, AuthStatus, AuthActions }
./hooks    → { useAuth, useUser, useIsAuthenticated, usePermissions, useHasPermission, useAnyPermission }
./guard    → { PermissionGate, withPermission }
./session  → { useSessionIdleTimer, useCountdown }
./2fa      → { use2faChallenge, TwoFaState }
./client   → { login, verify2FA, refreshAccessToken, logout, requestPasswordReset, confirmPasswordReset }
.          → barrel of all
```

`AuthState` shape (Zustand):

```ts
{
  status: "idle" | "authenticating" | "authenticated" | "refreshing" | "unauthenticated",
  accessToken: string | null,
  accessTokenExp: number | null,     // Unix seconds
  user: User | null,
  permissions: Permission[],
  primaryRole: RoleGroup | null,
  hasBothRoles: boolean,
  activeRoleGroup: RoleGroup | null, // which shell the user is currently viewing
  sessionId: string | null,
  needsTwoFa: boolean,
  twoFaChallengeId: string | null,
}
```

Actions:

- `setAuthenticated({ accessToken, accessTokenExp, user, permissions, sessionId })` — full login/refresh success.
- `setRefreshed({ accessToken, accessTokenExp, permissions, sessionId })` — refresh cycle (keeps existing user).
- `setTwoFaChallenge(challengeId)` — mid-login, awaiting TOTP.
- `setRoleGroup(group)` — dual-role users toggle between client/staff shells.
- `reset()` — full logout, status becomes `"unauthenticated"`.

Client fns (all use `/api/auth/*` same-origin proxy, `credentials: "same-origin"`, CSRF header from cookie):

- `login(input: LoginInput) → { needsTwoFa: true, challengeId } | { needsTwoFa: false }` — ensures csrf cookie, POSTs, parses via `loginResponseSchema`, mutates store, returns branch.
- `verify2FA(input: TwoFactorInput)` — POSTs code, mutates store on success.
- `refreshAccessToken() → boolean` — POSTs, mutates on success, resets on failure.
- `logout()` — POSTs, always resets store even if network fails.
- `requestPasswordReset(input: ForgotPasswordInput)` — ensures csrf, POSTs.
- `confirmPasswordReset(input: { token, new_password })` — POSTs. Narrower type than `ResetPasswordInput` (the schema has a UI `confirm` field).

`PermissionGate` / `withPermission` — see Section 8.

`useSessionIdleTimer(onExpire, onWarn)`:

- Only active while `status === "authenticated"`.
- Idle threshold: 30 min. Warn threshold: 25 min.
- Activity events reset the timer: `pointerdown`, `keydown`, `wheel`, `touchstart`.
- Multi-tab sync via `BroadcastChannel("edss-session")` — activity in one tab resets others.
- Tick every 15s.
- `onWarn` fires once per idle window; `onExpire` fires when idle ≥ threshold.

`useCountdown(fromMs)` — 1-second-tick countdown for UI display.

`use2faChallenge()` — small state machine (`idle` | `verifying` | `invalid` | `rate-limited` | `verified`).

Auth cookies (set by Next proxy — see Section 6.4):

- `rt` — refresh token, `HttpOnly Secure SameSite=Lax Path=/api/auth Max-Age=30d`.
- `csrf` — CSRF token, JS-readable, `Secure SameSite=Lax Path=/ Max-Age=24h`.
- `theme` — `system`|`light`|`dark`, `SameSite=Lax Secure Path=/ Max-Age=1y`.
- `last_role_group` — `client`|`staff`, `SameSite=Lax Secure Path=/ Max-Age=1y`. Set by layouts.

---

## 4. `apps/website` — marketing site (production)

Port 3000. Static-first Next 15. See `apps/website/README.md` for detailed feature notes. Preservation rule: **zero visual/behavioral change without explicit approval**. See `.claude/projects/D--Aman-Build-External-Frontend-self-v1/memory/feedback_preserve_marketing.md`.

Routes (all under `(marketing)` route group, layout in `apps/website/app/(marketing)/layout.tsx`):

- `/` — home
- `/about`
- `/services` + `/services/[slug]` — SSG, 11 slugs from `data/services.ts`
- `/portfolio` + `/portfolio/[slug]` — 6 case studies from `data/portfolio.ts`
- `/blog` + `/blog/[slug]` + `/blog/category/[slug]` — 4 posts, 4 categories from `data/blog.ts`
- `/careers` + `/careers/[slug]` — 3 roles from `content/careers.json`
- `/contact` — form (react-hook-form + zod)
- `/faqs`
- `/legal/privacy` + `/legal/terms`

API + system routes:

- `/api/contact` — POST, zod-validated, forwards via Resend if `RESEND_API_KEY` set, else logs to console
- `/og/default.png` — Next `next/og` edge OG image
- `/manifest.webmanifest`, `/robots.txt`, `/sitemap.xml`

Root layout (`app/layout.tsx`) mounts:

1. `<html lang="en" className={${display.variable} ${sans.variable} ${mono.variable}}>`
2. Skip-to-content link
3. `<PostHogProvider>` wrapping the tree
4. `<Suspense><PageviewTracker /></Suspense>`
5. `<SmoothScroll />` (Lenis)
6. `{children}`, `<JsonLd data={organizationLd()} />`, `<Analytics />` (Vercel)

Component groups (all under `apps/website/components/`):

- `layout/` — Container, Section, Rule, Header (mega-panel), Footer
- `marketing/` — Hero, ServiceIndex, PortfolioGrid, JournalCard, FaqAccordion, TestimonialQuote, StatLedger, LogoMarquee, CtaBand, ContactForm, WhatsAppCta, PageIntro, ProcessRail
- `motion/` — Reveal, Stagger + StaggerItem, RevealLines, Marquee, CountUp, SmoothScroll, MagneticCta, HeroShader, CursorLens, Parallax

Data:

- `apps/website/data/{services,portfolio,blog,clients,nav,stats}.ts` — typed catalogs
- `apps/website/content/{careers,faqs,testimonials}.json` — JSON fixtures
- `apps/website/config/{site,seo,env,legal}.ts` — app-wide config

Styles:

- `apps/website/styles/globals.css` — imports `@edss/design-system/styles/tokens.css` + `tokens-light.css` + local utilities (marquee, noise, .on-ink, .container-edss)
- `apps/website/styles/typography.css` — editorial prose (drop cap, etc.)

Preservation suite (`tests/visual/`, `playwright.config.ts`):

- 24 baseline snapshots (12 routes × 2 viewports) with `reducedMotion: "reduce"` + 1.5s wait
- Runs `npm --workspace @edss/website run build && start` in webServer
- Command: `npm run test:visual` (from repo root)

Env used by website:

- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `CONTACT_EMAIL`, `RESEND_API_KEY` (optional)
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`

---

## 5. `apps/dashboard` — Business Operations Platform (dashboard shell)

Port 3001. Next 15 App Router. Consumes every `@edss/*` package. Cross-origin backend expected (mocked via MSW in dev).

### 5.1 Route map

**Route groups + URL prefixes:**

- `(auth)` — auth screens, split-screen brand layout. No shell.
- `client/` — client shell. URL prefix `/client/*`.
- `staff/` — staff shell. URL prefix `/staff/*`.

Note: the design spec used Next route groups `(client)` and `(staff)` mapping to bare URLs. Implementation switched to URL-segment prefixes (`/client`, `/staff`) because both groups shared identical URL segments (e.g. `/overview`) and Next refuses to compile conflicting parallel routes.

**Full route list:**

Auth (public, no auth gate):

- `/login` — LoginForm
- `/login/2fa-challenge?challenge_id=…` — TotpInput + verify
- `/forgot-password` — ForgotPasswordForm
- `/reset-password?token=…` — ResetPasswordForm
- `/logout` — client-side logout redirect

Landing (authed):

- `/dashboard` — client-side redirect based on `activeRoleGroup` → last visited role group cookie → `primaryRole` → default `/client/overview`

Client shell (authed, permission-gated per module):

- `/client/overview`, `/client/projects`, `/client/invoices`, `/client/tickets`, `/client/files`, `/client/calendar`, `/client/notifications`, `/client/profile`, `/client/settings`

Staff shell (authed):

- `/staff/overview`, `/staff/projects`, `/staff/invoices`, `/staff/sales`, `/staff/users`, `/staff/reports`, `/staff/audit-logs`, `/staff/calendar`, `/staff/notifications`, `/staff/settings`

API routes:

- `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/2fa/verify`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/csrf-token`, `/api/csp-report`

### 5.2 Root layout provider stack

`apps/dashboard/app/layout.tsx` reads request headers to get the CSP nonce, injects a nonced pre-hydration script that reads the `theme` cookie and sets `data-theme` on `<html>` before React paints (avoids FOUC), then mounts providers outer→inner:

```
<ThemeProvider>              (next-themes, attribute="data-theme")
  <QueryProvider>            (TanStack QueryClient)
    <MSWProvider>            (dev-only, dynamic-imports mocks/browser and starts SW)
      <AuthProvider>         (initApiClient + refreshAccessToken on mount + silent-refresh scheduler)
        <PostHogProvider>
          <Suspense><PageviewTracker /></Suspense>
          <ToastProvider>{children}</ToastProvider>
        </PostHogProvider>
      </AuthProvider>
    </MSWProvider>
  </QueryProvider>
</ThemeProvider>
```

Note: `ToastProvider` uses a Zustand `useToastStore` — `.push({ severity, title, body, durationMs })` from anywhere to enqueue toast; max 3 visible.

### 5.3 Shell components (used by both `client/layout.tsx` and `staff/layout.tsx`)

- `<Topbar>` — sticky 56px, Wordmark + Cmd+K search trigger + role-toggle chip (only when `hasBothRoles`) + notifications bell + `<UserMenu>`.
- `<Sidebar>` — 240px fixed, permission-gated nav. Reads `activeRoleGroup` from `useAuthStore` and builds nav with prefix `/client` or `/staff`. Icons from lucide.
- `<UserMenu>` — Radix DropdownMenu. Header with name/email, items: Profile / Settings / Theme submenu (System/Light/Dark) / Log out (danger).
- `<NotificationsDrawer>` — right-side `Sheet` 380px wide, tabs (All/Unread/Mentions), empty state phase 1.
- `<CommandPalette>` — `cmdk`-backed dialog, ⌘K / Ctrl+K global shortcut, routes from `palette-routes.ts` filtered by `activeRoleGroup`.
- `<SessionIdleWatcher>` — Dialog warn at 25min, auto-logout at 30min via `useSessionIdleTimer`.
- `<PageHeader>` — reusable page shell (kicker + title + subtitle + optional actions).
- `<EmptyStatePlaceholder>` — module placeholder body.

Layouts (both identical shape, only role differs):

```tsx
<div className="min-h-dvh">
  <Topbar />
  <SessionIdleWatcher />
  <div className="flex">
    <Sidebar />
    <div className="container-app flex-1 py-10">{children}</div>
  </div>
</div>
```

`client/layout.tsx` and `staff/layout.tsx` each set `useAuthStore.getState().setRoleGroup(...)` on mount and write `last_role_group` cookie.

### 5.4 Middleware — `apps/dashboard/middleware.ts`

Runs on every request except static assets (matcher excludes `_next/static`, `_next/image`, `favicon.ico`, `mockServiceWorker.js`).

Execution order per request:

1. Generate CSP nonce = `crypto.randomUUID().replace(/-/g, "")`. Inject into request headers as `x-nonce`.
2. If `POST /api/auth/{login,refresh,2fa/verify,forgot-password}` and Upstash Redis is configured, check rate limit. On limit: 429 + `Retry-After` seconds.
3. If mutating `/api/auth/*` (not `csrf-token`) — verify `X-CSRF-Token` header equals `csrf` cookie value. Mismatch: 403 `{ code: "CSRF_MISMATCH", … }`.
4. For non-API routes: if `rt` cookie absent and route is not `/`, `/login*`, `/forgot-password*`, `/reset-password*` → 302 to `/login?next=<pathname>`. If `rt` present and pathname is `/login` → 302 to `/dashboard`. If pathname is `/` → 302 to `/dashboard` (authed) or `/login`.
5. Apply security headers + CSP to the response.

Security headers set on every response:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
X-DNS-Prefetch-Control: off
Content-Security-Policy: <computed per-request>
```

CSP template (nonce substituted per request):

```
default-src 'self';
script-src 'self' 'nonce-{NONCE}' 'strict-dynamic' https://eu.i.posthog.com;
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
report-uri /api/csp-report
```

`{API_BASE_ORIGIN}` and `{WS_BASE_ORIGIN}` are set from env in `next.config.mjs` (see Section 7).

Rate-limit prefixes used with Upstash:

- `rl:login` — 5 per 15m per `${ip}|${userAgent.slice(0,64)}`
- `rl:refresh` — 60 per minute per same key + `|refresh`
- `rl:2fa` — 5 per 15m per same key + `|2fa`
- `rl:forgot` — 10 per hour per same key + `|forgot`

If Upstash env vars are unset, limits degrade to no-ops (dev friendly).

### 5.5 Auth-proxy route handlers (`apps/dashboard/app/api/auth/*`)

Shared helper `_proxy.ts`:

- `forwardToBackend(path, { method, body })` — POSTs to `${NEXT_PUBLIC_API_BASE}${path}` (default `https://api.edss.example`), returns `NextResponse.json`. On network error returns `502 { code: "NETWORK_ERROR" }`.
- `setAuthCookies(res, refreshToken)` — sets `rt` HttpOnly Secure Lax `/api/auth` `Max-Age=2592000`.
- `clearAuthCookies(res)` — clears `rt` and `csrf`.

**Endpoints and expected backend contracts:**

`GET /api/auth/csrf-token`:

- No CSRF check. Returns `{ ok: true }` and sets `csrf` cookie (JS-readable, Secure, Lax, Path=/, Max-Age=86400) with a base64url-encoded 32-random-byte token.

`POST /api/auth/login` — body: `{ email, password, remember_me }`:

- Forwards to backend `POST /auth/login`.
- Backend expected to return either:
  - `{ needs_2fa: true, two_fa_challenge_id }` — proxy passes through, no cookie.
  - `{ needs_2fa: false, access_token, access_token_exp, refresh_token, user, permissions, session_id }` — proxy strips `refresh_token`, sets `rt` cookie, returns rest to browser.

`POST /api/auth/refresh` — no body:

- Reads `rt` cookie value.
- Forwards `POST /auth/refresh` with body `{ refresh_token: <rt> }`.
- Backend expected: `{ access_token, access_token_exp, refresh_token (rotated), permissions, session_id }`.
- Proxy sets rotated `rt`, returns rest.

`POST /api/auth/logout` — no body:

- If `rt` present, forwards `POST /auth/logout` with `{ refresh_token }`. Then clears cookies + returns 204.

`POST /api/auth/2fa/verify` — body: `{ challenge_id, code, remember_device }`:

- Forwards to backend `POST /auth/2fa/verify`.
- Backend expected on success: same shape as login (non-2fa branch).

`POST /api/auth/forgot-password` — body: `{ email }` → `POST /auth/forgot-password` (pass-through).

`POST /api/auth/reset-password` — body: `{ token, new_password }` → `POST /auth/reset-password` (pass-through).

`POST /api/csp-report` — logs report to console, returns 204. Reachable from CSP `report-uri`.

**Backend cookie handling:** proxies always translate the backend's refresh token into an HttpOnly `rt` cookie. Backend never sets browser cookies directly. This keeps the backend cross-origin without needing CORS credential handling.

### 5.6 Data endpoints (NOT proxied)

Client code calls `${NEXT_PUBLIC_API_BASE}${path}` **directly** with `credentials: "omit"` and `Authorization: Bearer <access_token>`. Backend must:

- `Access-Control-Allow-Origin: https://<dashboard-origin>` (exact, no wildcard).
- `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`.
- `Access-Control-Allow-Headers: Authorization, Content-Type, X-Request-Id`.
- Handle OPTIONS preflight for JSON bodies.
- Never expects cookies (bearer only).
- Vary: Origin.

CORS is a backend concern; no credentials are sent.

### 5.7 MSW mock backend

Enabled with `NEXT_PUBLIC_USE_MOCKS=true`. Provider dynamic-imports `mocks/browser.ts` and starts the service worker.

Files:

- `apps/dashboard/mocks/browser.ts` — `setupWorker(...handlers)`, `startMocks()` calls `.start({ onUnhandledRequest: "bypass" })`.
- `apps/dashboard/mocks/node.ts` — `setupServer(...handlers)` for Vitest/Playwright (not wired yet).
- `apps/dashboard/mocks/delay.ts` — `realDelay(min=200, max=400)`; `?fast=1` in URL skips delay.
- `apps/dashboard/mocks/fixtures/users.ts` — seed users, `findUser(email)`, `permissionsFor(userId)`, `clientPermissions`, `staffPermissions`.
- `apps/dashboard/mocks/handlers/auth.ts` — full auth mock w/ per-email rate-limit sim (5/15min), 2FA challenge tracking, 000000 magic code.
- `apps/dashboard/mocks/handlers/{users,projects,invoices,tickets,files,notifications}.ts` — stub endpoints returning `{ items: [], cursor: null, has_more: false }`.
- `apps/dashboard/public/mockServiceWorker.js` — MSW-generated worker (committed).

Seeded permissions:

```ts
clientPermissions = [
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

staffPermissions = [
  "projects:read",
  "projects:write",
  "invoices:read",
  "invoices:write",
  "sales:read",
  "sales:write",
  "users:read",
  "users:write",
  "reports:read",
  "audit_logs:read",
  "calendar:read",
  "notifications:read",
  "settings:read",
  "settings:write",
];
```

Admin user gets `[...new Set([...clientPermissions, ...staffPermissions])]`.

**Real backend swap:** set `NEXT_PUBLIC_USE_MOCKS=false`. `MSWProvider` short-circuits. Every fetch hits `${NEXT_PUBLIC_API_BASE}${path}`. Zero code change in components.

### 5.8 Where common workflows live

- **Add a permission-gated UI element:** wrap with `<PermissionGate permission="projects:write">…`. Or use `useHasPermission("projects:write")` for inline logic.
- **Add a whole-page permission gate:** `export default withPermission(Page, "projects:read")` — unauthorized renders default 403.
- **Add a new API call:**
  1. Add schema to `packages/validation/src/api.ts`.
  2. Add a query hook using `useApiQuery(["key"], "/path", schema)` from `@edss/api/queries`.
  3. For mutations, `makeMutationFn("/path", "POST", responseSchema)` + `useApiMutation`.
- **Add a route to command palette:** append to `apps/dashboard/components/palette/palette-routes.ts` with the right `group` and optional `permission`.
- **Add a nav item to sidebar:** edit `buildClientNav` or `buildStaffNav` inside `apps/dashboard/components/shell/Sidebar.tsx`. Optional `permission` field auto-gates via `useHasPermission`.
- **Toast an error/success:** `useToastStore.getState().push({ severity: "error", title: "…", body: "…", durationMs: 5000 })`.

---

## 6. Contracts + auth flow

### 6.1 Login flow

1. Browser navigates `/login`.
2. Middleware inspects `rt` cookie — absent, allow. Present, redirect `/dashboard`.
3. User submits `LoginForm` — Zod validates `loginSchema`.
4. `login(input)` from `@edss/auth/client`:
   - Ensures `csrf` cookie (`GET /api/auth/csrf-token` if absent).
   - `POST /api/auth/login` with `Content-Type: application/json` + `X-CSRF-Token` header + JSON body.
5. Middleware checks CSRF (`x-csrf-token` header === `csrf` cookie). Fail → 403.
6. Middleware rate-limits (login: 5/15min per IP+UA hash). Fail → 429 + `Retry-After`.
7. Route handler `/api/auth/login/route.ts` forwards to `POST ${API_BASE}/auth/login`.
8. Backend responds. Proxy branches:
   - `needs_2fa: true` — proxy passes challenge_id back. Client-side navigates `/login/2fa-challenge?challenge_id=...`.
   - `needs_2fa: false` — proxy sets `rt` HttpOnly cookie, returns `{ access_token, access_token_exp, user, permissions, session_id }`. Client stores in Zustand, navigates `search.get("next") ?? "/dashboard"`.
9. `/dashboard` client component reads `useAuthStore` and redirects to `/${activeRoleGroup ?? last_role_group ?? primaryRole}/overview`.

### 6.2 2FA challenge flow

1. `/login/2fa-challenge` renders `<TotpInput>` (6-cell auto-advancing, paste-aware).
2. User enters code. `verify2FA({ challenge_id, code, remember_device })`.
3. `POST /api/auth/2fa/verify` with CSRF header + JSON body.
4. Middleware CSRF check + rate limit (`rl:2fa` — 5 per 15min).
5. Proxy forwards `POST /auth/2fa/verify`. Backend returns login-shape response.
6. Store hydrated. Route pushes `/dashboard`.

Mock: any code except `000000` → 401 `INVALID_TOTP`. `000000` → success (admin@example.com).

### 6.3 Refresh flow

1. `apiFetch` catches 401 (not itself a retry, not `skipAuth`).
2. Calls `ensureRefreshed()` — module-scoped promise ensures parallel refresh calls share one request.
3. `refreshAccessToken()` from `@edss/auth/client` → `POST /api/auth/refresh` with CSRF header (empty body, `rt` cookie carries state).
4. Middleware CSRF + rate limit (`rl:refresh` — 60/min/IP).
5. Proxy reads `rt` cookie, forwards to backend `POST /auth/refresh { refresh_token: <rt> }`.
6. Backend returns `{ access_token, access_token_exp, refresh_token (rotated), permissions, session_id }`.
7. Proxy sets rotated `rt`, returns `{ access_token, access_token_exp, permissions, session_id }` to browser.
8. Store `setRefreshed(...)`. Original 401'd request retries once with new token.

`<AuthProvider>` schedules a silent refresh at `(accessTokenExp - 60s) * 1000` via `setTimeout`.

### 6.4 Cookie flags matrix

| Cookie            | HttpOnly | Secure | SameSite | Path        | Max-Age | Set by                                                          | Read by                                    |
| ----------------- | -------- | ------ | -------- | ----------- | ------- | --------------------------------------------------------------- | ------------------------------------------ |
| `rt`              | yes      | yes    | Lax      | `/api/auth` | 30d     | proxy login/refresh/2fa/verify                                  | proxy refresh/logout                       |
| `csrf`            | no       | yes    | Lax      | `/`         | 24h     | `/api/auth/csrf-token` (also login/refresh handlers can rotate) | JS in browser                              |
| `theme`           | no       | yes    | Lax      | `/`         | 1y      | `next-themes`                                                   | pre-hydration inline script + `useTheme()` |
| `last_role_group` | no       | yes    | Lax      | `/`         | 1y      | shell layouts                                                   | `/dashboard/page.tsx`                      |

### 6.5 API error code taxonomy

Every backend error should be `{ code, message, details? }` matching `apiErrorSchema`. Codes:

| Code                  | Meaning                               | Typical HTTP     |
| --------------------- | ------------------------------------- | ---------------- |
| `INVALID_CREDENTIALS` | Bad email/password/2FA                | 401              |
| `INVALID_TOTP`        | Wrong or expired 2FA code             | 401              |
| `SESSION_EXPIRED`     | Refresh failed / rt invalid           | 401              |
| `SESSION_REVOKED`     | Backend killed session (other device) | 401              |
| `CSRF_MISMATCH`       | Header ≠ cookie                       | 403              |
| `RATE_LIMITED`        | Backend / edge rate limit             | 429              |
| `FORBIDDEN`           | Missing permission                    | 403              |
| `NOT_FOUND`           | Resource missing                      | 404              |
| `VALIDATION_FAILED`   | Body failed backend schema            | 422              |
| `INVALID_RESPONSE`    | Backend returned unexpected shape     | client-generated |
| `NETWORK_ERROR`       | Fetch failed                          | 0                |
| `SERVER_ERROR`        | 5xx                                   | 500-599          |
| `UNKNOWN`             | Catch-all                             | any              |

Client-side helper: `errorCodeToMessage(code)` produces a user-visible sentence.

---

## 7. Env variables — full list

Root `.env.example`. Copy to `.env.local` (gitignored) for local dev.

**Marketing:**

| Var                           | Default                       | Meaning                                            |
| ----------------------------- | ----------------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`        | `https://elitedigital.studio` | Canonical origin                                   |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `910000000000`                | Formatted for `wa.me/<n>`                          |
| `CONTACT_EMAIL`               | `hello@elitedigital.studio`   | Contact form target                                |
| `RESEND_API_KEY`              | empty                         | Optional Resend integration; empty logs to console |

**Analytics (both apps):**

| Var                        | Default                    | Meaning                                     |
| -------------------------- | -------------------------- | ------------------------------------------- |
| `NEXT_PUBLIC_POSTHOG_KEY`  | empty                      | Skips init if empty                         |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://eu.i.posthog.com` | Cloud EU locked per data-residency decision |

**Dashboard runtime:**

| Var                        | Default                                                         | Meaning                                                                                                                                                                               |
| -------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE`     | `https://api.edss.example`                                      | Backend base URL. Cross-origin. Used by `apiFetch` + auth proxies + CSP `connect-src`.                                                                                                |
| `NEXT_PUBLIC_WS_BASE`      | `wss://api.edss.example`                                        | WebSocket base (unused phase 1 — reserved for realtime in sub-project 6)                                                                                                              |
| `NEXT_PUBLIC_USE_MOCKS`    | `true`                                                          | MSW gate. Set `false` in prod.                                                                                                                                                        |
| `NEXT_PUBLIC_2FA_ENABLED`  | `false`                                                         | Feature flag. When `true`, backend can return `needs_2fa: true` and UI navigates 2FA challenge. Mock still respects backend response — flag lives here for future full-2FA build-out. |
| `UPSTASH_REDIS_REST_URL`   | empty                                                           | Edge rate limit. Empty → no-op.                                                                                                                                                       |
| `UPSTASH_REDIS_REST_TOKEN` | empty                                                           | Same                                                                                                                                                                                  |
| `CSP_REPORT_LOG_LEVEL`     | `info`                                                          | Reserved for future logging tiers                                                                                                                                                     |
| `API_BASE_ORIGIN`          | derived in `next.config.mjs` from `NEXT_PUBLIC_API_BASE`.origin | Substituted into CSP `connect-src`                                                                                                                                                    |
| `WS_BASE_ORIGIN`           | derived from `NEXT_PUBLIC_WS_BASE`                              | Substituted into CSP                                                                                                                                                                  |

Vercel projects: two separate projects, each with `Root Directory` set to `apps/website` or `apps/dashboard`. Each gets its own env vars from `.env.example`.

---

## 8. RBAC — permission strings

Backend owns role→permission mapping. Frontend never sees role names beyond `primaryRole` and `hasBothRoles`; UI gates on permission strings.

Convention: `<resource>:<action>` where action ∈ `read | write | approve | admin`.

Every module route can optionally supply a `permission` in the sidebar nav config. Palette routes work the same. Component-level `<PermissionGate>` handles inline gates.

Client-permission examples: `projects:read`, `invoices:read`, `tickets:read`, `tickets:write`, `files:read`, `files:write`, `calendar:read`, `notifications:read`, `profile:read`, `profile:write`, `settings:read`.

Staff-permission examples: `projects:write`, `invoices:write`, `sales:read`, `sales:write`, `users:read`, `users:write`, `reports:read`, `audit_logs:read`, `settings:write`.

**Backend contract:** `permissions: string[]` returned on every `login` and `refresh` response. Client never derives permissions.

---

## 9. Turborepo pipeline

`turbo.json`:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^lint"] },
    "typecheck": { "dependsOn": ["^typecheck"] },
    "format": { "cache": false }
  }
}
```

Root scripts:

```
npm run dev          # turbo run dev (starts both apps if their `dev` script exists)
npm run build        # turbo run build (currently only apps are buildable)
npm run lint         # turbo run lint
npm run typecheck    # turbo run typecheck
npm run format       # prettier over the whole tree
npm run test:visual  # playwright (marketing preservation)
npm run test:visual:update
```

Per-app scripts:

- `apps/website`: `dev` (port 3000), `build`, `start`, `lint`, `typecheck`, `format`, `analyze`, `check:bundle`.
- `apps/dashboard`: `dev` (port 3001), `build`, `start` (port 3001), `lint`, `typecheck`, `format`.

Husky pre-commit hook runs `lint-staged` (Prettier over changed files).

---

## 10. Testing / verification

### Marketing preservation

`npm run test:visual` — Playwright suite in `tests/visual/snapshot.spec.ts`. 12 routes × 2 viewports = 24 baseline snapshots. `reducedMotion: "reduce"` + 1500ms font/paint settle. `webServer` runs `npm --workspace @edss/website run build && run start`.

Zero pixel drift is the pass criterion. If a change legitimately alters output, refresh with `npm run test:visual:update` and commit the new baseline.

### Dashboard build smoke

- `npm --workspace @edss/dashboard run typecheck` — should exit 0.
- `npm --workspace @edss/dashboard run build` — should produce 32 routes: 8 auth API + `/api/csp-report` + 5 auth screens + `/dashboard` landing + 9 client + 10 staff + `/` + `/_not-found`. Shared First Load JS ~105 kB, middleware ~57 kB.
- Header smoke (dev):
  ```
  curl -sI http://localhost:3001/login | grep -E "content-security|strict-transport|x-frame|x-content|referrer|permissions-policy"
  ```
  Every header must appear.

### Manual dashboard smoke walk

1. `NEXT_PUBLIC_USE_MOCKS=true npm --workspace @edss/dashboard run dev`
2. `/` unauthenticated → redirects `/login`.
3. Login as `client@example.com / password` → lands `/client/overview`.
4. Login as `staff@example.com / password` → lands `/staff/overview`.
5. Login as `admin@example.com / password` → `/login/2fa-challenge` → enter `000000` → `/dashboard` → `/client/overview` (default when both roles).
6. Toggle theme via user menu → cookie persists → reload keeps.
7. Cmd+K opens palette. Enter a route.
8. In DevTools: check that `access_token` is NOT in `localStorage`/`sessionStorage`. Confirm `rt` cookie is HttpOnly (not visible in `document.cookie`).
9. Force-fail login 6 times (any wrong pass) — MSW returns 429 with `Retry-After: 900`.
10. Log out → `/login`.

### Dashboard Playwright suite (deferred)

Not yet baselined. Files planned:

- `tests/visual/dashboard/routes.ts`
- `tests/visual/dashboard/snapshot.spec.ts`

Should extend the root `playwright.config.ts` `webServer` array to spin up the dashboard alongside the website. Not blocking; add in future sub-project.

---

## 11. Known deviations from the plans

Recorded here so future agents don't chase drift.

- **Route groups → URL prefixes.** The dashboard spec used `(client)` and `(staff)` route groups mapping to bare URLs like `/overview`. Both groups shared identical segments; Next would refuse. Implementation renamed to plain URL segments `/client/*` and `/staff/*`. Landing route `/dashboard/page.tsx` client-side decides the redirect target. Sidebar hrefs are prefixed accordingly.
- **shadcn primitives partially added.** Stage 1 plan listed 17 primitives; only the ones actually consumed by Stage 2 shipped: `button` (from marketing), `form` (legacy from marketing), `input`, `label`, `checkbox`, `dialog`, `dropdown-menu`, `sheet`, `tabs`, `command`. Deferred: `avatar`, `badge`, `skeleton`, `separator`, `scroll-area`, `switch`, `toast`, `tooltip`, `button-v2`. Add them when a consumer needs them; follow the existing pattern.
- **`.js` import extensions dropped from new packages.** Sub-project 1 packages used `import ... from "./foo.js"` and worked. Sub-project 2 packages (`@edss/types`, `@edss/validation`, `@edss/api`, `@edss/auth`) hit Next 15 webpack resolution failures with `.js` extensions when consumed by the dashboard; extensions were stripped. This is a mixed-convention state — earlier packages keep `.js`, newer packages don't. Both work because `moduleResolution: "bundler"` accepts either.
- **MSW dev banner not shipped.** Plan listed a `<MockBanner>` component to help testers find seeded accounts. Not implemented. Seed accounts are documented here and in the mock handlers file.
- **Dashboard Playwright baseline not captured.** Plan listed a 48-snapshot baseline (48 = 8 routes × 2 viewports × 3 themes). Deferred to future sub-project.
- **`_proxy.ts` under `app/api/auth/`.** Next 15 by default treats every `.ts` file under `app/api/*` as a potential route unless it does not export route handlers. This file doesn't export handlers so it's safe, but if a future refactor tightens the router it may need to move to `apps/dashboard/lib/proxy.ts`.
- **`ResetPasswordSubmit` inline type.** `confirmPasswordReset` accepts `{ token, new_password }` not the full `ResetPasswordInput` (which carries `confirm` for form UX). If `@edss/types` gains this shape, prefer importing from there.
- **`useAuth()` returns the entire store.** `useAuth` currently returns `useAuthStore()` and will re-render on any store field. Convert consumers to specific selectors (`useAuthStore((s) => s.field)`) for performance if the shell gets busy.

---

## 12. Where to add code (extension points)

**A new module page:**

1. Add page file `apps/dashboard/app/{client|staff}/<module>/page.tsx` using `<PageHeader>` + `<EmptyStatePlaceholder>` initially.
2. Register in `apps/dashboard/components/shell/Sidebar.tsx` under the right section, with optional `permission`.
3. Register in `apps/dashboard/components/palette/palette-routes.ts` for Cmd+K.
4. Backend contract types → `@edss/types/api`.
5. Zod schemas → `@edss/validation/api` (extend or add subpath).
6. MSW handler → `apps/dashboard/mocks/handlers/<module>.ts` + register in `handlers/index.ts`.
7. Data hooks → build inside the page or lift to a `lib/queries/<module>.ts` module using `useApiQuery`.

**A new backend endpoint (proxied):**

1. Create `apps/dashboard/app/api/<path>/route.ts` — GET/POST handler.
2. Use `forwardToBackend` from `app/api/auth/_proxy.ts` (or a shared helper if you split it out) if you want the backend to be forwarded server-to-server.
3. If it's an authenticated data endpoint, prefer direct-from-browser calls via `apiFetch` (CORS + bearer) rather than proxying — saves a hop.

**A new package:**

1. `packages/<name>/package.json` with `"name": "@edss/<name>"`, `"private": true`, `"type": "module"`, subpath `exports`.
2. `packages/<name>/tsconfig.json` extends `@edss/config/tsconfig/react-library.json` (React runtime) or `base.json` (pure types/logic).
3. Add to `apps/dashboard/package.json` deps AND `apps/dashboard/next.config.mjs` `transpilePackages`.
4. If publishable one day, add subpath types + declaration output. Not needed now.

**A new security header or CSP directive:**

Edit `apps/dashboard/middleware.ts`:

- Headers array: `SECURITY_HEADERS`.
- CSP: `buildCsp(nonce)`.
- If new external origin needed: extend `connect-src` / `img-src` / `script-src` allowlist.

**A new rate limit:**

Edit `apps/dashboard/middleware.ts`:

1. Create a new `Ratelimit` instance with a unique `prefix`.
2. Route it under the appropriate `pathname` branch inside the `POST` handler.
3. Return 429 + `Retry-After` on failure using the existing pattern.

**A new toast severity:**

Extend `apps/dashboard/components/providers/ToastProvider.tsx` `ToastItem.severity` union and add styling for the new severity in the JSX.

---

## 13. Non-goals / red lines

- **Never commit secrets.** `.env.local` is gitignored. Env files with keys must never be committed.
- **Never store access tokens in localStorage or sessionStorage.** Memory only. Refresh cookie is HttpOnly.
- **Never trust client-side permissions.** Every gate is a UX affordance; backend must re-check on every mutation.
- **Never break marketing site output.** See preservation memory. Any change to `apps/website` must be user-approved.
- **Never break Cmd+K.** Global shortcut is registered by `<CommandPalette>` and must not be shadowed by other listeners.
- **Never bypass CSRF.** Every mutating call to `/api/auth/*` must send `X-CSRF-Token`. Every backend mutation must run behind the middleware CSRF check.
- **Never hardcode role names in UI logic.** Only permission strings. Backend owns roles.
- **Never render access tokens or refresh tokens in the DOM or console logs.**
- **Never inline scripts without a nonce.** All inline scripts (pre-hydration theme picker, etc.) must consume the request-scoped `x-nonce` header. `experimental.strictNextHead` is on to make Next's own inline scripts nonce-clean.

---

## 14. Onboarding a fresh AI agent

Minimum context to be productive:

1. Read this file entire.
2. Skim the two specs in `docs/superpowers/specs/`.
3. Read `packages/api/src/client.ts` — understanding `apiFetch` is the biggest leverage.
4. Read `packages/auth/src/store.ts` + `packages/auth/src/client.ts` — this is the auth state machine.
5. Read `apps/dashboard/middleware.ts` — this is the security substrate.
6. Read `apps/dashboard/app/layout.tsx` + one of the shell layouts (`client/layout.tsx`) — this is the render tree.
7. Look at one mock handler (`apps/dashboard/mocks/handlers/auth.ts`) and one page (`apps/dashboard/app/(auth)/login/page.tsx`) to see the loop end-to-end.

After that you can:

- Add a new module: follow Section 12 A.
- Add a new backend integration: define types → schema → query hook → mock handler → UI.
- Extend security: follow Section 12 for headers/CSP/rate limits.

---

## 15. Quick command cheat sheet

```
# install
npm install

# dev
npm --workspace @edss/website  run dev            # marketing on :3000
npm --workspace @edss/dashboard run dev           # dashboard on :3001

# build all
npm run build

# typecheck all
npm run typecheck

# lint all
npm run lint

# marketing snapshots
npm run test:visual
npm run test:visual:update

# format
npm run format

# playwright chromium browser install (once per machine)
npx playwright install chromium

# regenerate MSW worker (once)
cd apps/dashboard && npx msw init public/ --save

# add a shadcn primitive to @edss/ui (manual, not CLI):
# 1. Add exports entry in packages/ui/package.json
# 2. Create packages/ui/src/<name>.tsx (Radix + cn + tokens)
# 3. Re-export from packages/ui/src/index.ts
# 4. npm install

# start MSW smoke
NEXT_PUBLIC_USE_MOCKS=true npm --workspace @edss/dashboard run dev
```

---

## 16. Reference points

- Marketing README: `apps/website/README.md` (has stack + module deep-dive)
- Design system: `docs/design-system.md`
- Motion tokens: `packages/design-system/src/motion.ts`
- Impeccable brand register: `.impeccable/` (repo-level tool)
- Memory (auto): `C:\Users\DELL\.claude\projects\D--Aman-Build-External-Frontend-self-v1\memory\`
  - `MEMORY.md` — index
  - `feedback_preserve_marketing.md` — preservation rule
  - `project_master_prompt.md` — umbrella program
  - `project_analytics_posthog.md` — PostHog decisions
  - `project_git_remote.md` — git remote decisions

Last major migration event: sub-project 2 shipped 2026-07-07.
