# ADR-0001 — HSTS preload deferred until subdomain audit + preload-list submission

- Status: Accepted
- Date: 2026-07-12
- Related: risk-register.md S-05

## Context

Both apps previously served:

    Strict-Transport-Security: max-age=63072000; includeSubDomains; preload

`preload` is a public commitment: once submitted to the Chrome HSTS
preload list and shipped in browsers, every subdomain of the registered
eTLD+1 becomes HTTPS-only for two years across every user who ever
loaded any subdomain — effectively irreversible for the max-age window.

The audit surfaced two concerns:

- No confirmation that every current or future subdomain
  (`staging.*`, `webhooks.*`, marketing preview URLs, admin backends) is
  HTTPS-only. A single HTTP subdomain locks affected users out.
- Preload directive shipped without submission to hstspreload.org means
  Chrome does not preload the site anyway — the client bears the
  irreversibility risk without receiving the browser-side benefit.

## Decision

Drop `preload` from the dashboard until:

1. Every subdomain used in production is confirmed HTTPS-only.
2. The eTLD+1 has been submitted to https://hstspreload.org and accepted
   (visible in Chrome's preload list JSON).

Header on `apps/dashboard` becomes:

    Strict-Transport-Security: max-age=63072000; includeSubDomains

Marketing site (`apps/website/next.config.mjs`) still carries `preload`
today. Per client preservation rule the marketing change requires
explicit per-finding approval; recorded here for tracking, not landed.
Once the client approves, drop `preload` on the marketing site too and
re-submit as a coordinated action.

## Consequences

- Users get HSTS enforcement after their first HTTPS visit for two
  years — unchanged.
- Fresh browsers do not preload — one HTTPS visit is required first.
  Acceptable trade-off given the reversibility gain during the audit
  remediation window.
- Once the subdomain audit is done, add `preload` back and submit.

## Alternatives considered

- **Keep `preload`.** Rejected: irreversibility risk exceeds the value
  of pre-first-visit protection given the subdomain uncertainty.
- **Reduce `max-age`.** Rejected: two-year max-age is a preload-list
  prerequisite anyway, and shortening it does not fix the irreversibility.
