# Raw findings — UX / UI / A11y / Brand review

**Reviewers:** UX Senior · UI Senior · WCAG Auditor · Brand Steward
**Baseline commit:** `7c1cdf85c7f035bd253c3face4ce817779b551ba` (branch `audit-remediation`)
**Scope:** `apps/dashboard`, `apps/website`, `packages/design-system`, `packages/ui`, `packages/icons`, `packages/auth`, `packages/api`

## Totals

- **Sev-1:** 6
- **Sev-2:** 14
- **Sev-3:** 12
- **Sev-4:** 5
- **Total findings:** 37

### By dimension

| Dimension | Sev-1 | Sev-2 | Sev-3 | Sev-4 | Total |
| --------- | ----- | ----- | ----- | ----- | ----- |
| UX        | 3     | 4     | 3     | 1     | 11    |
| UI        | 1     | 3     | 5     | 3     | 12    |
| A11y      | 2     | 6     | 3     | 1     | 12    |
| Brand     | 0     | 1     | 1     | 0     | 2     |

---

## Journey

### F-01 UserMenu Profile / Settings links point to non-existent routes

**Severity:** Sev-1
**Where:** apps/dashboard/components/shell/UserMenu.tsx : 43, 48
**Dimension:** UX
**Problem:** UserMenu links go to `/profile` and `/settings`. Those routes do not exist. Real routes are `/client/profile`, `/client/settings`, `/staff/settings`. Middleware treats them as unknown authed routes and hands them to `not-found.tsx` — clicking the dropdown lands on a 404 that reads "Nothing here." A dead-end from the primary chrome is launch-blocking.
**Fix direction:** Derive the prefix from `useAuthStore(s => s.activeRoleGroup)` and build `${prefix}/profile`. Note the client shell has no settings-write permission; the staff shell has settings but no profile page — the menu items need to render conditionally by role group.

### F-02 Dashboard landing has no auth guard — flashes redirect for signed-out users

**Severity:** Sev-2
**Where:** apps/dashboard/app/dashboard/page.tsx : 6-25
**Dimension:** UX
**Problem:** `DashboardLanding` reads `useAuthStore.getState()` synchronously on mount; if the user is unauthenticated (fresh visit, expired session), `activeRoleGroup`/`primaryRole` are both null so it redirects to `/client/overview` which the middleware bounces to `/login?next=/client/overview`. The user sees "Loading dashboard…" then two redirects. On slow networks that is 3+ paints of unrelated shell.
**Fix direction:** Read `status` first; if `unauthenticated`, `router.replace("/login")`. If `refreshing`, keep the loader up. Also render the loader with the shell chrome so it does not appear naked on a white page.

### F-03 Login 429 / rate-limit copy has no cooldown affordance

**Severity:** Sev-2
**Where:** apps/dashboard/components/auth/LoginForm.tsx : 43-46; apps/dashboard/mocks/handlers/auth.ts : 42-50
**Dimension:** UX
**Problem:** After 5 wrong attempts the backend returns `RATE_LIMITED` with `Retry-After: 900`. The form just displays the backend `message` string ("Too many login attempts. Wait 15 minutes."). No visible countdown, no `errorCodeToMessage` mapping, no lockout state. `retry_after` from the API contract is discarded. On the 6th attempt users hammer the Sign-in button with no feedback.
**Fix direction:** Parse `err.details.retry_after` (or read Retry-After via a small helper), disable the submit button and store a countdown in local state. Use `errorCodeToMessage("RATE_LIMITED")` for the human copy, append the countdown string in a `role="status"` region.

### F-04 2FA challenge shows raw HTTP status when the challenge expires

**Severity:** Sev-2
**Where:** apps/dashboard/app/(auth)/login/2fa-challenge/page.tsx : 26-29; packages/auth/src/client.ts : 79-83
**Dimension:** UX
**Problem:** When the backend replies "Challenge expired." (INVALID_CREDENTIALS) or "Incorrect code." (INVALID_TOTP), the form shows the raw message. There is no recovery path: no "back to login" link, no "resend / restart", and no distinction between "wrong code" (retry) and "expired challenge" (must re-login). If the mock or backend responds with a 500/HTML instead of JSON, `err.message` becomes `HTTP 401` — leaked plumbing.
**Fix direction:** Branch on the parsed `ApiError.code`. On INVALID_TOTP keep the user on the page and clear the code cells. On CHALLENGE_EXPIRED / SESSION_EXPIRED redirect to `/login?reason=2fa_expired` with a toast. Add a persistent "Start over" link that clears the challenge.

