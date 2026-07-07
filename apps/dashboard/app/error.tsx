"use client";
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="container-app py-24">
      <p className="kicker">Error</p>
      <h1 className="h1 mt-4">Something went wrong.</h1>
      <p className="lede mt-4">We logged it. You can try again.</p>
      <button
        onClick={reset}
        className="mt-8 h-11 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] px-5 text-[0.9rem] hover:border-[var(--color-ink)]"
      >
        Try again
      </button>
    </main>
  );
}
