# External Frontend v1 — Remediation Plan

**Status:** Phase C closeout. Ready for Phase D execution.

Baseline: `7c1cdf8` on `main`. Working branch: `frontend-audit-remediation`. Compiled from `risk-register.md` (97 dedup findings).

## Scope commitment (from client-preferences.md)

- Wave A = Sev-1 + code-owned Sev-2 remediation. Sev-3 / Sev-4 documented backlog.
- Marketing site (`apps/website`) findings surfaced but code untouched — every marketing change requires per-finding client approval.
- Compliance foundation (DSAR, erasure, consent registry, breach SOP, DPA register) is a Wave-3 backend concern already logged in the backend engagement. Frontend consent-banner is the only compliance-foundation UI that lands here.
- 44 unit tests (backend) — frontend gets its own coverage floor via Vitest + MSW-node, incremental.

## Batch plan

Ordered by dependency + risk. Each batch = one commit on `frontend-audit-remediation`. Marketing branches only touched with explicit approval.

### Batch 1 — Existential CVE + auth bypass surface

Ship these first; every other fix rides on middleware integrity.

- **S-01** Bump Next to `>=15.2.3` (both apps) + defense-in-depth: reject requests carrying `x-middleware-subrequest` at edge.
- **S-02** Validate `?next=` — same-origin relative paths only. `LoginForm.tsx:41`.
- **S-03 = P-05 = S-23** Move MSW to `devDependencies`; remove committed `mockServiceWorker.js` from prod build; `MSWProvider` throws in prod; `.env.example` default flip to `false`; CI grep-guard on `.next/static`.

### Batch 2 — Server-side auth guarantees

- **S-04** Wrap every `app/{client,staff}/**/page.tsx` with `withPermission`. Gate `staff/layout.tsx` on `useAnyPermission(staffPermissions)`.
- **S-08** Never trust `last_role_group` to widen access. Derive redirect from in-memory `primaryRole` + `hasBothRoles`.
- **S-06** Rotate `csrf` cookie inside `login` / `2fa/verify` / `refresh` / `logout` handlers.
- **S-17** `refreshAccessToken` + `logout` client fns preflight `ensureCsrfCookie()`.

### Batch 3 — Edge hardening + rate limits

- **S-09** Add `rl:reset` (10/hour/IP+UA), `rl:logout` (30/min), `rl:csrf` (60/min). Extend `AUTH_PROXY_ROUTES` map.
- **S-05** Drop `preload` from HSTS pending hstspreload.org confirmation; document decision in ADR.
- **S-10** Normalise `forgot-password` + `reset-password` proxy responses to `{ ok: true }` regardless of upstream status.
- **P-06** Exclude `/api/csp-report` from CSP header path; frozen `SECURITY_HEADERS` template + template-string CSP.

### Batch 4 — CSP report + observability surface

- **S-19 + P-10 + P-11** csp-report endpoint gains 8 KB size cap, rate limit, structured logging (route through Sentry via feature-flag once wired).
- **P-08 + U-12** Install `@sentry/nextjs` with placeholder DSN gated on env. Wire `error.tsx` to `captureEvent` + digest surface.
- **P-09** Add `/api/health` on both apps returning `{ ok, commit, timestamp }`.

### Batch 5 — Consent + privacy (compliance foundation, frontend-side)

- **C-01 + C-02 + C-13 + P-19** Add `@edss/ui/consent-banner`; wrap `PostHogProvider` init behind consent state; PostHog persistence downgrade to `"memory"` until consent granted.
- **C-03** Rewrite `apps/website/app/(marketing)/legal/privacy/page.tsx` third-party + cookie sections. **Requires marketing preservation approval** (surface finding; do not touch code without client sign-off).
- **C-04** Add Grievance Officer contact block to privacy page + `config/legal.ts`. **Marketing preservation approval required.**
- **C-06 + C-18** Cookie inventory table on privacy page. **Marketing preservation approval required.**
- **C-08** `phone` optional on contact form; add purpose statement + consent checkbox. **Marketing preservation approval required.**
- **C-09** Contact-form logging gated on `NODE_ENV !== "production"`; redact PII in error branches. **Marketing preservation approval required.**

### Batch 6 — UX / A11y launch-blockers

- **U-01** UserMenu items derive prefix from `activeRoleGroup`. Conditional rendering per role.
- **U-02** `/dashboard` reads `status`; unauthenticated → `router.replace("/login")`; loader inside shell chrome.
- **U-16** Skip-link on dashboard root layout; `<main id="main" tabIndex={-1}>`.
- **U-19** UserMenu trigger gains `aria-label={\`Account menu for ${user?.name ?? "your account"}\`}`.
- **U-23** Drop `--color-muted` to `oklch(0.5 …)`; verify every consumer.
- **U-27** Sidebar `hidden md:block` + mobile Sheet trigger in Topbar left.

### Batch 7 — Refresh / session correctness

- **P-03** Silent-refresh scheduler: `visibilitychange` re-computes; `performance.now()` for elapsed; bounds `[30s, 55min]`; cross-tab `BroadcastChannel("edss-refresh")` leader election.
- **P-04** Refresh mutex: failure cooldown 5s; `safeParse` on refresh response; separate `SESSION_EXPIRED` vs "parse-failed" handling.
- **S-07** `useSessionIdleTimer` moves `onExpire` / `onWarn` into refs updated in a separate effect. Add regression test.
- **P-23** `SessionIdleWatcher` hoisted to root layout above shells; callbacks wrapped in `useCallback`.

### Batch 8 — CI baseline + test harness

