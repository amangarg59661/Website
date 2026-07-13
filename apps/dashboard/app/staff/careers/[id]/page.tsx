"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Archive, ArrowUpRight, ExternalLink, Rocket, Trash2, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shell/PageHeader";
import { apiFetch } from "@edss/api";
import { useApiMutation, useApiQuery, makeMutationFn } from "@edss/api/queries";
import {
  jobPostingSchema,
  jobPostingUpdateSchema,
  type JobPosting,
  type JobPostingUpdateInput,
} from "@edss/validation/resources";
import { PostingStatusBadge } from "@/components/careers/StatusBadge";
import {
  PostingForm,
  postingFormValueForCreate,
  postingToDefaults,
  usePostingForm,
  type PostingFormValue,
} from "@/components/careers/PostingForm";

export default function JobPostingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  const posting = useApiQuery(
    ["staff-careers", "detail", id],
    `/staff/careers/${id}`,
    jobPostingSchema,
  );

  const form = usePostingForm(posting.data ? postingToDefaults(posting.data) : undefined);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Re-hydrate form once the backend replies.
  useEffect(() => {
    if (posting.data) form.reset(postingToDefaults(posting.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posting.data?.id]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["staff-careers"] });
  };

  const update = useApiMutation(
    async (value: JobPostingUpdateInput): Promise<JobPosting> => {
      const parsed = jobPostingUpdateSchema.parse(value);
      const fn = makeMutationFn<JobPostingUpdateInput, typeof jobPostingSchema>(
        `/staff/careers/${id}`,
        "PATCH",
        jobPostingSchema,
      );
      return fn(parsed);
    },
    {
      onSuccess: invalidate,
      onError: (err) => setSubmitError(err.message),
    },
  );

  const publish = useApiMutation(
    makeMutationFn<void, typeof jobPostingSchema>(
      `/staff/careers/${id}/publish`,
      "POST",
      jobPostingSchema,
    ),
    { onSuccess: invalidate, onError: (err) => setSubmitError(err.message) },
  );

  const archive = useApiMutation(
    makeMutationFn<void, typeof jobPostingSchema>(
      `/staff/careers/${id}/archive`,
      "POST",
      jobPostingSchema,
    ),
    { onSuccess: invalidate, onError: (err) => setSubmitError(err.message) },
  );

  const remove = useApiMutation<void, void>(
    () => apiFetch(`/staff/careers/${id}`, { method: "DELETE" }) as Promise<void>,
    {
      onSuccess: () => {
        invalidate();
        router.push("/staff/careers");
      },
      onError: (err) => setSubmitError(err.message),
    },
  );

  if (posting.isLoading) {
    return (
      <>
        <PageHeader kicker="Careers" title="Loading role…" />
        <div className="mt-8 h-64 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-stone-2)]" />
      </>
    );
  }

  if (posting.error) {
    return (
      <>
        <PageHeader kicker="Careers" title="Role" />
        <p role="alert" className="mt-8 text-sm text-[var(--color-danger)]">
          {posting.error.message}
        </p>
        <Link
          href="/staff/careers"
          className="mt-4 inline-flex text-sm text-[var(--color-ink-2)] underline-offset-2 hover:underline"
        >
          ← Back to all postings
        </Link>
      </>
    );
  }

  if (!posting.data) return null;
  const p = posting.data;
  const isDraft = p.status === "draft";
  const isPublished = p.status === "published";
  const isArchived = p.status === "archived";
  const mutating = update.isPending || publish.isPending || archive.isPending || remove.isPending;

  return (
    <>
      <PageHeader
        kicker={`Careers · ${p.team}`}
        title={p.title}
        subtitle={p.summary}
        actions={
          <div className="flex items-center gap-2">
            <PostingStatusBadge status={p.status} />
            <Link
              href={`/staff/careers/${p.id}/applications`}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] px-3 text-sm text-[var(--color-ink)] hover:border-[var(--color-ink)]"
            >
              <Users className="h-3.5 w-3.5" />
              Applications
            </Link>
          </div>
        }
      />

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetaTile label="Slug" value={`/${p.slug}`} />
        <MetaTile
          label="Published"
          value={p.published_at ? new Date(p.published_at).toLocaleDateString() : "—"}
        />
        <MetaTile
          label="Updated"
          value={p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "—"}
        />
        <MetaTile
          label="Public URL"
          value={
            isPublished ? (
              <a
                href={`/careers/${p.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[var(--color-ink)] underline-offset-2 hover:underline"
              >
                careers/{p.slug}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <span className="text-[var(--color-muted-strong)]">Not published</span>
            )
          }
        />
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-stone)] p-3">
        {isDraft && (
          <>
            <button
              type="button"
              onClick={() => publish.mutate()}
              disabled={mutating}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-ink)] px-3 text-sm text-[var(--color-paper)] hover:bg-[var(--color-ink-2)] disabled:opacity-60"
            >
              <Rocket className="h-3.5 w-3.5" />
              Publish
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Delete this draft? This cannot be undone.")) remove.mutate();
              }}
              disabled={mutating}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] px-3 text-sm text-[var(--color-danger)] hover:border-[var(--color-danger)] disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete draft
            </button>
          </>
        )}
        {isPublished && (
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "Archive this posting? It will disappear from the public careers page.",
                )
              ) {
                archive.mutate();
              }
            }}
            disabled={mutating}
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] px-3 text-sm text-[var(--color-ink)] hover:border-[var(--color-ink)] disabled:opacity-60"
          >
            <Archive className="h-3.5 w-3.5" />
            Archive
          </button>
        )}
        {isArchived && (
          <p className="text-sm text-[var(--color-muted-strong)]">
            This posting is archived. It is not visible on the public careers page.
          </p>
        )}
        <div className="ml-auto flex items-center gap-2">
          {isPublished && (
            <Link
              href={`/careers/${p.slug}`}
              className="inline-flex h-9 items-center gap-1 rounded-[var(--radius-sm)] px-3 text-sm text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
              target="_blank"
              rel="noreferrer"
            >
              View live
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      <PostingForm
        form={form}
        disableSlug
        onSubmit={(value: PostingFormValue) => {
          setSubmitError(null);
          const shaped = postingFormValueForCreate(value);
          const { slug: _slug, ...updatePayload } = shaped;
          update.mutate(updatePayload);
        }}
        submitLabel="Save changes"
        pending={update.isPending}
        error={submitError}
        secondaryAction={
          <Link
            href="/staff/careers"
            className="inline-flex h-11 items-center rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] px-5 text-sm text-[var(--color-ink)] hover:border-[var(--color-ink)]"
          >
            Back
          </Link>
        }
      />
    </>
  );
}

function MetaTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
      <p className="kicker">{label}</p>
      <p className="mt-2 text-sm text-[var(--color-ink)]">{value}</p>
    </div>
  );
}
