# SEO / AEO / GEO

## Metadata

- `config/seo.ts` — default site metadata (title template, OG, Twitter, robots, canonical).
- Every route exports its own `metadata` or `generateMetadata()`. Titles use the `%s — Elite Digital` template.

## JSON-LD

Helpers in `lib/seo/jsonld.tsx`:

- `organizationLd()` — mounted on root layout (`app/layout.tsx`).
- `serviceLd({...})` — per service page.
- `articleLd({...})` — per blog post.
- `faqLd([...])` — FAQ page + per-service FAQ block.
- `breadcrumbLd([...])` — every deep route.

All rendered via `<JsonLd data={...} />` which serialises to `<script type="application/ld+json">`.

## Sitemap + robots

- `app/sitemap.ts` — dynamic. Reads services, portfolio, blog, blog categories, and career slugs. Emits `<lastmod>` and `<changefreq>`.
- `app/robots.ts` — environment-gated. Blocks all crawlers on non-production preview builds.

## OG images

`app/og/default.png/route.tsx` uses `next/og` to render editorial 1200×630 OG image at edge. Per-page OG (portfolio, blog) uses the case/article hero image directly.

## Internal linking

Every case study links to the services used and to two related cases. Every service links to related practices in the same category and up to two representative cases. Every blog post links to two related articles.

## AEO / GEO readiness

- FAQ blocks per service page render with `FAQPage` schema — LLM crawlers can pull direct answers.
- Semantic heading structure: one `<h1>` per page, `<article>` for blog posts, `<section aria-labelledby>` for content blocks.
- Fully static HTML — no client-side data fetching hides content from crawlers.
- Answer-friendly prose pattern in FAQ + service outcomes: question → 1–2 sentence direct answer → supporting detail.

## Canonicals

Set on every dynamic route (services, portfolio, blog). Root canonical in `defaultMetadata`.

## robots.txt in preview

Non-production Vercel environments serve `Disallow: /` — no accidental indexing of previews.
