"use client";

import { useEffect, useRef, type ReactNode } from "react";
import posthog from "posthog-js";
import { usePathname, useSearchParams } from "next/navigation";
import type { EventName, EventPropsFor } from "./events.js";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

function shouldSkipInit(): boolean {
  if (!KEY) return true;
  if (typeof navigator !== "undefined" && navigator.doNotTrack === "1")
    return true;
  return false;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  const inited = useRef(false);

  useEffect(() => {
    if (inited.current) return;
    if (shouldSkipInit()) return;
    inited.current = true;
    posthog.init(KEY!, {
      api_host: HOST,
      capture_pageview: false,
      capture_pageleave: true,
      persistence: "localStorage+cookie",
    });
  }, []);

  return <>{children}</>;
}

export function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (shouldSkipInit()) return;
    if (!pathname) return;
    const url = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export function captureEvent<N extends EventName>(
  name: N,
  props: EventPropsFor<N>,
) {
  if (shouldSkipInit()) return;
  posthog.capture(name, props as Record<string, unknown>);
}
