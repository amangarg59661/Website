# Monorepo Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the existing `edss-web` Next.js repository into a Turborepo monorepo hosting `apps/website` (the current marketing site, unchanged in output) plus six shared packages (`@edss/config`, `@edss/design-system`, `@edss/ui`, `@edss/icons`, `@edss/hooks`, `@edss/utils`, `@edss/analytics`), wire PostHog analytics into the website, and land it as five squash-merged PRs on a fresh GitHub private repo `SelfHosted_V1`.

**Architecture:** In-place migration with `git mv`. Raw-TS packages consumed by Next.js via `transpilePackages`; no dist builds. Tailwind v4 tokens shared via CSS files in `@edss/design-system`; each app owns its own `globals.css` for app-specific utilities. Marketing preservation is the hard constraint — every stage ends with a Playwright snapshot diff against a pre-migration baseline.

**Tech Stack:** Turborepo 2.3, Next.js 15.1, React 19, TypeScript 5.7, Tailwind CSS v4, Framer Motion 11, Radix UI, npm 10 workspaces, Playwright 1.49 (snapshots only), posthog-js / posthog-node.

**Spec:** [docs/superpowers/specs/2026-07-06-monorepo-migration-design.md](../specs/2026-07-06-monorepo-migration-design.md)

---

## File Structure — target state after all stages

Files created (`C`) or modified (`M`) per stage. Every path is repo-root-relative.

| Path | Stage | C/M | Responsibility |
|---|---|---|---|
| `.gitignore` | 0 | M | Add `.turbo/`, keep everything else. |
| `README.md` | 2 | M | Rewrite to describe monorepo (old README moves to `apps/website/`). |
| `package.json` | 1 | M | Root workspace manifest — Turbo scripts + root devDeps only. |
| `turbo.json` | 1 | C | Turborepo pipeline. |
| `tsconfig.json` | 1 | M | Root — `references: []`, no compile. |
| `packages/config/package.json` | 1 | C | `@edss/config`. |
| `packages/config/eslint/base.js` | 1 | C | Base ESLint flat config. |
| `packages/config/eslint/next.js` | 1 | C | Next-specific ESLint. |
| `packages/config/tsconfig/base.json` | 1 | C | Base TS config. |
| `packages/config/tsconfig/next.json` | 1 | C | Next TS config. |
| `packages/config/tsconfig/react-library.json` | 1 | C | Library TS config. |
| `packages/config/prettier/index.js` | 1 | C | Prettier config. |
| `apps/website/…` (all current root app files) | 2 | M | Moved from repo root via `git mv`. |
| `apps/website/package.json` | 2 | M | Rename to `@edss/website`, drop tooling deps. |
| `apps/website/tsconfig.json` | 2 | M | Extends `@edss/config/tsconfig/next.json`. |
| `apps/website/eslint.config.mjs` | 2 | M | Re-exports `@edss/config/eslint/next`. |
| `apps/website/next.config.mjs` | 2 | M | Adds `transpilePackages`. |
| `packages/design-system/package.json` | 3 | C | `@edss/design-system`. |
| `packages/design-system/src/styles/tokens.css` | 3 | C | Mode-agnostic tokens (`@theme` block). |
| `packages/design-system/src/styles/tokens-light.css` | 3 | C | Light-mode surface overrides. |
| `packages/design-system/src/styles/tokens-dark.css` | 3 | C | Dark-mode surface stub. |
| `packages/design-system/src/fonts.ts` | 3 | C | `next/font` instances. |
| `packages/design-system/src/motion.ts` | 3 | C | Easing + duration TS constants. |
| `packages/design-system/src/index.ts` | 3 | C | Barrel. |
| `apps/website/styles/globals.css` | 3 | M | Reduced to `@import 'tailwindcss'` + `@source` + shared token imports + website-only utilities. |
| `apps/website/app/layout.tsx` | 3 | M | Font imports from `@edss/design-system/fonts`. |
| `packages/utils/*` | 4a | C | `@edss/utils` — `cn`, `format`. |
| `apps/website/lib/utils/*` | 4a | M | Delete after re-imports point to `@edss/utils`. |
| `packages/ui/*` | 4b | C | `@edss/ui` — Button, ButtonLink, Form primitives. |
| `apps/website/components/primitives/*` | 4b | M | Delete after re-imports point to `@edss/ui`. |
| `packages/icons/*` | 4c | C | `@edss/icons` — Wordmark, Monogram, LogoMark, lucide re-exports. |
| `apps/website/components/icons/*` | 4c | M | Delete after re-imports point to `@edss/icons`. |
| `packages/hooks/*` | 4d | C | `@edss/hooks` — `useMediaQuery`, `useReducedMotion`, `useInViewOnce`. |
| `apps/website/lib/hooks/index.ts` | 4d | M | Retain only `useHeaderState`; drop the three moved hooks. |
| `packages/analytics/*` | 5 | C | `@edss/analytics` — PostHog client provider, server helpers, event catalog. |
| `apps/website/app/layout.tsx` | 5 | M | Mount `<PostHogProvider>` inside `<body>`. |
| `apps/website/scripts/check-bundle.mjs` | 5 | M | Bump First Load JS ceiling ~50 kB. |
| `.env.example` | 5 | M | Add `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`. |

---

## Baseline capture (runs once after Stage 0)

Every subsequent stage ends with an automated diff against this baseline. Baseline lives in `scratchpad/` — gitignored.

**Baseline artifacts:**
- `scratchpad/baseline-build.txt` — output of `npm run build` (route table + First Load JS).
- `scratchpad/baseline-routes.md` — hand-transcribed route table extracted from build output for easy visual diffing.
- `scratchpad/baseline-shots/` — one PNG per route × two viewports (1440 × 900, 375 × 812).

**Playwright suite** — new dev dep at root, added in Stage 1 Task 1.10.

**Routes exercised:**
- `/`
- `/about`
- `/services`
- `/services/web` (or first available service slug — enumerated in Task 1.10)
- `/portfolio`
- `/portfolio/<first-slug>` (enumerated in Task 1.10)
- `/blog`
- `/blog/<first-slug>` (enumerated in Task 1.10)
- `/careers`
- `/contact`
- `/faqs`
- `/legal/privacy` (or first legal page)

---

## Stage 0 — Git initialization

Prerequisite. No monorepo change; only version-control setup.

### Task 0.1: Confirm gh CLI is available

**Files:** none

- [ ] **Step 1: Check gh presence**

Run: `gh --version`
Expected: `gh version 2.x.x ...` (any 2.x).

- [ ] **Step 2: If missing, install then re-run**

Windows: `winget install --id GitHub.cli`. On any other host, use the platform installer at https://cli.github.com/. Re-run `gh --version` to confirm.

- [ ] **Step 3: Verify authentication**

Run: `gh auth status`
Expected: `Logged in to github.com as <user>`. If not, run `gh auth login`, choose GitHub.com, HTTPS, browser flow. Re-check.

### Task 0.2: Initialize local git repo

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: `git init`**

Run at repo root: `git init -b main`
Expected: `Initialized empty Git repository in D:/Aman_Build/External Frontend/self v1/.git/`.

- [ ] **Step 2: Verify `.gitignore` already covers the essentials, then extend**

Read `.gitignore`. Add these lines at the bottom under new headings:

```
# turborepo
.turbo

# scratchpad (baselines, ephemeral artifacts)
/scratchpad
```

- [ ] **Step 3: Stage everything and confirm no secrets**

Run: `git add -A && git status`
Look at the staged list. Confirm no `.env`, no `.env.local`, no `node_modules`, no `.next/`, no `.turbo/`, no `scratchpad/`. If any appear, add the pattern to `.gitignore` and re-stage.

- [ ] **Step 4: Initial commit**

```bash
git commit -m "chore: initial commit of edss-web pre-monorepo baseline"
```

Expected: single commit created on `main`.

### Task 0.3: Create the GitHub private repo and push

**Files:** none

- [ ] **Step 1: Create remote and set upstream**

Run at repo root:

```bash
gh repo create SelfHosted_V1 --private --source=. --remote=origin --push
```

Expected: repo appears at `https://github.com/<user>/SelfHosted_V1`, `main` branch created, initial commit pushed. `git remote -v` shows `origin` pointing at the new repo.

- [ ] **Step 2: Verify push**

Run: `git log --oneline -1 origin/main`
Expected: prints the same commit hash as `git log --oneline -1 main`.

### Task 0.4: Snapshot baseline artifacts (pre-migration reference)

**Files:**
- Create: `scratchpad/baseline-build.txt`
- Create: `scratchpad/baseline-routes.md`

- [ ] **Step 1: Ensure `scratchpad/` exists**

Run: `mkdir -p scratchpad`

- [ ] **Step 2: Run production build and capture full output**

```bash
npm install
npm run build > scratchpad/baseline-build.txt 2>&1
```

Expected: `scratchpad/baseline-build.txt` contains the Next.js route table (`Route (app)`, `Size`, `First Load JS`), no errors.

- [ ] **Step 3: Hand-transcribe the route table**

Open `scratchpad/baseline-build.txt`. Copy the routes+sizes table into `scratchpad/baseline-routes.md` as a Markdown table. This is the human-readable reference for later "did any route regress?" checks.

- [ ] **Step 4: Commit the plan and baseline reference**

The baseline itself is gitignored (spec Section 11: rollback reference, ephemeral). But the design doc + this plan should now go up:

```bash
git add docs/superpowers/
git commit -m "docs: add monorepo migration spec + implementation plan"
git push
```

Expected: docs on `origin/main`.

### Task 0.5: Playwright snapshot baseline

Deferred to Task 1.10 — Playwright dep does not exist yet; we install it during Stage 1 alongside Turbo. Stage 1 opens with the Playwright install; the very next task after install (1.11) captures the baseline snapshots before any code change.

**Rationale:** Installing Playwright and its browser binaries is a workspace-wide operation; postponing it one task keeps Stage 0 minimal.

---

## Stage 1 — Turborepo scaffold at root, marketing untouched

Marketing site continues to build unchanged. All new files live in `packages/config/`, `turbo.json`, and the rewritten root `package.json`.

### Task 1.1: Create a feature branch

**Files:** none

- [ ] **Step 1: Branch off `main`**

```bash
git checkout -b chore/monorepo-stage-1-scaffold
```

### Task 1.2: Create `packages/config` skeleton

