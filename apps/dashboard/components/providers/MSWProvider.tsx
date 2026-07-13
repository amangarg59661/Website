"use client";
import { useEffect, useState, type ReactNode } from "react";

/**
 * S-03: MSW is a development-only mock backend. Runtime guard rejects the
 * `NEXT_PUBLIC_USE_MOCKS=true` combination in a production build so a
 * misconfigured env var can never expose the seeded `admin@example.com /
 * password / 000000` handlers to end users. Companion CI check verifies
 * `mockServiceWorker.js` is not shipped in `.next/static` (see .github/workflows/ci.yml).
 */
const requestedMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
const isProd = process.env.NODE_ENV === "production";

if (requestedMocks && isProd) {
  throw new Error(
    "MSW cannot be enabled in a production build. Unset NEXT_PUBLIC_USE_MOCKS or set it to 'false' on the deployment.",
  );
}

const enabled = requestedMocks && !isProd;

export function MSWProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!enabled);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      const { startMocks } = await import("@/mocks/browser");
      await startMocks();
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  if (!ready) return null;
  return <>{children}</>;
}
