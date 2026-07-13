# Raw Security Review — Dashboard + Website + shared packages

- **Reviewer:** Security + IAM
- **Repo baseline commit:** `7c1cdf85c7f035bd253c3face4ce817779b551ba` (branch `audit-remediation`)
- **Date:** 2026-07-12
- **Scope:** `apps/dashboard`, `apps/website`, `packages/*` (auth, api, validation, analytics, ui, hooks, types, utils, design-system, config, icons)
- **Total findings:** 24
  - Sev-1: 3
  - Sev-2: 9
  - Sev-3: 8
  - Sev-4: 4

Findings are ordered roughly by severity. Marketing-site findings (`apps/website/**`) are surfaced but MUST NOT be remediated by the reviewer per preservation rule.

---

### F-01 Next 15.1.3 is vulnerable to CVE-2025-29927 middleware bypass

**Severity:** Sev-1
**Where:** `apps/dashboard/package.json:48`, `apps/website/package.json:39`
**Problem:** Both apps pin `next@15.1.3`. CVE-2025-29927 (published March 2025) allows an attacker to bypass Next middleware entirely by sending an `x-middleware-subrequest` header; patched in 15.2.3 and 14.2.25. In this repo, `apps/dashboard/middleware.ts` is the _only_ enforcement of the authentication redirect, the CSRF double-submit check, the Upstash rate limits, and the CSP nonce injection. A one-line header on any request to `/api/auth/login` (or any authed page) skips all four defenses at once — an attacker can brute-force credentials without rate limits, submit login/refresh without CSRF, and load pages that assume `rt` presence has been middleware-verified.
**Fix direction:** Bump both apps to the latest Next 15.x patch line (>= 15.2.3, ideally the current LTS 15.x) and re-run `npm install`. Add a defense-in-depth check that rejects requests carrying `x-middleware-subrequest` at the edge (Vercel WAF rule or explicit reject in `middleware.ts`) so future variants don't re-open the hole.

### F-02 Post-login open redirect via `?next=` (protocol-relative URL)

**Severity:** Sev-1
**Where:** `apps/dashboard/components/auth/LoginForm.tsx:41-42`
**Problem:** After successful login the code does `const next = search.get("next") ?? "/dashboard"; router.push(next);` with zero validation of the value. `router.push("//attacker.example/phish")` performs a full navigation to the attacker origin because protocol-relative URLs are resolved against the current scheme. An attacker can craft `https://dashboard.edss/login?next=//attacker.example/x` and send it via email/Slack — victims see the real dashboard login, submit credentials, then land on the phishing site with an authenticated referrer. Same class of bug lives on `/dashboard/page.tsx` redirect target because that reads `last_role_group` from a JS-readable cookie without integrity checks (subordinate risk, F-08).
**Fix direction:** Constrain `next` to same-origin relative paths only. Reject anything that starts with `//`, contains `://`, or does not start with a single `/`. Simplest: `const next = search.get("next"); const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";`. Apply the same validation to `middleware.ts:161` (currently safe because `pathname` is server-derived, but codify the invariant).

### F-03 MSW mock backend ships as production dependency + service worker

**Severity:** Sev-1
**Where:** `apps/dashboard/package.json:47` (msw as `dependencies`), `apps/dashboard/public/mockServiceWorker.js`, `apps/dashboard/components/providers/MSWProvider.tsx:4`
**Problem:** MSW is listed under `dependencies` (not `devDependencies`) and `public/mockServiceWorker.js` is committed and served at prod URLs. Activation is gated on a single public env var `NEXT_PUBLIC_USE_MOCKS === "true"`. If Vercel env config accidentally sets that var in production (a single-character typo away from the truthy path), every `/api/*` call is intercepted client-side and MSW's mock handlers succeed with `admin@example.com` / `password` / `000000` 2FA — full auth bypass with hardcoded admin. Even without accidental enable, having the SW file at a discoverable URL discloses the mock surface to any reconnaissance scan.
**Fix direction:** Move MSW to `devDependencies`, remove `public/mockServiceWorker.js` from the committed prod artifact (generate on demand in dev only, or gate its emission via a build script that fails when `NODE_ENV=production`). In `MSWProvider`, add a `process.env.NODE_ENV !== "production"` invariant so the code path throws (not silently continues) in prod builds. Add a CI check that grep-rejects `mockServiceWorker.js` in the built `.next/static` output.