**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/README.md`

- [ ] **Step 1: Create directory tree**

```bash
mkdir -p packages/config/eslint packages/config/tsconfig packages/config/prettier
```

- [ ] **Step 2: Write `packages/config/package.json`**

```json
{
  "name": "@edss/config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./eslint/base": "./eslint/base.js",
    "./eslint/next": "./eslint/next.js",
    "./tsconfig/base.json": "./tsconfig/base.json",
    "./tsconfig/next.json": "./tsconfig/next.json",
    "./tsconfig/react-library.json": "./tsconfig/react-library.json",
    "./prettier": "./prettier/index.js"
  },
  "peerDependencies": {
    "eslint": ">=9",
    "prettier": ">=3",
    "typescript": ">=5"
  }
}
```

- [ ] **Step 3: Write minimal `packages/config/README.md`**

```markdown
# @edss/config

Shared tooling presets (ESLint, TypeScript, Prettier) consumed by every app and package in this monorepo. No runtime code.
```

### Task 1.3: Move ESLint config into `@edss/config`

**Files:**
- Create: `packages/config/eslint/base.js`
- Create: `packages/config/eslint/next.js`

- [ ] **Step 1: Write `packages/config/eslint/base.js`**

Byte-equivalent to the rules block from current root `eslint.config.mjs`, minus the Next extends.

```js
export const baseRules = {
  "@typescript-eslint/consistent-type-imports": [
    "error",
    { prefer: "type-imports", fixStyle: "inline-type-imports" },
  ],
  "@typescript-eslint/no-unused-vars": [
    "error",
    { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
  ],
};

export default [
  {
    rules: baseRules,
  },
];
```

- [ ] **Step 2: Write `packages/config/eslint/next.js`**

Extends Next core-web-vitals + Next typescript + base rules.

```js
import { FlatCompat } from "@eslint/eslintrc";
import { baseRules } from "./base.js";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: baseRules,
  },
];
```

### Task 1.4: Move TypeScript configs into `@edss/config`

**Files:**
- Create: `packages/config/tsconfig/base.json`
- Create: `packages/config/tsconfig/next.json`
- Create: `packages/config/tsconfig/react-library.json`

- [ ] **Step 1: Write `packages/config/tsconfig/base.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": false
  },
  "exclude": ["node_modules", "dist", ".next", ".turbo"]
}
```

- [ ] **Step 2: Write `packages/config/tsconfig/next.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "allowJs": true,
    "plugins": [{ "name": "next" }]
  }
}
```

- [ ] **Step 3: Write `packages/config/tsconfig/react-library.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "declaration": true
  }
}
```

### Task 1.5: Move Prettier config into `@edss/config`

**Files:**
- Create: `packages/config/prettier/index.js`

- [ ] **Step 1: Write `packages/config/prettier/index.js`**

Byte-equivalent to current root `prettier.config.mjs`.

```js
/** @type {import('prettier').Config} */
const config = {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2,
  plugins: ["prettier-plugin-tailwindcss"],
};

