"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { contactSchema, type ContactPayload } from "@/lib/contact/schema";
import { Button } from "@/components/primitives/Button";
import { FieldError, FieldHint, Input, Label, Textarea } from "@/components/primitives/Form";

type Status = { kind: "idle" | "submitting" | "ok" | "error"; message?: string };

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactPayload>({ resolver: zodResolver(contactSchema), mode: "onBlur" });

  const submit = handleSubmit(async (data) => {
    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Request failed");
      setStatus({
        kind: "ok",
        message: "Thank you. We'll be in touch within one business day.",
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
        <p className="mt-4 font-[family-name:var(--font-display)] text-[clamp(1.5rem,1.1rem+1.4vw,2.25rem)] leading-tight tracking-[-0.02em] text-[var(--color-ink)] max-w-[38ch]">
          {status.message}
        </p>
        <p className="mt-6 text-[var(--color-muted)] max-w-[54ch]">
          A partner will read your note personally. If your inquiry is urgent, you can also
          message us on WhatsApp for a faster read.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
      <div className="md:col-span-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" autoComplete="name" {...register("name")} aria-invalid={!!errors.name} />
        <FieldError>{errors.name?.message}</FieldError>
      </div>

      <div className="md:col-span-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        <FieldError>{errors.email?.message}</FieldError>
      </div>

      <div className="md:col-span-1">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+91 · with country code"
          {...register("phone")}
          aria-invalid={!!errors.phone}
        />
        <FieldError>{errors.phone?.message}</FieldError>
      </div>

      <div className="md:col-span-1">
        <Label htmlFor="meetingTime">Preferred meeting time</Label>
        <Input
          id="meetingTime"
          placeholder="Tuesday afternoons, IST — for example"
          {...register("meetingTime")}
          aria-invalid={!!errors.meetingTime}
        />
        <FieldError>{errors.meetingTime?.message}</FieldError>
        <FieldHint>Time zone and rough window — we&apos;ll confirm precisely.</FieldHint>
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="message">What are we solving?</Label>
        <Textarea
          id="message"
          rows={6}
          placeholder="A few sentences on the shape of the problem — technology, brand, growth, or a specific outcome."
          {...register("message")}
          aria-invalid={!!errors.message}
        />
        <FieldError>{errors.message?.message}</FieldError>
      </div>

      {/* Honeypot — hidden from users */}
      <div className="hidden" aria-hidden>
        <label htmlFor="company">Company</label>
        <input id="company" tabIndex={-1} autoComplete="off" {...register("company")} />
      </div>

      <div className="md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mt-4">
        <p className="text-sm text-[var(--color-muted)] max-w-[52ch]">
          We reply within one business day. You&apos;ll hear from a partner, not a rep.
        </p>
        <Button
          type="submit"
          intent="primary"
          size="lg"
          disabled={status.kind === "submitting"}
          withArrow
        >
          {status.kind === "submitting" ? "Sending…" : "Send inquiry"}
        </Button>
      </div>

      {status.kind === "error" && (
        <p role="alert" className="md:col-span-2 text-sm text-[var(--color-danger)]">
          {status.message}
        </p>
      )}
    </form>
  );
}
