"use client";
import { useEffect, useState, type ReactNode } from "react";

const enabled = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

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
