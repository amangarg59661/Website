"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, Mail, Phone, ExternalLink } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shell/PageHeader";
import { useApiMutation, useApiQuery, makeMutationFn } from "@edss/api/queries";
import {
  jobApplicationListSchema,
  jobApplicationSchema,
  type JobApplication,
  type JobApplicationStatus,
  jobPostingSchema,
  type JobApplicationReviewInput,
} from "@edss/validation/resources";
import { ApplicationStatusBadge } from "@/components/careers/StatusBadge";

const STATUSES: Array<JobApplicationStatus | "all"> = [
  "all",
  "new",
  "reviewing",
  "contacted",
  "rejected",
  "hired",
];
const REVIEW_STATUSES: JobApplicationStatus[] = [
  "new",
  "reviewing",
  "contacted",
  "rejected",
  "hired",
];

export default function JobApplicationsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();

  const posting = useApiQuery(
    ["staff-careers", "detail", id],
    `/staff/careers/${id}`,
    jobPostingSchema,
  );
  const applications = useApiQuery(
    ["staff-careers", "applications", id],
    `/staff/careers/${id}/applications`,
    jobApplicationListSchema,
  );

  const [filter, setFilter] = useState<JobApplicationStatus | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const items = useMemo(() => {
    const all = applications.data ?? [];
    if (filter === "all") return all;
    return all.filter((a) => a.status === filter);
  }, [applications.data, filter]);

  const countByStatus = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const a of applications.data ?? []) {
      acc.all = (acc.all ?? 0) + 1;
      acc[a.status] = (acc[a.status] ?? 0) + 1;
    }
    return acc;
  }, [applications.data]);

  return (
    <>
      <div className="mb-4">
        <Link
          href={`/staff/careers/${id}`}
          className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-strong)] hover:text-[var(--color-ink)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to role
        </Link>
      </div>

      <PageHeader
        kicker="Applications"
        title={posting.data?.title ?? "Applications"}
        subtitle="Every applicant for this role. Change status to send the applicant an update by email."
      />

      <div className="mt-8 flex flex-wrap items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-line)] p-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            aria-pressed={filter === s}
            className={`inline-flex h-8 items-center gap-1.5 rounded-[3px] px-2.5 text-xs capitalize ${
              filter === s
                ? "bg-[var(--color-ink)] text-[var(--color-paper)]"
                : "text-[var(--color-muted-strong)] hover:text-[var(--color-ink)]"
            }`}
          >
            {s}
            <span
              className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] ${
                filter === s
                  ? "bg-[color-mix(in_oklch,var(--color-paper)_25%,transparent)]"
                  : "bg-[var(--color-stone)]"
              }`}
            >
              {countByStatus[s] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {applications.isLoading && (
        <div className="mt-8 space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              aria-hidden="true"
              className="h-20 animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-stone-2)]"
            />
          ))}
        </div>
      )}

      {applications.error && (
        <p role="alert" className="mt-8 text-sm text-[var(--color-danger)]">
          {applications.error.message}
        </p>
      )}

      {!applications.isLoading && items.length === 0 && (
        <div className="mt-12 rounded-[var(--radius-md)] border border-dashed border-[var(--color-line-strong)] p-12 text-center">
          <p className="kicker text-[var(--color-gold-ink)]">Empty</p>
          <h2 className="h4 mt-2">
            {filter === "all" ? "No applications yet." : `No ${filter} applications.`}
          </h2>
          <p className="mx-auto mt-2 max-w-[46ch] text-sm text-[var(--color-muted)]">
            Applications land here as they come in. Every applicant receives an automatic thank-you.
          </p>
        </div>
      )}

      {items.length > 0 && (
        <ul className="mt-8 flex flex-col gap-3">
          {items.map((a) => (
            <ApplicationRow
              key={a.id}
              app={a}
              open={openId === a.id}
              onToggle={() => setOpenId((prev) => (prev === a.id ? null : a.id))}
              onReviewed={() => {
                void queryClient.invalidateQueries({
                  queryKey: ["staff-careers", "applications", id],
                });
              }}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function ApplicationRow({
  app,
  open,
  onToggle,
  onReviewed,
}: {
  app: JobApplication;
  open: boolean;
  onToggle: () => void;
  onReviewed: () => void;
}) {
  const [status, setStatus] = useState<JobApplicationStatus>(app.status);
  const [note, setNote] = useState(app.reviewer_note ?? "");
  const [error, setError] = useState<string | null>(null);

  const review = useApiMutation(
    makeMutationFn<JobApplicationReviewInput, typeof jobApplicationSchema>(
      `/staff/careers/applications/${app.id}`,
      "PATCH",
      jobApplicationSchema,
    ),
    {
      onSuccess: () => {
        setError(null);
        onReviewed();
      },
      onError: (err) => setError(err.message),
    },
  );

  const dirty = status !== app.status || (note || "") !== (app.reviewer_note ?? "");

  return (
    <li className="rounded-[var(--radius-md)] border border-[var(--color-line)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-4 rounded-t-[var(--radius-md)] px-4 py-3 text-left hover:bg-[var(--color-stone)]"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-[var(--color-ink)]">{app.applicant_name}</p>
            <ApplicationStatusBadge status={app.status} />
          </div>
          <p className="mt-1 text-xs text-[var(--color-muted-strong)]">
            {app.applicant_email} · Submitted {new Date(app.submitted_at).toLocaleDateString()}
          </p>
          {!open && (
            <p className="mt-2 line-clamp-1 text-sm text-[var(--color-muted)]">
              {app.cover_letter}
            </p>
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--color-line)] px-4 py-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-muted-strong)]">
            <a
              href={`mailto:${app.applicant_email}`}
              className="inline-flex items-center gap-1 hover:text-[var(--color-ink)]"
            >
              <Mail className="h-3.5 w-3.5" />
              {app.applicant_email}
            </a>
            {app.applicant_phone && (
              <a
                href={`tel:${app.applicant_phone.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-1 hover:text-[var(--color-ink)]"
              >
                <Phone className="h-3.5 w-3.5" />
                {app.applicant_phone}
              </a>
            )}
            {app.resume_url && (
              <a
                href={app.resume_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-[var(--color-ink)]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Portfolio
              </a>
            )}
          </div>

          <p className="mt-4 text-sm whitespace-pre-wrap text-[var(--color-ink)]">
            {app.cover_letter}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
            <label className="text-sm">
              <span className="kicker mb-1 block">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as JobApplicationStatus)}
                className="h-10 w-full rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] bg-[var(--color-paper)] px-2 text-sm capitalize"
              >
                {REVIEW_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="kicker mb-1 block">Internal note (optional)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="A line for the team. The applicant does not see this."
                className="w-full rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] bg-[var(--color-paper)] px-3 py-2 text-sm"
              />
            </label>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <p className="mr-auto text-xs text-[var(--color-muted-strong)]">
              Status change sends the applicant an automatic email — contacted, hired, and rejected
              all trigger tailored copy.
            </p>
            <button
              type="button"
              onClick={() => review.mutate({ status, note: note || undefined })}
              disabled={!dirty || review.isPending}
              className="inline-flex h-10 items-center rounded-[var(--radius-sm)] bg-[var(--color-ink)] px-4 text-sm text-[var(--color-paper)] hover:bg-[var(--color-ink-2)] disabled:opacity-60"
            >
              {review.isPending ? "Saving…" : "Save review"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
