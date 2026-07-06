# Sub-project 1 — Monorepo Migration

**Date:** 2026-07-06
**Status:** Design approved, awaiting spec review
**Sub-project of:** Business Operations Platform build (see [dashboard-master-prompt.md](../../../PLAN.md) at repo root for umbrella program)
**Blocks:** all subsequent sub-projects (dashboard shell, data plumbing, modules, cross-cutting)

---

## 1. Purpose

Restructure the existing single-app `edss-web` Next.js repository into a Turborepo monorepo that hosts both the existing marketing website and a forthcoming dashboard, extracting shared design tokens, UI primitives, and tooling into workspace packages. Ship PostHog analytics as a first-class shared package.

**Success criteria**

- Repo root at `D:\Aman_Build\External Frontend\self v1` contains `apps/website/` (was root) plus `packages/` (design-system, ui, icons, hooks, utils, config, analytics).
- Marketing site renders and behaves identically before and after migration — verified via headless Playwright snapshots and manual walkthrough on Vercel preview.
- `npx turbo run build lint typecheck` green across the workspace.
- PostHog Cloud EU wired into the marketing site with typed event catalog; scaffolded for later dashboard consumption.

## 2. Constraints (locked)

Every constraint below reflects a user-confirmed decision from the brainstorming session.

| Decision | Choice | Notes |
|---|---|---|
| Migration path | In-place, `git mv` | Preserves history. |
| Package extraction scope (phase 1) | Marketing-driven only | design-system, ui, icons, hooks, utils, config, analytics. `api`, `auth`, `validation`, `types` deferred to sub-projects 2 and 3. |
| Package scope name | `@edss/*` | Matches Elite Digital Solutions Studio brand. |
| Build strategy | Raw TS via Next `transpilePackages` | No dist builds. |
| Tailwind v4 tokens | Shared `tokens.css` in `@edss/design-system`, app-owned `globals.css` | Marketing keeps editorial utilities; dashboard adds its own. |
| Dark mode | Dashboard-only; split light/dark token files | Marketing stays single-mode (paper light) to preserve editorial identity. Website imports only `tokens-light.css`. |
| shadcn/ui integration | Deferred to sub-project 2 | Phase 1 lifts existing hand-rolled Button + Form as-is. |
| Migration execution | Incremental, 5 stages, one PR per stage | Each stage verifiable in isolation. |
| PostHog region | Cloud EU (`https://eu.i.posthog.com`) | Asia region does not exist; EU is closest acceptable posture for Indian user base. Self-hosted Mumbai infra planned if DPDP tightens. |
| PostHog init location | Root layout, every route | Full UX visibility. |
| Consent banner | Deferred to sub-project 6 (cross-cutting) | Required for EU cloud regardless of user location. |
| Baseline capture | Headless Playwright snapshots per stage | Manual walkthrough happens on Vercel preview post-migration. |
| Marketing preservation | Zero visual or behavioral change without explicit approval | See [feedback memory](../../../../../../../../.claude/projects/D--Aman-Build-External-Frontend-self-v1/memory/feedback_preserve_marketing.md). |

## 3. Target folder architecture

