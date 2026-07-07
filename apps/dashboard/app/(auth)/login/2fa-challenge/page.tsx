"use client";
import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TotpInput } from "@/components/auth/TotpInput";
import { verify2FA } from "@edss/auth/client";
import { RememberMeCheckbox } from "@/components/auth/RememberMeCheckbox";

function Inner() {
  const router = useRouter();
  const search = useSearchParams();
  const challengeId = search.get("challenge_id") ?? "";
  const [code, setCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    if (code.length !== 6) return;
    setError(null);
    start(async () => {
      try {
        await verify2FA({
          challenge_id: challengeId,
          code,
          remember_device: rememberDevice,
        });
        router.push("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Verification failed.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="kicker">Two-factor auth</p>
        <h1 className="h2 mt-2">Enter the six-digit code.</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">From your authenticator app.</p>
      </div>
      <TotpInput value={code} onChange={setCode} />
      <RememberMeCheckbox checked={rememberDevice} onCheckedChange={setRememberDevice} />
      {error && (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={pending || code.length !== 6}
        className="h-11 rounded-[var(--radius-sm)] bg-[var(--color-ink)] px-5 text-[0.9rem] text-[var(--color-paper)] disabled:opacity-60"
      >
        {pending ? "Verifying…" : "Verify"}
      </button>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
