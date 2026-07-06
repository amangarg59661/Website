# Architecture

## Rendering

- **Static** — every marketing route. Zero SSR. All dynamic segments implement `generateStaticParams`.
- **RSC-first** — components are server components unless client state, event handlers, or a browser-only API is required.
- **Client boundaries** — kept minimal:
  - `components/layout/Header.tsx` — mega-panel state, scroll direction, mobile drawer
  - `components/marketing/ContactForm.tsx` — react-hook-form
  - `components/marketing/PortfolioGrid.tsx` — filter state
  - `app/(marketing)/blog/page.tsx` — filter state
  - `components/motion/*` — Framer motion wrappers
  - `components/motion/SmoothScroll.tsx` — Lenis

## Route groups

- `app/(marketing)/` — public-facing marketing routes; shares header/footer via nested `layout.tsx`.
- `app/api/contact/route.ts` — POST handler for contact form.
- `app/og/default.png/route.tsx` — dynamic OG image.

## Content pipeline

Content lives in `content/*.json` and `data/*.ts`. MDX is stubbed via `lib/mdx/renderArticleBody()` — a simple markdown-like renderer. To migrate:

1. Move article bodies from `data/blog.ts` into `content/blog/*.mdx`.
2. Add frontmatter parsing (`gray-matter` already in `dependencies`).
3. Replace `renderArticleBody()` calls with `next-mdx-remote/rsc` `<MDXRemote />`.

CMS migration path:

1. Introduce `lib/content/getArticles()`, `getServices()`, `getCases()`.
2. Move each collection into a CMS (Sanity, Payload, or Contentlayer).
3. Swap the accessor bodies. No page-level changes required.

## State management

None global. React Hook Form covers the contact form. All other UI state is local component state.

## Path aliases

Configured in `tsconfig.json`:
- `@/*` — repo root
- `@/components/*`, `@/lib/*`, `@/content/*`, `@/data/*`, `@/config/*`, `@/styles/*`

## Subdomain migration

The `(marketing)` route group is the seed of a future monorepo. To split off `portal.`, `dashboard.`, `app.`:

1. Extract `components/primitives`, `styles`, and `config` into `packages/ui`, `packages/tokens`.
2. Move `app/(marketing)/` into `apps/marketing/app/`.
3. Copy `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts` into `apps/marketing/`.
4. Add sibling `apps/portal/`, etc.

No component rewrite required.
