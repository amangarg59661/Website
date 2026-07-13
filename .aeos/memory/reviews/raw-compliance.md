# Raw compliance findings — DPDP 2023 (India) + GDPR + PCI-SAQ-A hygiene

**Baseline commit:** `e9121c7` (branch `audit-remediation`)
**Scope:** `apps/dashboard`, `apps/website`, `packages/*` (especially `packages/analytics`)
**Regimes:** DPDP Act 2023 (India), GDPR (EU), PCI-SAQ-A hygiene
**Reviewer note:** Wave 3 backend compliance work (DSAR/erasure/consent registry/breach SOP/DPA register) is already flagged in the client backlog. Frontend findings that only surface those backend gaps are noted but not re-scored as launch-blockers on their own.

---

### F-01 No consent banner / cookie-notice UI anywhere in the frontend

**Severity:** Sev-1
**Where:** absent — repo-wide grep for `consent|banner|cookie-notice` returns zero components. `apps/website/app/layout.tsx:36` mounts `<PostHogProvider>` unconditionally; `apps/dashboard/app/layout.tsx:46` does the same.
**Regime:** DPDP | GDPR
**Problem:** No first-visit notice, no accept/reject toggle, no granular categories. PostHog init runs on mount and drops `localStorage` + first-party cookies (`persistence: "localStorage+cookie"`, `packages/analytics/src/client.tsx:29`) before the user sees any privacy language. DPDP §6 (notice + consent before processing) and GDPR Art 6/7 (freely-given, specific, informed, unambiguous consent, plus ePrivacy for cookies) are both violated on first paint.
**Fix direction:** Introduce a consent gate component (e.g. `packages/ui/consent-banner`) that renders on first visit, blocks PostHog init until the user picks a category, persists the choice in a first-party `consent` cookie, and gives a way to revoke. `PostHogProvider` and `PageviewTracker` must read the consent state and no-op until "analytics" is granted.

### F-02 PostHog init runs before consent / drops storage on every visit

**Severity:** Sev-1
**Where:** `packages/analytics/src/client.tsx:11-31`, `apps/website/app/layout.tsx:36`, `apps/dashboard/app/layout.tsx:46`
**Regime:** GDPR | DPDP
**Problem:** `shouldSkipInit()` gates on missing key or `navigator.doNotTrack === "1"` only. It does not check any consent flag. PostHog therefore writes `ph_*` cookies and `localStorage` keys, captures `$pageview` including full URL + referrer + IP + UA, on every anonymous visitor. Under GDPR this is unlawful processing; under DPDP notice-and-consent must precede the collection.
**Fix direction:** Wrap init behind a consent selector (see F-01). Also switch `persistence` to `"memory"` until consent is granted; only upgrade to `localStorage+cookie` post-opt-in. Add `respect_dnt: true` to `posthog.init` explicitly rather than relying on a hand-rolled DNT check.

### F-03 Privacy policy is silent on PostHog / mis-declares third-party services

**Severity:** Sev-1
**Where:** `apps/website/app/(marketing)/legal/privacy/page.tsx:47-53, 55-60`
**Regime:** DPDP | GDPR
**Problem:** The policy says "Analytics is handled by Vercel Analytics (privacy-preserving; no cookies)" and "We use one cookie category: strictly necessary. No advertising cookies. No cross-site tracking cookies." Reality (`packages/analytics/src/client.tsx`, `apps/website/app/layout.tsx:36`) is that PostHog Cloud EU is also live and does set cookies + localStorage. This is a factual misstatement to the data principal and would fail a first-day DPO review under both regimes.
**Fix direction:** Rewrite the "Third-party services" and "Cookies" sections to declare PostHog Cloud EU, its purpose (product analytics), its data categories (URL, referrer, IP, UA, session recording if enabled), its EU processing region, its retention, and — once F-01 lands — the categorised consent model. Keep the Vercel Analytics line only if that product is truly still on.

