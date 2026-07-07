"use client";
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <main style={{ padding: "48px", fontFamily: "system-ui" }}>
          <h1>Fatal error</h1>
          <p>The dashboard could not render. Try again.</p>
          <button onClick={reset}>Try again</button>
        </main>
      </body>
    </html>
  );
}