export default config;
```

### Task 1.6: Write `turbo.json`

**Files:**
- Create: `turbo.json`

- [ ] **Step 1: Write `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "format": {
      "cache": false
    }
  }
}
```

### Task 1.7: Rewrite root `package.json` for workspaces

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Replace root `package.json` entirely**

Keep every runtime dep exactly as it was (marketing site still lives at root during Stage 1 — moves in Stage 2). Only workspace + Turbo bits are added.

```json
{
  "name": "edss-monorepo",
  "version": "0.0.0",
  "private": true,
  "description": "Elite Digital Solutions Studio — monorepo (website + dashboard + shared packages)",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "start": "next start",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "format": "prettier --write \"**/*.{ts,tsx,md,mdx,css,json}\"",
    "analyze": "ANALYZE=true turbo run build",
    "check:bundle": "node scripts/check-bundle.mjs",
    "prepare": "husky"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.2",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-popover": "^1.1.4",
    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.2",
    "@radix-ui/react-tooltip": "^1.1.5",
    "@vercel/analytics": "^1.4.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^11.15.0",
    "gray-matter": "^4.0.3",
    "lenis": "^1.1.20",
    "lucide-react": "^0.469.0",
    "next": "15.1.3",
    "next-mdx-remote": "^5.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.54.2",
    "rehype-autolink-headings": "^7.1.0",
    "rehype-pretty-code": "^0.14.0",
    "rehype-slug": "^6.0.0",
    "shiki": "^1.24.4",
    "tailwind-merge": "^2.6.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@edss/config": "*",
    "@next/bundle-analyzer": "^15.1.3",
    "@tailwindcss/postcss": "^4.0.0",
    "@types/node": "^22.10.5",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "@playwright/test": "^1.49.0",
    "eslint": "^9.17.0",
    "eslint-config-next": "15.1.3",
    "husky": "^9.1.7",
    "lint-staged": "^15.3.0",
    "postcss": "^8.4.49",
    "prettier": "^3.4.2",
    "prettier-plugin-tailwindcss": "^0.6.9",
    "tailwindcss": "^4.0.0",
    "turbo": "^2.3.0",
    "typescript": "^5.7.2"
  },
  "lint-staged": {
    "*.{ts,tsx,md,mdx,css,json}": ["prettier --write"]
  },
  "engines": { "node": ">=20.11" },
  "packageManager": "npm@10"
}
```

### Task 1.8: Reroute root `tsconfig.json`, ESLint, and Prettier to consume `@edss/config`

**Files:**
- Modify: `tsconfig.json`
- Modify: `eslint.config.mjs`
- Delete: `prettier.config.mjs` (re-created inside `apps/website/` in Stage 2; during Stage 1 the root Prettier config re-exports from `@edss/config`)

- [ ] **Step 1: Rewrite root `tsconfig.json`**

Stage 1 keeps the site at root, so root TS still needs to compile it. We extend `@edss/config/tsconfig/next.json` and keep the current path aliases + include glob.

```json
{
  "extends": "@edss/config/tsconfig/next.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/content/*": ["./content/*"],
      "@/data/*": ["./data/*"],
      "@/config/*": ["./config/*"],
      "@/styles/*": ["./styles/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "packages/**", "apps/**"]
}
```

- [ ] **Step 2: Rewrite root `eslint.config.mjs`**

```js
import config from "@edss/config/eslint/next";

export default config;
```

- [ ] **Step 3: Replace `prettier.config.mjs` with a re-export**

```js
export { default } from "@edss/config/prettier";
```

### Task 1.9: Install dependencies and verify Turbo

**Files:** none

- [ ] **Step 1: Fresh install at workspace root**

```bash
rm -rf node_modules package-lock.json
npm install
```

Expected: `@edss/config` resolves as a workspace symlink under `node_modules/@edss/config`. Zero peer-dep warnings we didn't already have.

- [ ] **Step 2: Verify Turbo picks up the workspace**

Run: `npx turbo --version`
Expected: `2.x.x`.

Run: `npx turbo run build --dry-run`
Expected: at least one task listed (`build#build` in the root package because the site still lives there in Stage 1).

- [ ] **Step 3: Verify a real build still passes**

Run: `npm run build`
Expected: same route table as `scratchpad/baseline-build.txt`, no new warnings/errors.

### Task 1.10: Add Playwright and enumerate route list

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/visual/routes.ts`

- [ ] **Step 1: Install Playwright and download browser binaries**

```bash
npm install --save-dev @playwright/test@^1.49.0
npx playwright install chromium
```

Expected: chromium downloaded. No other browsers.

- [ ] **Step 2: Enumerate exact route slugs**

Run these lookups to pick the deep-link routes referenced in the baseline set:

```bash
ls "app/(marketing)/services"
ls "app/(marketing)/portfolio"
ls "app/(marketing)/blog"
ls "app/(marketing)/legal"
```

Pick the alphabetically-first directory that contains a `page.tsx` from each list and record it. Where the directory uses `[slug]` (dynamic route), open `content/` or `data/` to find a real slug value.

- [ ] **Step 3: Write `tests/visual/routes.ts`**

Replace `SERVICE_SLUG`, `PORTFOLIO_SLUG`, `BLOG_SLUG`, `LEGAL_SLUG` with the concrete strings from Step 2.

```ts
export const ROUTES = [
  "/",
  "/about",
  "/services",
  `/services/${"SERVICE_SLUG"}`,
  "/portfolio",
  `/portfolio/${"PORTFOLIO_SLUG"}`,
  "/blog",
  `/blog/${"BLOG_SLUG"}`,
  "/careers",
  "/contact",
  "/faqs",
  `/legal/${"LEGAL_SLUG"}`,
];

export const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 375, height: 812 },
];
```

- [ ] **Step 4: Write `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/visual",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
    screenshot: "off",
  },
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
```

### Task 1.11: Write the snapshot suite and capture baseline

**Files:**
- Create: `tests/visual/snapshot.spec.ts`
- Create: `scratchpad/baseline-shots/` (populated as a side effect)

- [ ] **Step 1: Write `tests/visual/snapshot.spec.ts`**

The suite captures one PNG per (route × viewport). On the first run without a baseline, Playwright records the baseline in `tests/visual/snapshot.spec.ts-snapshots/`. Later stages fail if any diff exceeds threshold.

```ts
import { test, expect } from "@playwright/test";
import { ROUTES, VIEWPORTS } from "./routes";

for (const viewport of VIEWPORTS) {
  test.describe(`viewport ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of ROUTES) {
      test(`${route}`, async ({ page }) => {
        await page.goto(route, { waitUntil: "networkidle" });
        await page.evaluate(async () => {
          if (document.fonts) await document.fonts.ready;
        });
        await page.waitForTimeout(300);
        await expect(page).toHaveScreenshot(
          `${viewport.name}-${route.replace(/\//g, "_") || "root"}.png`,
          { fullPage: true, maxDiffPixelRatio: 0.001 },
        );
      });
    }
  });
}
```

- [ ] **Step 2: Run the suite once to record the baseline**

```bash
npx playwright test --update-snapshots
```

Expected: Playwright starts `npm run build && npm run start`, walks every route × viewport, writes PNG snapshots into `tests/visual/snapshot.spec.ts-snapshots/`, and reports every test as passing (baseline was just written, so any comparison passes).

- [ ] **Step 3: Copy the snapshot dir into `scratchpad/` as an off-repo reference**

```bash
cp -R tests/visual/snapshot.spec.ts-snapshots scratchpad/baseline-shots
```

Expected: `scratchpad/baseline-shots/` populated. Snapshots inside `tests/visual/` are the working reference and go into git; the scratchpad copy is a paranoia backup.

- [ ] **Step 4: Verify a second run yields zero diffs**

```bash
npx playwright test
```

Expected: all tests pass. Any failure = the run was non-deterministic (fonts, animations, network) — investigate before continuing.

### Task 1.12: Commit Stage 1 and open PR

**Files:** none

- [ ] **Step 1: Stage and commit**

```bash
git add packages/config turbo.json package.json package-lock.json tsconfig.json eslint.config.mjs prettier.config.mjs playwright.config.ts tests/visual .gitignore
git commit -m "chore(monorepo): add turborepo scaffold + shared @edss/config + playwright baseline"
```

- [ ] **Step 2: Push and open PR**

```bash
git push -u origin chore/monorepo-stage-1-scaffold
gh pr create --fill --base main --head chore/monorepo-stage-1-scaffold
```

- [ ] **Step 3: Merge (squash) and clean up**

Merge on GitHub UI or via CLI:

```bash
gh pr merge --squash --delete-branch
git checkout main && git pull
```

---

## Stage 2 — Move website to `apps/website/`

Marketing site relocates to `apps/website/`. Output must not change.

### Task 2.1: Feature branch

**Files:** none

- [ ] **Step 1: Branch off `main`**

```bash
git checkout -b chore/monorepo-stage-2-move-website
```

### Task 2.2: Create target dir and move source files with `git mv`

**Files:**
- Modify (moved): `app/`, `components/`, `config/`, `content/`, `data/`, `lib/`, `public/`, `scripts/`, `styles/`, `next.config.mjs`, `next-env.d.ts`, `postcss.config.mjs`, `PLAN.md`, `README.md`, `tsconfig.json`, `eslint.config.mjs`, `prettier.config.mjs`

- [ ] **Step 1: Create the target directory**

```bash
mkdir -p apps/website
```

- [ ] **Step 2: Move source dirs and files via `git mv`**

```bash
git mv app apps/website/app
git mv components apps/website/components
git mv config apps/website/config
git mv content apps/website/content
git mv data apps/website/data
git mv lib apps/website/lib
git mv public apps/website/public
git mv scripts apps/website/scripts
git mv styles apps/website/styles
git mv next.config.mjs apps/website/next.config.mjs
git mv next-env.d.ts apps/website/next-env.d.ts
git mv postcss.config.mjs apps/website/postcss.config.mjs
git mv PLAN.md apps/website/PLAN.md
git mv README.md apps/website/README.md
git mv tsconfig.json apps/website/tsconfig.json
git mv eslint.config.mjs apps/website/eslint.config.mjs
git mv prettier.config.mjs apps/website/prettier.config.mjs
```

Do NOT move `.gitignore`, `.env.example`, `.husky/`, `.impeccable/`, `docs/`, `packages/`, `turbo.json`, `package.json`, `package-lock.json`, `node_modules/`, `.next/`, `playwright.config.ts`, `tests/`, `scratchpad/`.

- [ ] **Step 3: Verify tree structure**

```bash
ls apps/website
ls
```

Expected under `apps/website/`: everything listed in Step 2. Expected at root: `.env.example`, `.gitignore`, `.husky`, `.impeccable`, `apps`, `docs`, `node_modules`, `package.json`, `package-lock.json`, `packages`, `playwright.config.ts`, `README.md` (about to be re-written), `scratchpad`, `tests`, `tsconfig.json`, `turbo.json`.

### Task 2.3: Write `apps/website/package.json`

**Files:**
- Create: `apps/website/package.json`

- [ ] **Step 1: Author the website manifest**

Drops tooling deps (they migrate to root or `@edss/config`); keeps every runtime dep. Adds `@edss/config` as devDep.

```json
{
  "name": "@edss/website",
  "version": "0.1.0",
  "private": true,
  "description": "Elite Digital Solutions Studio — marketing website",
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write \"**/*.{ts,tsx,md,mdx,css,json}\"",
    "analyze": "ANALYZE=true next build",
    "check:bundle": "node scripts/check-bundle.mjs"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.2",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-popover": "^1.1.4",
    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.2",
    "@radix-ui/react-tooltip": "^1.1.5",
    "@vercel/analytics": "^1.4.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^11.15.0",
    "gray-matter": "^4.0.3",
    "lenis": "^1.1.20",
    "lucide-react": "^0.469.0",
    "next": "15.1.3",
    "next-mdx-remote": "^5.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.54.2",
    "rehype-autolink-headings": "^7.1.0",
    "rehype-pretty-code": "^0.14.0",
    "rehype-slug": "^6.0.0",
    "shiki": "^1.24.4",
    "tailwind-merge": "^2.6.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@edss/config": "*",
    "@next/bundle-analyzer": "^15.1.3",
    "@tailwindcss/postcss": "^4.0.0",
    "@types/node": "^22.10.5",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "postcss": "^8.4.49"
  }
}
```

### Task 2.4: Rewire `apps/website/tsconfig.json`, ESLint, Prettier

**Files:**
- Modify: `apps/website/tsconfig.json`
- Modify: `apps/website/eslint.config.mjs`
- Modify: `apps/website/prettier.config.mjs`

- [ ] **Step 1: Rewrite `apps/website/tsconfig.json`**

Extends `@edss/config`, preserves path aliases (unchanged — website source paths did not shift).

```json
{
  "extends": "@edss/config/tsconfig/next.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/content/*": ["./content/*"],
      "@/data/*": ["./data/*"],
      "@/config/*": ["./config/*"],
      "@/styles/*": ["./styles/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 2: Rewrite `apps/website/eslint.config.mjs`**

```js
import config from "@edss/config/eslint/next";

export default config;
```

- [ ] **Step 3: Rewrite `apps/website/prettier.config.mjs`**

```js
export { default } from "@edss/config/prettier";
```

### Task 2.5: Update `apps/website/next.config.mjs` for future package transpilation

**Files:**
- Modify: `apps/website/next.config.mjs`

- [ ] **Step 1: Add `transpilePackages` field to `nextConfig`**

Insert immediately after the `experimental` block. No runtime effect yet (no `@edss/*` runtime deps installed for the website), but wires the plumbing so Stage 3+ can extract packages without another config edit per stage.

```js
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  transpilePackages: [
    "@edss/design-system",
    "@edss/ui",
    "@edss/icons",
    "@edss/hooks",
    "@edss/utils",
    "@edss/analytics",
  ],
  experimental: {
    // ...unchanged...
  },
  // ...rest unchanged...
};
```

Keep every other field byte-identical.

### Task 2.6: Strip website-only deps from root `package.json`

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Rewrite root `package.json` to workspace-orchestrator role**

Root no longer runs a Next app; drops all runtime deps. Keeps only tooling, Turbo, Husky, Playwright, tsc.

```json
{
  "name": "edss-monorepo",
  "version": "0.0.0",
  "private": true,
  "description": "Elite Digital Solutions Studio — monorepo (website + dashboard + shared packages)",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "format": "prettier --write \"**/*.{ts,tsx,md,mdx,css,json}\"",
    "test:visual": "playwright test",
    "test:visual:update": "playwright test --update-snapshots",
    "prepare": "husky"
  },
  "devDependencies": {
    "@edss/config": "*",
    "@playwright/test": "^1.49.0",
    "husky": "^9.1.7",
    "lint-staged": "^15.3.0",
    "prettier": "^3.4.2",
    "prettier-plugin-tailwindcss": "^0.6.9",
    "turbo": "^2.3.0",
    "typescript": "^5.7.2"
  },
  "lint-staged": {
    "*.{ts,tsx,md,mdx,css,json}": ["prettier --write"]
  },
  "engines": { "node": ">=20.11" },
  "packageManager": "npm@10"
}
```

### Task 2.7: Rewrite root `tsconfig.json` to non-compiling references-only

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: Reduce root tsconfig to a stub**

```json
{
  "compilerOptions": {
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": [],
  "exclude": ["node_modules", "apps", "packages", ".next", ".turbo"]
}
```

### Task 2.8: Delete stale root config files

**Files:**
- Delete: `eslint.config.mjs` (root)
- Delete: `prettier.config.mjs` (root)

- [ ] **Step 1: Remove root tooling configs**

```bash
git rm eslint.config.mjs prettier.config.mjs
```

Root workspace no longer needs its own copies — `apps/website/*` and every package own theirs.

### Task 2.9: Write new root `README.md`

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write root README**

```markdown
# Elite Digital Solutions — monorepo

Turborepo monorepo for the Elite Digital Solutions website and the forthcoming Business Operations Platform dashboard.

## Layout

- `apps/website` — public marketing site (production).
- `packages/design-system` — shared Tailwind tokens, fonts, motion constants.
- `packages/ui` — cross-app primitives.
- `packages/icons` — brand SVGs and curated Lucide re-exports.
- `packages/hooks` — shared React hooks.
- `packages/utils` — pure helper functions.
- `packages/analytics` — PostHog wrapper.
- `packages/config` — ESLint, TypeScript, Prettier presets.

## Common commands

```bash
npm install              # install all workspaces
npm run dev              # runs every app's dev server via Turbo
npm run build            # builds every app
npm run lint             # lints every workspace
npm run typecheck        # TypeScript check across every workspace
npm run test:visual      # Playwright preservation snapshots for apps/website
```

See [docs/superpowers/specs/2026-07-06-monorepo-migration-design.md](docs/superpowers/specs/2026-07-06-monorepo-migration-design.md) for the sub-project 1 design and [docs/superpowers/plans/2026-07-06-monorepo-migration.md](docs/superpowers/plans/2026-07-06-monorepo-migration.md) for the implementation plan.
```

### Task 2.10: Install, verify, snapshot, commit, PR

**Files:** none

- [ ] **Step 1: Fresh install**

```bash
rm -rf node_modules apps/website/node_modules package-lock.json
npm install
```

Expected: `apps/website/node_modules` symlinks to the workspace root's hoisted packages; `@edss/config` symlinks under both root and website `node_modules`.

- [ ] **Step 2: Build the workspace via Turbo**

```bash
npm run build
```

Expected: Turbo finds one buildable workspace (`@edss/website`) and runs `next build` inside `apps/website`. Route table matches `scratchpad/baseline-build.txt`.

- [ ] **Step 3: Typecheck and lint**

```bash
npm run typecheck
npm run lint
```

Expected: green.

- [ ] **Step 4: Run the visual suite**

```bash
npm run test:visual
```

Expected: every snapshot passes with zero pixel diff. If any diff appears, investigate before continuing — Stage 2 must be output-preserving per [preserve-marketing-site](../../../../../../../../.claude/projects/D--Aman-Build-External-Frontend-self-v1/memory/feedback_preserve_marketing.md).

- [ ] **Step 5: Husky sanity check**

```bash
touch _husky_probe && git add _husky_probe && git commit -m "chore: probe husky path"
git reset --hard HEAD~1
```

Expected: `lint-staged` ran on the probe (empty change → no-op). If Husky prints "command not found" or the hook silently skips, fix `.husky/pre-commit` to invoke `npx lint-staged` before proceeding.

- [ ] **Step 6: Commit and PR**

```bash
git add -A
git commit -m "chore(monorepo): move edss-web to apps/website"
git push -u origin chore/monorepo-stage-2-move-website
gh pr create --fill --base main --head chore/monorepo-stage-2-move-website
gh pr merge --squash --delete-branch
git checkout main && git pull
```

---

## Stage 3 — Extract `@edss/design-system`

Split the current `apps/website/styles/globals.css` into shared tokens (mode-agnostic + light + dark) and website-owned utilities. Lift `next/font` calls and motion constants into the package.

### Task 3.1: Feature branch

**Files:** none

- [ ] **Step 1: Branch off `main`**

```bash
git checkout -b chore/monorepo-stage-3-design-system
```

### Task 3.2: Create `@edss/design-system` skeleton

**Files:**
- Create: `packages/design-system/package.json`
- Create: `packages/design-system/README.md`
- Create: `packages/design-system/src/index.ts`
- Create: `packages/design-system/src/styles/tokens.css` (empty for now)
- Create: `packages/design-system/src/styles/tokens-light.css` (empty for now)
- Create: `packages/design-system/src/styles/tokens-dark.css`

- [ ] **Step 1: Create directory tree**

```bash
mkdir -p packages/design-system/src/styles
```

- [ ] **Step 2: Write `packages/design-system/package.json`**

```json
{
  "name": "@edss/design-system",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "sideEffects": ["*.css"],
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./fonts": {
      "types": "./src/fonts.ts",
      "default": "./src/fonts.ts"
    },
    "./motion": {
      "types": "./src/motion.ts",
      "default": "./src/motion.ts"
    },
    "./styles/tokens.css": "./src/styles/tokens.css",
    "./styles/tokens-light.css": "./src/styles/tokens-light.css",
    "./styles/tokens-dark.css": "./src/styles/tokens-dark.css"
  },
  "peerDependencies": {
    "next": "^15",
    "react": "^19"
  },
  "devDependencies": {
    "@edss/config": "*",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 3: Write `packages/design-system/README.md`**

```markdown
# @edss/design-system

Executive Minimalist design system — charcoal-anchored surfaces + warm gold accent (≤10% of surface). Exports:

- `./styles/tokens.css` — mode-agnostic `@theme` tokens (color, type, space, radius, shadow, motion, z-index).
- `./styles/tokens-light.css` — light-mode surface overrides. Consumed by both apps.
- `./styles/tokens-dark.css` — dark-mode surface overrides. Consumed by the dashboard only.
- `./fonts` — `next/font` instances (Fraunces, IBM Plex Sans, Geist Mono).
- `./motion` — easing curves + duration constants for Framer Motion.
```

- [ ] **Step 4: Placeholder file content**

For `src/styles/tokens-dark.css`:

```css
/* Dark-mode surface overrides. Consumed only by apps/dashboard (created in sub-project 2). */
/* Populated as part of the dashboard shell scaffold. */

.dark {
  /* TODO(sub-project 2): dark surface overrides */
}
```

For `src/index.ts`:

```ts
export * from "./motion.js";
export * from "./fonts.js";
```

(Files `motion.ts` and `fonts.ts` land in Tasks 3.4 and 3.5.)

- [ ] **Step 5: Create `packages/design-system/tsconfig.json`**

```json
{
  "extends": "@edss/config/tsconfig/react-library.json",
  "include": ["src"]
}
```

### Task 3.3: Split `globals.css` into shared tokens + website utilities

**Files:**
- Modify: `packages/design-system/src/styles/tokens.css` (was empty)
- Create: `packages/design-system/src/styles/tokens-light.css` (populated content)
- Modify: `apps/website/styles/globals.css` (rewritten)

- [ ] **Step 1: Populate `packages/design-system/src/styles/tokens.css`**

The `@theme` block from the current website `globals.css` — mode-agnostic tokens only. Font `@theme` entries stay here since they reference variables `next/font` will produce via `fonts.ts`.

```css
/* ------------------------------------------------------------------ */
/* Design tokens — Executive Minimalist                               */
/* Charcoal-anchored surfaces + warm gold accent (≤10% of surface).   */
/* Mode-agnostic values. Surface overrides live in tokens-light.css   */
/* and tokens-dark.css.                                               */
/* ------------------------------------------------------------------ */

@theme {
  /* Colors (OKLCH) */
  --color-ink: oklch(0.145 0.005 250);
  --color-ink-2: oklch(0.22 0.005 250);
  --color-ink-3: oklch(0.32 0.005 250);
  --color-paper: oklch(0.985 0.003 90);
  --color-stone: oklch(0.965 0.004 90);
  --color-stone-2: oklch(0.93 0.004 90);
  --color-muted: oklch(0.55 0.005 250);
  --color-muted-2: oklch(0.72 0.005 250);
  --color-line: oklch(0.9 0.004 90);
  --color-line-strong: oklch(0.82 0.005 90);
  --color-gold: oklch(0.78 0.13 85);
  --color-gold-2: oklch(0.7 0.15 75);
  --color-gold-ink: oklch(0.35 0.09 75);
  --color-danger: oklch(0.55 0.19 25);
  --color-success: oklch(0.62 0.15 155);

  /* Fonts — bound to next/font variables provided by @edss/design-system/fonts */
  --font-display:
    var(--font-display-provider), "Fraunces", "Times New Roman", ui-serif, serif;
  --font-sans:
    var(--font-sans-provider), "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono:
    var(--font-mono-provider), "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;

  /* Type scale (clamp — desktop max ≤6rem, floor for mobile) */
  --text-eyebrow: clamp(0.7rem, 0.68rem + 0.1vw, 0.75rem);
  --text-body: clamp(0.95rem, 0.9rem + 0.2vw, 1rem);
  --text-body-lg: clamp(1.05rem, 1rem + 0.25vw, 1.125rem);
  --text-lede: clamp(1.15rem, 1.05rem + 0.4vw, 1.35rem);
  --text-h4: clamp(1.25rem, 1.15rem + 0.4vw, 1.5rem);
  --text-h3: clamp(1.5rem, 1.3rem + 0.8vw, 2rem);
  --text-h2: clamp(2rem, 1.6rem + 1.6vw, 3rem);
  --text-h1: clamp(2.5rem, 1.8rem + 3vw, 4.5rem);
  --text-display: clamp(3rem, 2rem + 4.5vw, 6rem);

  /* Spacing */
  --spacing-gutter: clamp(1.25rem, 1rem + 1.5vw, 2rem);
  --spacing-margin: clamp(1.25rem, 0.75rem + 2vw, 4rem);
  --spacing-stack: clamp(3.5rem, 2rem + 4vw, 7.5rem);
  --spacing-stack-lg: clamp(5rem, 3rem + 6vw, 10rem);
  --container-max: 1280px;
  --container-max-wide: 1440px;
  --container-max-reading: 68ch;

  /* Radii */
  --radius-xs: 2px;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 10px;
  --radius-xl: 16px;

  /* Shadows — diffused ambient */
  --shadow-sm: 0 1px 2px rgba(23, 23, 23, 0.04);
  --shadow-md: 0 8px 24px rgba(23, 23, 23, 0.05);
  --shadow-lg: 0 24px 60px -20px rgba(23, 23, 23, 0.12);
  --shadow-xl: 0 40px 100px -30px rgba(23, 23, 23, 0.18);

  /* Motion */
  --ease-out-quart: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 180ms;
  --dur: 320ms;
  --dur-slow: 640ms;
  --dur-cinematic: 1200ms;

  /* Z-index scale (semantic) */
  --z-below: -1;
  --z-base: 0;
  --z-raised: 10;
  --z-dropdown: 20;
  --z-sticky: 30;
  --z-panel: 40;
  --z-modal-backdrop: 50;
  --z-modal: 60;
  --z-toast: 70;
  --z-tooltip: 80;
  --z-cursor: 90;
}
```

- [ ] **Step 2: Populate `packages/design-system/src/styles/tokens-light.css`**

Current website is effectively light-mode only — the token values above already assume paper background + ink text. Keep this file present but empty of overrides (comment-only), so the import chain is stable and the dashboard's dark-mode file can mirror it. This is not a placeholder — light-mode intentionally requires no override on top of the mode-agnostic tokens.

```css
/* Light-mode surface overrides. Currently no additional overrides required —
   base tokens in tokens.css assume the light "paper" palette. This file is
   imported by both apps so the token-import chain has a consistent shape and
   future light-mode tweaks land here without touching consumers. */
```

- [ ] **Step 3: Rewrite `apps/website/styles/globals.css`**

Everything above `@layer base` in the original is now imported from `@edss/design-system`. The `@layer base` and `@layer utilities` blocks stay — those are website-owned styling. The `.on-ink` rules at the bottom stay too (marketing-only pattern). Import order matters: Tailwind first, then `@source` directives for package scanning (populated in Stage 4/5), then shared tokens, then app utilities.

```css
@import "tailwindcss";

/* Package sources — populated in later stages when ui/icons/analytics land. */
/* @source '../../../packages/ui/src/**/*.{ts,tsx}'; */
/* @source '../../../packages/icons/src/**/*.{ts,tsx}'; */
/* @source '../../../packages/analytics/src/**/*.{ts,tsx}'; */

@import "@edss/design-system/styles/tokens.css";
@import "@edss/design-system/styles/tokens-light.css";

@import "./typography.css";

/* ------------------------------------------------------------------ */
/* Base                                                                */
/* ------------------------------------------------------------------ */

@layer base {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html {
    -webkit-text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    scroll-behavior: smooth;
    scrollbar-gutter: stable;
  }

  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  body {
    margin: 0;
    background: var(--color-paper);
    color: var(--color-ink);
    font-family: var(--font-sans);
    font-size: var(--text-body);
    line-height: 1.6;
    font-feature-settings: "ss01", "cv11";
  }

  h1,
  h2,
  h3,
  h4 {
    font-family: var(--font-display);
    color: var(--color-ink);
    font-weight: 400;
    letter-spacing: -0.02em;
    line-height: 1.05;
    text-wrap: balance;
    margin: 0;
  }

  h4 {
    font-weight: 500;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }

  p {
    margin: 0;
    text-wrap: pretty;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  :focus-visible {
    outline: 2px solid var(--color-gold);
    outline-offset: 3px;
    border-radius: 2px;
  }

  ::selection {
    background: var(--color-ink);
    color: var(--color-paper);
  }

  img,
  svg,
  video {
    display: block;
    max-width: 100%;
    height: auto;
  }

  button {
    font: inherit;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: inherit;
  }

  input,
  textarea,
  select {
    font: inherit;
    color: inherit;
  }
}

/* ------------------------------------------------------------------ */
/* Utilities specific to the brand                                     */
/* ------------------------------------------------------------------ */

@layer utilities {
  .container-edss {
    max-width: var(--container-max);
    margin-inline: auto;
    padding-inline: var(--spacing-margin);
  }

  .container-wide {
    max-width: var(--container-max-wide);
    margin-inline: auto;
    padding-inline: var(--spacing-margin);
  }

  .container-reading {
    max-width: var(--container-max-reading);
    margin-inline: auto;
  }

  .stack {
    padding-block: var(--spacing-stack);
  }

  .stack-lg {
    padding-block: var(--spacing-stack-lg);
  }

  .rule {
    height: 1px;
    background: var(--color-line);
    border: 0;
    margin: 0;
  }

  .rule-strong {
    height: 1px;
    background: var(--color-line-strong);
    border: 0;
    margin: 0;
  }

  .hairline {
    box-shadow: inset 0 0 0 1px var(--color-line);
  }

  .kicker {
    font-family: var(--font-mono);
    font-size: var(--text-eyebrow);
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-muted);
  }

  .display {
    font-family: var(--font-display);
    font-size: var(--text-display);
    line-height: 0.95;
    letter-spacing: -0.04em;
    font-weight: 300;
  }

  .h1 { font-size: var(--text-h1); }
  .h2 { font-size: var(--text-h2); }
  .h3 { font-size: var(--text-h3); }
  .h4 { font-size: var(--text-h4); }
  .lede {
    font-size: var(--text-lede);
    line-height: 1.5;
    color: var(--color-muted);
    max-width: 62ch;
  }

  .num {
    font-family: var(--font-mono);
    font-feature-settings: "tnum", "zero";
    letter-spacing: -0.02em;
  }

  .link-underline {
    position: relative;
    display: inline-block;
  }
  .link-underline::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: -2px;
    height: 1px;
    background: currentColor;
    transform-origin: right;
    transform: scaleX(0);
    transition: transform var(--dur) var(--ease-out-quart);
  }
  .link-underline:hover::after,
  .link-underline:focus-visible::after {
    transform-origin: left;
    transform: scaleX(1);
  }

  .noise::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.09 0 0 0 0 0.09 0 0 0 0 0.09 0 0 0 0.35 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    opacity: 0.06;
    mix-blend-mode: multiply;
  }

  .marquee {
    display: flex;
    overflow: hidden;
    mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
  }
  .marquee-track {
    display: flex;
    gap: 4rem;
    flex-shrink: 0;
    animation: marquee 42s linear infinite;
  }
  .marquee:hover .marquee-track {
    animation-play-state: paused;
  }
  @keyframes marquee {
    from { transform: translate3d(0,0,0); }
    to   { transform: translate3d(-100%,0,0); }
  }

  @keyframes accordion-open {
    from { height: 0; opacity: 0; }
    to   { height: var(--radix-accordion-content-height); opacity: 1; }
  }
  @keyframes accordion-closed {
    from { height: var(--radix-accordion-content-height); opacity: 1; }
    to   { height: 0; opacity: 0; }
  }
  .animate-accordion-open {
    animation: accordion-open 380ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .animate-accordion-closed {
    animation: accordion-closed 260ms cubic-bezier(0.22, 1, 0.36, 1);
  }
}

/* ------------------------------------------------------------------ */
/* Dark surfaces (used on hero, footer, portfolio pin) — marketing    */
/* editorial pattern, distinct from dashboard dark-mode.               */
/* ------------------------------------------------------------------ */

.on-ink {
  background: var(--color-ink);
  color: var(--color-paper);
}
.on-ink h1,
.on-ink h2,
.on-ink h3,
.on-ink h4 {
  color: var(--color-paper);
}
.on-ink .kicker {
  color: var(--color-muted-2);
}
.on-ink .lede {
  color: color-mix(in oklch, var(--color-paper) 78%, transparent);
}
.on-ink .rule {
  background: color-mix(in oklch, var(--color-paper) 12%, transparent);
}
.on-ink :focus-visible {
  outline-color: var(--color-gold);
}
```

### Task 3.4: Move motion constants to `@edss/design-system/motion`

**Files:**
- Create: `packages/design-system/src/motion.ts`

- [ ] **Step 1: Locate motion constants in website source**

Run: `grep -rn "cubic-bezier(0.22, 1, 0.36, 1)" apps/website/`
Run: `grep -rn "var(--ease-out-quart)" apps/website/`

If Framer components hardcode `[0.22, 1, 0.36, 1]` or `"cubic-bezier(...)"`, those are the consumers that need to import from `@edss/design-system/motion` (updated in Step 3).

- [ ] **Step 2: Write `packages/design-system/src/motion.ts`**

Byte-parity with the CSS custom properties in `tokens.css` — same values, TS surface.

```ts
export const easings = {
  outQuart: [0.22, 1, 0.36, 1] as const,
  outExpo: [0.16, 1, 0.3, 1] as const,
} as const;

export const durationsMs = {
  fast: 180,
  default: 320,
  slow: 640,
  cinematic: 1200,
} as const;

export const durationsSec = {
  fast: durationsMs.fast / 1000,
  default: durationsMs.default / 1000,
  slow: durationsMs.slow / 1000,
  cinematic: durationsMs.cinematic / 1000,
} as const;
```

- [ ] **Step 3: Point Framer consumers at `@edss/design-system/motion`**

For each file found in Step 1 that hardcodes the bezier tuple, replace with:

```ts
import { easings, durationsSec } from "@edss/design-system/motion";
```

Then swap the literal `[0.22, 1, 0.36, 1]` for `easings.outQuart` and duration numerics for `durationsSec.*` as appropriate. If a file only reads `var(--ease-out-quart)` inside a `style` attribute or Tailwind arbitrary value, leave it — that resolves at CSS time and needs no code change.

### Task 3.5: Move `next/font` calls to `@edss/design-system/fonts`

**Files:**
- Create: `packages/design-system/src/fonts.ts`
- Modify: `apps/website/app/layout.tsx`

- [ ] **Step 1: Write `packages/design-system/src/fonts.ts`**

Byte-equivalent to the three `next/font/google` calls currently in `apps/website/app/layout.tsx`.

```ts
import { Fraunces, IBM_Plex_Sans, Geist_Mono } from "next/font/google";

export const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display-provider",
  axes: ["opsz", "SOFT"],
});