### F-04 Client-side-only permission gates; server components fetch nothing but role-shell URL segments are unprotected

**Severity:** Sev-2
**Where:** `packages/auth/src/guard.tsx`, `apps/dashboard/app/client/layout.tsx`, `apps/dashboard/app/staff/layout.tsx`, all 19 `app/{client,staff}/**/page.tsx`
**Problem:** `PermissionGate` and `withPermission` are defined but never used anywhere in the app (grep confirms zero call sites in `apps/dashboard/app/**` — only the guard file itself). Middleware only checks the presence of the `rt` cookie; it does not check role or permission. A user whose backend session has `client`-only permissions can freely navigate to `/staff/audit-logs`, `/staff/users`, `/staff/reports`, etc. Server components render regardless. Right now the backend enforces on data fetches, but any staff-only page that later adds SSR data fetch (or worse, exposes seed/skeleton content that hints at protected data) leaks by default. This inverts the safe-by-default principle.
**Fix direction:** Wrap every `client/**/page.tsx` with `withPermission(Page, "<client-perm>")` and every `staff/**/page.tsx` with the equivalent staff permission — using the permission strings already documented in AGENTS.md §8. Additionally, gate the `activeRoleGroup !== "staff"` transition inside `staff/layout.tsx` behind `useAnyPermission(staffPermissions)` and render 403 otherwise, so entering the staff shell without staff permissions redirects to the client shell instead of silently rendering.

### F-05 HSTS `preload` directive without confirmed preload-list inclusion

**Severity:** Sev-2
**Where:** `apps/dashboard/middleware.ts:51`, `apps/website/next.config.mjs:17`
**Problem:** Both apps send `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`. `preload` implies a public commitment to being HTTPS-only across all subdomains for two years and is a prerequisite for HSTS preload list submission — but it also means once the browser ever sees this header from any subdomain, that browser will refuse to make plaintext requests to _any_ subdomain, forever (until max-age expires). If any subdomain (e.g., `staging.elitedigital.studio`, a webhook receiver, a legacy service) is HTTP-only, users hitting that subdomain from a browser that saw the header become locked out. Once emitted, this is effectively irreversible.
**Fix direction:** Ship `max-age=63072000; includeSubDomains` first (no `preload`), verify every subdomain is HTTPS-only, submit to hstspreload.org, wait for confirmation, then add `preload`. Alternatively, if the domain is already on the preload list, document that in a comment referencing the preload-list PR/commit.

### F-06 CSRF cookie is never rotated on privilege transitions

**Severity:** Sev-2
**Where:** `apps/dashboard/app/api/auth/csrf-token/route.ts`, `apps/dashboard/app/api/auth/login/route.ts`, `apps/dashboard/app/api/auth/refresh/route.ts`
**Problem:** The `csrf` cookie is minted once via `GET /api/auth/csrf-token`, is `Max-Age=86400`, and is not rotated by the login proxy, the 2FA verify proxy, the refresh proxy, or on session revocation. A stale CSRF token from a pre-login session survives login. In combination with any browser-shared attack surface (e.g., XSS elsewhere on the origin, or a session-fixation-adjacent bug), this widens the CSRF replay window. The double-submit check is only meaningful if both sides rotate together.
**Fix direction:** Rotate `csrf` inside `login`, `2fa/verify`, `refresh`, and `logout` route handlers by calling the same `generateCsrfToken()` helper and setting a fresh cookie on the response. Consider binding CSRF to the session by prefixing the token with a session-id-derived HMAC and validating it in the middleware.

### F-07 `useSessionIdleTimer` closes over stale `onExpire` / `onWarn` refs

