# Perf + Test + Ops Review — Raw Findings

**Reviewers:** Web Perf Senior + Automation Testing Senior + DevOps + Observability
**Baseline commit:** `7c1cdf85c7f035bd253c3face4ce817779b551ba` (branch `audit-remediation`, HEAD at time of review)
**Scope:** apps/dashboard, apps/website, packages/*, turbo pipeline, Playwright config, Husky hook, .env.example.
**Method:** AGENTS.md read first; then verified against source (next.config.mjs, turbo.json, playwright.config.ts, .husky/pre-commit, per-app package.json, middleware, client-boundary files, providers, .env.example).

---

## Totals

**By severity:**

- Sev-1: 4
- Sev-2: 8
- Sev-3: 9
- Sev-4: 4
- **Total: 25 findings**

**By dimension:**

- Perf: 7
- Test: 6
- CI: 3
- Ops: 4
- Observability: 5

---

## Findings

### F-01 No CI pipeline of any kind

**Severity:** Sev-1
**Where:** `.github/` : absent
**Dimension:** CI
**Problem:** There is no `.github/workflows/` directory anywhere in the repo. No GitHub Actions, no Vercel-preview verification workflow, no unit-test job, no typecheck job, no lint job, no Playwright preservation job. Nothing prevents a broken commit from reaching `main`. AGENTS.md documents the intended commands (typecheck, lint, build, test:visual) but nothing enforces them. This is a shipping frontend for two production apps with auth + CSP + 24 preservation snapshots and the pipeline that actually runs those snapshots does not exist.
**Fix direction:** Add `.github/workflows/ci.yml` with jobs `typecheck`, `lint`, `build`, `test:visual` gated on PRs against `main`. Cache `~/.npm` and `.turbo`. Add `.github/workflows/pr-preview.yml` for Vercel preview URL verification. Playwright job needs `npx playwright install --with-deps chromium` before `npm run test:visual`.

### F-02 No unit / integration test coverage for auth, refresh mutex, RBAC gates, or apiFetch

**Severity:** Sev-1
**Where:** whole repo — `find . -name "*.test.*"` outside node_modules returns zero user-authored tests; only `tests/visual/snapshot.spec.ts` exists
**Dimension:** Test
**Problem:** The load-bearing modules — `packages/api/src/client.ts` (refresh mutex, 401 retry, 429 retry, response validation), `packages/auth/src/client.ts` (login/2FA/refresh state machine), `packages/auth/src/session.ts` (idle timer + BroadcastChannel), `apps/dashboard/middleware.ts` (CSP nonce, CSRF, rate limits, redirect matrix) — have no automated tests. AGENTS.md acknowledges the dashboard Playwright baseline is deferred, but there is also no Vitest / Jest / Testing Library / MSW-node harness at all. Zero coverage on the entire auth shell means a refactor to `apiFetch` or `refreshAccessToken` can silently break every authenticated request.
**Fix direction:** Add Vitest at repo root with per-workspace projects. Author MSW-node handlers reusing `apps/dashboard/mocks/handlers/*` for a) refresh-mutex under concurrent 401s, b) 429 Retry-After budget, c) CSRF mismatch → 403, d) middleware redirect matrix, e) `useSessionIdleTimer` BroadcastChannel behavior via `@happy-dom/global-registrator`. Land before adding new modules.

### F-03 Silent-refresh timer breaks on tab visibility change, laptop sleep, and clock skew

**Severity:** Sev-1
**Where:** `apps/dashboard/components/providers/AuthProvider.tsx` : 21–38
**Dimension:** Ops
**Problem:** `AuthProvider` schedules `setTimeout` at `(accessTokenExp - now - 60) * 1000`. Three failure modes: (1) tab throttled to 1s ticks in background — timer fires late, but any race with `apiFetch` 401 will still get through the mutex; more importantly (2) laptop sleep — `setTimeout` is paused; on wake the timer fires long past expiry so the next `apiFetch` triggers a 401→refresh chain instead of a proactive refresh; (3) OS clock skew — `Date.now()` is used against a server-issued `access_token_exp` (Unix seconds); if the client clock drifts +5 min the timer becomes negative and clamps to 30_000 ms floor, giving spurious refreshes every 30 s. No `visibilitychange` handler re-computes the schedule when the tab regains focus.
**Fix direction:** On `visibilitychange` (visible), recompute `untilRefresh` and reschedule. Use `performance.now()` for elapsed measurement and only use `accessTokenExp` for the initial delta. Add a lower bound and an upper bound on the delta (e.g. 30 s ≤ delta ≤ 55 min). Consider a `BroadcastChannel("edss-refresh")` so cross-tab refreshes deduplicate.

### F-04 Refresh mutex has no failure-cooldown — network-flaky 401s can loop

**Severity:** Sev-1
**Where:** `packages/api/src/client.ts` : 18–28, 76–80
**Dimension:** Ops
**Problem:** `ensureRefreshed()` collapses concurrent refreshes into one promise (correct). But: (a) when refresh throws (e.g. network error), the promise rejects and the `finally` clears `refreshPromise` immediately, meaning the very next 401 will kick off another refresh. Under transient upstream flakiness this becomes an unbounded retry loop as each queued authenticated fetch that hit 401 gets its own retry pass; (b) `refreshAccessToken()` in `packages/auth/src/client.ts:97` uses `.parse(body)` which THROWS on unexpected shape instead of resetting the store — thrown error propagates back to `ensureRefreshed`, promise rejects, and `apiFetch` then calls `onSessionExpired()` which is correct, but a valid-looking but unparseable refresh response now looks identical to a session-expired case. No exponential backoff on refresh; no `retry-after` respect. Also `useAuthStore.setState({ status: "refreshing" })` runs before the network call, meaning any race between two independent code paths (silent-refresh timer + apiFetch 401) can both mark refreshing → still safe because both go through `ensureRefreshed`, but the store status flip happens twice.
**Fix direction:** Add a small failure cooldown: on refresh failure, block subsequent refresh attempts for e.g. 5 s and short-circuit `apiFetch` to `SESSION_EXPIRED` during that window. Wrap `refreshResponseSchema.parse` in `safeParse` and treat parse failure as a hard reset. Consider one retry inside `refreshAccessToken` for network errors only (never for 4xx).

### F-05 MSW ServiceWorker gate blocks first paint of every authed screen

**Severity:** Sev-2
**Where:** `apps/dashboard/components/providers/MSWProvider.tsx` : 6–22
**Dimension:** Perf
**Problem:** `MSWProvider` returns `null` (renders nothing) until the service worker registers and `worker.start()` resolves. That is inside every render tree — for the login route too. When mocks are enabled (`NEXT_PUBLIC_USE_MOCKS=true`, i.e. every dev and every preview) the entire UI is unmounted for typically 200–800 ms of MSW boot. Also, MSW boot happens BEFORE `<AuthProvider>` mounts, so the initial `refreshAccessToken()` is delayed by MSW boot even in prod builds where `enabled` is false (safe: fallthrough returns children immediately). But in prod with `NEXT_PUBLIC_USE_MOCKS` accidentally left `true`, the entire dashboard blanks for the MSW window.
**Fix direction:** Add a build-time assertion that `NEXT_PUBLIC_USE_MOCKS !== "true"` in production. Consider rendering `children` immediately and gating only data fetches on a `mocksReady` promise via context — the shell + auth screens do not need MSW to paint.

### F-06 Middleware runs UUID + CSP-build on every request including static-adjacent paths

**Severity:** Sev-2
**Where:** `apps/dashboard/middleware.ts` : 100–103, 176–178
**Dimension:** Perf
**Problem:** The matcher excludes `_next/static`, `_next/image`, `favicon.ico`, `mockServiceWorker.js` but not `/api/csp-report` or non-existent asset paths. Every non-static request pays: (a) `crypto.randomUUID().replace` for nonce, (b) `clientKey` string concat, (c) `buildCsp(nonce)` which allocates 13-line template + `.join("; ")`, (d) `applyHeaders` iterating 8 header entries. Only Upstash paths involve network — good. But the per-request nonce is 32-hex randomBytes not a monotonic counter, and Next 15 turbopack dev runs middleware on every asset probe. Also middleware runs on `/api/csp-report` which is a reporting sink — pointless CSP + security headers on a 204 response, ~sub-ms but wasted.
**Fix direction:** Exclude `/api/csp-report` from CSP-header path. Consider pre-computing `SECURITY_HEADERS` as a single frozen `Headers` template (currently rebuilt per request via `Object.entries`). The nonce cost is unavoidable but the CSP string can be a `` `template` `` with only the `${nonce}` slot varying.

### F-07 useApiQuery retry policy retries on non-recoverable errors

**Severity:** Sev-2
**Where:** `packages/api/src/queries.ts` : 23–24
**Dimension:** Ops
**Problem:** Retry predicate is `n < 3 && err.code !== "SESSION_EXPIRED" && err.code !== "FORBIDDEN"`. That retries on `VALIDATION_FAILED` (422), `NOT_FOUND` (404), `CSRF_MISMATCH` (403 — note: only `FORBIDDEN` is filtered, not `CSRF_MISMATCH`), `INVALID_RESPONSE`, and even `RATE_LIMITED` (which `apiFetch` already handled once). Each retry is real network round-trips. `CSRF_MISMATCH` retry is particularly wasteful — the cookie mismatch will persist. `NOT_FOUND` retries are dumb.
**Fix direction:** Extend the negative list to `SESSION_EXPIRED`, `FORBIDDEN`, `CSRF_MISMATCH`, `VALIDATION_FAILED`, `NOT_FOUND`, `INVALID_RESPONSE`, `RATE_LIMITED`. Consider only retrying on `NETWORK_ERROR` and `SERVER_ERROR`.

### F-08 No client-side or server-side error reporting; error boundary is a print statement

**Severity:** Sev-2
**Where:** `apps/dashboard/app/error.tsx` : 1–21; `apps/website/app/error.tsx` : absent from grep; no `@sentry/nextjs` or equivalent in either package.json
**Dimension:** Observability
**Problem:** Error boundaries render "We logged it" but nothing is logged anywhere — no Sentry, no LogRocket, no Datadog RUM, no console.error dispatch to a server route. Server-side route handlers (`_proxy.ts`, `/api/auth/*`) also do not emit structured logs; they return generic 502 on network fail. The `console.warn("[csp-report]", …)` in `csp-report/route.ts` is only visible in the runtime host's stdout — on Vercel it winds up in Runtime Logs which have short retention and no alerting. No PII scrubbing, no rate-limit on the report handler.
**Fix direction:** Install `@sentry/nextjs` for the dashboard (client + server + edge) with a placeholder DSN gated on env, so the wiring exists even before turning on. Route `csp-report` through Sentry as `report_type: "csp-violation"`. Add a `/api/health` endpoint returning `{ ok: true, commit: process.env.VERCEL_GIT_COMMIT_SHA }` for uptime checks.

### F-09 No health endpoint on either app

**Severity:** Sev-2
**Where:** `apps/dashboard/app/api/` : only `auth/` and `csp-report/`; `apps/website/app/api/` : only `contact/`
**Dimension:** Ops
**Problem:** Neither app exposes a liveness or readiness endpoint. Vercel provides some blackbox uptime but nothing lets an external monitor (Better Stack, Pingdom, StatusCake) verify (a) the app is deployed, (b) the current commit, (c) upstream API is reachable. Without health endpoints an outage in the backend surfaces only via user complaints.
**Fix direction:** Add `apps/dashboard/app/api/health/route.ts` and `apps/website/app/api/health/route.ts` returning `{ ok, commit, timestamp }`. Consider a `/api/ready` on dashboard that pings `${NEXT_PUBLIC_API_BASE}/health` with a 2-second timeout.

### F-10 CSP report endpoint uses console.warn — silently black-holed in production

**Severity:** Sev-2
**Where:** `apps/dashboard/app/api/csp-report/route.ts` : 4–5
**Dimension:** Observability
**Problem:** `console.warn("[csp-report]", report.slice(0, 4000))` — the ONE thing this endpoint has to do is capture the violation somewhere queryable. In prod on Vercel, stdout goes to Runtime Logs (24h retention on Hobby, 3d on Pro) with no filter or alerting. This makes CSP violations invisible in practice, defeating the whole `strict-dynamic` deployment. Also no truncation is enforced beyond 4000 chars in memory before slicing — the entire body is read into memory first via `req.text()`, so a large POST can spike memory.
**Fix direction:** Forward the report to Sentry (`Sentry.captureMessage`) or a dedicated log sink (Axiom, Better Stack, Datadog). Add a size cap by reading a bounded body. Add a rate limit — CSP reports can DDoS this endpoint. Return 204 immediately, sink asynchronously.

### F-11 No CSRF check on `POST /api/csp-report` — usable as public log-write endpoint

**Severity:** Sev-3
**Where:** `apps/dashboard/middleware.ts` : 135–150; the CSRF matcher only covers `AUTH_PROXY_ROUTES`
**Dimension:** Ops
**Problem:** The middleware CSRF check is gated on `AUTH_PROXY_ROUTES`. `csp-report` correctly skips CSRF (browser CSP report cannot carry a header), but it also skips rate limits and body size caps. An attacker can POST arbitrary bodies to `/api/csp-report` from any origin and fill the log buffer. Impact is small (log spam) but there is no defence.
**Fix direction:** Add a size cap (e.g. reject if content-length > 8 KiB). Optionally add a `text/csp-report` content-type filter. Add a lightweight IP-based rate limit if Upstash is configured.

### F-12 Zero dashboard test coverage — Playwright baseline deferred, no unit tests, MSW-node harness not wired

**Severity:** Sev-2
**Where:** dashboard has no tests; `apps/dashboard/mocks/node.ts` exists (per AGENTS.md 5.7) but not consumed
**Dimension:** Test
**Problem:** AGENTS.md 11 acknowledges the deferred Playwright baseline (48 = 8 routes × 2 viewports × 3 themes). But: (a) there is no smoke test that just verifies `/login` compiles and renders; (b) `mocks/node.ts` (setupServer) exists but no Vitest project uses it; (c) MSW handlers themselves are untested — the auth handler encodes rate-limit + 2FA state machine + magic-code logic that could regress silently. The manual smoke walk in AGENTS.md 10 is the only verification loop.
**Fix direction:** Add Vitest project for `apps/dashboard` with jsdom, using `mocks/node.ts`. Cover: (1) `/login` renders + submits + redirects on success, (2) `/login/2fa-challenge` accepts `000000`, (3) middleware CSRF matrix, (4) sidebar permission gating for one client + one staff module. Add a headless Playwright smoke run on `/dashboard` post-login before adding visual baselines.

### F-13 Turbo pipeline missing typecheck outputs and test task

**Severity:** Sev-3
**Where:** `turbo.json` : 1–23
**Dimension:** CI
**Problem:** `typecheck` and `lint` have `dependsOn: ["^typecheck" / "^lint"]` (correct for propagation) but no `outputs`. Turbo therefore never caches successful typechecks — every CI run redoes them. `format` correctly opts out of cache. There is no `test` or `test:visual` task registered at all; the root `test:visual` script bypasses turbo entirely. `build` outputs are fine (`.next/**`, `!.next/cache/**`).
**Fix direction:** Add `outputs: []` explicitly on `typecheck` and `lint` so turbo still caches based on inputs even when there is no artifact. Register `test:visual` in `turbo.json` with proper `dependsOn: ["^build"]` and `outputs: ["playwright-report/**"]`.

### F-14 transpilePackages list drifts between apps — website missing @edss/api, @edss/auth (correct today, fragile going forward)

**Severity:** Sev-3
**Where:** `apps/website/next.config.mjs` : 27–34; `apps/dashboard/next.config.mjs` : 12–23
**Dimension:** Perf
**Problem:** Website transpiles 6 packages, dashboard transpiles 10. Correct today because website does not consume `@edss/api|auth|types|validation`. But when marketing eventually calls the contact API through `apiFetch` or reuses a validation schema, the missing `transpilePackages` entry will fail webpack resolution silently in dev and blow up prod build. No lint rule enforces the invariant. Also `optimizePackageImports` on both apps lists `framer-motion`, `lucide-react`, and Radix — good — but website adds `@radix-ui/react-accordion` and dashboard omits it (correct today, symmetric fragility).
**Fix direction:** Extract shared list into `packages/config/next/base.mjs`, per-app extends. Document that any new `@edss/*` package must be added to both. Consider a lint rule that scans `package.json` deps against `next.config.mjs.transpilePackages`.

### F-15 useApiQuery default retryDelay caps at 8s but retry count is 3 — worst-case 21s user wait

**Severity:** Sev-3
**Where:** `packages/api/src/queries.ts` : 25
**Dimension:** Perf
**Problem:** `retryDelay = Math.min(1000 * 2 ** n + jitter, 8000)`. With retry `n < 3` that's 3 retries, delays roughly {1s, 2s, 4s} = 7s of blocking on a query the user already gave up on. Combined with the wide error predicate (F-07) users on flaky networks wait a long time for `NOT_FOUND`. `QueryProvider` also sets `refetchOnWindowFocus: false` which is fine for a working app but hides the "you were away" scenario — no data freshness signal.
**Fix direction:** Reduce retry cap to 2 on default. Tighten the retry predicate per F-07. Consider `refetchOnReconnect: true` (default) is on — good.

### F-16 Root layout ordering — QueryProvider outside MSWProvider means first render mutations run against real endpoint if MSW not ready

**Severity:** Sev-3
**Where:** `apps/dashboard/app/layout.tsx` : 41–56
**Dimension:** Ops
**Problem:** Provider order is `ThemeProvider → QueryProvider → MSWProvider → AuthProvider`. With `MSWProvider` returning `null` until worker starts (F-05), the children under it never render before mocks are ready — so mutations are safe. BUT: the mounted `QueryProvider` state persists across the MSW gate; if MSW is not enabled (`NEXT_PUBLIC_USE_MOCKS=false` in prod) there is no gate at all and `AuthProvider`'s initial `refreshAccessToken()` fires immediately against the real backend — fine. Real subtle risk: `QueryClient` is created in `useState` — good — but any queries prefetched by RSC via a hypothetical hydration boundary would target the real API even when MSW is on. Currently no RSC data fetching exists so this is theoretical.
**Fix direction:** Move `MSWProvider` outside `QueryProvider` so QueryClient is created after mocks are ready. Document the constraint for future RSC data fetching.

### F-17 Marketing test coverage — 12 routes snapshotted, ~10 marketing routes NOT snapshotted

**Severity:** Sev-3
**Where:** `tests/visual/routes.ts` : 1–14
**Dimension:** Test
**Problem:** AGENTS.md claims "24 baselines" (12 × 2 viewports) which matches file count. But the marketing site has more routes than 12: `/about`, `/services` + 11 slugs, `/portfolio` + 6 slugs, `/blog` + 4 posts + 4 categories, `/careers` + 3 roles, `/contact`, `/faqs`, `/legal/privacy` + `/legal/terms`. Snapshotted: index of each collection + one slug per collection. Missing snapshots: all other slugs, category routes (`/blog/category/[slug]`), `/legal/terms`, all other services and portfolio and career slugs. A data-only change to `data/services.ts` mid-list would ship unreviewed.
**Fix direction:** Either snapshot all slugs by iterating `services`, `portfolio.cases`, `blog.posts` at test setup, OR document explicitly that only "representative" slugs are baselined and CI must fail if `data/*.ts` line count changes (poor man's diff detection).

### F-18 No image priority on Hero — but Hero uses WebGL shader, not next/image; LCP element unclear

**Severity:** Sev-3
**Where:** `apps/website/components/marketing/Hero.tsx` : 15–22, 30–66
**Dimension:** Perf
**Problem:** Hero LCP candidate is the shader canvas OR the display headline. The shader is dynamic-imported (`ssr: false`) — good, defers cost. The background is a static CSS gradient — LCP-safe. But when reduced-motion is on, the shader never mounts and LCP falls to the gradient + headline. Nothing here is a raster next/image so `priority` isn't needed. Verified other pages: `blog/[slug]` : 95 and `portfolio/[slug]` : 86 both use `priority` correctly on their hero image. `PortfolioGrid` and `JournalCard` do NOT set `priority` and are below the fold — correct. But `PortfolioGrid` line 3 imports `next/image` and the very first card CAN be above the fold on desktop (grid `md:col-span-2` for `idx % 3 === 0`) — missing `priority` on the first card.
**Fix direction:** In `PortfolioGrid.CaseCard`, accept an `isFirst` prop and set `priority` on the first `<Image>`. Verify LCP element via `web-vitals` or Vercel Speed Insights before making further changes.

### F-19 Website analytics fires PostHog on init without consent gate

**Severity:** Sev-2
**Where:** `packages/analytics/src/client.tsx` : 18–34; `apps/website/app/layout.tsx` : 36–44
**Dimension:** Ops
**Problem:** `PostHogProvider` initializes on mount when `NEXT_PUBLIC_POSTHOG_KEY` is set. Only gate is `navigator.doNotTrack === "1"` and the env-key presence. There is no cookie banner, no consent state, no wait-for-consent. The marketing site targets EU (locked to `eu.i.posthog.com`) — GDPR/ePrivacy requires opt-in for analytics cookies. Immediate `posthog.init` writes a `posthog` cookie. AGENTS.md Section 1 lists "consent banner" as deferred to Sub-project 6. That deferral is the risk — the site is presumably shipping to real users before Sub-project 6.
**Fix direction:** Either (a) reduce PostHog to strictly-necessary analytics with no cookies (`persistence: "memory"`) until consent, or (b) ship a consent banner before public launch. `PageviewTracker` should also gate on consent state.

### F-20 Dashboard middleware writes `theme` cookie via next-themes JS — pre-hydration script assumes it exists

**Severity:** Sev-3
**Where:** `apps/dashboard/app/layout.tsx` : 28 (inline script) vs. `next-themes` (client-only)
**Dimension:** Perf
**Problem:** The pre-hydration inline script reads `document.cookie` for `theme=`. On the very first request from a new user, this cookie does not exist — the fallback is `"system"` which is correct. But `next-themes` writes the cookie inside a `useEffect` after mount, meaning the second hard-refresh will be fine but any race between mount and reload could leave the cookie unset. Under CSP `strict-dynamic` the inline script must carry the `nonce` — it does (`headers().get("x-nonce")`). If the middleware fails to inject nonce (e.g. exception before line 103) the head script is blocked and FOUC returns. Also, `suppressHydrationWarning` is on `<html>` but the script mutates `data-theme` — hydration mismatch is suppressed but the theme class in Tailwind depends on `data-theme` variant selector; if next-themes decides differently than the cookie there is a paint flash after hydration.
**Fix direction:** Read the cookie server-side in `layout.tsx` via `cookies()` and set `<html data-theme={theme}>` directly, so no client script is needed for the initial render. Keep the inline script only for the `system` → media-query case if you want zero-JS theme detection.

### F-21 Fonts use `display: swap` — good — but no `preload` guarantee for the display headline font

**Severity:** Sev-4
**Where:** `packages/design-system/src/fonts.ts` : 3–22
**Dimension:** Perf
**Problem:** `next/font/google` handles preload by default when the font is used above the fold, but `Fraunces` is loaded with `axes: ["opsz", "SOFT"]` — variable font with two axes. Bundle is larger than a plain weight. No `preload: false` is set (so preload is on by default) but no explicit route-level preload override either. `display: swap` means FOIT is avoided but the Cinderella swap-in is visible on slow networks. This is standard behavior — the "risk" is the font file being large enough to matter for LCP.
**Fix direction:** Consider `axes: ["opsz"]` only if `SOFT` is not visually critical. Run `analyze` and inspect font sizes. Verify with Chrome DevTools Coverage.

### F-22 Env `NEXT_PUBLIC_API_BASE` read at module load time in `_proxy.ts` — SSR-safe but changes require rebuild

**Severity:** Sev-4
**Where:** `apps/dashboard/app/api/auth/_proxy.ts` : 3
**Dimension:** Ops
**Problem:** `const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ...` is a module-scope constant, so it is baked in at build time (Next inlines `NEXT_PUBLIC_*` at build). Changing the backend URL requires a rebuild + redeploy — but that is true of all `NEXT_PUBLIC_*` vars. Not an SSR failure but a footgun documented nowhere. Same for `middleware.ts` :31 (`API_BASE_ORIGIN`) and `AuthProvider.tsx` :10.
**Fix direction:** Document in `.env.example` that changing any `NEXT_PUBLIC_*` requires a full rebuild. If you want runtime-swappable backend URLs, move to server-only `API_BASE` (drop `NEXT_PUBLIC_`) — but only on the server side; the client-side data fetching cannot be affected since it goes direct to the backend.

### F-23 Idle timer subscribes on every mount; multi-shell layouts double-mount SessionIdleWatcher

**Severity:** Sev-4
**Where:** `apps/dashboard/app/client/layout.tsx` : 18; `apps/dashboard/app/staff/layout.tsx` : ~same shape; `packages/auth/src/session.ts` : 17–58
**Dimension:** Perf
**Problem:** Both client and staff layouts render `<SessionIdleWatcher />`. Navigating between `/client/*` and `/staff/*` (dual-role users) unmounts and remounts the watcher, clearing timers and re-registering activity listeners. Not incorrect but wasteful. Also `useSessionIdleTimer(onExpire, onWarn)` accepts fresh function identities each render — the `useEffect` deps `[authed, onExpire, onWarn]` means the effect re-runs when the caller re-renders unless the callback is memoized. `SessionIdleWatcher` passes inline arrow functions — the effect re-registers listeners on every render of `SessionIdleWatcher`.
**Fix direction:** Wrap `onExpire` and `onWarn` in `useCallback`. Or hoist `SessionIdleWatcher` to the root layout above the shell (it only needs `status === "authenticated"`).

### F-24 Preservation snapshots baseline is `-win32` — non-portable between OSes

**Severity:** Sev-4
**Where:** `tests/visual/snapshot.spec.ts-snapshots/*-win32.png`
**Dimension:** Test
**Problem:** All baselines have `-win32` suffix — captured on Windows. Playwright's snapshot name suffix uses `process.platform`. Running the suite in GitHub Actions Ubuntu will look for `-linux.png` and fail every test with "snapshot not found", regenerating baselines. Common Playwright + monorepo gotcha.
**Fix direction:** Either commit both `-win32` and `-linux` baselines (regenerate in CI once), OR pin the snapshot suffix via `expect.configure({ toHaveScreenshot: { pathTemplate: … } })`. Recommended: run baselines only in CI (Linux) and gitignore local platform variants.

### F-25 Duplicate framer-motion, react-hook-form, zod dependency declarations across apps and packages

**Severity:** Sev-4
**Where:** `apps/dashboard/package.json` : 44–54; `apps/website/package.json` : 35–49; `packages/ui/package.json` : 61; `packages/validation/package.json` : 26
**Dimension:** Perf
**Problem:** `framer-motion@^11.15.0` declared in both apps. `react-hook-form@^7.54.2` declared in both. `zod@^3.24.1` declared in both apps AND in `@edss/validation`. `cmdk@^1.0.4` declared in dashboard AND in `@edss/ui`. Under npm workspaces these usually hoist to a single copy at the root `node_modules`, but a caret range mismatch on the next minor release can produce two copies in the bundle. Not currently a duplicate — verified with `packages/validation/package.json:26` — but the shape is fragile.
**Fix direction:** Pin exact versions in all workspace `package.json` files (drop caret) or centralize via `packageManager` overrides. Enable `npm ls framer-motion` in CI to assert single instance.

---

## Notes / non-findings

- **Hydration under CSP strict-dynamic:** the pre-hydration inline script (`apps/dashboard/app/layout.tsx:39`) carries `nonce={nonce}` and CSP includes `'nonce-${NONCE}' 'strict-dynamic'` — verified correct. See F-20 for the cookie-availability race.
- **Refresh mutex correctness under happy path:** confirmed — `refreshPromise` is module-scoped, single-flight semantics work. See F-04 for failure-mode gaps.
- **Middleware CSRF matcher:** correct scope (only `AUTH_PROXY_ROUTES`). CSP report bypass is intentional (browser can't send header).
- **Env at module load, SSR:** none of the `process.env` reads would fail SSR — they all fall back to defaults. See F-22 for the config-update ergonomics.
- **Marketing preservation rule:** untouched. Findings surfaced, no code modified.