### F-04 Grievance Officer / Data Protection Officer contact is absent

**Severity:** Sev-1
**Where:** absent — `apps/website/app/(marketing)/legal/privacy/page.tsx` names only `legal@elitedigital.studio` as a general mailbox. `config/legal.ts:1-7` carries no officer role.
**Regime:** DPDP
**Problem:** DPDP §8(9) requires every Data Fiduciary to publish a Grievance Officer's business contact information on its privacy notice. If EDSS is subsequently notified as a "Significant Data Fiduciary" a formal DPO is also mandated (§10). Neither is on-page today; a generic legal mailbox does not satisfy §8(9).
**Fix direction:** Add a named Grievance Officer role (name, email, physical address, response SLA) to `config/legal.ts` and render a dedicated section in the privacy policy. Add a "raise a grievance" copy path with the mandated 30-day response window.

### F-05 No consent-withdrawal or DSAR UI trigger

**Severity:** Sev-2 (foundation lives in backend Wave 3 — do not launch-block on frontend alone)
**Where:** absent — no route, no page, no form under `apps/website/app/(marketing)/legal/` or `apps/dashboard/app/*/settings/`.
**Regime:** DPDP | GDPR
**Problem:** DPDP §6(4)–(6) require a mechanism as easy to use as the consent capture for withdrawal, access, correction, erasure, and nomination. GDPR Art 15–22 require analogous UIs. Current flow directs the user to email `legal@elitedigital.studio` — a mailbox request is not "as easy" as the analytics that ships without a click.
**Fix direction:** Ship a self-service page under `/legal/data-requests` (marketing) and a "Privacy" tab in `dashboard/{client,staff}/settings` that lets an authenticated user request export, erasure, correction, and consent withdrawal. Route to the Wave-3 backend DSAR endpoints once available. Meanwhile expose an on-page form that files the request into a queue.

### F-06 No cookie inventory or "necessary vs analytics" declaration surfaced to the user

**Severity:** Sev-2
**Where:** absent from `apps/website/app/(marketing)/legal/privacy/page.tsx`; cookies are set in `apps/dashboard/app/api/auth/_proxy.ts:36-58`, `apps/dashboard/app/api/auth/csrf-token/route.ts:15-21`, `apps/dashboard/app/{client,staff}/layout.tsx:13`, `apps/dashboard/app/layout.tsx:28` (theme cookie via `next-themes`), `packages/analytics/src/client.tsx:29` (PostHog persistence).
**Regime:** GDPR | DPDP
**Problem:** Live cookies are `rt` (auth, necessary), `csrf` (necessary), `theme` (preference — arguably necessary), `last_role_group` (preference), plus PostHog's anon `distinct_id` / session / `ph_*` set (analytics, non-necessary). None of these are enumerated on the privacy page. GDPR ePrivacy and DPDP §6 both require the user to know what is set, by whom, for how long, and for what purpose — before non-necessary cookies drop.
**Fix direction:** Add a cookie inventory table to the privacy page listing every cookie by name, purpose, category (Strictly Necessary / Preference / Analytics), max-age, and first- vs third-party. Once F-01 lands, tie each non-necessary row to its consent-category toggle.

### F-07 Cross-border transfer basis for PostHog Cloud EU / Resend / Unsplash / CDN not documented

**Severity:** Sev-2
**Where:** absent in `apps/website/app/(marketing)/legal/privacy/page.tsx`; origins live in `apps/dashboard/middleware.ts:37, 39` (PostHog EU, images.unsplash.com, cdn.elitedigital.studio), `apps/website/next.config.mjs:47-50`, `apps/website/app/api/contact/route.ts:61` (Resend, US).
**Regime:** DPDP | GDPR
**Problem:** IP + UA leak to PostHog (EU/DE), Resend (US), Unsplash (US CDN), CDN.elitedigital.studio (unknown region). DPDP §16 (cross-border transfer to notified jurisdictions) and GDPR Art 44–49 (transfer basis, SCCs, TIA) both demand the transfer basis be documented and disclosed. Nothing in the codebase or the privacy page states the basis.
**Fix direction:** In the privacy policy add a "Cross-border transfers" section listing each subprocessor, its processing region, and the legal basis (SCCs for Resend/US, Cloud EU residency for PostHog, standard hosting for Unsplash). Maintain a subprocessor register (DPA metadata) alongside the Wave 3 backend DPA work.