export const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-provider",
  weight: ["400", "500", "600"],
});

export const mono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-provider",
  weight: ["400", "500"],
});
```

- [ ] **Step 2: Rewrite `apps/website/app/layout.tsx` to import fonts from the package**

Import path changes only. Everything else stays byte-identical.

```tsx
import type { Metadata, Viewport } from "next";
import { display, sans, mono } from "@edss/design-system/fonts";
import { Analytics } from "@vercel/analytics/react";
import "@/styles/globals.css";
import { defaultMetadata } from "@/config/seo";
import { JsonLd, organizationLd } from "@/lib/seo/jsonld";
import { SmoothScroll } from "@/components/motion/SmoothScroll";

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf9f9" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[var(--z-toast)] focus:bg-[var(--color-ink)] focus:text-[var(--color-paper)] focus:px-4 focus:py-2 focus:rounded"
        >
          Skip to content
        </a>
        <SmoothScroll />
        {children}
        <JsonLd data={organizationLd()} />
        <Analytics />
      </body>
    </html>
  );
}
```

### Task 3.6: Add `@edss/design-system` to `apps/website` deps

**Files:**
- Modify: `apps/website/package.json`

- [ ] **Step 1: Add workspace dependency**

Insert `"@edss/design-system": "*"` into `"dependencies"` alphabetically (before `@hookform/resolvers` in the existing block). Full block:

```json
"dependencies": {
  "@edss/design-system": "*",
  "@hookform/resolvers": "^3.10.0",
  "…": "unchanged"
}
```

### Task 3.7: Install, build, snapshot, commit, PR

**Files:** none

- [ ] **Step 1: Install**

```bash
npm install
```

Expected: workspace symlink for `@edss/design-system` under `apps/website/node_modules/@edss/`.

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: green. Route table matches baseline.

- [ ] **Step 3: Typecheck + lint**

```bash
npm run typecheck
npm run lint
```

- [ ] **Step 4: Visual snapshot suite**

```bash
npm run test:visual
```

Expected: zero pixel diff. If any diff, the most likely culprit is font-provider variable name drift or CSS import order — inspect and fix before commit.

- [ ] **Step 5: Commit and PR**

```bash
git add -A
git commit -m "feat(design-system): extract tokens, fonts, motion into @edss/design-system"
git push -u origin chore/monorepo-stage-3-design-system
gh pr create --fill --base main --head chore/monorepo-stage-3-design-system
gh pr merge --squash --delete-branch
git checkout main && git pull
```

---

## Stage 4 — Extract `utils`, `ui`, `icons`, `hooks`

Four sub-stages, one package each, one commit + PR each. Order matters: `utils` first because `ui` depends on it.

### Stage 4a — `@edss/utils`

#### Task 4a.1: Feature branch

- [ ] **Step 1: Branch**

```bash
git checkout -b chore/monorepo-stage-4a-utils
```

#### Task 4a.2: Scaffold `@edss/utils`

**Files:**
- Create: `packages/utils/package.json`
- Create: `packages/utils/src/cn.ts`
- Create: `packages/utils/src/format.ts`
- Create: `packages/utils/src/index.ts`
- Create: `packages/utils/tsconfig.json`

- [ ] **Step 1: Create dirs**

```bash
mkdir -p packages/utils/src
```

- [ ] **Step 2: Write `packages/utils/package.json`**

```json
{
  "name": "@edss/utils",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./cn": {
      "types": "./src/cn.ts",
      "default": "./src/cn.ts"
    },
    "./format": {
      "types": "./src/format.ts",
      "default": "./src/format.ts"
    }
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@edss/config": "*",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 3: Write `packages/utils/src/cn.ts`**

