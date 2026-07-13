"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { applySchema, type ApplyPayload } from "@/lib/careers/apply-schema";
import { Button } from "@edss/ui/button";
import { FieldError, FieldHint, Input, Label, Textarea } from "@edss/ui/form";

/**
 * C-4: applicant form for /careers/[slug]. Posts to /api/apply which
 * forwards to backend POST /careers/{slug}/apply. Marketing preservation
 * rule: reuses the same form primitives + tokens as ContactForm — no new
 * styling, no new theme.
 */
type Status = { kind: "idle" | "submitting" | "ok" | "error"; message?: string };

export function ApplyForm({ slug, roleTitle }: { slug: string; roleTitle: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ApplyPayload>({ resolver: zodResolver(applySchema), mode: "onBlur" });

  const submit = handleSubmit(async (data) => {
    setStatus({ kind: "submitting" });
    try {
      const res = await fetch(`/api/apply?slug=${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Request failed");
      }
      setStatus({
        kind: "ok",
        message: `Thank you. Your application for ${roleTitle} is with us; a partner will reply personally within two weeks.`,
      });
      reset();
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  });

  if (status.kind === "ok") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="border-t border-[var(--color-line-strong)] pt-10"
      >
        <span className="kicker text-[var(--color-gold-2)]">Received</span>
        <p className="mt-4 max-w-[38ch] font-[family-name:var(--font-display)] text-[clamp(1.5rem,1.1rem+1.4vw,2.25rem)] leading-tight tracking-[-0.02em] text-[var(--color-ink)]">
          {status.message}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2">
      <div className="md:col-span-1">
        <Label htmlFor="applicantName">Name</Label>
        <Input
          id="applicantName"
          autoComplete="name"
          {...register("applicantName")}
          aria-invalid={!!errors.applicantName}
        />
        <FieldError>{errors.applicantName?.message}</FieldError>
      </div>

      <div className="md:col-span-1">
        <Label htmlFor="applicantEmail">Email</Label>
        <Input
          id="applicantEmail"
          type="email"
          autoComplete="email"
          {...register("applicantEmail")}
          aria-invalid={!!errors.applicantEmail}
        />
        <FieldError>{errors.applicantEmail?.message}</FieldError>
      </div>

      <div className="md:col-span-1">
        <Label htmlFor="applicantPhone">Phone (optional)</Label>
        <Input
          id="applicantPhone"
          type="tel"
          autoComplete="tel"
          placeholder="+91 · with country code"
          {...register("applicantPhone")}
          aria-invalid={!!errors.applicantPhone}
        />
        <FieldError>{errors.applicantPhone?.message}</FieldError>
      </div>

      <div className="md:col-span-1">
        <Label htmlFor="resumeUrl">Portfolio or resume link (optional)</Label>
        <Input
          id="resumeUrl"
          type="url"
          placeholder="LinkedIn, personal site, or a public PDF"
          {...register("resumeUrl")}
          aria-invalid={!!errors.resumeUrl}
        />
        <FieldError>{errors.resumeUrl?.message}</FieldError>
        <FieldHint>
          Any public link works. We don&apos;t accept file uploads on this page.
        </FieldHint>
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="coverLetter">Why this role?</Label>
        <Textarea
          id="coverLetter"
          rows={7}
          placeholder="A few sentences on why this role fits, and one recent piece of work you're proud of."
          {...register("coverLetter")}
          aria-invalid={!!errors.coverLetter}
        />
        <FieldError>{errors.coverLetter?.message}</FieldError>
      </div>

      {/* Honeypot — hidden from users */}
      <div className="hidden" aria-hidden>
        <label htmlFor="apply-company">Company</label>
        <input id="apply-company" tabIndex={-1} autoComplete="off" {...register("company")} />
      </div>

      <div className="mt-4 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center md:col-span-2">
        <p className="max-w-[52ch] text-sm text-[var(--color-muted)]">
          We read every application personally. Reply within two weeks.
        </p>
        <Button
          type="submit"
          intent="primary"
          size="lg"
          disabled={status.kind === "submitting"}
          withArrow
        >
          {status.kind === "submitting" ? "Sending…" : "Send application"}
        </Button>
      </div>

      {status.kind === "error" && (
        <p role="alert" className="text-sm text-[var(--color-danger)] md:col-span-2">
          {status.message}
        </p>
      )}
    </form>
  );
}
