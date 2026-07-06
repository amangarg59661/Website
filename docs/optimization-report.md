# Optimization report

## Tactics applied at build time

### Bundle

- `experimental.optimizePackageImports` for lucide-react, framer-motion, and each Radix subpackage.
- Client components segmented tightly — hero motion, header state, mega-panel, filters — each isolated from server code.
- No `import * from '@/components/primitives'` barrels — every import is a leaf path so tree-shaking works.

### CSS

- Tailwind v4 — no runtime, no dead selectors. `@theme` writes token variables once.
- Grain overlay is inline SVG data URL (~130 bytes).
- Marquee via CSS `@keyframes`, no JS.

### Fonts

- `next/font/google` — three families, subset to Latin, variable-axis for Fraunces (opsz + SOFT).
- `display: swap` on all faces.

### Images

- `next/image` with AVIF + WebP + JPEG cascade.
- `deviceSizes` tuned to [360, 640, 768, 1024, 1280, 1536, 1920] in `next.config.mjs`.
- Portfolio and hero images marked `priority`; everything else lazy.
- Every image has explicit dimensions — CLS baseline zero.

### JavaScript

- Zero global state.
- Lenis loaded only when reduced-motion is off.
- Framer Motion imports minimised — no full-library imports.

### Third parties

- Vercel Analytics — script-only, no cookie.
- Optional Resend on server route — never touches the client.
- No Google Fonts, no external CSS, no third-party embeds in v1.

## Security headers

Set in `next.config.mjs`:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

## Redirects

Configured in `next.config.mjs`:

- `/services/uiux` → `/services/ui-ux`
- `/services/mobile` → `/services/mobile-app`
- `/services/maintenance` → `/services/maintenance-support`

## Deferred (v1.1+)

- Nonce-based CSP via edge middleware.
- Route-level ISR when content moves to a CMS.
- Preload hints for above-the-fold hero image (currently `priority` on `<Image>` handles it).
- Service worker for offline shell (only when a strong offline story exists).

## Measurement

Run after each deploy:

```bash
npm run analyze          # opens .next/analyze
npm run check:bundle     # verifies root bundle stays under budget
npx lighthouse https://elitedigital.studio --view --preset=desktop
npx lighthouse https://elitedigital.studio --view --preset=mobile
```

Append the JSON output from each run to `docs/audit.md` under "Lighthouse".