Byte-equivalent to `apps/website/lib/utils/cn.ts`.

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Write `packages/utils/src/format.ts`**

Byte-equivalent to `apps/website/lib/utils/format.ts`, except the `NEXT_PUBLIC_SITE_URL` fallback stays — it's read from the process env at call time, which continues to work when the module is imported by the website (Next inlines public env vars per app).

```ts
export function formatDate(input: string | Date, locale = "en-US") {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatDateShort(input: string | Date, locale = "en-US") {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
  }).format(date);
}

export function absoluteUrl(path: string, base?: string) {
  const origin = base ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://elitedigital.studio";
  if (path.startsWith("http")) return path;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pad(n: number, width = 2) {
  return String(n).padStart(width, "0");
}
```

- [ ] **Step 5: Write `packages/utils/src/index.ts`**

```ts
export { cn } from "./cn.js";
export { formatDate, formatDateShort, absoluteUrl, pad } from "./format.js";
```

- [ ] **Step 6: Write `packages/utils/tsconfig.json`**

```json
{
  "extends": "@edss/config/tsconfig/react-library.json",
  "include": ["src"]
}
```

#### Task 4a.3: Rewire website imports to `@edss/utils`

**Files:**
- Modify: every website file that imports from `@/lib/utils/cn` or `@/lib/utils/format`
- Delete: `apps/website/lib/utils/cn.ts`, `apps/website/lib/utils/format.ts`
- Modify: `apps/website/package.json`