```text
self v1/                              # repo root, unchanged path
├── apps/
│   └── website/                      # was: root — the current edss-web
│       ├── app/                      # (marketing) group + api + og + robots + sitemap + manifest
│       ├── components/               # website-only compositions (marketing, layout, motion)
│       ├── content/                  # MDX
│       ├── data/                     # website data
│       ├── lib/                      # website-only helpers
│       ├── public/
│       ├── scripts/                  # check-bundle.mjs etc.
│       ├── styles/globals.css        # website-owned utilities (marquee, noise, on-ink, etc.)
│       ├── next.config.mjs           # transpilePackages: ['@edss/*']
│       ├── postcss.config.mjs
│       ├── eslint.config.mjs         # re-exports from @edss/config/eslint/next
│       ├── tsconfig.json             # extends @edss/config/tsconfig/next.json
│       ├── package.json              # name: @edss/website
│       ├── PLAN.md                   # moved from root
│       └── README.md                 # moved from root (website-specific)
├── packages/
│   ├── design-system/
│   │   ├── src/
│   │   │   ├── styles/
│   │   │   │   ├── tokens.css        # @theme block — mode-agnostic colors/type/space/motion
│   │   │   │   ├── tokens-light.css  # light-mode surface overrides
│   │   │   │   └── tokens-dark.css   # dark-mode surface overrides (dashboard-only consumer)
│   │   │   ├── fonts.ts              # next/font instances
│   │   │   ├── motion.ts             # ease + duration TS constants
│   │   │   └── index.ts              # barrel
│   │   └── package.json
│   ├── ui/                           # cross-app primitives
│   │   ├── src/{button.tsx,form.tsx,index.ts}
│   │   └── package.json
│   ├── icons/                        # brand SVGs + curated lucide re-exports
│   │   ├── src/{whatsapp.tsx,logo.tsx,lucide.ts,index.ts}
│   │   └── package.json
│   ├── hooks/                        # shared React hooks
│   │   ├── src/index.ts              # populated during Stage 4 scan
│   │   └── package.json
│   ├── utils/                        # pure functions, no React
│   │   ├── src/{cn.ts,format.ts,index.ts}
│   │   └── package.json
│   ├── analytics/                    # PostHog wrapper
│   │   ├── src/
│   │   │   ├── client.tsx            # PostHogProvider, usePostHog wrapper
│   │   │   ├── server.ts             # posthog-node helpers
│   │   │   ├── events.ts             # typed event catalog
│   │   │   └── index.ts
│   │   └── package.json
│   └── config/                       # shared tooling presets, no runtime
│       ├── eslint/{base.js,next.js}
│       ├── tsconfig/{base.json,next.json,react-library.json}
│       ├── prettier/index.js
│       └── package.json
├── docs/                             # stays at root — architecture, design-system, motion, a11y, perf, seo, audit + superpowers/
├── .husky/                           # stays at root
├── .impeccable/                      # stays at root
├── .env.example                      # stays at root, extended with POSTHOG vars
├── .gitignore                        # stays at root
├── turbo.json                        # new
├── package.json                      # new — workspaces + turbo scripts + root devDeps only
├── README.md                         # new — describes monorepo
└── tsconfig.json                     # root — references: []
```

## 4. Package boundaries and exports

### `@edss/config` — tooling presets, no runtime

```
exports:
  ./eslint/base       → base ESLint flat config
  ./eslint/next       → Next-specific ESLint config
  ./tsconfig/base.json
  ./tsconfig/next.json
  ./tsconfig/react-library.json
  ./prettier          → prettier config
peerDeps: eslint, prettier, typescript
```

### `@edss/design-system` — tokens, fonts, motion constants

```
exports:
  ./styles/tokens.css
  ./styles/tokens-light.css
  ./styles/tokens-dark.css
  ./fonts             → { fraunces, plex, geistMono } (next/font instances)
  ./motion            → { easeOutQuart, durFast, dur, durSlow, durCinematic }
  ./                  → barrel (fonts + motion)
peerDeps: next, react
sideEffects: ["*.css"]
```

### `@edss/ui` — cross-app primitives

```
exports:
  ./button
  ./form
  ./                  → barrel
peerDeps: react, react-dom, @radix-ui/*, class-variance-authority, clsx, tailwind-merge
deps: @edss/utils
```

### `@edss/icons` — brand SVGs and curated lucide re-exports

```
exports:
  ./                  → barrel: WhatsAppIcon, LogoMark, ...
  ./lucide            → narrow re-export surface (only used icons)
peerDeps: react, lucide-react
sideEffects: false
```

### `@edss/hooks` — shared React hooks

```
exports:
  ./useMediaQuery
  ./useReducedMotion
  ./                  → barrel
peerDeps: react
sideEffects: false
```

Confirmed liftable from `apps/website/lib/hooks/index.ts`: `useMediaQuery`, `useReducedMotion`. `useHeaderState` stays in the website — it wraps marketing-header-specific scroll state.

### `@edss/utils` — pure functions, no React

```
exports:
  ./cn                → tailwind-merge + clsx
  ./format            → date/currency formatters
  ./                  → barrel
deps: clsx, tailwind-merge
sideEffects: false
```

### `@edss/analytics` — PostHog wrapper

```
exports:
  ./client            → <PostHogProvider>, usePostHog, useCaptureEvent
  ./server            → posthog-node capture helpers
  ./events            → typed event catalog (see Section 8)
  ./                  → barrel
peerDeps: react, next
deps: posthog-js, posthog-node
```

