# Design system — Executive Minimalist

## Palette (OKLCH)

Anchored charcoal + warm gold. The gold accent covers ≤10% of any surface. All values live in `styles/globals.css` under `@theme`.

| Token | Value | Role |
|---|---|---|
| `--color-ink` | `oklch(0.145 0.005 250)` | Dominant surface / body text |
| `--color-ink-2` | `oklch(0.22 0.005 250)` | Elevated dark surface |
| `--color-paper` | `oklch(0.985 0.003 90)` | Off-white body — NOT cream |
| `--color-stone` | `oklch(0.965 0.004 90)` | Subtle tinted surface |
| `--color-muted` | `oklch(0.55 0.005 250)` | Body secondary (4.6:1 on paper) |
| `--color-line` | `oklch(0.9 0.004 90)` | Hairline separators |
| `--color-gold` | `oklch(0.78 0.13 85)` | Accent (state, hover, focus) |
| `--color-gold-2` | `oklch(0.7 0.15 75)` | Accent on text |
| `--color-gold-ink` | `oklch(0.35 0.09 75)` | Text on gold surface |

**Contrast verified.** Body muted on paper measures 4.6:1 (AA compliant). Headings on paper 15:1. Body on ink 14.5:1.

## Typography

- **Display** — Fraunces. Editorial serif with optical size axis. Weights: 300, 400, 500, 600. Letter-spacing floor `-0.045em` on hero; `-0.02em` on section h2. `text-wrap: balance` on all headings.
- **Body** — IBM Plex Sans. Weights 400/500/600. 1.6 line-height. Max 65–75ch.
- **Label / kicker** — Geist Mono. 12px, tracking `0.14em`, uppercase.

Full type scale in `@theme` (`--text-eyebrow` → `--text-display`) — all clamp-based, hero maxed at 6rem per Impeccable guidance.

## Space

- 8px base grid.
- `--spacing-stack` (48/80/120px clamp) for major sections.
- Container widths: `--container-max` 1280px, `--container-max-wide` 1440px, `--container-max-reading` 68ch.

## Radius

Very restrained. Corner radii of 2–10px only. No pills for structural elements — reserved for status chips.

## Elevation

Ambient shadows only. Very soft, high-blur, low-opacity charcoal. Never used decoratively.

## Motion tokens

- `--ease-out-quart`: `cubic-bezier(0.22, 1, 0.36, 1)` — canonical curve.
- `--dur-fast` 180ms, `--dur` 320ms, `--dur-slow` 640ms, `--dur-cinematic` 1200ms.

## Utilities

- `.container-edss`, `.container-wide`, `.container-reading` — width scales.
- `.stack`, `.stack-lg` — vertical rhythm.
- `.rule`, `.rule-strong` — hairlines.
- `.kicker` — mono label.
- `.display`, `.h1`, `.h2`, `.h3`, `.h4`, `.lede` — type scale.
- `.num` — tabular figures.
- `.link-underline` — animated underline.
- `.marquee`, `.marquee-track` — infinite marquee.
- `.on-ink` — dark-surface theming.
- `.noise` — grain overlay.

## Anti-patterns explicitly avoided

Per Impeccable brand register:

- No cream / sand / bone body background.
- No numbered `01 / 02 / 03` eyebrows as scaffolding on every section. (Numbers appear only where they carry information — practice index, portfolio metrics ledger, method rail.)
- No universal small all-caps tracked eyebrow above every section. (`.kicker` is used deliberately, not reflexively.)
- No gradient text via `background-clip: text`.
- No side-stripe borders (`border-left` > 1px as accent).
- No identical icon-card grids.
- No purple AI aesthetic.
