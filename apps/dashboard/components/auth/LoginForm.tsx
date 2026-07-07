"use client";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@edss/validation/auth";
import { login } from "@edss/auth/client";
import { Input } from "@edss/ui/input";
import { Label } from "@edss/ui/label";
import { RememberMeCheckbox } from "./RememberMeCheckbox";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [pending, start] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember_me: false },
  });

  function onSubmit(input: LoginInput) {
    setFormError(null);
    start(async () => {
      try {
        const result = await login(input);
        if (result.needsTwoFa) {
          router.push(
            `/login/2fa-challenge?challenge_id=${encodeURIComponent(result.challengeId)}`,
          );
          return;
        }
        const next = search.get("next") ?? "/dashboard";
        router.push(next);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Login failed.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      <div>
        <p className="kicker">Sign in</p>
        <h1 className="h1 mt-2">Welcome back.</h1>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-sm text-[var(--color-danger)]">{errors.email.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            Forgot?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <p className="text-sm text-[var(--color-danger)]">{errors.password.message}</p>
        )}
      </div>
      <RememberMeCheckbox
        checked={!!watch("remember_me")}
        onCheckedChange={(v) => setValue("remember_me", v)}
      />
      {formError && (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {formError}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-[var(--radius-sm)] bg-[var(--color-ink)] px-5 text-[0.9rem] text-[var(--color-paper)] hover:bg-[var(--color-ink-2)] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