- [ ] **Step 1: Add dep and locate consumers**

Add `"@edss/utils": "*"` to `apps/website/package.json` `"dependencies"` alphabetically.

Run: `grep -rln "@/lib/utils/cn\|@/lib/utils/format" apps/website/`

Note every path — these are the files to edit in Step 2.

- [ ] **Step 2: Rewrite imports in each consumer**

For each file, replace:
- `from "@/lib/utils/cn"` → `from "@edss/utils/cn"`
- `from "@/lib/utils/format"` → `from "@edss/utils/format"`

Named imports (`cn`, `formatDate`, etc.) unchanged.

- [ ] **Step 3: Delete stale website files**

```bash
git rm apps/website/lib/utils/cn.ts apps/website/lib/utils/format.ts
```

Leave `apps/website/lib/utils/` in place only if it still contains other files. Otherwise remove the dir:

```bash
rmdir apps/website/lib/utils 2>/dev/null || true
```

#### Task 4a.4: Verify + PR

- [ ] **Step 1: Install, build, snapshot**

```bash
npm install
npm run build
npm run typecheck
npm run lint
npm run test:visual
```

Expected: all green, zero pixel diff, no lingering `@/lib/utils/*` imports.

- [ ] **Step 2: Commit + PR**

```bash
git add -A
git commit -m "feat(utils): extract cn + format helpers into @edss/utils"
git push -u origin chore/monorepo-stage-4a-utils
gh pr create --fill --base main --head chore/monorepo-stage-4a-utils
gh pr merge --squash --delete-branch
git checkout main && git pull
```

### Stage 4b — `@edss/ui`

#### Task 4b.1: Feature branch

```bash
git checkout -b chore/monorepo-stage-4b-ui
```

#### Task 4b.2: Scaffold `@edss/ui`

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/src/button.tsx`
- Create: `packages/ui/src/form.tsx`
- Create: `packages/ui/src/index.ts`
- Create: `packages/ui/tsconfig.json`

- [ ] **Step 1: Create dirs**

```bash
mkdir -p packages/ui/src
```

- [ ] **Step 2: Write `packages/ui/package.json`**

```json
{
  "name": "@edss/ui",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./button": {
      "types": "./src/button.tsx",
      "default": "./src/button.tsx"
    },
    "./form": {
      "types": "./src/form.tsx",
      "default": "./src/form.tsx"
    }
  },
  "dependencies": {
    "@edss/utils": "*",
    "class-variance-authority": "^0.7.1",
    "lucide-react": "^0.469.0"
  },
  "peerDependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19"
  },
  "devDependencies": {
    "@edss/config": "*",
    "@types/react": "^19.0.2",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 3: Write `packages/ui/src/button.tsx`**

Byte-equivalent to `apps/website/components/primitives/Button.tsx` — only import paths change (`@/lib/utils/cn` → `@edss/utils/cn`).

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@edss/utils/cn";

const button = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background,color,border,transform] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-gold)] disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      intent: {
        primary:
          "bg-[var(--color-ink)] text-[var(--color-paper)] border border-[var(--color-ink)] hover:bg-[var(--color-ink-2)]",
        gold:
          "bg-[var(--color-gold)] text-[var(--color-ink)] border border-[var(--color-gold)] hover:bg-[color-mix(in_oklch,var(--color-gold)_92%,black)]",
        ghost:
          "bg-transparent text-[var(--color-ink)] border border-[var(--color-line-strong)] hover:border-[var(--color-ink)]",
        onInk:
          "bg-transparent text-[var(--color-paper)] border border-[color-mix(in_oklch,var(--color-paper)_28%,transparent)] hover:border-[var(--color-paper)]",
        onInkFilled:
          "bg-[var(--color-paper)] text-[var(--color-ink)] border border-[var(--color-paper)] hover:bg-[color-mix(in_oklch,var(--color-paper)_92%,var(--color-ink))]",
      },
      size: {
        sm: "h-9 px-3.5 text-[0.85rem] rounded-[var(--radius-sm)]",
        md: "h-11 px-5 text-[0.9rem] rounded-[var(--radius-sm)]",
        lg: "h-14 px-7 text-[0.95rem] rounded-[var(--radius-sm)]",
      },
    },
    defaultVariants: { intent: "primary", size: "md" },
  },
);

type Base = VariantProps<typeof button> & { withArrow?: boolean; children: ReactNode };
type ButtonProps = Base & ButtonHTMLAttributes<HTMLButtonElement>;
type LinkProps = Base & { href: string; external?: boolean; className?: string };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, intent, size, withArrow, children, ...props }, ref) => (
    <button ref={ref} className={cn(button({ intent, size }), className)} {...props}>
      {children}
      {withArrow && <ArrowUpRight aria-hidden className="h-4 w-4" />}
    </button>
  ),
);
Button.displayName = "Button";

export function ButtonLink({
  href,
  external,
  intent,
  size,
  withArrow,
  className,
  children,
}: LinkProps) {
  const cls = cn(button({ intent, size }), className);
  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {children}
        {withArrow && <ArrowUpRight aria-hidden className="h-4 w-4" />}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
      {withArrow && <ArrowUpRight aria-hidden className="h-4 w-4" />}
    </Link>
  );
}
```

- [ ] **Step 4: Write `packages/ui/src/form.tsx`**

Byte-equivalent to `apps/website/components/primitives/Form.tsx` — only the `cn` import path changes.

```tsx
import type { InputHTMLAttributes, TextareaHTMLAttributes, LabelHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@edss/utils/cn";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "kicker block mb-2 text-[color:var(--color-muted)] uppercase tracking-[0.14em]",
        className,
      )}
      {...props}
    />
  );
}