### F-08 Contact-form data-minimisation gap — no purpose statement, no consent checkbox, `phone` required

**Severity:** Sev-2
**Where:** `apps/website/lib/contact/schema.ts:6-10` (phone `.min(6)` required), `apps/website/components/marketing/ContactForm.tsx:82-93`, `apps/website/app/(marketing)/contact/page.tsx:19-95`
**Regime:** DPDP | GDPR
**Problem:** Phone number is a required field for what the copy describes as a written inquiry — a caller may want email-only contact and phone is not necessary for that purpose. There is no explicit purpose-limitation statement rendered next to the form and no consent checkbox for the inbound processing. The form footer (`ContactPage:107-115`) only links Privacy/Terms — implicit consent is being taken. DPDP §5–6 require notice at collection and explicit purpose; GDPR Art 5(1)(c) requires data minimisation.
**Fix direction:** Make `phone` optional in `contactSchema` and render "(optional)" on the label. Add an inline notice above the submit button: "By submitting, you agree to us using this information to reply to your inquiry. See our Privacy Policy." (with hyperlink). Consider a mandatory consent checkbox for record-keeping. Purpose text should name retention (Wave 3 will finalise the number).

### F-09 Contact-form PII logged to server console when RESEND_API_KEY is unset

**Severity:** Sev-2
**Where:** `apps/website/app/api/contact/route.ts:97-106`
**Regime:** DPDP | GDPR
**Problem:** The dev-mode branch does `console.info("[contact] inquiry received", { name, email, phone, meetingTime, message: message.slice(0, 500) })`. On Vercel this stream lands in build/serverless logs retained ~30 days with no user-visible retention notice, no scrubbing, no DSAR reachability. If `RESEND_API_KEY` is ever accidentally blank in prod (env drift), full PII is silently persisted to Vercel logs. Even the `resend failed` and `resend error` lines at 84 and 91 include the raw upstream text which may echo PII.
**Fix direction:** Gate the `else` branch on `NODE_ENV !== "production"` so a missing key in prod fails loudly instead of quietly logging PII. Redact `email` and `phone` in the error branches (log only length + hash). Route all contact-form observability through a structured logger with an explicit PII allowlist.

### F-10 Retention policy exists on paper but is unenforced client-side and inconsistent with logs

**Severity:** Sev-3
**Where:** `apps/website/app/(marketing)/legal/privacy/page.tsx:62-67` claims "server logs retained for thirty days"; actual server-side logs (F-09) go to Vercel with platform defaults; no code enforces the CRM 24-month + engagement window.
**Regime:** DPDP | GDPR
**Problem:** The stated retention is a promise the frontend cannot keep — retention is a backend/Vault-side concern that is on the Wave 3 backlog. The claim as written is enforceable only by a backend job that does not yet exist. This is not a launch-blocker in isolation but the stated numbers should not be more precise than what the platform actually enforces.
**Fix direction:** Either loosen the copy to "we retain inquiry data for the duration of the engagement plus a defined retention window; contact us to know the current window and to request early deletion" until the backend enforcement is live, or align the number to a Wave-3-scheduled retention job. Track this against the Wave 3 compliance-foundation deliverable.

### F-11 No language variant of the privacy notice — DPDP §5(3) mentions eighth-schedule languages

