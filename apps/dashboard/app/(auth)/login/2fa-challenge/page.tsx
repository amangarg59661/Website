"use client";
import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TotpInput } from "@/components/auth/TotpInput";
import { verify2FA } from "@edss/auth/client";
import type { TwoFactorMethod } from "@edss/validation/auth";
import { RememberMeCheckbox } from "@/components/auth/RememberMeCheckbox";

/**
 * M-02: backend requires `method` on TwoFaVerifyRequest. Default TOTP so
 * users with only-TOTP enrolled see the same UX. WhatsApp OTP + backup
 * code selectors surface when the user has multiple methods enrolled.
 */
function Inner() {
  const router = useRouter();
  const search = useSearchParams();
  const challengeId = search.get("challenge_id") ?? "";
  const [method, setMethod] = useState<TwoFactorMethod>("totp");
  const [code, setCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const codeLen = method === "backup_code" ? 10 : 6;
  const codeReady = code.length >= codeLen;

  function submit() {
    if (!codeReady) return;
    setError(null);
    start(async () => {
      try {
        await verify2FA({
          challenge_id: challengeId,
          method,
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
      {method === "totp" || method === "whatsapp_otp" ? (
        <TotpInput value={code} onChange={setCode} />
      ) : (
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 10))}
          autoFocus
          spellCheck={false}
          maxLength={10}
          aria-label="Backup code"
          className="h-12 w-full rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] bg-transparent px-3 text-center font-mono text-lg tracking-widest focus:border-[var(--color-ink)] focus:outline-none"
        />
      )}
      <div className="text-sm">
        <details className="text-[var(--color-muted)]">
          <summary className="cursor-pointer">Use another method</summary>
          <div className="mt-3 flex flex-col gap-2">
            {(["totp", "whatsapp_otp", "backup_code"] as const)
              .filter((m) => m !== method)
              .map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMethod(m);
                    setCode("");
                  }}
                  className="text-left text-[var(--color-ink)] underline-offset-2 hover:underline"
                >
                  {m === "totp"
                    ? "Authenticator app code"
                    : m === "whatsapp_otp"
                      ? "WhatsApp code"
                      : "Backup code"}
                </button>
              ))}
          </div>
        </details>
      </div>
      <RememberMeCheckbox checked={rememberDevice} onCheckedChange={setRememberDevice} />
      {error && (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={pending || !codeReady}
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
