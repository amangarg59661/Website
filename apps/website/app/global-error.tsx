"use client";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#171717",
          color: "#fbf9f9",
          fontFamily: "system-ui, sans-serif",
          padding: "6rem 1.5rem",
          minHeight: "100vh",
        }}
      >
        <main style={{ maxWidth: "44rem", margin: "0 auto" }}>
          <p
            style={{
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontSize: 12,
              opacity: 0.7,
            }}
          >
            Fatal error
          </p>
          <h1
            style={{
              marginTop: 24,
              fontSize: "clamp(2rem, 1.4rem + 3vw, 3.5rem)",
              lineHeight: 1.05,
              fontWeight: 500,
            }}
          >
            The studio&apos;s website is currently unreachable.
          </h1>
          <p style={{ marginTop: 24, opacity: 0.8, lineHeight: 1.6 }}>
            We&apos;ve been notified. Please email{" "}
            <a href="mailto:hello@elitedigital.studio" style={{ color: "#D4AF37" }}>
              hello@elitedigital.studio
            </a>{" "}
            in the meantime.
          </p>
          {error.digest && (
            <p
              style={{
                marginTop: 24,
                opacity: 0.6,
                fontFamily: "ui-monospace, monospace",
                fontSize: 12,
              }}
            >
              Ref · {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