**Severity:** Sev-2
**Where:** `apps/website/app/(marketing)/legal/privacy/page.tsx` renders English only. Layout locks `lang="en"` at `apps/website/app/layout.tsx:25`. No i18n route group.
**Regime:** DPDP
**Problem:** DPDP §5(3) obliges the Data Fiduciary to make the notice available in English _and_ in any language listed in the Eighth Schedule of the Constitution that the data principal opts for. There is no language selector, no route parameter, no translated copy.
**Fix direction:** Publish at minimum a Hindi translation initially and add a language selector on the notice. Longer term structure the notice as MDX/JSON keyed by language and drive selection from a `?lang=` query or `Accept-Language`. Coordinate with legal counsel on which additional languages ship at launch.

### F-12 Children's data — no age gate, no parental-consent flow

**Severity:** Sev-2
**Where:** `apps/website/app/(marketing)/legal/privacy/page.tsx:77-81` states "we do not knowingly collect data from individuals under sixteen"; no verification runs anywhere.
**Regime:** DPDP | GDPR
**Problem:** DPDP §9 imposes verifiable parental consent for processing of children (<18 in India). The contact form asks for name/email/phone with no age attestation, no self-declaration. GDPR Art 8 sets a lower bar (13–16) but still expects some check. The written promise not to collect is meaningless without any mechanism.
**Fix direction:** Add an "I confirm I am 18 or older" checkbox to the contact form (and to the login/reset flows if the target audience allows minors). Escalate to product/legal on whether a verifiable parental-consent flow is needed for any dashboard cohort.

### F-13 PostHog `distinct_id` cookie set pre-consent — anonymous tracking cookie

**Severity:** Sev-2
**Where:** `packages/analytics/src/client.tsx:29` uses `persistence: "localStorage+cookie"`; no consent gate.
**Regime:** GDPR | DPDP
**Problem:** Even before login PostHog persists a first-party `ph_<key>_posthog` cookie carrying the anon `distinct_id`. Under GDPR ePrivacy, non-essential analytics cookies require opt-in before storage. Under DPDP the same act of persisting an identifier without notice-then-consent breaches §6.
**Fix direction:** Same fix as F-01/F-02 — do not call `posthog.init` until consent is captured, and until then only use `persistence: "memory"`. Purge existing `ph_*` cookies if the user subsequently rejects.

### F-14 `captureServerEvent` distinctId choice is undefined by convention — risk of PII as distinct_id

**Severity:** Sev-3
**Where:** `packages/analytics/src/server.ts:16-25`
**Problem:** The helper accepts an arbitrary `distinctId: string`. There is no callsite in the app tree today (grep returns zero uses of `captureServerEvent`), but the API surface leaves it entirely to a future caller whether they pass `user.email`, `user.id`, or an ephemeral id. Passing an email would create a joinable identifier server-side.
**Fix direction:** Document (and enforce via a wrapper) that `distinctId` MUST be an opaque user id — never an email, phone, or name. Add a Zod or narrow type-brand (`type DistinctId = string & { __brand: "opaque" }`) with a helper that fails fast if the string looks like an email.
**Regime:** GDPR | DPDP

### F-15 `captureEvent` prop schema is safe today but has no PII lint rule

**Severity:** Sev-3
**Where:** `packages/analytics/src/events.ts:1-16`
**Problem:** `WebsiteEvent` currently exposes only `topic`, `source_page`, `slug`. No PII fields today, which is good. But the type is closed to authors adding a new event with `email: string` etc. and no automated check would flag it. This is a convention-only guardrail.
**Fix direction:** Add a repo lint (custom ESLint rule or CI grep) that flags event-prop union members whose field names match `/email|phone|name|address|token|password|dob|pan|aadhaar/i`. Document the rule in `AGENTS.md` §3.6. Preserve current behaviour, only tighten additions.
**Regime:** GDPR | DPDP

### F-16 No `identify()` call — but no documented "never send email as identifier" red line either

