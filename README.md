# Elite Digital Solutions — monorepo

Turborepo monorepo for the Elite Digital Solutions marketing website and the forthcoming Business Operations Platform dashboard.

## Layout

- `apps/website` — public marketing site (production).
- `packages/design-system` — shared Tailwind tokens, fonts, motion constants (Stage 3).
- `packages/ui` — cross-app primitives (Stage 4b).
- `packages/icons` — brand SVGs and curated Lucide re-exports (Stage 4c).
- `packages/hooks` — shared React hooks (Stage 4d).
- `packages/utils` — pure helper functions (Stage 4a).
- `packages/analytics` — PostHog wrapper (Stage 5).
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
