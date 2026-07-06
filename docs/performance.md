# Performance

## Targets

| Metric | Budget |
|---|---|
| LCP | ≤ 1.8s (mobile 4G Slow) |
| CLS | 0 |
| INP | ≤ 200ms |
| Home JS gzipped | ≤ 90KB (goal 75KB) |
| Total transferred first paint | ≤ 300KB |
| Lighthouse — Performance | ≥ 95 |
| Lighthouse — Accessibility | ≥ 95 |
| Lighthouse — Best Practices | ≥ 95 |
| Lighthouse — SEO | ≥ 98 |

## Tactics implemented

### Rendering

- **Static-first.** Every marketing route is SSG. Zero SSR in v1.
- **RSC by default.** Client boundaries limited to interactive surfaces (header, forms, filters, motion wrappers).
- Package-level tree-shaking via `experimental.optimizePackageImports` for `lucide-react`, `framer-motion`, Radix.

### Fonts

- `next/font/google` with variable fonts and Latin-only subset.
- `display: swap` on all three families.
- CSS variables bound in `styles/globals.css`, avoiding FOIT.

### Images

- `next/image` throughout — automatic AVIF/WebP with JPEG fallback.
- Explicit `width` × `height` or `fill` + `sizes` on every image — no CLS.
- Hero images marked `priority`; below-the-fold cases lazy load by default.
- Device sizes tuned in `next.config.mjs`.

### JavaScript

- **No global state manager.** No Redux, no Zustand.
- Motion isolated to individual client components.
- Header's client bundle is the largest — kept lean by extracting mega-panel to a sibling.

### CSS

- Tailwind v4 with `@theme` — no runtime style computation.
- Utilities emit only what's used.
- Grain overlay is inline SVG (~150 bytes), not a fetched image.

### Marquee

- Pure CSS `@keyframes` + `translate3d`. No JS on scroll or animation frame.
- Hover pauses via CSS, not JS.

### Bundle budget

- `scripts/check-bundle.mjs` — reads `.next/build-manifest.json`, sums root bundle files, fails build if over budget.
- Wired to `npm run check:bundle`. Run after `next build`.
- Analyzer: `npm run analyze` (opens `.next/analyze/`).

### Security headers

Set in `next.config.mjs`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

## Deferred

- CSP with nonces — set at edge middleware when introduced.
- ISR — infrastructure in place; used only when content moves to CMS.
- Image CDN with signed URLs — when portfolio hosting is finalised.