const fieldBase =
  "w-full bg-transparent text-[var(--color-ink)] placeholder:text-[color-mix(in_oklch,var(--color-muted)_88%,transparent)] border-0 border-b border-[var(--color-line-strong)] py-3 px-0 text-[var(--text-body-lg)] focus:outline-none focus:border-[var(--color-ink)] transition-colors";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldBase, className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} rows={4} className={cn(fieldBase, "resize-none", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";

export function FieldError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-2 text-sm text-[var(--color-danger)]">
      {children}
    </p>
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-sm text-[var(--color-muted)]">{children}</p>;
}
```

- [ ] **Step 5: Write `packages/ui/src/index.ts`**

```ts
export { Button, ButtonLink } from "./button.js";
export { Label, Input, Textarea, FieldError, FieldHint } from "./form.js";
```

- [ ] **Step 6: Write `packages/ui/tsconfig.json`**

```json
{
  "extends": "@edss/config/tsconfig/react-library.json",
  "include": ["src"]
}
```

#### Task 4b.3: Rewire website imports and add package dep

**Files:**
- Modify: `apps/website/package.json`
- Modify: every website file that imports from `@/components/primitives/Button` or `@/components/primitives/Form`
- Delete: `apps/website/components/primitives/Button.tsx`, `apps/website/components/primitives/Form.tsx`
- Modify: `apps/website/styles/globals.css` (uncomment `@source` for `packages/ui`)

- [ ] **Step 1: Add dep**

Add `"@edss/ui": "*"` to `apps/website/package.json` `"dependencies"` alphabetically.

- [ ] **Step 2: Locate and rewrite consumers**

Run: `grep -rln "@/components/primitives" apps/website/`

For each file, rewrite:
- `from "@/components/primitives/Button"` → `from "@edss/ui/button"`
- `from "@/components/primitives/Form"` → `from "@edss/ui/form"`

Named imports (`Button`, `ButtonLink`, `Label`, `Input`, `Textarea`, `FieldError`, `FieldHint`) unchanged.

- [ ] **Step 3: Delete stale website files**

```bash
git rm apps/website/components/primitives/Button.tsx apps/website/components/primitives/Form.tsx
rmdir apps/website/components/primitives 2>/dev/null || true
```

- [ ] **Step 4: Uncomment `@source` directive for `packages/ui`**

Edit `apps/website/styles/globals.css`. Replace:

```css
/* @source '../../../packages/ui/src/**/*.{ts,tsx}'; */
```

with:

```css
@source '../../../packages/ui/src/**/*.{ts,tsx}';
```

Leave the other two `@source` lines commented (they enable in Stage 4c and Stage 5).

#### Task 4b.4: Verify + PR

- [ ] **Step 1: Install, build, verify**

```bash
npm install
npm run build
npm run typecheck
npm run lint
npm run test:visual
grep -rln "@/components/primitives" apps/website/ && echo "STALE IMPORTS FOUND" && exit 1 || echo "OK"
```

Expected: all green, zero pixel diff, no stale imports.

- [ ] **Step 2: Commit + PR**

```bash
git add -A
git commit -m "feat(ui): extract Button + Form primitives into @edss/ui"
git push -u origin chore/monorepo-stage-4b-ui
gh pr create --fill --base main --head chore/monorepo-stage-4b-ui
gh pr merge --squash --delete-branch
git checkout main && git pull
```

### Stage 4c — `@edss/icons`

#### Task 4c.1: Feature branch

```bash
git checkout -b chore/monorepo-stage-4c-icons
```

#### Task 4c.2: Scaffold `@edss/icons`

**Files:**
- Create: `packages/icons/package.json`
- Create: `packages/icons/src/index.tsx`
- Create: `packages/icons/src/lucide.ts`
- Create: `packages/icons/tsconfig.json`

- [ ] **Step 1: Enumerate lucide icons currently in use**

Run:

```bash
grep -rhoE 'from "lucide-react"' apps/website/ | wc -l
grep -rhoE '\{[^}]+\}\s*from\s*"lucide-react"' apps/website/ -A 0
```

Compile the union of icon names actually imported. Record them for Step 4.

- [ ] **Step 2: Create dirs**

```bash
mkdir -p packages/icons/src
```

- [ ] **Step 3: Write `packages/icons/package.json`**

```json
{
  "name": "@edss/icons",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./src/index.tsx",
      "default": "./src/index.tsx"
    },
    "./lucide": {
      "types": "./src/lucide.ts",
      "default": "./src/lucide.ts"
    }
  },
  "dependencies": {
    "lucide-react": "^0.469.0"
  },
  "peerDependencies": {
    "react": "^19"
  },
  "devDependencies": {
    "@edss/config": "*",
    "@types/react": "^19.0.2",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 4: Write `packages/icons/src/lucide.ts`**

Narrow re-export of the icons enumerated in Step 1. Example — replace this list with the actual union from Step 1:

```ts
export {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  Check,
  Minus,
  Plus,
  X,
} from "lucide-react";
```

- [ ] **Step 5: Write `packages/icons/src/index.tsx`**

Byte-equivalent to `apps/website/components/icons/index.tsx`.

```tsx
import type { SVGProps } from "react";

export function Wordmark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 260 24"
      role="img"
      aria-label="Elite Digital Solutions"
      className={className}
      {...props}
    >
      <text
        x="0"
        y="18"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "22px",
          fontWeight: 400,
          letterSpacing: "-0.02em",
        }}
        fill="currentColor"
      >
        Elite Digital
      </text>
      <text
        x="132"
        y="18"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
        fill="currentColor"
        opacity="0.6"
      >
        Studio · Est 2021
      </text>
    </svg>
  );
}

export function Monogram({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" role="img" aria-label="EDSS" className={className} {...props}>
      <circle cx="20" cy="20" r="19" fill="none" stroke="currentColor" strokeWidth="1" />
      <text
        x="20"
        y="27"
        textAnchor="middle"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "18px",
          fontWeight: 400,
          letterSpacing: "-0.03em",
        }}
        fill="currentColor"
      >
        e
      </text>
    </svg>
  );
}

export function LogoMark({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={className}
      style={{
        fontFamily: "var(--font-display)",
        fontSize: "1.35rem",
        fontWeight: 500,
        letterSpacing: "-0.02em",
        color: "currentColor",
        whiteSpace: "nowrap",
        opacity: 0.7,
      }}
    >
      {label}
    </div>
  );
}
```

- [ ] **Step 6: Write `packages/icons/tsconfig.json`**

```json
{
  "extends": "@edss/config/tsconfig/react-library.json",
  "include": ["src"]
}
```

#### Task 4c.3: Rewire imports (brand icons only — lucide imports stay unchanged)

**Files:**
- Modify: `apps/website/package.json`
- Modify: every website file that imports `Wordmark`, `Monogram`, or `LogoMark` from `@/components/icons`
- Delete: `apps/website/components/icons/index.tsx`
- Modify: `apps/website/styles/globals.css` (uncomment `@source` for `packages/icons`)

- [ ] **Step 1: Add dep**

Add `"@edss/icons": "*"` to `apps/website/package.json` `"dependencies"` alphabetically.

- [ ] **Step 2: Locate and rewrite consumers**

Run: `grep -rln "@/components/icons" apps/website/`

For each file, replace `from "@/components/icons"` with `from "@edss/icons"`. Named imports unchanged.

Do NOT touch existing `from "lucide-react"` imports in this step — those stay direct. The `@edss/icons/lucide` narrow surface is a future consolidation, adopted opportunistically by consumers over time. Phase 1 keeps existing lucide imports intact to keep the diff surgical.

- [ ] **Step 3: Delete stale website file**

```bash
git rm apps/website/components/icons/index.tsx
rmdir apps/website/components/icons 2>/dev/null || true
```

- [ ] **Step 4: Uncomment `@source` for icons**

Edit `apps/website/styles/globals.css`. Replace:

```css
/* @source '../../../packages/icons/src/**/*.{ts,tsx}'; */
```

with:

```css
@source '../../../packages/icons/src/**/*.{ts,tsx}';
```

#### Task 4c.4: Verify + PR

- [ ] **Step 1: Install, build, verify**

```bash
npm install
npm run build
npm run typecheck
npm run lint
npm run test:visual
grep -rln "@/components/icons" apps/website/ && echo "STALE IMPORTS FOUND" && exit 1 || echo "OK"
```

- [ ] **Step 2: Commit + PR**

```bash
git add -A
git commit -m "feat(icons): extract brand SVGs into @edss/icons"
git push -u origin chore/monorepo-stage-4c-icons
gh pr create --fill --base main --head chore/monorepo-stage-4c-icons
gh pr merge --squash --delete-branch
git checkout main && git pull
```

### Stage 4d — `@edss/hooks`

#### Task 4d.1: Feature branch

```bash
git checkout -b chore/monorepo-stage-4d-hooks
```

#### Task 4d.2: Scaffold `@edss/hooks`

**Files:**
- Create: `packages/hooks/package.json`
- Create: `packages/hooks/src/useMediaQuery.ts`
- Create: `packages/hooks/src/useReducedMotion.ts`
- Create: `packages/hooks/src/useInViewOnce.ts`
- Create: `packages/hooks/src/index.ts`
- Create: `packages/hooks/tsconfig.json`

- [ ] **Step 1: Create dirs**

```bash
mkdir -p packages/hooks/src
```

- [ ] **Step 2: Write `packages/hooks/package.json`**

```json
{
  "name": "@edss/hooks",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./useMediaQuery": {
      "types": "./src/useMediaQuery.ts",
      "default": "./src/useMediaQuery.ts"
    },
    "./useReducedMotion": {
      "types": "./src/useReducedMotion.ts",
      "default": "./src/useReducedMotion.ts"
    },
    "./useInViewOnce": {
      "types": "./src/useInViewOnce.ts",
      "default": "./src/useInViewOnce.ts"
    }
  },
  "peerDependencies": {
    "react": "^19"
  },
  "devDependencies": {
    "@edss/config": "*",
    "@types/react": "^19.0.2",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 3: Write `packages/hooks/src/useMediaQuery.ts`**

Byte-equivalent to the `useMediaQuery` function currently in `apps/website/lib/hooks/index.ts`.

```ts
"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const on = () => setMatches(mql.matches);
    on();
    mql.addEventListener("change", on);
    return () => mql.removeEventListener("change", on);
  }, [query]);
  return matches;
}
```

- [ ] **Step 4: Write `packages/hooks/src/useReducedMotion.ts`**

```ts
"use client";

import { useMediaQuery } from "./useMediaQuery.js";

export function useReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
```

- [ ] **Step 5: Write `packages/hooks/src/useInViewOnce.ts`**

Byte-equivalent to `useInViewOnce` currently in `apps/website/lib/hooks/index.ts`.

```ts
"use client";

import { useEffect, useRef, useState } from "react";

export function useInViewOnce<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        });
      },
      { threshold, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [inView, threshold]);
  return { ref, inView };
}
```

- [ ] **Step 6: Write `packages/hooks/src/index.ts`**

```ts
export { useMediaQuery } from "./useMediaQuery.js";
export { useReducedMotion } from "./useReducedMotion.js";
export { useInViewOnce } from "./useInViewOnce.js";
```

- [ ] **Step 7: Write `packages/hooks/tsconfig.json`**

```json
{
  "extends": "@edss/config/tsconfig/react-library.json",
  "include": ["src"]
}
```

#### Task 4d.3: Trim `apps/website/lib/hooks/index.ts` and rewire imports

**Files:**
- Modify: `apps/website/package.json`
- Modify: `apps/website/lib/hooks/index.ts`
- Modify: every website file that imports the moved hooks

- [ ] **Step 1: Add dep**

Add `"@edss/hooks": "*"` to `apps/website/package.json` `"dependencies"` alphabetically.

- [ ] **Step 2: Rewrite `apps/website/lib/hooks/index.ts` to retain only `useHeaderState`**

```ts
"use client";

import { useEffect, useRef, useState } from "react";

export function useHeaderState() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setHidden(y > 200 && y > lastY.current);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return { scrolled, hidden };
}
```

- [ ] **Step 3: Locate and rewrite consumers of the moved hooks**

Run:

```bash
grep -rln "useMediaQuery\|useReducedMotion\|useInViewOnce" apps/website/
```

For each consumer that imports these from `@/lib/hooks` (not `apps/website/lib/hooks/index.ts` itself, which now defines only `useHeaderState`):

- Replace `from "@/lib/hooks"` with `from "@edss/hooks"`.
- If the file imports both `useHeaderState` and one of the moved hooks from `@/lib/hooks`, split into two imports: `useHeaderState` from `@/lib/hooks`, the rest from `@edss/hooks`.

Named imports unchanged.

#### Task 4d.4: Verify + PR

- [ ] **Step 1: Install, build, verify**

```bash
npm install
npm run build
npm run typecheck
npm run lint
npm run test:visual
```

Expected: green, zero pixel diff.

- [ ] **Step 2: Sanity-grep for stale patterns**

```bash
grep -n "useMediaQuery\|useReducedMotion\|useInViewOnce" apps/website/lib/hooks/index.ts \
  && echo "STALE HOOK STILL DECLARED" && exit 1 || echo "OK"
