# Motion

## Philosophy

Motion is punctuation. It communicates hierarchy, directs attention, and signals a premium build. It is never decorative.

Every animation has a `prefers-reduced-motion` alternative — usually crossfade or instant.

## Reveal system

Located in `components/motion/Reveal.tsx`.

- `<Reveal>` — single-element fade + 14px rise, `once: true`, 700ms `ease-out-quart`.
- `<Stagger>` + `<StaggerItem>` — container/child pattern for lists.
- `<RevealLines lines={[...]}>` — line-clipped headline reveal via `overflow-hidden` + Y translate. Used on the home hero.

## Header

- Auto-hides on downward scroll, reappears on upward — see `useHeaderState`.
- Blur + subtle background emerge on scroll (`bg-color-mix + backdrop-blur`).
- Services opens the **MegaPanel** — the surface signature. Editorial 12-col grid, 11 services with number/kicker/arrow, live gold underline on hover.

## Smooth scroll

Lenis wrapped in `<SmoothScroll />` client component, mounted in root layout. Bypasses on `prefers-reduced-motion`.

## Marquee

Pure CSS (`@keyframes marquee`) with `mask-image` fade edges. Pauses on hover. No JS.

## Accordion

Radix Accordion + custom `.animate-accordion-open` / `.animate-accordion-closed` keyframes using `--radix-accordion-content-height`.

## CountUp

`components/motion/CountUp.tsx` — Framer's `animate()` on in-view. Instant when reduced.

## GSAP (deferred)

Reserved for portfolio detail pinned narrative — not shipped in v1. When added, load via dynamic import to keep home bundle unaffected.

## Timing scale

| Purpose | Duration | Ease |
|---|---|---|
| Micro (hover, focus) | 180ms | `--ease-out-quart` |
| Standard (reveals, panels) | 320–700ms | `--ease-out-quart` |
| Section-wide | 900–1200ms | `--ease-out-expo` |

## Reduced-motion rules

- Lenis: don't mount.
- Framer variants: skip initial state, snap to final.
- Marquee: still animates via CSS but the global `@media (prefers-reduced-motion: reduce)` reset kills all animation duration.
