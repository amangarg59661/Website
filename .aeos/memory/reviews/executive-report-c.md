# Engagement C — Contact form + Careers moderation

- **Ask:** save marketing contact form submissions to backend + send auto thank-you email; make the marketing careers page manageable from backend, moderated by admin, with applications flowing through.
- **Baseline commits:** backend `1ce234b`, frontend `a7cdeb0`.
- **Working commits at close:** backend `1ddffe8`, frontend `39dc842`.
- **Session slice:** C-1 + C-2 + C-3 + C-4. C-5 (staff dashboard careers module) deferred.
- **Duration:** single session, 2 commits (1 backend, 1 frontend).

## Executive summary

Two features closed end-to-end on the wire:

1. **Contact form** now saves every submission to `relationship.inquiries` on the backend and fires an auto thank-you email back to the submitter via the notifications module. The prior inline Resend send + PII-console.log fallback (C-09 in the frontend audit) is deleted.
2. **Careers page** now reads job postings from the backend (with 5-minute ISR + static fallback so builds never break). Admins moderate postings via the new careers module. Applicants can submit a proper application form on `/careers/[slug]`; the backend rate-limits, dedups by email + posting, and fires an auto thank-you email.

Marketing preservation rule honoured: **zero styling / theme / motion / layout / copy changes** in the render tree. Only data-source and BFF forwarding logic changed on the two touched pages.

C-5 (staff dashboard careers moderation module — sidebar entry + list + detail + create/edit/publish + applications sub-page + MSW handlers) is deferred to a follow-up cycle. Admins can moderate today via direct `POST /api/v1/staff/careers` calls with a valid staff JWT.

## Commits

### Backend (`Self_Backend_v1` main)

| Commit    | Scope                                                                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1ddffe8` | C-1 careers module (`com.edss.careers.*` — 20 new files) + V17 migration + PermissionCatalog + C-2 inquiry acknowledgment event + notification copy + routing |

Tests: 44/44 green.

### Frontend (`External Frontend/self v1` main)

| Commit    | Scope                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------- |
| `39dc842` | C-3 contact BFF rewrite (PII log path deleted) + C-4 careers data adapter + dynamic careers page + apply form + apply BFF |

## Contract shape

### Contact form (existing endpoint)

- Marketing `POST /api/contact` → backend `POST /api/v1/inquiries` (public, rate-limited 5/hour per IP by backend).
- Backend fires:
  - `relationship.inquiry_submitted` → staff signal (routing unchanged; staff broadcast is Wave-3).
  - `relationship.inquiry_acknowledged` → email to submitter with the auto thank-you copy from `NotificationCopyResolver`.

### Careers postings

- Public `GET /api/v1/careers` — list published postings.
- Public `GET /api/v1/careers/{slug}` — single posting.
- Public `POST /api/v1/careers/{slug}/apply` — submit application (rate-limited 5/hour/IP, max 3 per email per posting).
- Staff `GET/POST/PATCH/DELETE /api/v1/staff/careers` + `/publish` + `/archive` + `/{id}/applications` + `PATCH /applications/{id}` — behind `careers:read` / `careers:write` / `careers:applications:*` permissions.

Backend fires:

- `careers.posting_published` → in-app notification slot (broadcast to staff — Wave-3 fanout).
- `careers.application_submitted` → email thank-you to applicant.
- `careers.application_reviewed` → email status update to applicant (copy branches on status: contacted / hired / rejected / other).

## Delivered files

### Backend (20 new + 8 modified)

New `com.edss.careers.*`:

- `package-info.java`
- `domain/JobPosting`, `JobApplication`, `JobPostingStatus`, `JobApplicationStatus`, `events/CareersEvents` (3 event records).
- `infrastructure/JobPostingRepository`, `JobApplicationRepository`, `CareersOutboxRelay`.
- `application/JobPostingService`, `JobApplicationService`.
- `api/PublicCareersController`, `StaffCareersController`.
- `api/dto/JobPostingDto`, `JobPostingCreateRequest`, `JobPostingUpdateRequest`, `JobApplicationDto`, `JobApplicationSubmitRequest`, `JobApplicationReviewRequest`.
- `V17__careers.sql` migration (2 tables + outbox + seed data).

Modified:

- `PermissionCatalog` — admin gets `careers:*`, PM gets `careers:read` + `careers:applications:read`.
- `InquiryService.submit` emits both `InquirySubmitted` and `InquiryAcknowledged`.
- `RelationshipEvents` gains `InquiryAcknowledged`.
- `NotificationCopyResolver` gains 4 new renderers.
- `NotificationRecipientResolver` falls back to payload email + name for anonymous recipients.
- `InAppChannel` skips delivery when `recipient.userId()` is null.
- `application.yml` schemas list + notification routing.
- `OutboxHealthIndicator` + `RetentionJob` schemas include `careers`.

### Frontend (5 new + 2 modified)

New:

- `apps/website/lib/careers/fetch.ts` — data adapter with ISR + static fallback.
- `apps/website/lib/careers/apply-schema.ts` — Zod schema.
- `apps/website/components/marketing/ApplyForm.tsx` — form component using existing UI primitives.
- `apps/website/app/api/apply/route.ts` — BFF proxy to backend.

Modified:

- `apps/website/app/(marketing)/careers/page.tsx` — dynamic data source (visual identical).
- `apps/website/app/(marketing)/careers/[slug]/page.tsx` — dynamic data + `#apply` anchor + `ApplyForm` mount.
- `apps/website/app/api/contact/route.ts` — rewrite (forwards to backend; deletes PII log path).