### F-05 Logout page bare "Signing out…" — no shell, no fallback

**Severity:** Sev-3
**Where:** apps/dashboard/app/(auth)/logout/page.tsx : 6-12
**Dimension:** UX
**Problem:** The logout page renders `<p className="p-8">Signing out…</p>` with no branding and no error state. If the network fails, the store still resets but the user is stranded on plain text.
**Fix direction:** Reuse the auth split-screen layout (already at `apps/dashboard/app/(auth)/layout.tsx`) so the wordmark and "Operate the studio…" panel stay visible. Provide a manual "Return to sign-in" link that fires after a 3s timeout in case the logout POST hangs.

### F-06 `/dashboard` "Loading dashboard…" bypasses `<Topbar>` and `<Sidebar>`

**Severity:** Sev-3
**Where:** apps/dashboard/app/dashboard/page.tsx : 24; apps/dashboard/app/layout.tsx : 30-58
**Dimension:** UX
**Problem:** The landing page is a leaf under the root layout (no `client/` or `staff/` layout wrapper), so the shell is not rendered. Users get a raw sentence on a white background before the redirect resolves. Feels like a broken deploy.
**Fix direction:** Move the decision to `apps/dashboard/app/dashboard/layout.tsx` that renders the shell chrome, or convert `/dashboard` into a server-side redirect using cookies (`last_role_group`) so no client render is needed.

## Empty states

### F-07 All 19 module placeholders share identical body copy

