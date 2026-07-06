# Elite Digital Solutions — marketing website

Production-grade Next.js 15 marketing site for **Elite Digital Solutions Studio**. Static-first, editorially minimalist, engineered for Core Web Vitals.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Scripts

| Command                | Purpose                                          |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Local dev on port 3000                           |
| `npm run build`        | Production build (SSG for every marketing route) |
| `npm run start`        | Run the production build locally                 |
| `npm run lint`         | ESLint                                           |
| `npm run typecheck`    | `tsc --noEmit` — strict TS                       |
| `npm run format`       | Prettier                                         |
| `npm run analyze`      | Build with `@next/bundle-analyzer`               |
| `npm run check:bundle` | Enforce bundle budget after build                |

## Stack

- **Next.js 15** (App Router) · **React 19** · **TypeScript strict**
- **Tailwind CSS v4** (`@theme` tokens co-located in `styles/globals.css`)
- **Radix UI** primitives (Accordion, Dialog, Popover, Tabs)
- **Framer Motion** for reveals, stagger, headline clip-mask
- **Lenis** for smooth scroll (opt-out on `prefers-reduced-motion`)
- **next/font** for `Fraunces` (display, serif), `IBM Plex Sans` (body), `Geist Mono` (labels)
- **react-hook-form** + **zod** for the contact form
- **Vercel Analytics**
- **Resend** for contact email delivery (dev falls back to console)

## Structure

```
app/
  (marketing)/          route group — shared header/footer layout
    layout.tsx
    page.tsx            Home
    about/              About the studio
    services/           Index + [slug] template (11 static params)
    portfolio/          Index + [slug] template (6 case studies)
    blog/               Index + [slug] + category/[slug]
    faqs/
    careers/            Index + [slug]
    contact/            Form + WhatsApp + calendar hook
    legal/privacy/
    legal/terms/
  api/contact/route.ts  POST — zod-validated, rate-limited
  og/default.png/       Dynamic OG via next/og
  layout.tsx            Root — fonts, providers, JSON-LD, analytics
  not-found.tsx         404
  error.tsx / global-error.tsx
  sitemap.ts / robots.ts / manifest.ts

components/
  primitives/           Button, Input, Textarea, Label
  layout/               Header (with MegaPanel), Footer, Container, Section, Rule
  marketing/            Hero, ServiceIndex, PortfolioGrid, JournalCard,
                        FaqAccordion, TestimonialQuote, StatLedger,
                        LogoMarquee, CtaBand, ContactForm, WhatsAppCta,
                        PageIntro, ProcessRail
  motion/               Reveal, Stagger, RevealLines, Marquee, CountUp,
                        SmoothScroll
  icons/                Wordmark, Monogram, LogoMark

content/                MDX-ready collections (JSON in v1)
  testimonials.json
  faqs.json
  careers.json

data/                   Typed catalogs
  nav.ts / services.ts / portfolio.ts / stats.ts / clients.ts / blog.ts

config/                 App-wide configuration
  site.ts / seo.ts / env.ts / legal.ts

lib/
  utils/                cn, formatDate, absoluteUrl
  hooks/                useReducedMotion, useHeaderState, useInViewOnce
  seo/                  JSON-LD builders (Organization, Service, Article, FAQPage, Breadcrumb)
  contact/              schema + whatsappUrl
  mdx/                  renderArticleBody (MDX pipeline stub)

styles/
  globals.css           @theme tokens, base, utilities
  typography.css        Editorial prose, drop-cap

docs/                   Architecture, motion, SEO, a11y, perf notes
scripts/                Bundle budget checker
```

## Design system — Executive Minimalist

- **Palette (OKLCH):** charcoal-dominant surfaces + warm gold accent (≤10% of any surface).
- **Type:** Fraunces (display, optical-size axis), IBM Plex Sans (body), Geist Mono (labels).
- **Type scale:** clamp-based, hero display maxed at 6rem per Impeccable guidance.
- **Motion:** ease-out-quart, staggered reveals, headline clip-mask, marquee. Every animation respects `prefers-reduced-motion`.
- **Spacing:** 8px base, clamp-based section rhythm 3.5rem → 10rem.
- **Contrast:** verified ≥4.5:1 on body text; muted variants tuned above threshold.

See `docs/design-system.md` for full token reference.

## Rendering strategy

- Every marketing route is **statically generated** at build time (`generateStaticParams` on all dynamic routes).
- No SSR in v1.
- Client components are limited to: header state, mega-panel, mobile drawer, portfolio filter, blog filter, contact form, smooth-scroll, reveal wrappers.
- Fonts self-hosted via `next/font`.

## SEO / AEO / GEO

- Full `metadata` per route via Metadata API + template.
- JSON-LD: `Organization` (root), `Service` (per service page), `Article` (per blog post), `FAQPage` (FAQ + per-service), `BreadcrumbList` (all deep routes).
- Dynamic `sitemap.ts` + `robots.ts` (environment-gated).
- OG images generated at edge via `next/og`.
- Semantic HTML, one `<h1>` per page, `<article>` / `<section aria-labelledby>` conventions.

## Accessibility

- WCAG 2.2 AA baseline.
- Skip link, visible focus rings (2px gold outline), keyboard-navigable mega-panel with Escape close and focus trap.
- `aria-current` on nav, `aria-expanded` on disclosures, `aria-live` on form status.
- `prefers-reduced-motion` bypasses Lenis, Framer variants, marquees.

## Performance

- Static-first + RSC by default.
- `next/font` subset + `display: swap`.
- `next/image` with AVIF/WebP.
- Package import optimisation for Radix, Framer, Lucide.
- Bundle budget script (`npm run check:bundle`) — pre-push via husky.
- Security headers set in `next.config.mjs` (HSTS, Referrer-Policy, X-Content-Type-Options, Permissions-Policy).

## Environment

| Variable                      | Purpose                                                             |
| ----------------------------- | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`        | Canonical origin                                                    |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp `wa.me/{number}`                                           |
| `CONTACT_EMAIL`               | Where contact-form submissions go                                   |
| `RESEND_API_KEY`              | Optional — enables email delivery (dev logs to console when absent) |

## Deploy

Zero-config on Vercel. `next.config.mjs` sets headers, image formats, redirects.

## Roadmap

- MDX pipeline (`next-mdx-remote/rsc`) live — content collections migrate from JSON/data.
- CMS integration (Sanity or Payload) — via `getAll*` accessors in `lib/content/`.
- Dark mode (surfaces already dark-anchored).
- Portal / dashboard subdomains (folder shape already set up).
- GSAP pinned narrative on portfolio detail (currently RSC-only).

## License

Proprietary. © Elite Digital Solutions Studio Pvt Ltd.