**Severity:** Sev-2
**Where:** `packages/auth/src/session.ts:17-58`
**Problem:** The `useEffect` includes `onExpire` and `onWarn` in its dependency array, so it rebinds all activity listeners and the interval every time either callback identity changes. If a consumer forgets `useCallback`, listeners churn — but more concerning, every callback swap resets `lastActivity.current = Date.now()` because the ref is initialised inside a re-created effect closure (`lastActivity` survives, but `warnedRef` initialisation logic runs), and the 15s tick timer resets. An attacker who can spam a re-render of the parent (e.g., through a subscribed store field) can defer the idle timeout indefinitely. Multi-tab `BroadcastChannel` is fine, but the `MessageEvent.data?.type` check does not verify the origin — same-origin only in browsers, so fine.
**Fix direction:** Move `onExpire` / `onWarn` into `useRef`s updated in a separate no-dep effect, and depend only on `authed` in the main effect. Or wrap consumers with a documented `useCallback` requirement. Add a test that verifies the timer keeps ticking through 30 minutes across re-renders.

### F-08 `last_role_group` cookie is trusted for redirect target with no integrity check

**Severity:** Sev-2
**Where:** `apps/dashboard/app/dashboard/page.tsx:10-22`, `apps/dashboard/app/client/layout.tsx:13`, `apps/dashboard/app/staff/layout.tsx:13`
**Problem:** `/dashboard` reads `last_role_group` from a JS-readable cookie and redirects to `/${role}/overview`. The cookie is `HttpOnly: false` and set by client-side `document.cookie = ...`. Any XSS on the origin, browser extension, or dev-tool tinkering can set `last_role_group=staff` for a client-only user and force a redirect into the staff shell. Combined with F-04 (no per-page permission gate), the user then lands on staff pages. Even without XSS, cookie mismatch after backend permission changes is a poor UX signal.
**Fix direction:** Derive the redirect target from the in-memory auth store (`primaryRole` + `hasBothRoles`) authoritatively, and only use `last_role_group` as a UX preference when the user has both roles. Never trust it to widen access. In the shell layouts, validate `activeRoleGroup` against `permissions`/`primaryRole` before applying it.

### F-09 `/api/auth/reset-password` has no edge rate limit

**Severity:** Sev-2
**Where:** `apps/dashboard/middleware.ts:108-116`
**Problem:** The middleware rate-limit map covers `login`, `refresh`, `2fa/verify`, and `forgot-password` but does not cover `reset-password`. Reset tokens are the highest-value guessable credential in the whole system: if the backend uses short tokens or long-lived tokens, an attacker can enumerate them at line rate.
**Fix direction:** Add `rl:reset` sliding-window (e.g., 10/hour per IP+UA, plus a per-email throttle if email is echoed in the request). Also add rate limits on `/api/auth/logout` (currently unlimited — abused for session-invalidation DoS) and `/api/auth/csrf-token` (mint-spam attack).

### F-10 Password-reset endpoint returns backend body unchanged, may leak account existence

**Severity:** Sev-2
**Where:** `apps/dashboard/app/api/auth/forgot-password/route.ts:9`, `apps/dashboard/app/api/auth/reset-password/route.ts:9`
**Problem:** Both proxies do `return forwardToBackend(...)` returning whatever the backend returns verbatim. If the backend distinguishes between "email exists" and "email not found" (via status code, body text, or timing), that distinction is exposed to the browser. Modern practice is a constant-response, constant-time behavior to prevent user enumeration.
**Fix direction:** Have the proxy normalise the response — always return `{ ok: true }` with 200 regardless of upstream status (except 5xx / network errors, which should fall through). If the backend already normalises, add a defensive assertion. Same treatment for `login` on the mocked "no account" path (currently returns `INVALID_CREDENTIALS` for both wrong password and unknown email — that's already safe, keep it that way).

### F-11 `apps/website/api/contact` in-memory rate limiter is per-instance and unbounded

**Severity:** Sev-2 (surfaced only; do not remediate)
**Where:** `apps/website/app/api/contact/route.ts:10-24`
**Problem:** The `buckets` Map lives in module scope in a Node.js runtime function. On Vercel serverless the map is per-instance — attackers who spread requests across cold-start instances effectively bypass the limit. The map is also never GC'd for expired entries, so long-lived instances accumulate one entry per IP forever (memory-DoS). The keying uses the first hop of `x-forwarded-for` with no proxy-hop verification (spoofable if any Vercel-preview environment doesn't strip forwarded chains). Honeypot is present but weak; no captcha.
**Fix direction:** Move to Upstash Redis (already used by dashboard) or `@vercel/kv`. Periodically prune expired entries. Add a lightweight CAPTCHA (Turnstile or hCaptcha) once rate-limit is exceeded. Trust only the last hop of `x-forwarded-for` under a documented proxy contract.