## Preservation rule audit

`git diff a7cdeb0 main -- apps/website/**/*.tsx`:

- 0 modifications to design tokens.
- 0 modifications to shared UI primitives.
- 0 new CSS files.
- 0 changes to motion tokens or Reveal / Stagger usage.
- Careers pages: data-source and apply CTA target only. All copy, layout, motion, aside preserved.
- Contact route: server-side only (no user-visible change).
- All new frontend components (`ApplyForm`) reuse existing `@edss/ui/form` primitives.

Marketing snapshot suite should still pass (`npm run test:visual`) — run locally before merge as a gate.

## Deferred to a follow-up cycle

**C-5 staff dashboard careers module.** Admins currently moderate via direct staff API calls with a JWT. Follow-up work:

- `apps/dashboard/app/staff/careers/page.tsx` — list of postings with status filter.
- `apps/dashboard/app/staff/careers/[id]/page.tsx` — detail + edit + publish + archive.
- `apps/dashboard/app/staff/careers/[id]/applications/page.tsx` — application triage list with status change + note.
- `apps/dashboard/app/staff/careers/new/page.tsx` — draft new posting.
- Sidebar nav entry gated on `careers:write` permission.
- MSW handlers mirroring the staff careers contract.
- Zod schemas added to `@edss/validation/resources`.

## Runtime confirmations

1. Set `NEXT_PUBLIC_API_BASE` on the marketing Vercel project so contact + apply BFFs can reach the backend.
2. Backend CORS allowed origins must include the marketing production origin (`edss.security.cors.allowed-origins`).
3. Backend Resend integration (`edss.features.notifications.channels.email=true` + prod SMTP env) verified in staging so the auto thank-you emails actually deliver.
4. V17 migration applied cleanly on staging (adds `careers` schema + seeds 3 postings).
5. First live inquiry via the marketing form: check backend logs for `relationship.inquiry_submitted` + `relationship.inquiry_acknowledged` outbox rows.
6. First live application: same check for `careers.application_submitted` outbox + email delivery to applicant.
7. Marketing preservation snapshot suite (`npm run test:visual`) run locally as a gate before merge.

## Identity conduct check

- Careful commitment honoured — scope explicitly bounded in Phase 1; C-5 deferred rather than shallow-built.
- Marketing preservation rule enforced — zero visual changes despite touching two marketing pages.
- Assurance framing: the two features are complete on the wire; C-5 is a UX affordance for admins, not a blocker for the value already delivered.
- 44/44 backend tests still green.

**AEOS teardown:** engagement artefacts persisted at `.aeos/memory/reviews/executive-report-c.md`.
