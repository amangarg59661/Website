"use client";

import { useForm, useFieldArray, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Plus } from "lucide-react";
import { Input } from "@edss/ui/input";
import { Label } from "@edss/ui/label";
import { FieldError, FieldHint, Textarea } from "@edss/ui/form";
import {
  jobPostingCreateSchema,
  type JobPosting,
  type JobPostingCreateInput,
} from "@edss/validation/resources";

/**
 * Shared form for /staff/careers/new and /staff/careers/[id] edit.
 *
 * Internal shape uses object-wrapped bullets (`{ value: string }[]`) so
 * react-hook-form's `useFieldArray` can key them by stable id. On submit
 * we convert back to the wire shape (`string[]`) via
 * `postingFormValueForCreate`. Zod validation runs on the internal shape
 * with a matching schema — the same rules the backend enforces on the
 * wire schema.
 */
export type PostingFormValue = JobPostingCreateInput;

type BulletItem = { value: string };
export type PostingFormInternal = Omit<PostingFormValue, "responsibilities" | "requirements"> & {
  responsibilities: BulletItem[];
  requirements: BulletItem[];
};

const bulletItemSchema = z.object({ value: z.string().min(1) });
const postingFormInternalSchema = jobPostingCreateSchema
  .omit({ responsibilities: true, requirements: true })
  .extend({
    responsibilities: z.array(bulletItemSchema).default([]),
    requirements: z.array(bulletItemSchema).default([]),
  });

function toBullets(list: string[] | undefined): BulletItem[] {
  const items = (list ?? []).filter((v) => v !== undefined);
  return items.length > 0 ? items.map((value) => ({ value })) : [{ value: "" }];
}

export function usePostingForm(
  defaults?: Partial<PostingFormValue>,
): UseFormReturn<PostingFormInternal> {
  return useForm<PostingFormInternal>({
    resolver: zodResolver(postingFormInternalSchema),
    mode: "onBlur",
    defaultValues: {
      slug: defaults?.slug ?? "",
      title: defaults?.title ?? "",
      team: defaults?.team ?? "",
      location: defaults?.location ?? "",
      employmentType: defaults?.employmentType ?? "Full-time",
      commitment: defaults?.commitment ?? "40h / week",
      summary: defaults?.summary ?? "",
      responsibilities: toBullets(defaults?.responsibilities),
      requirements: toBullets(defaults?.requirements),
      salaryRangeMin: defaults?.salaryRangeMin,
      salaryRangeMax: defaults?.salaryRangeMax,
      currency: defaults?.currency ?? "",
    },
  });
}

/**
 * Prepare a form value for the backend POST/PATCH body — unwraps the
 * BulletItem shape, drops empties, coerces numerics, uppercases currency.
 */
export function postingFormValueForCreate(v: PostingFormInternal): PostingFormValue {
  return {
    slug: v.slug.trim(),
    title: v.title.trim(),
    team: v.team.trim(),
    location: v.location.trim(),
    employmentType: v.employmentType.trim(),
    commitment: v.commitment?.trim() ? v.commitment.trim() : undefined,
    summary: v.summary.trim(),
    responsibilities: (v.responsibilities ?? []).map((b) => b.value.trim()).filter(Boolean),
    requirements: (v.requirements ?? []).map((b) => b.value.trim()).filter(Boolean),
    salaryRangeMin: v.salaryRangeMin,
    salaryRangeMax: v.salaryRangeMax,
    currency: v.currency && v.currency.length === 3 ? v.currency.toUpperCase() : undefined,
  };
}

export function postingToDefaults(p: JobPosting): PostingFormValue {
  return {
    slug: p.slug,
    title: p.title,
    team: p.team,
    location: p.location,
    employmentType: p.employment_type,
    commitment: p.commitment ?? undefined,
    summary: p.summary,
    responsibilities: p.responsibilities.length ? p.responsibilities : [""],
    requirements: p.requirements.length ? p.requirements : [""],
    salaryRangeMin: p.salary_range_min ?? undefined,
    salaryRangeMax: p.salary_range_max ?? undefined,
    currency: p.currency ?? undefined,
  };
}

/** Internal-shape variant for `form.reset` after a fetch completes. */
export function postingToInternalDefaults(p: JobPosting): PostingFormInternal {
  return {
    slug: p.slug,
    title: p.title,
    team: p.team,
    location: p.location,
    employmentType: p.employment_type,
    commitment: p.commitment ?? "",
    summary: p.summary,
    responsibilities: toBullets(p.responsibilities),
    requirements: toBullets(p.requirements),
    salaryRangeMin: p.salary_range_min ?? undefined,
    salaryRangeMax: p.salary_range_max ?? undefined,
    currency: p.currency ?? "",
  };
}

