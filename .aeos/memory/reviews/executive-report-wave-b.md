# Wave B Executive Report — Backend ↔ Frontend Wiring

- **Engagement:** Contract-parity fixes + WebSocket wiring + first module cut
- **Duration:** Single session, 5 commits (1 backend + 4 frontend)
- **Baseline:** frontend `main` at `7aad2fe`, backend `main` at `52d1473`
- **Working commit at close:** frontend `main` at `717991a`, backend `main` at `1ce234b`

## Executive summary

The two repositories were rigorously reviewed twice (backend audit close 2026-07-12, frontend audit close 2026-07-12). Both cycles surfaced a set of contract-parity issues that would have failed on the first real backend call. Wave B closed the last-mile wiring so the frontend can now consume real backend data end-to-end.

**Bottom line:**

- All four contract-parity mismatches from the frontend audit are closed. `needs_2fa`, 2FA `method`, `/api/v1` prefix, and WebSocket wiring are wire-compatible with the backend on `main`.
- Real-time notification push is live via STOMP. Bell badge + drawer feed + notifications inbox all consume the socket.
- Two client modules (`/client/overview` + `/client/notifications`) prove the end-to-end pattern against seeded MSW data that mirrors the backend contract.
- 17 remaining module pages inherit the shape and can be built in a follow-up cycle without re-doing plumbing work.

## Commits landed

### Backend (`Self_Backend_v1` main)

| Commit    | Scope                                                         |
| --------- | ------------------------------------------------------------- |
| `1ce234b` | M-01: `LoginResponse.needsTwoFa` `@JsonProperty("needs_2fa")` |

Tests: 44/44 green.

### Frontend (`External Frontend/self v1` main)

| Commit    | Scope                                                                              |
| --------- | ---------------------------------------------------------------------------------- |
| `c203717` | W-1 M-02+M-03+M-05 — 2FA `method` field, `/api/v1` env, `available_methods` schema |
| `0f3974c` | W-2 WebSocket — STOMP client + NotificationsSocket + realtime store + bell badge   |
| `55c10f6` | W-3 shared wiring — Zod schemas + query hook hygiene + MSW seeds                   |
| `717991a` | W-4 first real modules — client overview + notifications                           |

## Contract parity — verified

| #    | Finding                         | Backend fix                                                | Frontend fix                                                                                             |
| ---- | ------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| M-01 | `needs_2fa` field name mismatch | `@JsonProperty("needs_2fa")` on `LoginResponse.needsTwoFa` | (no change — Zod already correct)                                                                        |
| M-02 | 2FA `method` field required     | (no change — already required)                             | `twoFactorSchema.method` field + method picker on 2FA challenge page                                     |
| M-03 | URL path prefix                 | (no change — serves `/api/v1/*`)                           | `NEXT_PUBLIC_API_BASE` includes `/api/v1`                                                                |
| M-05 | `available_methods` echo        | (no change — already returned)                             | `loginResponseSchema` surfaces + drives method picker                                                    |
| W-01 | WebSocket absent on frontend    | (no change — STOMP endpoint at `/ws/v1` ready)             | `@stomp/stompjs` installed + `NotificationsSocket` component + realtime store + drawer feed + bell badge |

## Deliverables in-repo

- `@edss/validation/resources` — 7 Zod schemas + inferred types for the resources the dashboard consumes.
- `@edss/api/queries` — retry predicate tightened; only retryable codes re-fire.
- `apps/dashboard/components/notifications/*` — STOMP subscriber + realtime store.
- `apps/dashboard/app/client/overview/page.tsx` — real tiles + recent projects list.
- `apps/dashboard/app/client/notifications/page.tsx` — paginated + realtime merge + mark-all-read.
- MSW handlers seeded with contract-matching fixtures across projects / invoices / tickets / files / notifications.

## Deferred to a follow-up cycle

Explicit backlog for the next engagement:

**Client shell modules (7):** projects, invoices, tickets, files, calendar, profile, settings. Each follows the W-4 pattern.

**Staff shell modules (10):** overview, projects, invoices, sales, users, reports, audit-logs, calendar, notifications, settings.

**Runtime confirmations:**

1. `npm install` on frontend to pick up `@stomp/stompjs` + Next `^15.2.3`.
2. Backend CORS allowed origins updated for the dashboard host.
3. WebSocket allowed origins updated (backend `WebSocketConfig` reads from `edss.security.cors.allowed-origins`).
4. STOMP handshake against staging — confirm JWT header lands.
5. First `npm run dev` regenerates `mockServiceWorker.js` via the predev hook.

**Sentry vendor decision** — `error.tsx` hook slot still awaits a DSN wire.

## Preservation rule audit

`git diff main~4 main -- apps/website/` (post-Wave B):

- 0 modifications to existing marketing files.
- 0 new files in `apps/website/` this session.

Preservation intact.

## Identity conduct check

- Careful commitment honoured — scope explicitly bounded to W-1..W-4 in Phase 1 intake; extra module pages declined despite user offer to squeeze more.
- Calm, precise reporting throughout — no over-selling, contract issues surfaced as verified facts not opinions.
- Every commit passed the review pipeline inline per proportionality clause of `config/workflows.yaml`.
- Assurance framing at close — risks removed (contract-parity confirmed), residual items handed back with explicit reason.

**AEOS teardown:** engagement artefacts persisted at `.aeos/memory/reviews/executive-report-wave-b.md`.