**Severity:** Sev-3
**Where:** `packages/analytics/src/client.tsx` — no `identify` wrapper; spec at `docs/superpowers/specs/2026-07-07-dashboard-shell-design.md:582` says `identify(userId, { role: primary_role, has_both_roles })` will fire post-auth in a future sub-project.
**Problem:** Sub-project 6 will introduce identify. If that lands using `user.email` as distinct_id (a common default), the analytics store gains a directly-identifying key. Codify the constraint now before implementation.
**Fix direction:** In `packages/analytics/src/client.tsx` add an `identify(userId, traits)` export that takes only an opaque id, whitelists `role`/`has_both_roles` in traits, and rejects any trait matching the PII regex from F-15.
**Regime:** GDPR | DPDP

### F-17 Marketing site ships PostHog but has no CSP — no report-uri, no origin lockdown

**Severity:** Sev-3
**Where:** `apps/website/next.config.mjs:7-19` sets HSTS, XCTO, XFO, Referrer-Policy, Permissions-Policy; no `Content-Security-Policy` header. Contrast dashboard `apps/dashboard/middleware.ts:30-48` which does.
**Regime:** Cross-regime (indirect)
**Problem:** Absence of CSP is not itself a privacy breach but it removes the enforcement path that would catch a rogue subresource shipping PII off-site. Given PostHog + Resend + Vercel Analytics + Unsplash all render on the marketing surface, a CSP that at minimum locks `connect-src`/`img-src`/`script-src` to that allowlist is warranted.
**Fix direction:** Mirror the dashboard CSP template on the marketing site via `next.config.mjs` headers or a middleware. Include `report-uri /api/csp-report`.

### F-18 `cookies.set('csrf', ...)` and `document.cookie = last_role_group=...` fire pre-consent

**Severity:** Sev-3
**Where:** `apps/dashboard/app/api/auth/csrf-token/route.ts:15-21`, `apps/dashboard/app/{client,staff}/layout.tsx:13`
**Problem:** `csrf` is arguably strictly-necessary (auth). `last_role_group` is a preference cookie — 1-year Max-Age, no consent check. `theme` cookie set via `next-themes` is similar. If the consent framework introduced by F-01 keeps "necessary" as no-consent, these are fine; but the categorisation must be explicit in the privacy notice, and `last_role_group`/`theme` should probably be labelled "Preferences" rather than "Necessary".
**Fix direction:** Categorise cookies in the inventory (F-06) as Strictly Necessary (`rt`, `csrf`) vs Preferences (`theme`, `last_role_group`) vs Analytics (PostHog `ph_*`). Where categorisation is Preferences, either move to `sessionStorage` or gate behind a soft opt-in.
**Regime:** GDPR

### F-19 No PCI surface — verified no card capture on this frontend

**Severity:** Sev-4 (informational, no action required)
**Where:** `apps/dashboard/**` — grep for `stripe|razorpay|paypal|checkout\.com|card|PAN` returns only marketing case-study copy (`apps/website/data/services.ts:91`, `apps/website/data/portfolio.ts:93`). No client-side card capture, no payment form, no `/api/pay*` route.
**Regime:** PCI-SAQ-A
**Problem:** None. Confirms SAQ-A eligibility: no PAN ever touches this frontend surface. As long as future billing UI (invoice-pay button in `client/invoices`) redirects to a hosted checkout with no iframe embed and no card fields, SAQ-A applies.
**Fix direction:** Document the "no card fields on this surface, redirect only" rule in `AGENTS.md` §13 "Non-goals / red lines" so future sub-projects don't accidentally embed a card form. When Stripe/Razorpay is wired for the invoice module, use `redirect` mode (not embedded elements).

### F-20 `X-Forwarded-For` first-hop IP stored in memory rate-limit bucket without notice

