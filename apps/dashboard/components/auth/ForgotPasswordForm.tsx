"use client";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@edss/validation/auth";
import { requestPasswordReset } from "@edss/auth/client";
import { Input } from "@edss/ui/input";
import { Label } from "@edss/ui/label";

export function ForgotPasswordForm() {
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  if (sent) {
    return (
      <div>
        <h1 className="h2">Check your email.</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          If the address exists, we sent a reset link.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((v) =>
        start(async () => {
          await requestPasswordReset(v);
          setSent(true);
        }),
      )}
      className="flex flex-col gap-6"
      noValidate
    >
      <div>
        <p className="kicker">Reset password</p>
        <h1 className="h2 mt-2">Send a reset link.</h1>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoFocus {...register("email")} />
        {errors.email && (
          <p className="text-sm text-[var(--color-danger)]">{errors.email.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-[var(--radius-sm)] bg-[var(--color-ink)] px-5 text-[0.9rem] text-[var(--color-paper)] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
