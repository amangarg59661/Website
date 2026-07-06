# Elite Digital Solutions Studio — Implementation Plan

Source of truth: Stitch project `10325219565383540458` (title: "Elite Digital Solutions Studio", design system: **Executive Minimalist**). Screens are branded internally as "Aetheris Consulting"; product-facing brand = **Elite Digital Solutions Studio** (EDSS). Screens treated as canonical layout/composition; copy is rebranded to EDSS's 11-service B2B tech offering.

---

## 1. Brand + Aesthetic Direction

**Positioning.** Boutique global B2B tech studio. Feels like a private consultancy, not a template SaaS.

**Aesthetic register (Impeccable, brand register).** Editorial minimalism with layered depth. Anchored, not decorative. Reads like Sotheby's / Frieze / Berg&Kø rather than Vercel / Linear.

**Anti-references — will not build:**
- Purple-gradient AI aesthetic
- Cream/sand/bone body background (saturated 2026 AI default per Impeccable)
- Numbered `01 / 02 / 03` section eyebrows as scaffolding
- Small all-caps tracked eyebrow above every section
- Identical icon-card grids
- Big-number hero-metric template
- Side-stripe borders, gradient text, decorative glass, generic Inter-only stack

**Committed direction.** Charcoal-dominant surfaces with warm-gold accent used *sparingly* (state, hairlines, one CTA per surface). Editorial serif kicker in one place per page (not on every section). Real typographic contrast: **Fraunces** display (serif, high-contrast optical) paired with **Söhne / IBM Plex Sans** functional body, **Geist Mono** for technical labels (code cards, service manifests, portfolio meta). Falls back cleanly to Stitch's Hanken Grotesk + Inter + Geist if user prefers to stay literal to design system.

**Palette (OKLCH, final):**
```
--ink:      oklch(0.145 0.005 250)   /* #171717 charcoal — dominant */
--ink-2:    oklch(0.22  0.005 250)   /* elevated surface on dark */
--paper:    oklch(0.985 0.003 90)    /* off-white, NOT cream */
--stone:    oklch(0.965 0.004 90)    /* subtle surface tint */
--muted:    oklch(0.55  0.005 250)   /* body secondary */
--line:     oklch(0.90  0.004 90)    /* hairlines */
--gold:     oklch(0.78  0.13  85)    /* #D4AF37 warm gold — accent ≤10% */
--gold-ink: oklch(0.35  0.09  75)    /* on-gold text */
```
Contrast verified: body `--muted` on `--paper` = 4.6:1. Gold reserved for: active nav underline, one primary CTA per section, focus ring, and portfolio year meta.

