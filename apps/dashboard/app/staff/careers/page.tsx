"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { useApiQuery } from "@edss/api/queries";
import {
  jobPostingListSchema,
  type JobPosting,
  type JobPostingStatus,
} from "@edss/validation/resources";
import { useHasPermission } from "@edss/auth";
import { PostingStatusBadge } from "@/components/careers/StatusBadge";

/**
 * Staff careers module — list of every posting (all statuses), tabbed
 * status filter, "New draft" primary CTA. Follows the same shape as
 * client/overview: schema in @edss/validation/resources, backend hit via
 * useApiQuery, MSW seed in dev, error/loading states inline.
 */

const STATUSES: Array<JobPostingStatus | "all"> = ["all", "published", "draft", "archived"];

export default function StaffCareersPage() {
  const canWrite = useHasPermission("careers:write");
  const [filter, setFilter] = useState<JobPostingStatus | "all">("all");

  const postings = useApiQuery(
    ["staff-careers", "list"],
    "/staff/careers?limit=200",
    jobPostingListSchema,
  );

  const items = useMemo(() => {
    const all = postings.data ?? [];
    if (filter === "all") return all;
    return all.filter((p) => p.status === filter);
  }, [postings.data, filter]);

  const countByStatus = useMemo(() => {
    const acc: Record<string, number> = { all: 0, published: 0, draft: 0, archived: 0 };
    for (const p of postings.data ?? []) {
      acc.all += 1;
      acc[p.status] = (acc[p.status] ?? 0) + 1;
    }
    return acc;
  }, [postings.data]);

  return (
    <>
      <PageHeader
        kicker="Careers"
        title="Job postings"
        subtitle="Draft, publish, and archive the roles that appear on the marketing careers page."
        actions={
          canWrite && (
            <Link
              href="/staff/careers/new"
              className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-ink)] px-3.5 text-sm text-[var(--color-paper)] hover:bg-[var(--color-ink-2)]"
            >
              <Plus className="h-3.5 w-3.5" />
              New draft
            </Link>
          )
        }
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

      {postings.isLoading && (
        <div className="mt-8 space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              aria-hidden="true"
              className="h-16 animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-stone-2)]"
            />
          ))}
        </div>
      )}

      {postings.error && (
        <p role="alert" className="mt-8 text-sm text-[var(--color-danger)]">
          {postings.error.message}
        </p>
      )}

      {!postings.isLoading && items.length === 0 && (
        <div className="mt-12 rounded-[var(--radius-md)] border border-dashed border-[var(--color-line-strong)] p-12 text-center">
          <p className="kicker text-[var(--color-gold-ink)]">Empty</p>
          <h2 className="h4 mt-2">
            {filter === "all" ? "No postings yet." : `No ${filter} postings.`}
          </h2>
          <p className="mx-auto mt-2 max-w-[46ch] text-sm text-[var(--color-muted)]">
            Roles you draft here appear on the public careers page as soon as you publish them.
          </p>
          {canWrite && (
            <Link
              href="/staff/careers/new"
              className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-ink)] px-3.5 text-sm text-[var(--color-paper)] hover:bg-[var(--color-ink-2)]"
            >
              <Plus className="h-3.5 w-3.5" />
              Draft a role
            </Link>
          )}
        </div>
      )}

      {items.length > 0 && (
        <ul className="mt-8 divide-y divide-[var(--color-line)]">
          {items.map((p) => (
            <PostingRow key={p.id} posting={p} />
          ))}
        </ul>
      )}
    </>
  );
}

function PostingRow({ posting }: { posting: JobPosting }) {
  return (
    <li className="py-4">
      <Link
        href={`/staff/careers/${posting.id}`}
        className="flex items-start justify-between gap-4 rounded-[var(--radius-sm)] px-2 py-2 hover:bg-[var(--color-stone)]"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-[var(--color-ink)]">{posting.title}</p>
            <PostingStatusBadge status={posting.status} />
          </div>
          <p className="mt-1 text-xs text-[var(--color-muted-strong)]">
            {posting.team} · {posting.location} · {posting.employment_type}
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-[var(--color-muted)]">{posting.summary}</p>
        </div>
        <div className="hidden shrink-0 text-right text-xs text-[var(--color-muted-strong)] sm:block">
          <p>/{posting.slug}</p>
          {posting.published_at && (
            <p className="mt-1">Published {new Date(posting.published_at).toLocaleDateString()}</p>
          )}
          {!posting.published_at && posting.updated_at && (
            <p className="mt-1">Updated {new Date(posting.updated_at).toLocaleDateString()}</p>
          )}
        </div>
      </Link>
    </li>
  );
}
