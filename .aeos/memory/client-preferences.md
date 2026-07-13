# Client Preferences — External Frontend v1

## Engagement summary

- **Client** — solo founder / product owner. Runs both the backend (Self_Backend_v1) and this frontend monorepo.
- **Depth** — full production-readiness audit (parity with backend engagement closed 2026-07-12) **plus** module wiring against the newly-hardened backend.
- **Timing** — quality-first; no fixed launch deadline.
- **Compliance scope** — India DPDP Act 2023, GDPR (frontend touches user data + PostHog analytics), plus CSP / CSRF / XSS / cookie flags posture.
- **Scope choices confirmed (Phase 1)**:
  - Wave A = full frontend audit + Sev-1 + code-owned Sev-2 remediation.
  - Wave B = sub-project 4 + 5 module pages built for all 19 routes + real backend wiring.
  - Audit **first**, wire **after** — no re-work on unfinished code.
  - Dashboard **and** marketing site in audit scope. Marketing preservation rule stays in force — every marketing code change requires per-finding approval.
  - MSW mock backend retained for local dev + tests after real-backend swap.
  - Module page depth: functional cut (real data, permission gates, empty/loading/error states, WCAG AA, keyboard-navigable). No Impeccable-grade polish this window.
- **Baseline commits** — frontend `7c1cdf8` on `main`; backend `52d1473` on `audit-remediation`.
- **Working branches** — Wave A on `frontend-audit-remediation`; Wave B on `frontend-module-wiring` (branches off Wave A merge point).

## Commitments (recorded per identity policy, tracked, reported at close)

1. Every review stage checklist answered — no silent skips.
2. Every confirmed code-owned Sev-1 + Sev-2 finding fixed inside this engagement window.
3. Every fix passes the review pipeline before it lands on the working branch.
4. Marketing site (`apps/website`) preservation rule enforced — findings surfaced but no code changed without explicit per-finding approval.
5. Marketing preservation snapshot suite (`npm run test:visual`) run as a gate on any commit that touches shared packages.
6. Material design decisions become ADRs in `.aeos/memory/adr/`.
7. MSW mock handlers stay in sync with the real backend contract after Wave B swap — a divergence found later must be fixed inside this engagement.
8. Every backend contract cross-check done against the audit-remediation branch at commit `52d1473`, not against stale `main`.
9. Compliance foundation carried from the backend engagement (DSAR, erasure, consent, breach SOP, DPA register, cross-border basis, grievance officer) remains **client-owned** — frontend adds UI surfaces once foundation lands; not this engagement.
10. Executive report at close covers Wave A + Wave B in one document, with residual-risk statement and a signed-off backlog.

## Working preferences observed

- Client keeps the codebase on branches without a PR gate; commits land straight on the working branch.
- Client uses conventional Co-Authored-By commits.
- Client already runs `/simplify` before big audits — trivial reuse/cleanup already in main.
- Client prefers explicit, terse status updates outside of client-facing deliverables. Caveman mode active for chat. Code / commits / security artefacts stay in normal prose.
- Client authorized the backend audit engagement's full-remediation policy and expects the same shape here.

Related repo memory: cross-project client preferences from the backend engagement live at `C:\Users\DELL\.claude\projects\D--Aman-Build-backend-Self-Backend-v1\memory\` — do not import backend audit findings into this engagement, but the client's working-style preferences carry over.