export function PostingForm({
  form,
  onSubmit,
  submitLabel,
  pending,
  disableSlug = false,
  error,
  secondaryAction,
}: {
  form: UseFormReturn<PostingFormInternal>;
  onSubmit: (value: PostingFormInternal) => Promise<void> | void;
  submitLabel: string;
  pending: boolean;
  disableSlug?: boolean;
  error?: string | null;
  secondaryAction?: React.ReactNode;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form;

  const responsibilities = useFieldArray({ control, name: "responsibilities" });
  const requirements = useFieldArray({ control, name: "requirements" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 flex flex-col gap-8">
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register("title")} aria-invalid={!!errors.title} />
          <FieldError>{errors.title?.message}</FieldError>
        </div>

        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            disabled={disableSlug}
            {...register("slug")}
            aria-invalid={!!errors.slug}
          />
          <FieldError>{errors.slug?.message}</FieldError>
          <FieldHint>
            {disableSlug
              ? "Slug is locked once a posting exists — old marketing URLs stay valid."
              : "Lower-case, hyphen-separated. Marketing URL becomes /careers/<slug>."}
          </FieldHint>
        </div>

        <div>
          <Label htmlFor="team">Team</Label>
          <Input id="team" {...register("team")} aria-invalid={!!errors.team} />
          <FieldError>{errors.team?.message}</FieldError>
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" {...register("location")} aria-invalid={!!errors.location} />
          <FieldError>{errors.location?.message}</FieldError>
        </div>

        <div>
          <Label htmlFor="employmentType">Employment type</Label>
          <Input
            id="employmentType"
            placeholder="Full-time"
            {...register("employmentType")}
            aria-invalid={!!errors.employmentType}
          />
          <FieldError>{errors.employmentType?.message}</FieldError>
        </div>

        <div>
          <Label htmlFor="commitment">Commitment (optional)</Label>
          <Input
            id="commitment"
            placeholder="40h / week"
            {...register("commitment")}
            aria-invalid={!!errors.commitment}
          />
          <FieldError>{errors.commitment?.message}</FieldError>
        </div>
      </section>

      <div>
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          rows={4}
          placeholder="One paragraph that appears on the /careers list and at the top of the role page."
          {...register("summary")}
          aria-invalid={!!errors.summary}
        />
        <FieldError>{errors.summary?.message}</FieldError>
      </div>

      <section>
        <div className="flex items-baseline justify-between">
          <Label>Responsibilities</Label>
          <button
            type="button"
            onClick={() => responsibilities.append({ value: "" })}
            className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-sm)] px-2 text-xs text-[var(--color-ink-2)] hover:bg-[var(--color-stone)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
        <FieldHint>Each line shows as a bullet on the marketing page.</FieldHint>
        <ul className="mt-3 flex flex-col gap-2">
          {responsibilities.fields.map((field, index) => (
            <li key={field.id} className="flex items-center gap-2">
              <Input
                aria-label={`Responsibility ${index + 1}`}
                {...register(`responsibilities.${index}.value` as const)}
              />
              <button
                type="button"
                onClick={() => responsibilities.remove(index)}
                disabled={responsibilities.fields.length <= 1}
                aria-label={`Remove responsibility ${index + 1}`}
                className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-strong)] hover:bg-[var(--color-stone)] disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <Label>Requirements</Label>
          <button
            type="button"
            onClick={() => requirements.append({ value: "" })}
            className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-sm)] px-2 text-xs text-[var(--color-ink-2)] hover:bg-[var(--color-stone)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
        <FieldHint>
          Each line shows as a bullet under &ldquo;What we&rsquo;re looking for&rdquo;.
        </FieldHint>
        <ul className="mt-3 flex flex-col gap-2">
          {requirements.fields.map((field, index) => (
            <li key={field.id} className="flex items-center gap-2">
              <Input
                aria-label={`Requirement ${index + 1}`}
                {...register(`requirements.${index}.value` as const)}
              />
              <button
                type="button"
                onClick={() => requirements.remove(index)}
                disabled={requirements.fields.length <= 1}
                aria-label={`Remove requirement ${index + 1}`}
                className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-strong)] hover:bg-[var(--color-stone)] disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <Label htmlFor="salaryRangeMin">Salary min (optional)</Label>
          <Input
            id="salaryRangeMin"
            type="number"
            inputMode="numeric"
            {...register("salaryRangeMin", { setValueAs: numericOrUndefined })}
            aria-invalid={!!errors.salaryRangeMin}
          />
          <FieldError>{errors.salaryRangeMin?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="salaryRangeMax">Salary max (optional)</Label>
          <Input
            id="salaryRangeMax"
            type="number"
            inputMode="numeric"
            {...register("salaryRangeMax", { setValueAs: numericOrUndefined })}
            aria-invalid={!!errors.salaryRangeMax}
          />
          <FieldError>{errors.salaryRangeMax?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="currency">Currency (ISO)</Label>
          <Input
            id="currency"
            placeholder="INR"
            maxLength={3}
            {...register("currency", {
              setValueAs: (v) => (typeof v === "string" ? v.toUpperCase() : v),
            })}
            aria-invalid={!!errors.currency}
          />
          <FieldError>{errors.currency?.message}</FieldError>
        </div>
      </section>

      {error && (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse items-stretch gap-3 border-t border-[var(--color-line)] pt-6 sm:flex-row sm:items-center sm:justify-end">
        {secondaryAction}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center rounded-[var(--radius-sm)] bg-[var(--color-ink)] px-5 text-sm text-[var(--color-paper)] hover:bg-[var(--color-ink-2)] disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function numericOrUndefined(raw: unknown): number | undefined {
  if (raw === "" || raw === null || raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}
