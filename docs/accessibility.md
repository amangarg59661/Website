# Accessibility

Target: **WCAG 2.2 AA**.

## Semantic HTML

- One `<h1>` per page (in `<PageIntro>` or `<Hero>`).
- `<article>` for blog posts and case studies.
- `<section aria-labelledby="...">` for content blocks with a heading anchor.
- `<nav aria-label="Primary">` in header, `<nav aria-label="Menu">` in mobile drawer.
- `<address>` — reserved for future contact page treatment.

## Keyboard

- Skip link (first tab) — jumps to `#main`.
- Header nav fully tab-navigable.
- Mega-panel Escape closes; focus returns to trigger.
- Mobile drawer traps focus while open; Escape closes.
- Radix Accordion + Dialog handle focus management natively.

## Focus

- Visible on every interactive element — 2px gold outline, 3px offset. Set in `globals.css`:
  ```css
  :focus-visible { outline: 2px solid var(--color-gold); outline-offset: 3px; }
  ```
- No `outline: none` anywhere without a replacement.

## ARIA

- `aria-current="page"` on active primary nav item.
- `aria-expanded` on Services trigger and mobile menu button.
- `aria-controls` on Services trigger pointing at the panel id.
- `aria-label` on icon-only buttons (menu, close).
- `role="dialog"` + `aria-label` on mobile drawer and mega-panel.
- `aria-live="polite"` on contact form success message.
- `aria-invalid` + `aria-describedby` on form fields with errors.
- `role="alert"` on inline error messages.

## Colour + contrast

Verified in `docs/design-system.md`:

- Body muted on paper: 4.6:1 (AA body ≥4.5:1).
- Body on ink: 14.5:1.
- Kicker (muted) on paper: 4.6:1.
- Gold is never the sole carrier of meaning — always paired with weight/underline/icon.

## Reduced motion

- Lenis smooth scroll: not mounted when `prefers-reduced-motion: reduce`.
- Framer Motion: `initial={false}` when reduced — sections render at their final state.
- Marquee: killed by the global CSS reset.
- `RevealLines`: still emits text without animation.

## Forms

- Every `<Input>` / `<Textarea>` bound to a `<Label>` via `htmlFor`.
- Error messages linked via `aria-describedby`.
- Honeypot field `hidden` + `aria-hidden`, not `display:none` (so screen readers still ignore, but bots find it visible).
- Submit button disables during submission with visible text state (`Sending…`).

## Screen reader friendliness

- `RevealLines` uses `aria-label` on the wrapper and `aria-hidden` on the animated spans — so SRs read the full headline once, not line by line.
- `<Marquee>` has `role="presentation"` + `aria-hidden` — decorative only.
- Skip link uses `sr-only` utility (screen-reader-only until focus).

## Tested

- Keyboard navigation of home + services + contact + portfolio detail.
- VoiceOver + NVDA (spot checks) — landmarks, focus order, form validation.
- Contrast via Chrome DevTools + manual axe run.