- **P-01** `.github/workflows/ci.yml` — `typecheck`, `lint`, `build`, `test:visual` jobs; `~/.npm` + `.turbo` cache; Playwright chromium install step.
- **P-02** Vitest at repo root with per-workspace projects. Initial tests: refresh mutex under concurrent 401s; 429 Retry-After budget; middleware CSRF matrix; middleware redirect matrix; `useSessionIdleTimer` BroadcastChannel; `apiFetch` response validation.
- **P-12** MSW-node harness wired via `mocks/node.ts`. Smoke tests: `/login` renders + submits; `/login/2fa-challenge` accepts 000000; sidebar permission gating; UserMenu prefix.
- **P-13** turbo `outputs: []` explicit on `typecheck` + `lint`. Register `test` + `test:visual` tasks.

### Batch 9 — Empty states + module copy + form UX

- **U-07 + U-33** Rewrite every `client/**/page.tsx` and `staff/**/page.tsx` empty-state copy — one calm, module-specific sentence + subtitle. Drop "sub-project 4" references.
- **U-08** `EmptyStatePlaceholder` gains `action?: ReactNode` + `phase?: "coming-soon" | "empty"` props. Default "Back to overview" CTA.
- **U-10** Notifications drawer empty state rewrite (calm register, tab-specific).
- **U-32** Form errors gain `id` + inputs gain `aria-describedby`. Login, forgot, reset, 2FA forms.
- **U-20** `SheetTitle` export; `NotificationsDrawer` wraps title in `<VisuallyHidden>` or renders it.
- **U-04** 2FA challenge branches on `ApiError.code` (INVALID_TOTP retry; CHALLENGE_EXPIRED redirect to login). "Start over" link.
- **U-03** 429 handling on `LoginForm`: parse `err.details.retry_after`, disable submit with countdown in `role="status"` region.
- **U-11** Add `@edss/ui/skeleton` primitive; `<PageSkeleton>` for route-level Suspense.

### Batch 10 — Retention + docs (marketing preservation deferred)

- **C-11** Language selector on privacy page. **Marketing preservation approval required.**
- **C-12** Age gate on contact form. **Marketing preservation approval required.**
- **U-28** Topbar responsive: hide Cmd+K below `md:`; role toggle into UserMenu on mobile; Wordmark → Monogram below `sm:`.
- **U-24** Dark-mode `--color-muted-2` raised to `0.7`; verify disabled-state contrast.
- **U-31** Toast severity visual differentiation + sr-only prefix.
- **U-17** Cmd+K listener ignores when target matches `input, textarea, [contenteditable]`.

### Batch 11 — Perf polish + query hygiene

- **P-07 + P-15** `useApiQuery` retry predicate + cap tightened. Only retry on `NETWORK_ERROR` + `SERVER_ERROR`. Retry cap 2.
- **P-14** Extract shared `transpilePackages` to `packages/config/next/base.mjs`. Both apps extend.
- **P-16** Move `MSWProvider` outside `QueryProvider`.
- **P-24** Snapshot suffix `pathTemplate` fix so Linux CI reuses baselines.

### Batch 12 — Documentation + backlog handoff

- **P-22** Document `NEXT_PUBLIC_*` rebuild-on-change constraint in `.env.example` + `AGENTS.md`.
- **P-25** Pin exact versions across workspace or centralize via overrides.
- **U-30** Document `useReducedMotion` pattern in `docs/motion.md`.
- **C-14 + C-15 + C-16** Add PII lint rule + `identify()` wrapper enforcing opaque id.

### Marketing preservation batch (opt-in, per client approval)

Everything below stays gated on explicit per-finding client sign-off. NOT part of Batch 5 default landing.

- Marketing CSP (**S-12 + C-17**)
- Contact form rate limiter → Upstash (**S-11**)
- Privacy notice rewrites (**C-03 / C-04 / C-06 / C-11 / C-12**)
- Marketing snapshot coverage expansion (**P-17**)
- PortfolioGrid LCP priority (**P-18**)

## Sev-3 / Sev-4 backlog handoff

Not landed this window. Documented in the executive report as Wave 3 for later engagements or client-owned.

- Sev-3 security (S-13/14/15/16/18/20): CSP hygiene, cross-tab refresh leader, apiFetch retry budget.
- Sev-3 compliance (C-10/14/15/16/17/20/21): retention prose, analytics identifier discipline.
- Sev-3 UX (U-05/06/09/10/13/14/15/18/21/22/25/29/30/36/37): logout page polish, error UX, password rules, contrast on gold surfaces.
- Sev-3 perf (P-13/14/15/16/17/18/20/21): turbo caching, Hero LCP, font preload.
- Sev-4 (12): pure hygiene.

## Verification gate at close

Phase E re-review confirms:

1. `mvn`-equivalent build passes: `npm run build` clean on both apps.
2. `npm run test:visual` (marketing preservation) passes with zero pixel drift (proves marketing untouched).
3. `npm run typecheck` clean across workspace.
4. `npm run lint` clean.
5. Vitest project has ≥15 passing tests covering refresh + CSRF + auth state machine + apiFetch + middleware.
6. Playwright dashboard smoke: login + 2FA + sidebar navigation happy paths.
7. All Sev-1 items marked FIXED with commit reference in `risk-register.md`.
8. All Sev-2 code-owned items marked FIXED or accepted-Wave-3 with client-owned justification.
9. Marketing preservation gate: `git log --stat` shows zero changes to `apps/website/**` unless a per-finding approval note exists in `.aeos/memory/adr/`.