**Severity:** Sev-2
**Where:** apps/dashboard/app/client/{overview,projects,invoices,tickets,files,calendar,notifications,profile,settings}/page.tsx; apps/dashboard/app/staff/*/page.tsx (all)
**Dimension:** Brand
**Problem:** Every page reads: title `<Module> coming soon`, body `This module lands in sub-project 4/5. Right now you are looking at a shell that proves the plumbing works.` The user-facing dashboard admits it is scaffolding and references internal sub-project numbers. Even the subtitle is identical for all nine client modules ("Your studio at a glance.") and all ten staff modules ("Operate the studio.") — Overview and Files and Audit-logs all get the same lede. This reads like a template you forgot to fill in, not the Executive Minimalist tone from `docs/design-system.md`.
**Fix direction:** Write one calm, module-specific sentence per screen ("Projects will show every engagement, its stage, and its next milestone." etc.). Drop "sub-project 4" and "coming soon" — say "arriving with the next release" or nothing at all. Distinguish subtitle per module.

### F-08 Empty state has no next action

**Severity:** Sev-2
**Where:** apps/dashboard/components/shell/EmptyStatePlaceholder.tsx : 1-9
**Dimension:** UX
**Problem:** The placeholder is a dashed box with a kicker and two lines of prose. No CTA, no "notify me when this ships", no link to a related area (Overview, Contact). For 19 routes this is 19 dead ends — a signed-in user has nowhere to go from any module except back to the sidebar.
**Fix direction:** Accept an optional `action?: ReactNode` prop rendered under the body. Default it to a `<ButtonLink href="/client/overview" intent="ghost">Back to overview</ButtonLink>` (or staff equivalent). Gate the "Coming soon" kicker behind a `phase?: "coming-soon" | "empty"` prop so this same component can serve real empty-list states later.

### F-09 Kicker uses `--color-gold-2` on paper — low contrast

**Severity:** Sev-3
**Where:** apps/dashboard/components/shell/EmptyStatePlaceholder.tsx : 4
**Dimension:** A11y
**Problem:** `text-[var(--color-gold-2)]` (`oklch(0.7 0.15 75)` in light mode) on `--color-paper` (`oklch(0.985 …)`) computes to roughly 2.9:1 contrast for the kicker eyebrow. Below WCAG AA (4.5:1) for small text.
**Fix direction:** Use `--color-gold-ink` (`oklch(0.35 0.09 75)`) for kicker text on paper, or increase kicker weight and switch to `--color-ink-2`. Same principle applies to any kicker rendered in gold on light surfaces.

### F-10 Notifications drawer empty state loses voice

**Severity:** Sev-3
**Where:** apps/dashboard/components/shell/NotificationsDrawer.tsx : 24-27
**Dimension:** Brand
**Problem:** Copy reads "No notifications yet. We'll ping you when things happen." "Ping you" is casual-startup register, and "when things happen" is unspecified. `.impeccable/` register is calm/precise/assurance-framed — "things" is exactly the vague-noun anti-pattern.
**Fix direction:** Replace with something concrete: "You're clear. New activity across projects, invoices, and tickets will appear here." Match tone across All / Unread / Mentions with a subtly different phrase per tab, not the same string three times.

## Loading + error states

### F-11 No shared Skeleton primitive; no loading UX in shell

**Severity:** Sev-2
**Where:** packages/ui/src/ (absent); apps/dashboard/components/ (absent)
**Dimension:** UX
**Problem:** Section 3.7 of AGENTS.md lists `skeleton` as a deferred primitive. There is no shared component for TanStack Query `isLoading` states, no Suspense fallback beyond `null` (see `login/page.tsx:10`), and no shell-level route transition indicator. Once Sub-project 4 wires real queries, every module page will need to invent its own loader.
**Fix direction:** Add `@edss/ui/skeleton` (a token-driven `<div className="animate-pulse bg-[var(--color-stone-2)] rounded-[var(--radius-sm)]" />` block, respecting `prefers-reduced-motion` via `globals.css:49`). Add a `<PageSkeleton>` in `components/shell/` that renders a PageHeader-shaped block for route-level Suspense.

### F-12 `app/error.tsx` never surfaces the error, no reporting hook

**Severity:** Sev-2
**Where:** apps/dashboard/app/error.tsx : 1-21
**Dimension:** UX
**Problem:** Boundary swallows `error`, discards the digest, offers only "Try again." No trace-id to give support, no toast on retry, no fallback route. A crashed shell tells the user "We logged it" — but the code never logs anything.
**Fix direction:** Wire the boundary to PostHog `captureEvent` (already available via `@edss/analytics/client`) with `{ digest: error.digest }`. Show the digest as a small mono-font line ("Reference: xxxx") so users can quote it. Add a "Back to overview" secondary button.

### F-13 Global error uses inline styles + `<html>` — brand break on fatal

**Severity:** Sev-3
**Where:** apps/dashboard/app/global-error.tsx : 8-19
**Dimension:** Brand
**Problem:** The fatal-error page renders `fontFamily: "system-ui"` and no tokens. On the one moment brand assurance matters most, users see a Times/Arial white page with a bare button.
**Fix direction:** Import `@/styles/globals.css` (safe in a client boundary), use the tokened `<main className="container-app">` layout and the same Wordmark as auth. Keep the DOM minimal but honor the brand tone.

### F-14 `not-found.tsx` has no navigation back

**Severity:** Sev-3
**Where:** apps/dashboard/app/not-found.tsx : 1-9
**Dimension:** UX
**Problem:** 404 renders "Nothing here. The page you asked for does not exist." Full stop. No home link, no sidebar, no search hint. Combined with F-01, users hitting `/profile` land on this page and cannot recover without editing the URL.
**Fix direction:** Add a `<ButtonLink href="/dashboard">Return to your dashboard</ButtonLink>` and, when the user is signed in, render the shell chrome so the sidebar is still available.

### F-15 Query hooks don't surface network / server errors to the user anywhere

**Severity:** Sev-3
**Where:** packages/api/src/queries.ts (whole file — no `onError` handler); apps/dashboard (no consumer surfaces error states yet)
**Dimension:** UX
**Problem:** `useApiQuery` retries 3× with exponential backoff and then… nothing. There is no global error surface, no toast on failure, no "unable to load — retry" pattern documented anywhere. First real module built will invent its own approach.
**Fix direction:** Add a `<QueryErrorBoundary>` shell primitive that catches `ApiError` at page level and offers retry via `queryClient.resetQueries`. Wire `useToastStore.push` into `useApiMutation` `onError` by default (opt out for silent mutations).

## Keyboard nav

### F-16 Dashboard has no skip-link

**Severity:** Sev-2
**Where:** apps/dashboard/app/layout.tsx : 32-58 (skip link absent); compare apps/website/app/layout.tsx : 30-35
**Dimension:** A11y
**Problem:** The marketing site has a proper "Skip to content" link. The dashboard root layout has none. Keyboard users must tab through Wordmark, Cmd+K trigger, role toggle, notifications, avatar dropdown, then every sidebar item — 15+ tab stops — before reaching page content on every navigation. WCAG 2.4.1 (Bypass Blocks) failure at Level A.
**Fix direction:** Add the same `<a href="#main">` pattern used in `apps/website/app/layout.tsx`. Wrap `{children}` in the client/staff layouts with `<main id="main" tabIndex={-1}>` so focus lands correctly.

### F-17 Cmd/Ctrl+K shortcut fires inside every input

**Severity:** Sev-2
**Where:** apps/dashboard/components/palette/CommandPalette.tsx : 26-34
**Dimension:** A11y
**Problem:** The listener is `window.addEventListener("keydown", …)` with no target check. Ctrl+K in browsers is "focus omnibar"; the palette hijacks it globally even when the user is typing in the login/2FA/reset forms. Also hijacks Ctrl+K on Windows browsers where users expect address bar focus, with no way to opt out.
**Fix direction:** Ignore the event when `e.target instanceof HTMLElement && (target.matches("input, textarea, [contenteditable]"))`. Optionally register only after `useIsAuthenticated()` is true so the palette does not steal focus on the login screen.

### F-18 Topbar palette trigger is a `<button>` with no aria-label

**Severity:** Sev-3
**Where:** apps/dashboard/components/shell/Topbar.tsx : 21-30
**Dimension:** A11y
**Problem:** The Cmd+K button has visible text "Search…" so it is accessible in principle, but the `<kbd>⌘K</kbd>` is inside the button. Screen readers announce "Search cmd K" which is jarring, and mobile users see a control that suggests a keyboard shortcut they cannot use.
**Fix direction:** Wrap the kbd in `aria-hidden`, give the button `aria-label="Search — Command palette"`, and hide the entire palette trigger on `md:hidden` (mobile has no Cmd; expose search via mobile menu instead).

### F-19 UserMenu trigger relies on user initial with no accessible name

**Severity:** Sev-2
**Where:** apps/dashboard/components/shell/UserMenu.tsx : 33-35
**Dimension:** A11y
**Problem:** `<DropdownMenuTrigger>` renders `{user?.name?.charAt(0) ?? "?"}` as its only content. Screen readers announce "A button" or "? button". WCAG 4.1.2 (Name, Role, Value) fails when a control's only accessible name is a single letter or "?".
**Fix direction:** Add `aria-label={\`Account menu for ${user?.name ?? "your account"}\`}`on the trigger. When`user` is loading, announce "Account menu, loading" instead of "?".

### F-20 Notifications drawer has no Radix `DialogTitle` — Radix warns and screen readers get no name

**Severity:** Sev-2
**Where:** apps/dashboard/components/shell/NotificationsDrawer.tsx : 12-31; packages/ui/src/sheet.tsx : 35-53
**Dimension:** A11y
**Problem:** `SheetContent` is a `DialogPrimitive.Content` under the hood but the consumer renders only an `<h2 className="h4">Notifications</h2>`. There is no `DialogPrimitive.Title` / `SheetTitle` inside. Radix logs an accessibility warning at dev-time and the drawer opens with no accessible name for the dialog role. Same problem in the `Dialog` primitive as delivered — `DialogContent` does not enforce a `DialogTitle`.
**Fix direction:** Add a `SheetTitle` export (Radix `DialogPrimitive.Title`) and require it in `NotificationsDrawer`. When there is no visible title, wrap it in `<VisuallyHidden>`. Same fix for `SessionIdleWatcher` which does have a `DialogTitle` (good), but `EmptyStatePlaceholder` `<h2 className="h4">` inside the drawer should be the Radix title.

### F-21 TOTP inputs have no aria-describedby for validation state, no live-region on error

**Severity:** Sev-3
**Where:** apps/dashboard/components/auth/TotpInput.tsx : 37-52; apps/dashboard/app/(auth)/login/2fa-challenge/page.tsx : 43-47
**Dimension:** A11y
**Problem:** The 6-cell input has per-digit `aria-label="Digit 1"` etc but no wrapping fieldset/legend and no way to associate the "Incorrect code" error with the group. Error is a `<p role="alert">` which does announce, but sighted keyboard users cannot see which cell was wrong (all six get the same neutral border).
**Fix direction:** Wrap the six inputs in `<fieldset aria-labelledby="totp-label" aria-describedby="totp-error">` with a visually-hidden legend. On error, set `aria-invalid` on all six cells and switch their border to `--color-danger`. Focus should return to cell 0 after error so the user does not have to arrow-back.

### F-22 Password inputs offer no visibility toggle

**Severity:** Sev-3
**Where:** apps/dashboard/components/auth/LoginForm.tsx : 79-85; apps/dashboard/components/auth/ResetPasswordForm.tsx : 49-65
**Dimension:** UX
**Problem:** Login and reset-password forms use `type="password"` with no reveal toggle. WCAG 1.3.5 encourages this, and reset-password requires 12 chars with mixed case + symbols per `resetPasswordSchema` — very error-prone without visibility.
**Fix direction:** Add a right-aligned eye/eye-off toggle button (`aria-pressed`, `aria-label="Show password"`). Keep the toggle behind `autoComplete` semantics so password managers still work.

## WCAG 2.1 AA — tokens + contrast

### F-23 `--color-muted` on `--color-paper` fails AA in light mode

**Severity:** Sev-1
**Where:** packages/design-system/src/styles/tokens.css : 16 (`--color-muted: oklch(0.55 0.005 250)`); consumed all over (kicker, lede, subtle text)
**Dimension:** A11y
**Problem:** OKLCH `0.55` lightness against `0.985` paper computes to approximately 4.3:1 — just under the 4.5:1 WCAG AA threshold for small text. The kicker class and every "muted" body-copy passage (Notifications empty, EmptyStatePlaceholder body, PageHeader subtitle via `.lede`, form hint) misses AA in light mode.
**Fix direction:** Drop `--color-muted` to `oklch(0.5 0.005 250)` to clear 4.7:1. Verify with tooling for every consumer (there are dozens). For non-decorative small text, prefer `--color-ink-2` (0.22) or add a `--color-muted-strong` at 0.42 for interactive muted text.

### F-24 Dark-mode `--color-muted-2` and disabled states not audited

**Severity:** Sev-2
**Where:** packages/design-system/src/styles/tokens-dark.css : 9 (`--color-muted-2: oklch(0.55 …)`); consumed in dropdowns and role-toggle chip
**Dimension:** A11y
**Problem:** In dark mode `--color-muted-2` (`0.55`) sits on `--color-paper` at `0.15` — contrast is roughly 3.4:1. Fine for large text, fails AA for small. Role-toggle chip inactive text (`Topbar.tsx:41-43`) uses this in `text-xs`.
**Fix direction:** Raise `--color-muted-2` to `0.7` in dark mode. Also verify `disabled:opacity-60` on the primary button — combining 40% dim with muted ink can drop below 3:1.

### F-25 Focus ring is gold on gold-hover surfaces

**Severity:** Sev-3
**Where:** apps/dashboard/styles/globals.css : 44-47; Sidebar active state at Sidebar.tsx : 137
**Dimension:** A11y
**Problem:** Global `:focus-visible { outline: 2px solid var(--color-gold) }`. Sidebar's active row has a gold-tinted background (`color-mix(in oklch, var(--color-gold) 12%, transparent)`). When the active row is focused, a gold outline sits on a gold-tinted background — contrast is minimal.
**Fix direction:** Use `--color-ink` as the focus outline (or `--color-gold-ink`) for consistency across surfaces. If gold is the brand-mandated focus, add an inner white/paper outline (`box-shadow: 0 0 0 2px var(--color-paper), 0 0 0 4px var(--color-gold)`) to guarantee contrast on gold-tinted rows.

### F-26 Wordmark SVG uses `role="img"` but text is not exposed to search / selection

**Severity:** Sev-4
**Where:** packages/icons/src/index.tsx : 3-41
**Dimension:** A11y
**Problem:** Wordmark, Monogram both correctly use `role="img" aria-label`. `LogoMark` is a `<div>` with `whiteSpace: nowrap` and the label as a text node — but it is not marked as an image and has no semantic role. If used inside a `<button>` or link the accessible name is fine, but standalone it is announced as plain text without landmark cues.
**Fix direction:** Add `role="img" aria-label={label}` to the `<div>` in `LogoMark`. Or better, convert to `<svg role="img">` for hi-DPI crispness at any size.

## Responsive

### F-27 Sidebar is 240px fixed at every viewport — dashboard is unusable below ~640px

**Severity:** Sev-1
**Where:** apps/dashboard/components/shell/Sidebar.tsx : 154; apps/dashboard/app/client/layout.tsx : 15-25
**Dimension:** UI
**Problem:** Sidebar `w-[240px]` renders unconditionally. Layout uses `flex` with Sidebar + `flex-1` content. On a 375px phone, the sidebar eats 64% of the viewport and content is squeezed into a 135px strip. No sheet fallback, no hamburger, no `md:` gate. The dashboard is effectively desktop-only.
**Fix direction:** Wrap Sidebar in `<div className="hidden md:block">`. Add a mobile Sheet trigger to the Topbar left (menu icon) that opens the same nav in a `<Sheet side="left">`. Reuse `<Sidebar>` inside the sheet — extract the nav map so it works standalone.

### F-28 Topbar wordmark + Cmd+K trigger + role toggle + notifications + avatar all crammed on mobile

**Severity:** Sev-2
**Where:** apps/dashboard/components/shell/Topbar.tsx : 17-62
**Dimension:** UI
**Problem:** Even without the sidebar, the topbar has five clusters and no responsive collapsing. Wordmark + "Search…" button + kbd chip + role toggle + notifications + avatar on 375px will horizontally overflow or clip.
**Fix direction:** Hide the Cmd+K trigger below `md:` (it is not usable without a keyboard anyway). Collapse the role toggle into a menu item inside `UserMenu` on mobile. Reduce Wordmark to Monogram below `sm:`.

### F-29 Auth split-screen collapses to a single column below `lg:` but the aside is `hidden` — the "Operate the studio" statement disappears entirely on tablet

**Severity:** Sev-3
**Where:** apps/dashboard/app/(auth)/layout.tsx : 5-22
**Dimension:** UI
**Problem:** `lg:grid-cols-[6fr_4fr]` with `<aside … hidden bg-... lg:block>` means the copywriting-driven right panel vanishes below 1024px. On tablet, the auth screen becomes a lonely form on white. Brand promise is lost precisely where mobile-first users engage.
**Fix direction:** On `md:` show a compact banner strip above the form ("Operate the studio. See the whole of it.") instead of hiding the message entirely. Or accept the constraint and add a brand strip above the form only on `md:` and below.

## Motion + reduce-motion

### F-30 `useReducedMotion` from `framer-motion` is used in marketing but `@edss/hooks/useReducedMotion` is not consumed anywhere in dashboard

**Severity:** Sev-3
**Where:** packages/hooks/src/useReducedMotion.ts (exported); apps/dashboard (zero consumers)
**Dimension:** A11y
**Problem:** The dashboard does not import `useReducedMotion` at all. The only motion protection is the global CSS `@media (prefers-reduced-motion: reduce)` in `globals.css:49-56`. That protects CSS transitions/animations but not JS-driven Framer animations if / when they land in the dashboard.
**Fix direction:** When Sub-project 4 introduces animated modules (charts, drawers), wrap Framer with `useReducedMotion()` from `@edss/hooks` and default `initial/animate` to `{}` when reduced. Document the pattern in `docs/motion.md`.

## Live regions + async announcements

### F-31 Toast has no `aria-live`, `role="status"`, or Radix `Toast.Provider` announcer

**Severity:** Sev-2
**Where:** apps/dashboard/components/providers/ToastProvider.tsx : 33-51
**Dimension:** A11y
**Problem:** Uses `@radix-ui/react-toast` which normally provides announcer semantics via `<Toast.Root>` — but no explicit `type="foreground"` on error toasts and no visible test. The `Toast.Viewport` and `Toast.Root` do carry appropriate roles by default, however `Toast.Description` is not rendered as part of the announced label. Combined with unsupported severities (info/success/warning/error not visually differentiated at all — same border, same background), screen reader users get title-only announcements without severity context.
**Fix direction:** Set `type="foreground"` on `error` and `warning` toasts. Include the severity in the announced label by rendering an sr-only prefix (`<span className="sr-only">Error: </span>`). Actually distinguish severities visually — currently all four look identical.

### F-32 Form errors flash into DOM but are not associated to inputs via `aria-describedby`

**Severity:** Sev-2
**Where:** apps/dashboard/components/auth/LoginForm.tsx : 65-68, 86-89; ForgotPasswordForm.tsx : 51-53; ResetPasswordForm.tsx : 55-58, 63-65
**Dimension:** A11y
**Problem:** Each `<p className="text-sm text-[var(--color-danger)]">` appears next to the input but has no `id`, and the input has no `aria-describedby`. Screen reader users have to tab to the error text separately to know what went wrong.
**Fix direction:** Give each error paragraph an id (`email-error`) and wire `aria-describedby={errors.email ? "email-error" : undefined}` on the input. The form-level `<p role="alert">` for `formError` is fine — it announces automatically.

## Copy quality + brand voice

### F-33 Empty subtitle "Your studio at a glance." on Files / Notifications / Profile is a template artifact

**Severity:** Sev-2
**Where:** All apps/dashboard/app/client/*/page.tsx (subtitle prop on PageHeader)
**Dimension:** Brand
**Problem:** "Your studio at a glance." is a good line for Overview. On Files it is nonsensical ("your files at a glance" would be the closer version, but that is not what the page will do — it will be a Files browser). Copy was clearly written once and pasted across nine screens. Same problem on staff side ("Operate the studio." on Users, Audit-logs).
**Fix direction:** Author one subtitle per module, each ~5–10 words. Examples: Files → "Every deliverable, contract, and reference in one place." Tickets → "Open requests, replies, and resolutions." Audit-logs → "A signed record of every consequential action."