```

- [ ] **Step 3: Commit + PR**

```bash
git add -A
git commit -m "feat(hooks): extract useMediaQuery, useReducedMotion, useInViewOnce into @edss/hooks"
git push -u origin chore/monorepo-stage-4d-hooks
gh pr create --fill --base main --head chore/monorepo-stage-4d-hooks
gh pr merge --squash --delete-branch
git checkout main && git pull
```

---

## Stage 5 — `@edss/analytics` (PostHog) + website wire-up

Add PostHog Cloud EU to the website. Dashboard wiring comes in sub-project 2.

### Task 5.1: Feature branch

```bash
git checkout -b chore/monorepo-stage-5-analytics
```

### Task 5.2: Scaffold `@edss/analytics`

**Files:**
- Create: `packages/analytics/package.json`
- Create: `packages/analytics/src/events.ts`
- Create: `packages/analytics/src/client.tsx`
- Create: `packages/analytics/src/server.ts`
- Create: `packages/analytics/src/index.ts`
- Create: `packages/analytics/tsconfig.json`

- [ ] **Step 1: Create dirs**

```bash
mkdir -p packages/analytics/src
```

- [ ] **Step 2: Write `packages/analytics/package.json`**

```json
{
  "name": "@edss/analytics",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./client": {
      "types": "./src/client.tsx",
      "default": "./src/client.tsx"
    },
    "./server": {
      "types": "./src/server.ts",
      "default": "./src/server.ts"
    },
    "./events": {
      "types": "./src/events.ts",
      "default": "./src/events.ts"
    }
  },
  "dependencies": {
    "posthog-js": "^1.203.0",
    "posthog-node": "^4.5.0"
  },
  "peerDependencies": {
    "next": "^15",
    "react": "^19"
  },
  "devDependencies": {
    "@edss/config": "*",
    "@types/react": "^19.0.2",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 3: Write `packages/analytics/src/events.ts`**

Typed event catalog. Website phase 1 events only; dashboard events land in sub-project 2.

```ts
export type WebsiteEvent =
  | { name: "contact_form_submitted"; props: { topic: string; source_page: string } }
  | { name: "whatsapp_cta_clicked"; props: { source_page: string } }
  | { name: "portfolio_case_opened"; props: { slug: string } }
  | { name: "service_detail_opened"; props: { slug: string } }
  | { name: "journal_post_opened"; props: { slug: string } };

export type EventName = WebsiteEvent["name"];

export type EventPropsFor<N extends EventName> = Extract<WebsiteEvent, { name: N }>["props"];
```

- [ ] **Step 4: Write `packages/analytics/src/client.tsx`**

Provider guards against StrictMode double-init, honors `Do-Not-Track`, no-ops when the key is absent.

```tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";
import posthog from "posthog-js";
import { usePathname, useSearchParams } from "next/navigation";
import type { EventName, EventPropsFor } from "./events.js";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

function shouldSkipInit(): boolean {
  if (!KEY) return true;
  if (typeof navigator !== "undefined" && navigator.doNotTrack === "1") return true;
  return false;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  const inited = useRef(false);

  useEffect(() => {
    if (inited.current) return;
    if (shouldSkipInit()) return;
    inited.current = true;
    posthog.init(KEY!, {
      api_host: HOST,
      capture_pageview: false,
      capture_pageleave: true,
      persistence: "localStorage+cookie",
    });
  }, []);

  return <>{children}</>;
}

export function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (shouldSkipInit()) return;
    if (!pathname) return;
    const url = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export function captureEvent<N extends EventName>(name: N, props: EventPropsFor<N>) {
  if (shouldSkipInit()) return;
  posthog.capture(name, props as Record<string, unknown>);
}
```

- [ ] **Step 5: Write `packages/analytics/src/server.ts`**

Server-side capture helper. Not consumed by the website in phase 1 but sits ready for dashboard identify calls in sub-project 2.

```ts
import { PostHog } from "posthog-node";

let cached: PostHog | null = null;

function getClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
  if (!key) return null;
  if (!cached) {
    cached = new PostHog(key, { host, flushAt: 1, flushInterval: 0 });
  }
  return cached;
}

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties: Record<string, unknown> = {},
): Promise<void> {
  const client = getClient();
  if (!client) return;
  client.capture({ distinctId, event, properties });
  await client.shutdown();
}
```

- [ ] **Step 6: Write `packages/analytics/src/index.ts`**

```ts
export { PostHogProvider, PageviewTracker, captureEvent } from "./client.js";
export { captureServerEvent } from "./server.js";
export type { EventName, EventPropsFor, WebsiteEvent } from "./events.js";
```

- [ ] **Step 7: Write `packages/analytics/tsconfig.json`**

```json
{
  "extends": "@edss/config/tsconfig/react-library.json",
  "include": ["src"]
}
```

### Task 5.3: Wire PostHog into `apps/website/app/layout.tsx`

**Files:**
- Modify: `apps/website/package.json`
- Modify: `apps/website/app/layout.tsx`
- Modify: `apps/website/styles/globals.css` (uncomment `@source` for analytics)

- [ ] **Step 1: Add dep**

Add `"@edss/analytics": "*"` to `apps/website/package.json` `"dependencies"` alphabetically.

- [ ] **Step 2: Rewrite `apps/website/app/layout.tsx`**

Mount the provider inside `<body>`. `PageviewTracker` is a client-only component that reads the current route; wrap it in `Suspense` because `useSearchParams` requires a boundary.

```tsx
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { display, sans, mono } from "@edss/design-system/fonts";
import { PostHogProvider, PageviewTracker } from "@edss/analytics/client";
import { Analytics } from "@vercel/analytics/react";
import "@/styles/globals.css";
import { defaultMetadata } from "@/config/seo";
import { JsonLd, organizationLd } from "@/lib/seo/jsonld";
import { SmoothScroll } from "@/components/motion/SmoothScroll";

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf9f9" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[var(--z-toast)] focus:bg-[var(--color-ink)] focus:text-[var(--color-paper)] focus:px-4 focus:py-2 focus:rounded"
        >
          Skip to content
        </a>
        <PostHogProvider>
          <Suspense fallback={null}>
            <PageviewTracker />
          </Suspense>
          <SmoothScroll />
          {children}
          <JsonLd data={organizationLd()} />
          <Analytics />
        </PostHogProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Uncomment `@source` for analytics**

Edit `apps/website/styles/globals.css`. Replace:

```css
/* @source '../../../packages/analytics/src/**/*.{ts,tsx}'; */
```

with:

```css
@source '../../../packages/analytics/src/**/*.{ts,tsx}';
```

### Task 5.4: Update `.env.example` and document env

**Files:**
- Modify: `.env.example`
- Modify: `apps/website/README.md` (add env note)

- [ ] **Step 1: Extend root `.env.example`**

Append:

```
# Analytics — PostHog Cloud EU (locked 2026-07-06 for Indian user base)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

- [ ] **Step 2: Note env vars in `apps/website/README.md`**

Add a section titled `## Environment variables` (or extend the existing one) with a bullet describing `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`.

### Task 5.5: Bump bundle threshold for the analytics addition

**Files:**
- Modify: `apps/website/scripts/check-bundle.mjs`

- [ ] **Step 1: Locate the threshold constant**

Read `apps/website/scripts/check-bundle.mjs` and find the numeric ceiling for First Load JS (the constant against which route sizes are compared).

- [ ] **Step 2: Raise it by 55 kB**

Change the constant to the current value + 55 (headroom above the observed PostHog delta of ~50 kB gzip). Add a comment on the same line:

```js
// Raised by 55 kB in Stage 5 to accommodate the PostHog client bundle.
const FIRST_LOAD_LIMIT_KB = <NEW_VALUE>;
```

If the file uses per-route thresholds instead of a single ceiling, bump the ceiling on the highest-loading route only. Keep every other route's threshold unchanged.

### Task 5.6: Verify and update the Playwright baseline for analytics-induced sizing

**Files:**
- Modify: `tests/visual/snapshot.spec.ts-snapshots/*` (regenerated for any route whose layout shifts because PostHog injects a hidden `<div>`; usually none)

- [ ] **Step 1: Install and build**

```bash
npm install
npm run build
npm run typecheck
npm run lint
npm run check:bundle
```

Expected: build green, bundle check green under the new threshold.

- [ ] **Step 2: Run visual suite**

```bash
npm run test:visual
```

Expected: zero pixel diff. PostHog itself renders nothing visible — a diff here means the layout tree shifted (rare but possible from the extra provider wrapper). If a diff appears, inspect the reported route's HTML with:

```bash
npm run dev &
curl -s http://localhost:3000/ | grep -A2 "posthog"
kill %1
```

Confirm the delta is from an invisible wrapper (no visible content). If yes, update the baseline:

```bash
npm run test:visual:update
```

Commit the updated baseline snapshots in the same commit as this stage. Note the update in the commit message.

- [ ] **Step 3: End-to-end analytics smoke test (dev-time, manual)**

Set a real PostHog key temporarily in `.env.local` (not committed):

```
NEXT_PUBLIC_POSTHOG_KEY=phc_<your_dev_key>
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

Then:

```bash
npm run dev
```

Open `http://localhost:3000` in a browser, open DevTools → Network, filter for `posthog`. Expected: one `POST /e/` per pageview, no duplicates. Navigate to `/about`, `/services`. Confirm exactly one `POST /e/` fires per route transition. Remove `.env.local` (or blank the key) before committing.

### Task 5.7: Commit + PR

- [ ] **Step 1: Stage and commit**

```bash
git add -A
git commit -m "feat(analytics): add @edss/analytics package + wire website pageview + conversion events"
```

- [ ] **Step 2: Push and PR**

```bash
git push -u origin chore/monorepo-stage-5-analytics
gh pr create --fill --base main --head chore/monorepo-stage-5-analytics
gh pr merge --squash --delete-branch
git checkout main && git pull
```

---

## Completion checklist

Verify each item after Stage 5 merges:

- [ ] Repo at `D:\Aman_Build\External Frontend\self v1` is git-initialized on `main` with a private GitHub remote `SelfHosted_V1`.
- [ ] `apps/website/` contains every file previously at root except the ones explicitly kept at root (see Stage 2 Task 2.2 Step 3).
- [ ] `packages/config`, `packages/design-system`, `packages/ui`, `packages/icons`, `packages/hooks`, `packages/utils`, `packages/analytics` all exist with the `exports` maps documented in the spec Section 4.
- [ ] `npx turbo run build lint typecheck` green from repo root.
- [ ] `npm run test:visual` green — no drift from the pre-migration baseline captured in Task 1.11.
- [ ] `apps/website/next.config.mjs` `transpilePackages` lists every `@edss/*` runtime package.
- [ ] `apps/website/styles/globals.css` starts with `@import 'tailwindcss'`, followed by three uncommented `@source` directives, followed by the shared token imports, followed by app-owned utilities.
- [ ] PostHog Cloud EU is receiving `$pageview` events when a real key is set (verified in Task 5.6 Step 3).
- [ ] Five squash-merged PRs on `main`, one per stage 1–5, each independently passing every check.
- [ ] Baseline artifacts retained in `scratchpad/` for future comparison.

## Deferred to later sub-projects

The following spec items are intentionally out of scope for this plan:

- `apps/dashboard/` scaffold (sub-project 2).
- `packages/api`, `packages/auth`, `packages/validation`, `packages/types` (sub-projects 2 and 3).
- shadcn/ui integration inside `@edss/ui` (sub-project 2).
- Dashboard dark-mode wiring — the empty `tokens-dark.css` stub sits ready (sub-project 2).
- PostHog consent banner (sub-project 6, cross-cutting).
- Self-hosted PostHog on Indian infrastructure (future migration when compliance requires).
- Test framework and coverage beyond preservation snapshots (cross-cutting sub-project).
