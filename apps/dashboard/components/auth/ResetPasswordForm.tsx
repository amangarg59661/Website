"use client";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPasswordSchema, type ResetPasswordInput } from "@edss/validation/auth";
import { confirmPasswordReset } from "@edss/auth/client";
import { Input } from "@edss/ui/input";
import { Label } from "@edss/ui/label";

export function ResetPasswordForm() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") ?? "";
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, new_password: "", confirm: "" },
  });

  return (
    <form
      onSubmit={handleSubmit((v) =>
        start(async () => {
          try {
            await confirmPasswordReset({ token: v.token, new_password: v.new_password });
            router.push("/login?reason=password_reset");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Reset failed.");
          }
        }),
      )}
      className="flex flex-col gap-6"
      noValidate
    >
      <div>
        <p className="kicker">Set new password</p>
        <h1 className="h2 mt-2">Choose a strong password.</h1>
      </div>
      <input type="hidden" {...register("token")} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new_password">New password</Label>
        <Input
          id="new_password"
          type="password"
          autoComplete="new-password"
          autoFocus
          {...register("new_password")}
        />
        {errors.new_password && (
          <p className="text-sm text-[var(--color-danger)]">{errors.new_password.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input id="confirm" type="password" autoComplete="new-password" {...register("confirm")} />
        {errors.confirm && (
          <p className="text-sm text-[var(--color-danger)]">{errors.confirm.message}</p>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-[var(--radius-sm)] bg-[var(--color-ink)] px-5 text-[0.9rem] text-[var(--color-paper)] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