**Severity:** Sev-4
**Where:** `apps/website/app/api/contact/route.ts:27` — `req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()` used as the bucket key.
**Regime:** GDPR | DPDP
**Problem:** The value lives in a `Map` for 60s, then expires. Low risk. IP is personal data under GDPR case law; even ephemeral use should be disclosed as a "security processing" basis. The privacy page today makes a vague mention of IP capture.
**Fix direction:** Add a one-liner to the privacy page: "We temporarily hold your IP address for up to 60 seconds to rate-limit form submissions and prevent abuse. This is discarded thereafter." Consider hashing the IP before it enters the bucket.

### F-21 `reply_to: email` header in Resend send exposes inquirer email in mailbox metadata

**Severity:** Sev-4
**Where:** `apps/website/app/api/contact/route.ts:71`
**Problem:** Not a privacy defect on its own — the whole point of the contact form is to reply — but the entire body is stitched into `text:` (`name`, `email`, `phone`, `meetingTime`, `message`), which means the same PII lives in Resend's log for as long as Resend retains sent-email records.
**Fix direction:** Confirm Resend retention config with the vendor (usually 30 days), disclose in the "Third-party services" section of the privacy page, and align retention prose with the vendor number.
**Regime:** GDPR | DPDP

### F-22 Login/reset flows collect only what is necessary — no minimisation gap here

**Severity:** Sev-4 (informational)
**Where:** `apps/dashboard/components/auth/LoginForm.tsx`, `apps/dashboard/components/auth/ResetPasswordForm.tsx`
**Problem:** None. Login collects `email`, `password`, `remember_me`; reset collects `token`, `new_password`, `confirm`. No implicit consent, no over-collection.
**Fix direction:** No change. Note that these forms sit behind a same-origin dashboard shell that is `robots: noindex, nofollow` (`apps/dashboard/app/layout.tsx:16`) so they are not indexed. Keep this discipline.
**Regime:** Cross-regime

---

## Requires legal counsel (out of scope for code-only fix)

1. **DPDP notification status for EDSS as a Data Fiduciary / Significant Data Fiduciary.** Counsel to confirm whether the company must appoint a DPO under §10, or a Grievance Officer under §8(9) is sufficient at current volumes. Answer changes the copy in F-04.
2. **Cross-border transfer basis for Resend (US) and any US-only subprocessor.** Confirm SCCs are in place, Transfer Impact Assessment on file, and that the destination country list under DPDP §16 has not been notified in a way that restricts Resend usage.
3. **DPDPA-mandated language list at launch.** Counsel to advise which Eighth-Schedule languages must ship first (Hindi minimum; Kannada/Tamil/Marathi likely for the announced offices). Impacts F-11.
4. **Verifiable parental consent design under DPDP §9** for any dashboard flow that could plausibly onboard a minor (interns, career-portal applicants). Counsel + product to define whether the marketing site's "professionals only" copy is sufficient or a hard age gate must ship.
5. **Retention numbers on inquiry data (F-10).** Counsel to sign off on the "engagement + 24 months" statement in the privacy notice, aligned with Wave 3 backend retention job design.
6. **DPA / subprocessor register maintenance.** Counsel + backend Wave 3 to jointly own the DPA register (PostHog, Resend, Vercel, Upstash, Unsplash, CDN). Frontend surface only references it; ownership is legal + platform.
7. **Data-breach notification playbook** — DPDP §8(6) requires notice to the Board and each affected data principal "in such form and manner as may be prescribed". Counsel to draft the notification template; engineering ships the trigger in Wave 3.
8. **Cookie categorisation for `theme` and `last_role_group`.** Counsel to confirm whether preference cookies of 1-year Max-Age qualify as "strictly necessary" or require soft opt-in.
9. **Revocation semantics.** Counsel to confirm that PostHog opt-out must both suppress future capture _and_ trigger deletion of already-captured events for that distinct_id — impacts backend DSAR flow, not just the frontend banner.