**Motion palette.** Fraunces headline reveals via `clip-path` inset + `mask-image` gradient (not just translateY/opacity). Section reveals: staggered children with `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quart). Marquee via `scroll-timeline` where supported, `requestAnimationFrame` fallback. Custom cursor state on portfolio hover (magnifier ring, not decoration). Lenis smooth-scroll opt-in with reduced-motion bypass. All motion respects `prefers-reduced-motion`.

**One thing people remember.** The service navigation "mega-panel" from Stitch screen `a6d0a95f6bc5407a8f67d319e34d61f1` — a full-viewport editorial menu with 3-column typographic index, live preview thumbnail on hover, and gold underline that follows cursor. This is the surface signature.

---

## 2. Technology Stack (locked)

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | RSC, static-first, streaming |
| Runtime | React 19 | |
| Language | TypeScript (strict) | |
| Styling | Tailwind CSS v4 + CSS vars | v4 uses `@theme` — tokens co-located with CSS |
| Primitives | Radix UI + Shadcn/UI (selective) | Dropdown, Dialog, Accordion, Tabs, Popover, ToggleGroup |
| Motion | Framer Motion (Motion) | Declarative, respects reduced-motion out of box |
| Advanced motion | GSAP (only for: home hero shader intro, portfolio pin scroll) | Justified — Framer can't ScrollTrigger-pin |
| 3D | **No R3F** in v1 — brief says "only when justified". Reserved. |
| Forms | react-hook-form + zod | |
| Icons | Lucide (tree-shakeable) + hand-drawn SVG service marks | |
| Fonts | `next/font` — Fraunces, IBM Plex Sans, Geist Mono (self-hosted, subset) |
| Content | JSON in `/content` + `/data` + `/config` (MDX-ready per brief) |
| Analytics | Vercel Analytics + web-vitals reporter to console for dev |
| Package mgr | npm |

**Rendering strategy.**
- **Static (SSG)** — Home, About, Services index, all 11 service pages, Portfolio index, portfolio detail (via `generateStaticParams`), Blog index, blog detail, categories, FAQs, Careers, Contact, Privacy, Terms, 404. Everything ships as HTML.
- **ISR** wired but unused in v1 (60s revalidate ready for CMS).
- **SSR** reserved for future portal/dashboard subdomains only.
- **Client components** only where required: Header nav mega-panel, Contact form, Portfolio filter, Blog category filter, custom cursor, Lenis provider, motion wrappers. Everything else = RSC.

---

## 3. Information Architecture

```
/                                Home
/about                           About Us
/services                        Services index (11 tiles + category filter)
/services/custom-software        11 service pages, one route each:
/services/saas                   custom-software, saas, website,
/services/website                mobile-app, ai-automation, digital-marketing,
/services/mobile-app             performance-marketing, video-editing, ui-ux,
/services/ai-automation          branding, maintenance-support
/services/digital-marketing      
/services/performance-marketing  
/services/video-editing          
/services/ui-ux                  
/services/branding               
/services/maintenance-support    
/portfolio                       Portfolio index (case grid, filter)
/portfolio/[slug]                Case study detail (pinned scroll narrative)
/blog                            Blog index (editorial, not card grid)
/blog/[slug]                     Article
/blog/category/[slug]            Category filter
/faqs                            FAQ (accordion, schema.org/FAQPage)
/careers                         Careers
/careers/[slug]                  Job detail (reserved, static-empty in v1)
/contact                         Contact + WhatsApp CTA + calendar
/legal/privacy                   Privacy Policy
/legal/terms                     Terms
/404                             Custom 404
error.tsx / global-error.tsx     Custom error boundaries
sitemap.xml, robots.txt          Auto-generated (Next.js)
```

**Nav model.** Top bar 80px, ghost links + one filled Contact CTA. `Services` opens editorial mega-panel (the surface signature). Mobile: sheet drawer with same typographic hierarchy.

**Footer.** Editorial 4-col: brand + tagline, services (compact list), company (about/portfolio/blog/careers/contact), legal + social + address. Ends with large wordmark treated as horizon element.

---

## 4. Folder Architecture

```
edss/
├── app/
│   ├── (marketing)/                   Route group: shared marketing layout
│   │   ├── layout.tsx                 Header, Footer, providers
│   │   ├── page.tsx                   Home
│   │   ├── about/page.tsx
│   │   ├── services/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx        generateStaticParams over 11 slugs
│   │   ├── portfolio/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx
│   │   │   ├── [slug]/page.tsx
│   │   │   └── category/[slug]/page.tsx
│   │   ├── faqs/page.tsx
│   │   ├── careers/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── contact/page.tsx
│   │   └── legal/
│   │       ├── privacy/page.tsx
│   │       └── terms/page.tsx
│   ├── api/
│   │   └── contact/route.ts           POST — zod-validated, resend/console
│   ├── layout.tsx                     RootLayout — fonts, <html>, metadata
│   ├── not-found.tsx                  404
│   ├── error.tsx / global-error.tsx
│   ├── sitemap.ts
│   ├── robots.ts
│   └── manifest.ts
├── components/
│   ├── primitives/                    Button, Link, Input, Textarea, Select,
│   │                                  Dialog, Sheet, Accordion, Tabs, Tooltip
│   ├── layout/                        Header, MegaPanel, Footer, Container,
│   │                                  Section, EditorialGrid, PageIntro
│   ├── marketing/                     Hero, ServiceIndex, PortfolioGrid,
│   │                                  CaseCard, LogoMarquee, TestimonialQuote,
│   │                                  StatLedger, ProcessRail, FaqAccordion,
│   │                                  BlogList, JournalCard, CtaBand,
│   │                                  WhatsAppCta, ContactForm, TeamGrid
│   ├── motion/                        RevealText, RevealBlock, MarqueeRow,
│   │                                  MagneticCta, CursorLens, ScrollLenis,
│   │                                  Stagger, ParallaxLayer
│   └── icons/                         Wordmark, service marks (custom SVG)
├── content/                           Editable content (MDX-ready)
│   ├── services/*.mdx                 11 service files
│   ├── portfolio/*.mdx                Case studies
│   ├── blog/*.mdx                     Articles
│   ├── faqs.json
│   ├── careers.json
│   └── testimonials.json
├── data/                              Structured non-copy data
│   ├── nav.ts                         Navigation config
│   ├── services.ts                    Service catalog (slug, title, kicker)
│   ├── portfolio.ts                   Case metadata
│   ├── stats.ts                       Company stats (verified)
│   └── clients.ts                     Client logos
├── config/                            App-wide config
│   ├── site.ts                        Brand, url, socials, WhatsApp number
│   ├── seo.ts                         Default metadata
│   ├── legal.ts                       Legal entity details
│   └── env.ts                         zod-validated env
├── lib/
│   ├── seo/                           JSON-LD builders (Organization, Service,
│   │                                  Article, FAQPage, BreadcrumbList)
│   ├── contact/                       submitContact, whatsappUrl
│   ├── mdx/                           mdx compiler + rehype pipeline
│   ├── utils/                         cn, formatDate, absoluteUrl
│   └── hooks/                         useReducedMotion, useMediaQuery,
│                                      useHeaderState, useInViewOnce
├── styles/
│   ├── globals.css                    Tailwind v4 @theme, tokens, resets
│   └── typography.css                 Editorial rhythm, drop-cap, prose
├── public/
│   ├── fonts/                         Fraunces, Plex Sans, Geist Mono subsets
│   ├── og/                            OG images (per page)
│   └── portfolio/                     Case images
├── scripts/
│   └── check-bundle.mjs               Bundle budget check
├── .eslintrc / eslint.config.mjs
├── prettier.config.mjs
├── tailwind.config.ts                 (Tailwind v4 mostly needs none — kept slim)
├── next.config.mjs                    images, headers, redirects
├── tsconfig.json                      strict, path aliases
├── package.json
├── README.md
├── docs/
│   ├── architecture.md
│   ├── content-model.md
│   ├── motion.md
│   ├── seo.md
│   └── audit.md
└── .husky / lint-staged
```

**Path aliases:** `@/components/*`, `@/lib/*`, `@/content/*`, `@/data/*`, `@/config/*`.

**Subdomain-ready.** `/app/(marketing)` is a route group. Future `portal.`, `dashboard.`, `app.` become sibling groups or separate Next projects sharing `packages/ui`, `packages/tokens`, `packages/config` — monorepo migration is `mkdir apps/marketing && mv` mechanical, no code rewrite.

---

## 5. Component Hierarchy (atomic)

- **Tokens** — CSS custom properties (globals.css `@theme`).
- **Primitives** — Button, IconButton, Link (typed `next/link`), Input, Textarea, Select, Checkbox, Switch, Dialog, Sheet, Accordion, Tabs, Popover, Tooltip.
- **Layout** — Container (max 1280, 20/40/64 gutters), Section (rhythm 80/120), EditorialGrid (12-col, breaks to 8/4), Divider, Rule (hairline).
- **Marketing surfaces** — Header, MegaPanel, Footer, Hero, ServiceIndex, PortfolioGrid, CaseCard, LogoMarquee, StatLedger, ProcessRail, FaqAccordion, BlogList, JournalCard, CtaBand, ContactForm, WhatsAppCta, TeamGrid, TestimonialQuote.
- **Motion** — RevealText (SplitType-style clip mask, no library dep), RevealBlock, Stagger, MagneticCta, CursorLens (portfolio hover), ScrollLenis provider, MarqueeRow, ParallaxLayer.

Every component is exported via barrel from its folder. No default exports for components (named only) — matches typescript-expert best practice.

---

## 6. Rendering + State Strategy

| Surface | Strategy | Client boundary |
|---|---|---|
| Header + MegaPanel | Server shell + client mega-panel state | Header (server), MegaPanel (client) |
| Hero | Server + client `RevealText` wrapper | client only for reveal |
| Service pages | Full RSC | none |
| Portfolio grid | Server + client filter | client filter toolbar only |
| Portfolio detail | RSC + client GSAP pin scroll | client only for scroll narrative |
| Blog index | RSC + client category filter | client filter only |
| FAQ | Server + client Accordion | Accordion (Radix) |
| Contact | Client form (RHF+zod) | full client |
| Footer | RSC | none |

**No global store.** Small pieces of client state via Zustand only if genuinely needed (deferred until a real need appears — likely never in v1).

---

## 7. SEO / AEO / GEO Strategy

- **Metadata API** — every route exports `metadata` or `generateMetadata`. Title template: `%s — Elite Digital Solutions`. OG images auto-composed via `next/og` at build time.
- **JSON-LD** — global `Organization` on root layout; `Service` per service page; `Article` + `BreadcrumbList` per blog post; `FAQPage` on FAQ + service FAQ blocks; `BreadcrumbList` on all deep routes; `Person` on team members (future).
- **Semantic HTML** — one `<h1>` per page, `<article>`, `<section aria-labelledby>`, `<nav aria-label>`, `<address>` in footer.
- **Sitemap** — dynamic `app/sitemap.ts` reads static params (services, portfolio, blog).
- **robots.ts** — allow all in prod, `noindex` on preview via `VERCEL_ENV`.
- **Internal linking** — service ↔ related services rail; portfolio ↔ services used; blog ↔ related articles + relevant services.
- **AEO / GEO ready** — FAQ blocks per service using natural-language Q&A; JSON-LD FAQ schema per block. Answer-friendly heading pattern (question → 2-sentence answer → detail). Fully static HTML for LLM crawlers.

---

## 8. Performance Strategy

**Targets (self-imposed):**
- LCP ≤ 1.8s (mobile 4G Slow), TTFB ≤ 200ms static
- CLS = 0, INP ≤ 200ms
- JS on Home ≤ 90KB gzipped (goal ≤ 75KB)
- Total transferred first paint ≤ 300KB

**Tactics:**
- Fonts: `next/font` + `display: swap` + subset (Latin only v1) + preload `.woff2`. Fraunces variable, one axis.
- Images: `next/image` with explicit dimensions everywhere. Portfolio hero = AVIF + WebP + JPEG fallback. LQIP via `plaiceholder` at build.
- Marquees: pure CSS `translate3d` + `will-change`, no JS on scroll unless user hovers.
- Motion: import Framer as `motion/mini` (lazy client bundle) where possible; GSAP only in portfolio detail + home shader.
- Route splits: Radix components dynamically imported (`next/dynamic` with `ssr:false` where safe).
- No barrel-import bloat: `import { Button } from '@/components/primitives/Button'` not `@/components/primitives`.
- Bundle budget checker in `scripts/check-bundle.mjs`, wired to husky pre-push.
- `@next/bundle-analyzer` available via `ANALYZE=true npm run build`.
- Preload hero image; preconnect font CDN (not needed since self-hosted).

---

## 9. Accessibility Strategy

- WCAG 2.2 AA minimum. Verified contrast ratios in tokens (documented).
- Focus rings visible on all interactives — 2px `--gold` outline offset 3px.
- Keyboard: full keyboard flow tested. Mega-panel: Escape closes, tab traps.
- Screen reader: `aria-label` on icon buttons, `aria-current` on nav, `aria-expanded` on disclosure, live regions for form status.
- Reduced motion: `useReducedMotion` from Framer respected on every animation. Marquee pauses. Reveals become instant.
- Color-blind safe — gold never conveys meaning alone (paired with weight/underline/icon).
- Form: labels bound with `htmlFor`, error text `aria-describedby`, `aria-invalid` on error.

---

## 10. Contact Experience

Fields: Name, Email, Phone, Preferred Meeting Time, Message. Zod schema in `lib/contact/schema.ts`. Submission: `app/api/contact/route.ts` — POST, rate-limited (in-memory bucket for v1), sends via Resend (env-configurable) with dev-mode console fallback. Success: inline confirmation, focus moves to confirmation, `aria-live=polite`.

**WhatsApp CTA** — reads number from `config/site.ts`, opens `https://wa.me/{number}?text={encodeURIComponent(defaultMessage)}`. Both number and message configurable.

**Calendar** — v1 uses "Preferred Meeting Time" text field; integration slot reserved for Cal.com embed via dynamic import in v2.

---

## 11. Content Architecture

Zero hardcoded copy in components. All strings sourced from:
- `content/services/*.mdx` — one file per service, frontmatter (title, kicker, meta, deliverables, outcomes) + long-form body.
- `content/portfolio/*.mdx` — frontmatter (client, industry, year, services, hero image, credits) + narrative body.
- `content/blog/*.mdx` — frontmatter (title, description, date, category, author, cover) + body.
- `content/faqs.json`, `content/testimonials.json`, `content/careers.json`.
- `data/*.ts` — typed catalogs (services registry, nav, stats, clients).
- `config/site.ts` — brand copy (name, tagline, hero headline options), contact, socials.

MDX pipeline: `next-mdx-remote/rsc` + `rehype-slug` + `rehype-autolink-headings` + `rehype-pretty-code` (Shiki, dark ink theme). Frontmatter validated with zod per collection.

**Future CMS migration path.** Every `content/**` collection has a single `getAll<Collection>()` accessor in `lib/content/`. Swapping MDX → Sanity/Contentlayer/Payload = replacing that accessor's body only.

---

## 12. Animation Manifest

| Surface | Motion | Library |
|---|---|---|
| Global | Lenis smooth-scroll (skippable on `prefers-reduced-motion`) | lenis |
| Header | Hide on scroll-down / show on scroll-up | Framer + hook |
| MegaPanel | Slide-down + stagger service list | Framer |
| Hero headline | Clip-mask reveal per line | Framer |
| Section reveals | Fade + 12px rise, stagger 60ms, viewport once | Framer |
| Stat ledger | Count-up on in-view | Framer + hook |
| Logo marquee | Infinite marquee | CSS keyframes |
| Portfolio grid | Hover: image scale 1.02 + gold underline animate-in | CSS |
| Portfolio detail | Pin hero + horizontal chapter scroll | GSAP ScrollTrigger |
| CTA button | Magnetic pull (mouse) + arrow slide | Framer |
| Custom cursor | Cursor lens on portfolio media | Framer + pointer events |

Every animation has a reduced-motion alternative (crossfade or instant).

---

## 13. Security Hardening

- CSP headers via `next.config.mjs` (`script-src 'self' 'nonce-...'`, `img-src 'self' data: https:`, `frame-ancestors 'none'`).
- HSTS, X-Content-Type-Options, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy.
- Contact API: zod validation, rate limit, honeypot field + timing check, no PII in logs.
- Env validated at import time (`config/env.ts`, zod).
- No `dangerouslySetInnerHTML` outside MDX rendering (which uses trusted local content).
- All external links `rel="noopener noreferrer"` when `target="_blank"`.

---

## 14. Deliverables Checklist

1. ✅ Implementation plan (this file)
2. Folder architecture (Phase 5)
3. Design system (`globals.css` @theme, `tailwind.config.ts`, `docs/design-system.md`)
4. Component hierarchy (`components/**` + barrel exports)
5. Routing strategy (`app/**` structure)
6. Rendering strategy (per-route notes in code comments only where non-obvious)
7. State management (none global; local RHF; documented in `docs/architecture.md`)
8. SEO strategy (`docs/seo.md`)
9. Performance strategy (`docs/performance.md` + `scripts/check-bundle.mjs`)
10. Accessibility strategy (`docs/accessibility.md`)
11. Production implementation (all pages, all interactions)
12. README (setup, scripts, deploy)
13. Developer documentation (`docs/**`)
14. Optimization report (`docs/optimization-report.md` — Lighthouse, bundle stats)
15. Final audit report (`docs/audit.md`)

---

## 15. Execution Order (post-approval)

1. **Scaffold** — `create-next-app`, TS strict, Tailwind v4, path aliases, Prettier, ESLint, Husky.
2. **Tokens + typography** — `globals.css`, fonts, `docs/design-system.md`.
3. **Primitives + layout** — Button/Link/Input/Container/Section, Header/MegaPanel/Footer.
4. **Content + data** — services registry, portfolio metadata, blog + FAQ seeds.
5. **Home** — Hero, service index, stat ledger, portfolio preview, logo marquee, testimonial, journal preview, CTA band.
6. **Services index + 11 detail pages** — one template, content-driven.
7. **Portfolio index + detail template** — one template, MDX-driven.
8. **Blog index + detail + category** — one template.
9. **About, FAQs, Careers, Contact, Legal, 404, error boundaries.**
10. **Motion pass** — Lenis, reveals, marquee, magnetic CTAs, portfolio pin, custom cursor.
11. **SEO pass** — metadata, JSON-LD, sitemap, robots, OG images.
12. **A11y pass** — audit + fix keyboard, focus, ARIA, reduced-motion, contrast.
13. **Perf pass** — bundle analyze, image audit, font subset, dynamic imports, Lighthouse.
14. **Security pass** — CSP, headers, form hardening.
15. **Docs + audit** — README, `docs/**`, optimization report, final audit.

---

## 16. Open Questions (blocker-free defaults chosen; user can override)

| # | Question | Default assumption |
|---|---|---|
| 1 | Brand name literal — "Elite Digital Solutions" or "Elite Digital Solutions Studio"? | "Elite Digital Solutions" (nav + wordmark), full name in footer + `<title>` template |
| 2 | Real testimonials + client logos available? | Placeholder generic B2B logos + framed "reserved for client name" until user provides |
| 3 | Portfolio case studies — real or placeholder? | 6 placeholder cases with realistic industry copy, wired to swap in real ones |
| 4 | WhatsApp number, contact email, office address? | Placeholder `+91 00000 00000`, `hello@elitedigital.studio`, "Remote-first · Global" until user provides |
| 5 | Dark mode required? | Ship light default; dark mode stubbed via `class="dark"` root — not styled in v1 unless requested (site already dark-anchored) |
| 6 | Blog seeds — number of articles? | 4 seed articles across categories (Engineering, AI, Design, Marketing) |
| 7 | Careers — real openings? | 3 placeholder openings; page renders "no open roles" gracefully |
| 8 | Fraunces vs Hanken Grotesk for display? | Recommend **Fraunces** for editorial contrast (matches "boutique") but ship-ready to swap to Hanken Grotesk (Stitch literal) via one token change |
| 9 | Deploy target? | Vercel assumed; `next.config.mjs` portable |

---

## Approval

Reply **approved** (or with edits/preferences on the 9 open questions above) and I proceed with scaffolding + build. Estimated build: home + services + portfolio + blog + rest, in that order, several thousand LoC across ~80 files.
