# External Frontend v1 — Master Risk Register

Baseline commit: `7c1cdf8` on `main` (branch `frontend-audit-remediation`).
Compiled from four review dimensions (Security + IAM, Compliance / DPDP / GDPR / PCI-SAQ-A, UX + UI + A11y + Brand, Perf + Test + CI + Ops).
Raw reports live alongside this file (`raw-security.md`, `raw-compliance.md`, `raw-ux-ui-a11y.md`, `raw-perf-test-ops.md`).

Total findings before dedup: **108**. After dedup: **97**.

Namespace prefixes:

- `S-##` — Security (raw-security F-##)
- `C-##` — Compliance (raw-compliance F-##)
- `U-##` — UX / UI / A11y / Brand (raw-ux-ui-a11y F-##)
- `P-##` — Perf / Test / CI / Ops / Observability (raw-perf-test-ops F-##)

## Severity summary

| Severity | Count | Meaning                                                                                                                        |
| -------- | ----- | ------------------------------------------------------------------------------------------------------------------------------ |
| Sev-1    | 15    | Launch-blocker: security bypass, compliance-breach, unusable-on-mobile, or CI-absent. Must land before shipping to any user.   |
| Sev-2    | 36    | High: must-fix before scale — bypassable-in-theory, information disclosure, missing defense-in-depth, key UX/A11y AA failures. |
| Sev-3    | 34    | Medium: correctness / maintainability / polish with security or accessibility implications.                                    |
| Sev-4    | 12    | Low: hygiene, cosmetic, forward-compat.                                                                                        |

## Dedup notes

- **MSW ships to prod risk:** `S-03` = `P-05` = `S-23` — MSW dependency + committed worker + env-default `true`. Single remediation.
- **Consent-before-analytics:** `C-01` = `C-02` = `C-13` = `P-19` — PostHog init and `$pageview` before consent. One consent-gate remediation covers all four.
- **CSP-report endpoint:** `S-19` = `P-10` = `P-11` — csp-report has no size cap, no rate limit, no CSRF, only console.log. Single remediation.
- **Error reporting absent:** `P-08` = `U-12` — error.tsx renders "We logged it" but nothing is logged, and no Sentry wiring exists. Single remediation.
- **Refresh mutex + sleep + parse:** `P-03` + `P-04` — silent-refresh scheduler + mutex failure cooldown + safeParse path. Land together.
- **Empty-state copy shared across 19 pages:** `U-07` = `U-33` — same fix pass.
- **CSRF cookie not rotated + `refreshAccessToken` skips csrf preflight:** `S-06` + `S-17` — related, land together.
- **Mobile shell dead:** `U-27` + `U-28` — sidebar sheet fallback + topbar collapse — land together.
- **Cookie inventory + categorisation:** `C-06` + `C-18` — cookie table on privacy page + category labels — land together.

---

## Sev-1 (15) — launch blockers

### Security (3)

1. **S-01** — Next 15.1.3 vulnerable to CVE-2025-29927 middleware bypass. Every dashboard defence (CSRF, rate limits, auth redirect, CSP nonce) lives in `middleware.ts`; a single `x-middleware-subrequest` header skips all four. `apps/dashboard/package.json:48`, `apps/website/package.json:39`.
2. **S-02** — Post-login open redirect via `?next=` in `LoginForm.tsx:41`. `router.push(search.get("next"))` accepts protocol-relative URLs. Phishing vector.
3. **S-03 = P-05 = S-23** — MSW ships as production dependency, `public/mockServiceWorker.js` committed, activation gated only on `NEXT_PUBLIC_USE_MOCKS`; `.env.example` defaults to `true`. Single Vercel typo enables the seeded `admin@example.com / password / 000000` mock backend in prod. Full auth bypass.

### Compliance (4)

4. **C-01** — No consent banner or cookie-notice UI anywhere. DPDP §6 + GDPR/ePrivacy violated on first paint.
5. **C-02 = C-13 = P-19** — PostHog init + `$pageview` capture + `distinct_id` cookie all drop before consent.
6. **C-03** — Privacy policy at `apps/website/app/(marketing)/legal/privacy/page.tsx:47-60` mis-declares third-party services ("Analytics is Vercel Analytics; no cookies") when PostHog Cloud EU is live and drops cookies + localStorage. Factual misstatement to the data principal — first-day DPO fail.
7. **C-04** — Grievance Officer / DPO contact absent. DPDP §8(9) mandatory publication.

### UX / A11y (5)

8. **U-01** — UserMenu Profile / Settings dropdown links to `/profile` and `/settings` which do not exist — every click from primary chrome lands on `not-found.tsx`.
9. **U-16** — Dashboard root layout has no skip-link. WCAG 2.4.1 Level A failure. Keyboard users tab 15+ stops before content.
10. **U-19** — UserMenu trigger has no accessible name — screen readers announce "? button".
11. **U-23** — `--color-muted` on `--color-paper` computes to ~4.3:1 — every kicker / muted body / form-hint under-shoots WCAG AA 4.5:1.
12. **U-27** — Sidebar `w-[240px]` at every viewport. On 375px phone the sidebar eats 64% of viewport. Dashboard unusable below ~640px.

### CI / Ops (3)

13. **P-01** — `.github/workflows/` does not exist. No typecheck, lint, build, or Playwright job runs anywhere. 24 preservation snapshots not enforced.
14. **P-02** — Zero user-authored unit tests. Refresh mutex, apiFetch, middleware CSRF/rate-limit matrix, session-idle BroadcastChannel, and auth state machine have no coverage. Refactor risk is existential.
15. **P-03 + P-04** — Silent-refresh timer breaks on tab visibility change, laptop sleep, and clock skew. Refresh mutex has no failure cooldown → network-flaky 401s can loop.

---

## Sev-2 (36) — high; must-fix before scale

### Security (9)

- **S-04** — Client-side-only permission gates. `PermissionGate` / `withPermission` defined but zero call sites. Middleware only checks `rt` presence. Client-only user can navigate `/staff/audit-logs`, `/staff/users`.
- **S-05** — HSTS `preload` directive without confirmed preload-list inclusion. Irreversible browser lock-in if any subdomain is HTTP.
- **S-06** — CSRF cookie never rotated on login / 2FA / refresh / logout. Stale token from pre-login session survives.
- **S-07** — `useSessionIdleTimer` closes over stale callback refs → re-render churn can defer idle timeout indefinitely.
- **S-08** — `last_role_group` JS-readable cookie trusted for redirect target with no integrity check. XSS or extension can widen access into staff shell.
- **S-09** — `/api/auth/reset-password` has no edge rate limit. `/api/auth/logout` + `/api/auth/csrf-token` also uncapped.
- **S-10** — Password-reset proxy returns backend body verbatim. If backend distinguishes existent vs non-existent email, that leaks to browser.
- **S-11 / P-19** — `apps/website/api/contact` in-memory rate limiter is per-serverless-instance, unbounded (memory-DoS on long-lived instances). Marketing preservation — surface only.
- **S-12** — Marketing site has no CSP header at all. Only HSTS + Referrer-Policy + Permissions-Policy. Marketing preservation — surface only.
- **S-17** — `refreshAccessToken()` does not preflight the CSRF cookie. When `csrf` cookie expires (24h) but `rt` is valid (30d), refresh 403s and the user is silently logged out.

### Compliance (7)

- **C-05** — No consent-withdrawal or DSAR UI trigger. DPDP §6(4)-(6) + GDPR Art 15-22 require a UI as easy as consent capture. Wave-3 backend backlog referenced.
- **C-06 + C-18** — No cookie inventory / no category declaration on privacy page. `rt`, `csrf`, `theme`, `last_role_group`, PostHog `ph_*` are unlisted; category labels absent.
- **C-07** — Cross-border transfer basis for PostHog Cloud EU, Resend (US), Unsplash (US), CDN.elitedigital.studio (unknown region) not documented. GDPR Art 44-49 + DPDP §16.
- **C-08** — Contact form data-minimisation gap. `phone` required for what is described as a written inquiry. No purpose statement inline, no consent checkbox.
- **C-09** — Contact form PII (name, email, phone, message) logged to server console when `RESEND_API_KEY` is unset. Silent PII leak on env drift.
- **C-11** — No language variant of the privacy notice. DPDP §5(3) obliges English + any Eighth Schedule language the principal opts for.
- **C-12** — Children's data: no age gate, no parental consent flow. Written promise "we do not knowingly collect data from under-16" is meaningless without any check.

### UX / A11y (14)

- **U-02** — `/dashboard` landing has no auth guard; flashes "Loading dashboard…" then two redirects for signed-out users.
- **U-03** — Login 429 error copy discards `Retry-After` — no countdown, no lockout state, users hammer the button.
- **U-04** — 2FA challenge page shows raw backend error messages; no recovery path ("start over" / "back to login"); expired vs wrong-code not distinguished.
- **U-07 + U-33** — All 19 module placeholders share identical body copy referencing "sub-project 4" — user-facing dashboard admits it is scaffolding. Empty state copy is templated across shells.
- **U-08** — `EmptyStatePlaceholder` has no next action, no CTA, no link. 19 dead ends.
- **U-11** — No shared Skeleton primitive. No Suspense fallback beyond `null`. Every module page will reinvent loading UX.
- **U-17** — Cmd/Ctrl+K palette shortcut fires inside every input including login/2FA. No target check.
- **U-19 (see Sev-1 above)**
- **U-20** — Notifications drawer + Sheet primitive missing Radix `DialogTitle`. Dev-time accessibility warning; screen readers get no accessible name.
- **U-24** — Dark-mode `--color-muted-2` sits at ~3.4:1 on dark paper. WCAG AA small-text fail.
- **U-28** — Topbar has five clusters + kbd chip crammed on 375px. Horizontal overflow / clip.
- **U-31** — Toast has no severity distinction (info/success/warning/error all render identical). Screen reader users lose severity context.
- **U-32** — Form errors flash into DOM but not associated to inputs via `aria-describedby`.

### Perf / Test / CI / Ops (6)

- **P-06** — Middleware rebuilds CSP template + iterates 8 header entries on every request. `/api/csp-report` gets pointless CSP + security headers.
- **P-07** — `useApiQuery` retry predicate retries on `NOT_FOUND`, `VALIDATION_FAILED`, `CSRF_MISMATCH`, `INVALID_RESPONSE`, `RATE_LIMITED`. Wasted round-trips.
- **P-08 = U-12** — Zero error reporting. No Sentry, no LogRocket, no console.error dispatch. `error.tsx` says "We logged it" and logs nothing.
- **P-09** — No `/api/health` on either app. External monitors have no way to verify deploy status.
- **P-10 + P-11 + S-19** — `/api/csp-report` uses `console.warn` (24h retention on Vercel Hobby); no size cap on `req.text()`; no rate limit; no CSRF gate for size-cap enforcement. Log-spam DoS + violations invisible.
- **P-12** — No dashboard test coverage. `mocks/node.ts` exists but no Vitest project consumes it.

---

## Sev-3 (34) — medium; remediate during window

### Security (8)

S-13 CSP `img-src` extras (`images.unsplash.com`, `cdn.elitedigital.studio`) unused by dashboard; S-14 `eu.i.posthog.com` in `script-src` (misleading under `'strict-dynamic'`); S-15 CSRF compare short-circuit (theoretical timing); S-16 logout fire-and-forget without user feedback; S-18 cross-tab silent refresh — 5 tabs = 5 refresh POSTs; S-20 `apiFetch` 429 Retry-After budget per-session unbounded.

### Compliance (6)

C-10 retention prose "30 days" not enforced client-side; C-14 `captureServerEvent` distinctId convention undefined; C-15 event-prop schema has no PII lint rule; C-16 no `identify()` wrapper enforcing opaque id; C-17 marketing site has no CSP + no report-uri; C-20 `X-Forwarded-For` first hop stored in memory bucket without notice; C-21 `reply_to: email` in Resend send exposes PII in mailbox metadata.

### UX / A11y / Brand (12)

U-05 Logout page bare "Signing out…"; U-06 `/dashboard` bypasses shell chrome; U-09 kicker gold-on-paper contrast; U-10 Notifications drawer empty state casual copy; U-13 `global-error.tsx` uses inline system-ui — brand break on fatal; U-14 `not-found.tsx` no home link; U-15 useApiQuery has no user-facing error surface; U-18 Topbar palette trigger `<kbd>` inside button — screen readers announce "Search cmd K"; U-21 TOTP inputs no fieldset / no aria-describedby / no per-cell aria-invalid on error; U-22 password inputs no visibility toggle; U-25 focus ring gold-on-gold on active sidebar row; U-29 auth split-screen right panel `hidden` below `lg:`; U-30 dashboard has zero `useReducedMotion` consumers; U-36 session-idle "Still there?" reads casual + no context; U-37 ResetPasswordForm never shows password rules upfront.

### Perf / Test / CI / Ops (8)

P-13 turbo `typecheck` + `lint` missing `outputs`; P-14 `transpilePackages` list drifts between apps; P-15 `useApiQuery` retry cap 8s × 3 = up to 21s user wait; P-16 provider order: `MSWProvider` inside `QueryProvider` (theoretical RSC data risk); P-17 marketing preservation coverage — only 12 of ~30 routes snapshotted; P-18 Hero LCP-priority missing on `PortfolioGrid` first card; P-20 pre-hydration inline script assumes cookie exists; P-21 fonts variable-axis without explicit route-level preload.

---

## Sev-4 (12) — polish

S-21 `loginSchema.password` allows whitespace; S-22 `useAuth()` returns whole store; S-23 (deduped into Sev-1 S-03 — MSW risk); S-24 pre-hydration script uses `dangerouslySetInnerHTML` without lint guard; C-19 no PCI surface (informational — verified clean); C-22 login/reset forms clean (informational); U-26 `LogoMark` div lacks `role="img"`; U-34 root `/` renders `<div />`; U-35 "Forgot?" link weak affordance; P-22 `NEXT_PUBLIC_API_BASE` module-scope constant; P-23 `SessionIdleWatcher` re-mounts across shells; P-24 preservation baselines `-win32` platform-locked; P-25 duplicate `framer-motion`/`zod`/`cmdk` deps across workspace.

---

## Requires legal counsel / product decision (9)

1. DPDP notification status: Data Fiduciary vs Significant Data Fiduciary (§10 DPO trigger). Impacts C-04.
2. Cross-border transfer basis for Resend (US), Sentry (once wired), any US-only subprocessor. SCCs + TIA.
3. DPDPA-mandated language list at launch (Hindi minimum). Impacts C-11.
4. Verifiable parental-consent design under DPDP §9. Impacts C-12.
5. Retention numbers on inquiry data — "engagement + 24 months" statement in privacy notice. Impacts C-10.
6. DPA / subprocessor register maintenance (PostHog, Resend, Vercel, Upstash, Unsplash, CDN).
7. Data-breach notification playbook — DPDP §8(6) template.
8. Cookie categorisation for `theme` and `last_role_group` (1-year preference cookies).
9. Revocation semantics — PostHog opt-out + already-captured deletion (couples with backend Wave 3 DSAR).

## Requires runtime confirmation (7)

- Cookie flags in real browser over HTTPS (`rt` HttpOnly + Secure + SameSite=Lax + Path=/api/auth).
- CSP `report-uri /api/csp-report` reachability on real deploy.
- CVE-2025-29927 exploitability confirmation on current Next 15.1.3 build.
- HSTS preload eligibility check on hstspreload.org.
- PostHog CSP interaction (session recording / autocapture / feature-flag polling).
- Upstash rate limiter under load — key correctness (IP+UA vs UA-swap bypass).
- Refresh race under 5 concurrent tabs (F-18 / P-18).

## Marketing preservation surface (do not remediate)

Findings on `apps/website/*` are surfaced only. Per client scope decision + preservation rule, marketing code stays untouched unless the client approves per-finding.

- S-11 (marketing contact-form rate limiter in-memory).
- S-12 (marketing has no CSP).
- C-17 (marketing has no CSP report-uri).
- P-17 (marketing snapshots incomplete).
- P-18 (marketing PortfolioGrid LCP).
- C-11 (privacy notice language — marketing page).

---

# Phase D — Remediation Status (post-batch 7)

Branch: `frontend-audit-remediation` — 7 fix commits landed on top of Phase B+C. Working commit at close: `af0e0d6`.

## Sev-1 (15) — status

| #   | ID                 | Status             | Commit / notes                                                                                                                                                  |
| --- | ------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | S-01               | FIXED              | Batch 1 (`bacfe94`): next ^15.2.3 in both apps + middleware `x-middleware-subrequest` reject                                                                    |
| 2   | S-02               | FIXED              | Batch 1: `safeNext()` validator in LoginForm                                                                                                                    |
| 3   | S-03 = P-05        | FIXED              | Batch 1: MSW → devDeps, worker untracked + gitignored, MSWProvider throws in prod, `.env.example` flip, predev + build guard scripts                            |
| 4   | C-01               | WAVE-3             | Consent banner is compliance foundation — coordinated with backend Wave 3 DSAR / erasure / consent registry work; frontend UI lands once backend endpoints ship |
| 5   | C-02 = P-19        | WAVE-3             | PostHog consent gate follows C-01                                                                                                                               |
| 6   | C-03               | MARKETING-APPROVAL | Privacy policy rewrite touches `apps/website/app/(marketing)/legal/privacy` — needs explicit per-finding approval before landing (preservation rule)            |
| 7   | C-04               | MARKETING-APPROVAL | Grievance Officer contact touches marketing privacy page — awaiting approval                                                                                    |
| 8   | U-01               | FIXED              | Batch 4-6 (`45f3c3a`): UserMenu prefix from `activeRoleGroup`, Profile hidden in staff shell                                                                    |
| 9   | U-16               | FIXED              | Batch 4-6: skip-link on root layout, `<main id="dashboard-main">` on both shells                                                                                |
| 10  | U-19               | FIXED              | Batch 4-6: `aria-label="Account menu for {name}"` on trigger, initial `aria-hidden`                                                                             |
| 11  | U-23               | FIXED              | Batch 4-6: `--color-muted` dropped to `oklch(0.5)`, `--color-muted-strong` added                                                                                |
| 12  | U-27               | FIXED              | Batch 4-6: sidebar `hidden md:flex`, `SidebarNavBody` extracted, MobileNavSheet in Topbar                                                                       |
| 13  | P-01               | FIXED              | Batch 7 (`af0e0d6`): `.github/workflows/ci.yml` — typecheck/lint/build/test:visual/gitleaks                                                                     |
| 14  | P-02               | PARTIAL            | Vitest harness scaffolding + auth-state / apiFetch / middleware coverage — WAVE-3 (needs new dep install + config work; not landed this window)                 |
| 15  | P-03 + P-04 + S-07 | FIXED              | Batch 7: silent-refresh scheduler with visibility handling + clamped delay + BroadcastChannel; refresh mutex 5s cooldown; safeParse on refresh response         |

**Wave A Sev-1 fixed: 12 / 15.** 2 items are Wave 3 (compliance-foundation), 2 items require marketing preservation approval, 1 item (P-02 test harness) partial — CI wired to run tests, harness scaffolding deferred.

## Sev-2 (36) — status

### Security (9)

| ID   | Status               | Commit                                                                                                                                                            |
| ---- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-04 | FIXED (layout-level) | Batch 2 (`f16274f`): ShellGate + useCanEnterShell — refuses `/staff/*` for client-only users. Per-page withPermission wrap deferred pending Wave B module builds. |
| S-05 | FIXED (dashboard)    | Batch 3 (`bf372bc`): HSTS preload dropped from dashboard, ADR-0001 committed. Marketing side awaits approval.                                                     |
| S-06 | FIXED                | Batch 2: `setAuthCookies` rotates csrf on every privilege transition                                                                                              |
| S-07 | FIXED                | Batch 7: session-idle callbacks stabilised via useCallback pattern in scheduler rewrite                                                                           |
| S-08 | FIXED                | Batch 2: `/dashboard` derives target from primaryRole authoritatively; `last_role_group` is UX preference only                                                    |
| S-09 | FIXED                | Batch 3: `rl:reset`, `rl:logout`, `rl:csrf` buckets                                                                                                               |
| S-10 | FIXED                | Batch 3: forgot + reset proxies normalise 2xx/4xx to `{ ok: true }`                                                                                               |
| S-11 | MARKETING-APPROVAL   | Contact-form rate limiter → Upstash (marketing surface)                                                                                                           |
| S-12 | MARKETING-APPROVAL   | Marketing CSP                                                                                                                                                     |
| S-17 | FIXED                | Batch 2: `ensureCsrfCookie()` preflight on refresh + logout + verify2FA + reset                                                                                   |

### Compliance (7) — all Wave 3 client-owned (compliance foundation)

No fixes landed this window. Documented in `remediation-plan.md` Batch 5 as consent-banner + Grievance Officer + cookie inventory + cross-border basis + phone-optional contact + language variant + age gate — all client-owned deliverables coordinated with backend Wave 3.

### UX / A11y (14)

| ID          | Status                      | Commit                                                                                                    |
| ----------- | --------------------------- | --------------------------------------------------------------------------------------------------------- |
| U-02        | WAVE-3                      | DashboardLanding auth-status handling — depends on Wave B loading UX cluster                              |
| U-03        | WAVE-3                      | Login 429 countdown UX — module-level polish                                                              |
| U-04        | WAVE-3                      | 2FA challenge branching — depends on Wave B error UX cluster                                              |
| U-07 = U-33 | WAVE-3                      | Module empty-state copy rewrite (19 files) — folds into Wave B where module pages get real content anyway |
| U-08        | FIXED                       | Batch 7: EmptyStatePlaceholder gains `action` + `phase` props                                             |
| U-11        | WAVE-3                      | Skeleton primitive + PageSkeleton — Wave B loading UX cluster                                             |
| U-17        | FIXED                       | Batch 4-6: Cmd+K listener input-target guard                                                              |
| U-19        | FIXED (Sev-1 listing above) |
| U-20        | WAVE-3                      | Radix DialogTitle enforcement — packages/ui refactor                                                      |
| U-24        | FIXED                       | Batch 4-6: dark-mode muted contrast raised                                                                |
| U-28        | FIXED                       | Batch 4-6: Topbar responsive collapse                                                                     |
| U-31        | WAVE-3                      | Toast severity visual differentiation                                                                     |
| U-32        | WAVE-3                      | Form aria-describedby wiring (5 forms) — Wave B                                                           |

### Perf / Test / CI / Ops (6)

| ID                 | Status            | Commit                                                                                                                                                              |
| ------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-06               | FIXED             | Batch 3: middleware skips CSP header on `/api/csp-report`                                                                                                           |
| P-07               | WAVE-3            | useApiQuery retry predicate — Wave B once real query hooks land                                                                                                     |
| P-08 = U-12        | FIXED (hook slot) | Batch 4-6: `error.tsx` surfaces digest + dispatches to `window.__edssReportError`. Sentry install + DSN wire deferred pending client observability vendor decision. |
| P-09               | FIXED             | Batch 4-6: `/api/health` on both apps                                                                                                                               |
| P-10 + P-11 + S-19 | FIXED             | Batch 4-6: csp-report gains 8 KB cap + rate limit + structured log                                                                                                  |
| P-12               | WAVE-3            | Vitest harness + MSW-node — with P-02                                                                                                                               |

**Wave A Sev-2 fixed: 17 / 36.** Remainder split — 9 items Wave 3 client-owned (compliance), 6 items fold into Wave B module builds, 2 items awaiting marketing approval.

## Batch commit index (`frontend-audit-remediation`)

| Batch     | Commit    | Scope                                                   |
| --------- | --------- | ------------------------------------------------------- |
| Phase B+C | `abac9e8` | 4 raw reviews + master risk register + remediation plan |
| 1         | `bacfe94` | Next CVE + open redirect + MSW production-safety        |
| 2         | `f16274f` | shell gate + CSRF rotation + CSRF preflight             |
| 3         | `bf372bc` | rate limits + HSTS hold + enumeration hardening         |
| 4-6       | `45f3c3a` | observability + UX/A11y launch-blockers                 |
| 7         | `af0e0d6` | refresh mutex + silent-refresh scheduler + CI baseline  |

## Residual risks

1. **Test harness absent (P-02).** CI wired to run tests but no Vitest project ships yet. Refresh mutex + auth state machine covered by manual smoke only. Highest single-item risk. Wave 3.
2. **Sentry / observability vendor not chosen (P-08).** error.tsx has a hook slot; the reporter is not wired. All CSP violations still land in `console.warn` structured JSON, not a queryable sink.
3. **Consent banner absent (C-01 + related).** Coordinated with backend Wave 3 compliance foundation. Frontend cannot ship the compliance surface alone.
4. **Marketing preservation gates 5 findings.** C-03 / C-04 / S-11 / S-12 / C-11 all await per-finding approval before code lands.
5. **19 module pages still placeholders.** Wave B (sub-project 4+5) is the largest remaining engagement surface — deferred to a separate cycle per token-budget realism.
6. **PermissionGate per-page wrapping (S-04 full).** Layout-level gate is landed. Per-page wrapping deferred until Wave B builds the real modules (wasted work to wrap placeholders).

## Runtime confirmations still open (7)

All 7 items from the pre-remediation risk register remain — they need a live browser or prod env. Especially:

- CVE-2025-29927 exploitability confirmation on the current build (should now return 403 from the middleware defence-in-depth).
- HSTS preload eligibility (hstspreload.org submission).
- Cookie flags in real browser over HTTPS.
