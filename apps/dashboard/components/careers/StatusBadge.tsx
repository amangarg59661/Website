"use client";

import type { JobPostingStatus, JobApplicationStatus } from "@edss/validation/resources";

const POSTING_TONE: Record<JobPostingStatus, { bg: string; ink: string; label: string }> = {
  draft: {
    bg: "color-mix(in oklch, var(--color-ink-3) 12%, transparent)",
    ink: "var(--color-ink-2)",
    label: "Draft",
  },
  published: {
    bg: "color-mix(in oklch, var(--color-success) 15%, transparent)",
    ink: "var(--color-success)",
    label: "Published",
  },
  archived: {
    bg: "color-mix(in oklch, var(--color-muted) 15%, transparent)",
    ink: "var(--color-muted-strong)",
    label: "Archived",
  },
};

const APPLICATION_TONE: Record<JobApplicationStatus, { bg: string; ink: string; label: string }> = {
  new: {
    bg: "color-mix(in oklch, var(--color-gold) 15%, transparent)",
    ink: "var(--color-gold-ink)",
    label: "New",
  },
  reviewing: {
    bg: "color-mix(in oklch, var(--color-ink) 10%, transparent)",
    ink: "var(--color-ink-2)",
    label: "Reviewing",
  },
  contacted: {
    bg: "color-mix(in oklch, var(--color-success) 15%, transparent)",
    ink: "var(--color-success)",
    label: "Contacted",
  },
  rejected: {
    bg: "color-mix(in oklch, var(--color-danger) 12%, transparent)",
    ink: "var(--color-danger)",
    label: "Rejected",
  },
  hired: {
    bg: "color-mix(in oklch, var(--color-success) 20%, transparent)",
    ink: "var(--color-success)",
    label: "Hired",
  },
};

export function PostingStatusBadge({ status }: { status: JobPostingStatus }) {
  const tone = POSTING_TONE[status];
  return (
    <span
      style={{ backgroundColor: tone.bg, color: tone.ink }}
      className="inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium"
    >
      {tone.label}
    </span>
  );
}

export function ApplicationStatusBadge({ status }: { status: JobApplicationStatus }) {
  const tone = APPLICATION_TONE[status];
  return (
    <span
      style={{ backgroundColor: tone.bg, color: tone.ink }}
      className="inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium"
    >
      {tone.label}
    </span>
  );
}
