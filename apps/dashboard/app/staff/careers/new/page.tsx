"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shell/PageHeader";
import { useApiMutation, makeMutationFn } from "@edss/api/queries";
import { jobPostingSchema, type JobPosting } from "@edss/validation/resources";
import {
  PostingForm,
  postingFormValueForCreate,
  usePostingForm,
  type PostingFormValue,
} from "@/components/careers/PostingForm";

/**
 * Draft a new posting. Every new posting lands in `draft` — the publish
 * button on the detail page is what makes it live on the marketing site.
 */
export default function NewJobPostingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = usePostingForm();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const create = useApiMutation(
    makeMutationFn<PostingFormValue, typeof jobPostingSchema>(
      "/staff/careers",
      "POST",
      jobPostingSchema,
    ),
    {
      onSuccess: (created: JobPosting) => {
        void queryClient.invalidateQueries({ queryKey: ["staff-careers"] });
        router.push(`/staff/careers/${created.id}`);
      },
      onError: (err) => setSubmitError(err.message),
    },
  );

  return (
    <>
      <PageHeader
        kicker="Careers"
        title="Draft a new role"
        subtitle="Fill in the shape of the role. Nothing goes live on the marketing site until you publish."
      />

      <PostingForm
        form={form}
        onSubmit={(value) => {
          setSubmitError(null);
          create.mutate(postingFormValueForCreate(value));
        }}
        submitLabel="Save draft"
        pending={create.isPending}
        error={submitError}
        secondaryAction={
          <Link
            href="/staff/careers"
            className="inline-flex h-11 items-center rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] px-5 text-sm text-[var(--color-ink)] hover:border-[var(--color-ink)]"
          >
            Cancel
          </Link>
        }
      />
    </>
  );
}
