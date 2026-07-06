# @edss/design-system

Executive Minimalist design system — charcoal-anchored surfaces + warm gold accent (≤10% of surface). Exports:

- `./styles/tokens.css` — mode-agnostic `@theme` tokens (color, type, space, radius, shadow, motion, z-index).
- `./styles/tokens-light.css` — light-mode surface overrides. Consumed by both apps.
- `./styles/tokens-dark.css` — dark-mode surface overrides. Consumed by the dashboard only.
- `./fonts` — `next/font` instances (Fraunces, IBM Plex Sans, Geist Mono).
- `./motion` — easing curves + duration constants for Framer Motion.