### F-34 Dashboard page.tsx (`/`) renders `<div />` — no fallback content

**Severity:** Sev-4
**Where:** apps/dashboard/app/page.tsx : 1-3
**Dimension:** UX
**Problem:** Root `/` returns `<div />`. Middleware redirects `/` to `/dashboard` or `/login` so users never see this — but if middleware ever fails or is bypassed (Playwright, curl without cookies), the user gets a blank page with no help.
**Fix direction:** Render a minimal loader or a `<meta http-equiv="refresh" content="0;url=/dashboard">` so the fallback is not silently blank.

### F-35 "Forgot?" link has weak affordance

**Severity:** Sev-4
**Where:** apps/dashboard/components/auth/LoginForm.tsx : 72-77
**Dimension:** UI
**Problem:** The link reads just "Forgot?" — a single word with no underline in default state, muted color. Fine visually but not obvious as an action, and screen readers get "Forgot? link" out of context.
**Fix direction:** Change link text to "Forgot password?" so its intent is legible in and out of context. Add an underline on hover for consistency with body-link patterns.

### F-36 Session idle warning "Still there?" reads casual; no context for what happens

**Severity:** Sev-3
**Where:** apps/dashboard/components/auth/SessionIdleWatcher.tsx : 27-31
**Dimension:** Brand
**Problem:** "Still there? Your session will end in N minutes." is warm but lacks precision (what "ends" — page? work?). No mention of unsaved changes or auto-save behavior. The Executive Minimalist register expects calm assurance, not a chatty prompt.
**Fix direction:** "Your session is about to end. For your security we will sign you out in N minute(s). Any unsaved changes will be lost." Then two clear buttons: "Stay signed in" (primary), "Sign out now" (ghost).

### F-37 `ResetPasswordForm` never shows the password strength requirements

**Severity:** Sev-3
**Where:** apps/dashboard/components/auth/ResetPasswordForm.tsx : 47-66; packages/validation/src/auth.ts (`resetPasswordSchema`)
**Dimension:** UX
**Problem:** The schema requires ≥12 chars, uppercase, lowercase, digit, and symbol. The form shows the schema error only after submission. Users type a password, hit save, and get "String must contain at least one uppercase letter" (raw Zod message) with no upfront guidance.
**Fix direction:** Render the rules as a checklist under the New password field, ticking each rule live via `watch("new_password")`. Wire the confirm mismatch into a friendlier message than the Zod default. Use `role="status" aria-live="polite"` on the checklist so screen readers hear progress.

---

## Not addressed (out of remit)

- Marketing site (`apps/website`) — preservation rule; findings surfaced above where relevant (F-16 skip-link comparison), no code changes.
- Deferred cross-cutting: consent banner, Sentry, strict CSP promotion (Sub-project 6).
- Real data + Playwright dashboard baseline (Sub-projects 3-5).