### F-12 Marketing site (`apps/website`) has no CSP header

**Severity:** Sev-2 (surfaced only; do not remediate)
**Where:** `apps/website/next.config.mjs:7-19`
**Problem:** The website's `headers()` array sets HSTS, X-Frame, Referrer-Policy, Permissions-Policy, X-Content-Type-Options — but NO `Content-Security-Policy`. The site ships MDX-rendered content, JSON-LD via `dangerouslySetInnerHTML` (`apps/website/lib/seo/jsonld.tsx:94`), and framer-motion inline styles. An XSS in an MDX post or a compromised author account has no CSP fallback.
**Fix direction:** Add a nonce-based CSP via middleware (mirroring `apps/dashboard/middleware.ts`), or accept a report-only CSP first to measure violations without breaking preservation snapshots. Include `'self' https://eu.i.posthog.com images.unsplash.com cdn.elitedigital.studio` in the relevant directives.

### F-13 CSP `img-src` allowlists `images.unsplash.com` and `cdn.elitedigital.studio` in dashboard where no image loads from them

**Severity:** Sev-3
**Where:** `apps/dashboard/middleware.ts:37`
**Problem:** The dashboard CSP includes `https://images.unsplash.com https://cdn.elitedigital.studio` in `img-src`, but the dashboard itself does not consume these origins (they belong to the marketing site's `next.config.mjs` `images.remotePatterns`). Unnecessary allowlist entries widen the exfil surface for markdown / user-content XSS attacks (an attacker who can inject `<img src=https://cdn.elitedigital.studio/x?leak=...>` — if that CDN is attacker-controllable or logs referrers — bleeds session context).
**Fix direction:** Remove `images.unsplash.com` and `cdn.elitedigital.studio` from dashboard CSP `img-src`. Keep them in website CSP only.

### F-14 CSP `script-src` includes `https://eu.i.posthog.com` while PostHog SDK is bundled through `posthog-js` (self-origin)

**Severity:** Sev-3
**Where:** `apps/dashboard/middleware.ts:35`
**Problem:** `posthog-js` is imported from npm and bundled by Next; scripts execute from the app origin, not from `eu.i.posthog.com`. The `eu.i.posthog.com` origin only needs `connect-src` (ingest) and possibly `img-src` (feature-flag pixel). Having it under `script-src` alongside `'strict-dynamic'` is harmless in modern browsers (strict-dynamic ignores host allowlists) but is misleading and a red flag for reviewers, hiding the real trust surface.
**Fix direction:** Remove `https://eu.i.posthog.com` from `script-src`. Keep it in `connect-src` and `img-src` as needed. Document the rationale in a comment.

### F-15 CSRF header comparison is short-circuit (theoretical timing side-channel)

**Severity:** Sev-3
**Where:** `apps/dashboard/middleware.ts:142`
**Problem:** `header !== cookie` uses JavaScript string inequality which returns as soon as a differing byte is found. In a same-origin context the attacker already has the CSRF cookie (SameSite=Lax + JS-readable), so this is not a practical bypass — but the pattern is a smell that graders / red-team reviews will flag. If future refactors change the check to something SameSite doesn't already prevent, timing leaks matter.
**Fix direction:** Use a constant-time compare — `crypto.timingSafeEqual(Buffer.from(header), Buffer.from(cookie))` inside a try/catch guarding length mismatch. Not strictly necessary today; do it for hygiene and future-proofing.

### F-16 `logout` client fires-and-forgets even on network failure without user feedback

**Severity:** Sev-3
**Where:** `packages/auth/src/client.ts:119-129`
**Problem:** `logout()` catches all fetch errors silently (via `finally` reset). If the backend `/auth/logout` fails, the client still resets the store and clears memory but the `rt` cookie may still be valid server-side (backend never got the revoke). A stolen `rt` cookie (harder because HttpOnly, but not impossible via a compromised proxy or a browser extension) remains valid on the server.
**Fix direction:** Retry once on network failure; if still failing, still reset locally but surface a toast so the user knows the server-side session may still be live. Backend must also treat idle sessions as revoked after the same TTL as `rt` cookie (30d) — verify server side.

### F-17 `refreshAccessToken()` sets `status: "refreshing"` without CSRF cookie preflight

**Severity:** Sev-3
**Where:** `packages/auth/src/client.ts:97-117`
**Problem:** Unlike `login()` / `requestPasswordReset()`, `refreshAccessToken()` does not call `ensureCsrfCookie()` before firing. If the `csrf` cookie has expired (`Max-Age=86400`) but the `rt` cookie is still valid (`Max-Age=30d`), the refresh POST arrives without an `X-CSRF-Token` header, middleware returns 403 `CSRF_MISMATCH`, and the store is reset — the user is silently logged out mid-session despite a valid refresh token. This will bite any user who leaves a tab open longer than 24h.
**Fix direction:** Call `await ensureCsrfCookie()` before every mutating request in `client.ts`, including `refreshAccessToken` and `logout`. Alternatively, rotate the `csrf` cookie inside the refresh route handler so the two lifetimes stay aligned.

### F-18 Cross-tab silent refresh scheduler in `AuthProvider` calls refresh on every mounted dashboard tab independently

**Severity:** Sev-3
**Where:** `apps/dashboard/components/providers/AuthProvider.tsx:22-38`
**Problem:** The `setTimeout`-based silent refresh is per-tab. Open five tabs and the browser fires five near-simultaneous `POST /api/auth/refresh` requests every 15 minutes. The middleware's refresh rate limit is 60/min/IP so it doesn't 429, but the backend token-rotation logic must handle concurrent refreshes idempotently or one tab loses its `rt` to another tab's rotation. `ensureRefreshed` mutex only helps _within a single tab_.
**Fix direction:** Elect a leader tab via `BroadcastChannel` or `navigator.locks` to be the sole refresher and broadcast the resulting token to peers. Or accept concurrent refresh and require backend to return the same tokens for concurrent requests within a small window.

### F-19 `/api/csp-report` accepts unbounded payloads and only logs to server console

**Severity:** Sev-3
**Where:** `apps/dashboard/app/api/csp-report/route.ts:4-6`
**Problem:** The endpoint calls `await req.text()` with no `Content-Length` limit and no rate limit. Console-logging is a DoS amplification vector (attackers spam POSTs to blow up log storage costs and pollute observability). The report body is not parsed or validated — future analysis is grep-only.
**Fix direction:** Reject any body larger than 8 KB (`req.headers.get("content-length")` gate). Rate-limit to a few reports per minute per IP. Parse the JSON with Zod; drop malformed. Ship to Sentry/observability with structured fields, not console.

### F-20 `apiFetch` retries on 429 with a hard-coded 5s ceiling — attacker-controlled `Retry-After` can stall

**Severity:** Sev-3
**Where:** `packages/api/src/client.ts:83-92`
**Problem:** The code accepts `Retry-After: 4` and sleeps 4s before retrying. If a compromised or man-in-the-middle upstream returns `Retry-After: 5.0` and the UI is in a hot path (dashboard bootstrap), a whole app can hang for 5s per request. `retryAfter <= 5` clamps the upper bound but does not floor negatives or reject NaN — `Number("abc")` is `NaN`, then `NaN <= 5` is false, so it falls through to the throw path. That's fine, but `Number("-1000")` is `-1000`, `-1000 <= 5` is true, and it sleeps `-1000 * 1000` ms which becomes 0 — so retries burst. Minor.
**Fix direction:** Add `retryAfter > 0 && retryAfter <= 5` (currently `retryAfter > 0 && retryAfter <= 5` — already correct!) Actually verify: current code is `if (!opts.isRetry && retryAfter > 0 && retryAfter <= 5)`. That's fine. Downgrade this finding: the concern is only that `Retry-After` from a data endpoint is not bounded across many retries in a session; consider a per-session retry budget.

### F-21 Zod `loginSchema.password` requires only `min(1)` — sends 0-plus-whitespace passwords to backend

**Severity:** Sev-4
**Where:** `packages/validation/src/auth.ts:5`
**Problem:** Client-side validation permits `" "` as a password and forwards it to backend rate-limit + auth. Not a vulnerability — backend enforces — but it wastes rate-limit budget and produces user-hostile 401 flow.
**Fix direction:** `z.string().trim().min(8)` client-side. Backend still owns real enforcement.

### F-22 `useAuth()` returns whole store, causing every subscribing component to re-render on any store change

**Severity:** Sev-4
**Where:** `packages/auth/src/hooks.ts:5-7`
**Problem:** `useAuth = () => useAuthStore()` — no selector. Every render of every component that touches `useAuth()` fires on unrelated store updates (e.g., `activeRoleGroup` change re-renders a component that only reads `user.email`). Performance concern; also a subtle correctness issue if a memo boundary was assumed. Noted in AGENTS.md §11 already.
**Fix direction:** Deprecate `useAuth`; make consumers use narrow selectors.

### F-23 `.env.example` documents `NEXT_PUBLIC_USE_MOCKS=true` as the default

**Severity:** Sev-4
**Where:** `.env.example:13`
**Problem:** The default in the example file is `true`. A developer scaffolding a new environment who copies `.env.example` verbatim into a Vercel project and forgets to flip the flag ships with mocks enabled — see F-03 for the impact.
**Fix direction:** Change the example default to `false` and add a `# Development only — never set to true in production` comment. Optionally, throw at boot if `NODE_ENV=production && NEXT_PUBLIC_USE_MOCKS=true`.

### F-24 Pre-hydration inline script uses `dangerouslySetInnerHTML` — safe today, brittle to future changes

**Severity:** Sev-4
**Where:** `apps/dashboard/app/layout.tsx:28-39`
**Problem:** The theme-picker inline script is nonce-signed and reads only the `theme` cookie (constrained by a regex to `[^;]+` and passed through `decodeURIComponent`). Today the content is fully static — no user data interpolation — so `dangerouslySetInnerHTML` is safe. But there is no lint/CI check preventing a future refactor from interpolating a variable into the script string, at which point CSP nonce hardening does not help (nonce covers the outer script tag, not injections inside it).
**Fix direction:** Add an ESLint rule or CI grep that flags any template-string interpolation inside `PRE_HYDRATION_SCRIPT`. Or move the theme picker into a small compiled TS file that Next serves as a nonce'd module.

---

## Runtime confirmations needed

Items below require a live browser, prod-shaped env vars, or an actual Vercel deploy to confirm.

1. **Cookie flags in a real browser** — DevTools Application panel to confirm `rt` shows HttpOnly + Secure + SameSite=Lax + Path=/api/auth on staging over HTTPS. In dev over HTTP the `secure: true` flag causes the cookie to silently drop; verify this doesn't hide a bug.
2. **CSP `report-uri /api/csp-report` reachability** — confirm violations actually arrive at the endpoint on a real deploy; the endpoint is same-origin but `report-uri` is being deprecated in favour of `report-to` which is not configured.
3. **Middleware bypass regression test** — send a request with `x-middleware-subrequest: 1` header (or the multi-value variants published in the CVE) against a running dev server to confirm the current Next 15.1.3 vulnerability is exploitable in this specific configuration, and again after the Next bump in F-01.
4. **HSTS preload eligibility** — check hstspreload.org for the exact eTLD+1 and whether any subdomain currently serves HTTP. Do not merge F-05 fix without this.
5. **PostHog CSP interaction** — confirm PostHog session recording / autocapture / feature-flag polling all still work under the current `connect-src`, and that no third scripts (LinkedIn Insight, GA, etc.) sneak in via marketing.
6. **Upstash rate limiter under load** — the sliding-window limiter is theoretically fine, but confirm 5 login attempts from the same IP+UA get 429 and that a 6th attempt from a _different_ UA on the same IP is NOT blocked (proving keying works correctly).
7. **Refresh race under 5 concurrent tabs** — F-18: open 5 dashboard tabs, wait for the 15-minute silent refresh, watch DevTools Network across tabs to see if 5 refreshes fire concurrently and whether any tab ends up with a stale `rt` value.
8. **CSP violations in real usage** — enable Reporting API and let 24h of real traffic accumulate before enforcing tighter rules like removing `style-src 'unsafe-inline'`.
