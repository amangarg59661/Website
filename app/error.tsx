"use client";

import { useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { Button, ButtonLink } from "@/components/primitives/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <main id="main" className="on-ink min-h-[80vh] flex items-center">
      <Container className="py-24 md:py-32">
        <span className="kicker">Something went wrong</span>
        <h1 className="mt-8 font-[family-name:var(--font-display)] text-[clamp(2rem,1.4rem+3vw,4rem)] leading-[1.05] tracking-[-0.03em] max-w-[22ch]">
          A problem on our end. We&apos;ve logged it.
        </h1>
        <p className="lede mt-6 max-w-[52ch]">
          Please try again in a moment. If it keeps happening, {" "}
          <a href="/contact" className="link-underline">let us know</a>.
        </p>
        {error.digest && (
          <p className="kicker text-[color-mix(in_oklch,var(--color-paper)_60%,transparent)] mt-8 num">
            Ref · {error.digest}
          </p>
        )}
        <div className="mt-10 flex flex-wrap gap-3">
          <Button onClick={reset} intent="onInkFilled" size="lg">
            Try again
          </Button>
          <ButtonLink href="/" intent="onInk" size="lg">
            Return home
          </ButtonLink>
        </div>
      </Container>
    </main>
  );
}