### Rules

- Every package uses subpath `exports` map, not just `main`.
- Framework libs (`react`, `react-dom`, `next`) always `peerDependencies`, never runtime `deps`.
- `"type": "module"` everywhere.
- `sideEffects: false` where true, `["*.css"]` where CSS side-effects exist.
- No relative imports across package boundaries; always `@edss/*`.

## 5. Tooling

### Turborepo pipeline — `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build":     { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**"] },
    "dev":       { "cache": false, "persistent": true },
    "lint":      { "dependsOn": ["^lint"] },
    "typecheck": { "dependsOn": ["^typecheck"] },
    "format":    { "cache": false }
  }
}
```

`^build` is a no-op for raw-TS packages but keeps the pipeline declarative for when a package needs to build. A `test` task will be added when tests land.

### Root `package.json`

```json
{
  "name": "edss-monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev":       "turbo run dev",
    "build":     "turbo run build",
    "lint":      "turbo run lint",
    "typecheck": "turbo run typecheck",
    "format":    "prettier --write \"**/*.{ts,tsx,md,mdx,css,json}\""
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "prettier": "^3.4.2",
    "prettier-plugin-tailwindcss": "^0.6.9",
    "typescript": "^5.7.2",
    "husky": "^9.1.7",
    "lint-staged": "^15.3.0"
  },
  "engines": { "node": ">=20.11" },
  "packageManager": "npm@10"
}
```

Husky + lint-staged move to root. `.husky/` path unchanged. `lint-staged` config lives in root `package.json`.

### TypeScript — `packages/config/tsconfig/`

- `base.json` — `strict: true`, `target: ES2022`, `moduleResolution: Bundler`, `noEmit: true`.
- `next.json` — extends base, adds Next plugin, `jsx: preserve`, `allowJs`, `incremental`, path aliases scoped inside the app.
- `react-library.json` — extends base, `jsx: react-jsx`, `declaration`, `composite: true` (kept off phase 1; enables project references later).

Root `tsconfig.json` has `references: []` — project references not enabled phase 1.

### ESLint

Flat config only.

- `packages/config/eslint/base.js` — TS + import + react-hooks + `eslint-plugin-jsx-a11y`.
- `packages/config/eslint/next.js` — extends base + `eslint-config-next`.
- Every package and app owns an `eslint.config.mjs` that re-exports from `@edss/config`.

### Tailwind v4

No config file (v4 is CSS-first).

- Each app's `postcss.config.mjs` runs `@tailwindcss/postcss`.
- Each app's `globals.css`:

  ```css
  @import 'tailwindcss';
  @source '../../../packages/ui/src/**/*.{ts,tsx}';
  @source '../../../packages/icons/src/**/*.{ts,tsx}';
  @source '../../../packages/analytics/src/**/*.{ts,tsx}';
  @import '@edss/design-system/styles/tokens.css';
  @import '@edss/design-system/styles/tokens-light.css';
  /* dashboard-only, when it exists: @import '@edss/design-system/styles/tokens-dark.css'; scoped under .dark selector */
  /* app-owned utilities below */
  ```

- `@source` directives are mandatory so Tailwind v4 scans class strings inside workspace packages.

### `next.config.mjs` in both apps

```js
transpilePackages: [
  '@edss/design-system',
  '@edss/ui',
  '@edss/icons',
  '@edss/hooks',
  '@edss/utils',
  '@edss/analytics',
]
```

## 6. Migration stages

Every stage ends with green `next build`, green `turbo run typecheck lint`, green headless Playwright snapshot diff against the pre-migration baseline, and one squash-merged PR to `main`. Baseline captured immediately after Stage 0 (git init + initial commit) but before any Stage 1 code change, into `scratchpad/baseline-shots/`, `scratchpad/baseline-build.txt`, `scratchpad/baseline-routes.md`. Stage 0 itself has no baseline check — it only initializes version control.

### Stage 0 — Git initialization (repo prerequisite)

The current working tree at `D:\Aman_Build\External Frontend\self v1` is not a git repository. Every downstream stage assumes commits, `git mv`, PR flow, and revert-based rollback, so git must exist before Stage 1 runs.

1. Confirm branch naming and remote target with the user (GitHub, GitLab, self-hosted).
2. `git init` at repo root; set `main` as default branch.
3. Ensure `.gitignore` covers `node_modules/`, `.next/`, `.turbo/`, `.env*` (not `.env.example`), `dist/`, `.impeccable/` outputs, `scratchpad/`.
4. Initial commit of current tree as-is: `chore: initial commit of edss-web pre-monorepo baseline`.
5. Push to remote, protect `main` (require PR + status checks once CI lands).
6. Confirm husky prepare script runs after `npm install`.

No visual or behavioral change. No approval needed beyond confirming branch/remote choice.

### Stage 1 — Turborepo scaffold at root, marketing untouched

1. Create `packages/config/{eslint,tsconfig,prettier}` presets, byte-equivalent to current root `eslint.config.mjs`, `tsconfig.json`, `prettier.config.mjs`.
2. Add root `turbo.json`.
3. Rewrite root `package.json` to workspaces + turbo scripts (all current website deps still declared at root; website still lives at repo root during this stage).
4. Add `turbo` devDep at root; run `npm install`; verify `npx turbo --version`.
5. Confirm `npm run build` still delegates cleanly to `next build` — no path changes yet.
6. Playwright snapshot pass against baseline — zero diff expected.
7. Commit: `chore(monorepo): add turborepo scaffold + shared config package`.

### Stage 2 — Move website to `apps/website/`

1. `git mv` root-level app files into `apps/website/` — everything except `docs/`, `.husky/`, `.gitignore`, `.env.example`, root `README.md`, `.impeccable/`, `node_modules/`, `.next/`, `packages/`.
2. Move current root `README.md` and `PLAN.md` into `apps/website/`; write new root `README.md` describing the monorepo.
3. `apps/website/package.json`: rename to `@edss/website`, keep private, keep all current runtime deps, drop tooling deps (`eslint`, `prettier`, `typescript`, plugins) — those now come from `@edss/config` as devDeps.
4. `apps/website/tsconfig.json` extends `@edss/config/tsconfig/next.json`; existing path aliases preserved.
5. `apps/website/eslint.config.mjs` re-exports `@edss/config/eslint/next`.
6. `apps/website/next.config.mjs` adds `transpilePackages: ['@edss/config']` (no-op today; kept for Stage 3+ readiness).
7. Root `package.json`: strip website deps, keep only turbo/prettier/typescript/husky/lint-staged.
8. Verify husky `.husky/pre-commit` still runs `lint-staged` at root; dummy commit test.
9. `npm install`, `npx turbo run build typecheck lint`.
10. Playwright snapshot pass — zero diff.
11. Commit: `chore(monorepo): move edss-web to apps/website`.

### Stage 3 — Extract `@edss/design-system`

1. Create `packages/design-system` skeleton.
2. Split `apps/website/styles/globals.css`:
    - `packages/design-system/src/styles/tokens.css` — the `@theme` block (mode-agnostic tokens + font declarations + motion tokens).
    - `packages/design-system/src/styles/tokens-light.css` — light-mode surface overrides (may be empty if current tokens are effectively light).
    - `packages/design-system/src/styles/tokens-dark.css` — stub with TODO comment, unused by website.
    - `apps/website/styles/globals.css` — retains `@import 'tailwindcss'` at top, then `@source` directives, then imports from `@edss/design-system`, then app-owned utilities (`.marquee`, `.noise`, `.on-ink`, `.container-edss`, etc.). Import order fixed.
3. Move `next/font` declarations from `apps/website/app/layout.tsx` into `packages/design-system/src/fonts.ts`; website imports `{ fraunces, plex, geistMono }` from `@edss/design-system/fonts`.
4. Move motion tokens (ease + duration constants) into `packages/design-system/src/motion.ts`; every consumer imports from `@edss/design-system/motion`.
5. Extend `apps/website/next.config.mjs`'s `transpilePackages` with `@edss/design-system`.
6. Verify: build green, font CLS unchanged, motion timings byte-identical, Playwright diff zero.
7. Commit: `feat(design-system): extract tokens, fonts, motion into @edss/design-system`.

### Stage 4 — Extract `ui`, `icons`, `hooks`, `utils`

Per-package, in this order (each with its own commit and snapshot check):

1. `@edss/utils` — locate `cn()` and any pure formatters in `apps/website/lib/`, move them. Website updates imports.
2. `@edss/ui` — move `apps/website/components/primitives/Button.tsx` + `Form.tsx` into `packages/ui/src/`. Website updates imports. Hand-rolled implementation preserved verbatim.
3. `@edss/icons` — move `apps/website/components/icons/*` into `packages/icons/src/`; add `lucide.ts` re-exporting only icons actually used. Website updates imports.
4. `@edss/hooks` — move `useMediaQuery` and `useReducedMotion` from `apps/website/lib/hooks/index.ts` into `packages/hooks/src/`. Leave `useHeaderState` in the website. Update website imports.
5. Extend `apps/website/next.config.mjs`'s `transpilePackages` with the newly-extracted packages after each move.
6. Add `@source` directives to `apps/website/styles/globals.css` for `packages/ui`, `packages/icons`, `packages/analytics`.
7. Per package: `npx turbo run build typecheck lint`, Playwright snapshot diff, `grep -r "components/primitives" apps/website/` (or icon paths) returns nothing before commit.
8. Commits: `feat(utils): …`, `feat(ui): …`, `feat(icons): …`, `feat(hooks): …`.

### Stage 5 — `@edss/analytics` package + website wire-up

1. Create `packages/analytics`. Client wrapper mounts `<PostHogProvider>` inside app body; guards against StrictMode double-init via `useRef` flag; skips init when `NEXT_PUBLIC_POSTHOG_KEY` is absent; respects `navigator.doNotTrack === '1'` by declining `posthog.init`.
2. Server helper wraps `posthog-node` for one-off server-side captures (used later for auth events in dashboard).
3. Typed event catalog phase 1: `page_viewed` (autocapture), `contact_form_submitted`, `whatsapp_cta_clicked`, `portfolio_case_opened`, `service_detail_opened`, `journal_post_opened`.
4. Wire into `apps/website/app/layout.tsx` — provider mounts inside `<body>` at root, so autocapture fires on every route.
5. Extend `.env.example` at repo root:
    ```
    NEXT_PUBLIC_POSTHOG_KEY=
    NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
    ```
6. Extend `apps/website/next.config.mjs`'s `transpilePackages` with `@edss/analytics`.
7. Update `apps/website/scripts/check-bundle.mjs` threshold with commit note explaining the analytics addition — bump First Load JS ceiling by the observed delta (~50 kB gzip).
8. Verify: build green; in dev without a PostHog key, no capture requests fire; in a preview build with a key, Network tab shows one `/e/` request per pageview, no duplicates; Playwright snapshot diff zero (analytics does not affect layout).
9. Commit: `feat(analytics): add @edss/analytics package + wire website pageview + conversion events`.

## 7. Verification per stage

Automated (must pass before commit):

- `npm install` clean — no new peer-dep warnings vs baseline.
- `npx turbo run build` green.
- `npx turbo run typecheck` green.
- `npx turbo run lint` — no new violations vs baseline count (recorded at Stage 1 start).
- `next build` route table diff: route count unchanged; First Load JS per route within ±2 kB vs baseline (Stage 5 exempt for the analytics-induced delta).
- `npm run check:bundle` green.
- Headless Playwright snapshot suite — zero diff vs baseline across the route list in Section 7 below.

Manual walkthrough (deferred until Vercel preview per user preference): homepage, `/services` + one detail, `/portfolio` + one case, `/blog` + one MDX post, `/about`, `/careers`, `/contact`, `/faqs`, one legal page — at 1440px and 375px. Checks: Fraunces on headings, IBM Plex on body, Geist Mono on kickers; hairlines at 1px; marquee, testimonial fade, portfolio hover motion timing identical; reduced-motion honored (OS toggle); no layout shift on load; WhatsApp CTA icon; `.on-ink` contrast; contact form submits; FAQ accordion opens; keyboard focus order preserved.

Baseline captured once before Stage 1:

- Route screenshots at 1440px + 375px to `scratchpad/baseline-shots/`.
- `next build` output to `scratchpad/baseline-build.txt`.
- Route table + First Load JS to `scratchpad/baseline-routes.md`.

Rollback: any Playwright diff or manual-walkthrough regression is a rollback trigger — `git revert` the stage's commit, diagnose, retry. No forward-fixes on preservation regressions.

## 8. PostHog event catalog (phase 1)

Typed via a discriminated union in `packages/analytics/src/events.ts`.

| Event | Trigger | Payload |
|---|---|---|
| `page_viewed` | Autocapture on route change | `{ path, referrer }` (PostHog auto) |
| `contact_form_submitted` | `apps/website/components/marketing/ContactForm.tsx` on success | `{ topic, source_page }` |
| `whatsapp_cta_clicked` | `apps/website/components/marketing/WhatsAppCta.tsx` click | `{ source_page }` |
| `portfolio_case_opened` | `apps/website/app/(marketing)/portfolio/[slug]/page.tsx` mount | `{ slug }` |
| `service_detail_opened` | `apps/website/app/(marketing)/services/[slug]/page.tsx` mount | `{ slug }` |
| `journal_post_opened` | `apps/website/app/(marketing)/blog/[slug]/page.tsx` mount | `{ slug }` |

Dashboard events (identify + role, feature usage, opt-in session recording) will be added in sub-project 2. `identify(user_id, { role })` fires post-auth.

## 9. Env vars

Added to root `.env.example`:

```
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

Existing website env vars (currently in `.env.example` at root) stay at root — `apps/website/next.config.mjs` reads from the process env at build; Vercel injects per-app.

## 10. Risks and mitigations

Ranked by likelihood × impact.

1. **Tailwind v4 not scanning package sources.** v4 auto-detects content in the app's own tree only. Classes inside `@edss/ui`, `@edss/icons`, `@edss/analytics` will not emit unless `@source` directives are added to `apps/website/styles/globals.css`. Mitigation: added during Stage 4 and Stage 5; Playwright diff catches missing utilities immediately.
2. **`next/font` in a package.** Requires build-time integration with Next; works because the package is transpiled, but font config must be static (no runtime values). Mitigation: keep font declarations as top-level consts in `fonts.ts`; verify hydration matches, compare CLS and computed `font-family`.
3. **Peer-dep hell.** React 19 + Radix + Framer Motion resolution across the workspace could dedupe wrong. Mitigation: hoist `react` and `react-dom` as root devDeps; every package declares them peer only.
4. **CSS import order.** Tailwind reset must come before token imports before app utilities. Deviation breaks the cascade. Mitigation: Stage 3 fixes the order; lint or comment header enforces it.
5. **PostHog double-init in StrictMode.** Provider guards with `useRef` flag; dev-mode test.
6. **Motion tokens drift.** Byte-diff the moved `motion.ts` values against the source; consumer tests still animate identically.
7. **Husky path resolution post-migration.** `.husky/pre-commit` must resolve `lint-staged` from repo root. Mitigation: one dummy commit test at end of Stage 2.
8. **Bundle-size threshold.** `check-bundle.mjs` fixed limits breach at Stage 5. Mitigation: single explicit threshold bump in the same commit, explained in message.

## 11. Rollback plan

- Each stage is a single commit or short commit chain merged as its own PR.
- Baseline artifacts in `scratchpad/` are the reference for every stage.
- No force-push. Every stage pushed to a `chore/monorepo-stage-N` branch, PR reviewed, squash-merged to `main` only after all checks green.
- If a stage breaks something not caught until later, `git revert` the merged squash commit and reopen the branch.

## 12. Out of scope (deferred)

- `apps/dashboard/` scaffold — sub-project 2.
- `packages/api`, `packages/auth`, `packages/validation`, `packages/types` — sub-projects 2 and 3.
- shadcn/ui primitives — sub-project 2, inside `@edss/ui`.
- Dark mode wiring in dashboard — sub-project 2.
- Consent banner for PostHog — sub-project 6 (cross-cutting).
- Self-hosted PostHog on Indian infra — future migration when DPDP compliance tightens.
- Playwright suite promotion to CI — cross-cutting sub-project. Phase 1 uses local headless runs.
- Test framework choice and any test coverage — cross-cutting sub-project.

## 13. Definition of done

- Repo layout matches Section 3 exactly.
- All seven packages listed in Section 4 exist with the specified `exports` maps.
- `npx turbo run build lint typecheck` green from repo root.
- Marketing site on Vercel preview passes manual walkthrough per Section 7 with zero regression.
- PostHog Cloud EU receives `page_viewed` events from a preview build with the key set.
- Repo initialized (Stage 0) with a remote and `main` branch protection ready.
- Five squash-merged PRs on `main`, one per subsequent stage (Stages 1–5).
- Baseline artifacts retained in `scratchpad/` for later reference.
