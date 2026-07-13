"use client";
import { useEffect } from "react";
import Link from "next/link";

/**
 * P-08 + U-12: surface the error digest so users can quote it in support
 * conversations, and dispatch to whatever reporter is wired at boot
 * (window.__edssReportError, populated by AuthProvider or a future Sentry
 * hook). Console fallback keeps the trail readable in dev.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const reporter = (globalThis as unknown as { __edssReportError?: (e: unknown) => void })
      .__edssReportError;
    if (typeof reporter === "function") {
      reporter({ message: error.message, digest: error.digest, stack: error.stack });
    } else {
      console.error("[dashboard] unhandled error", {
        message: error.message,
        digest: error.digest,
      });
    }
  }, [error]);

  return (
    <main className="container-app py-24">
      <p className="kicker">Error</p>
      <h1 className="h1 mt-4">Something went wrong.</h1>
      <p className="lede mt-4">
        The page you were viewing failed to render. You can retry, or return to your dashboard.
      </p>
      {error.digest && (
        <p className="mt-4 font-mono text-xs text-[var(--color-ink-2)]">
          Reference: {error.digest}
        </p>
      )}
      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="h-11 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] px-5 text-[0.9rem] hover:border-[var(--color-ink)]"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="grid h-11 place-items-center rounded-[var(--radius-sm)] px-5 text-[0.9rem] text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
        >
          Return to your dashboard
        </Link>
      </div>
    </main>
  );
}
