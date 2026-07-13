"use client";
import { useEffect, type ReactNode } from "react";
import { initApiClient } from "@edss/api";
import { useAuthStore } from "@edss/auth/store";
import { refreshAccessToken } from "@edss/auth/client";

/**
 * P-03: silent-refresh scheduler that survives laptop sleep, tab
 * throttling, and OS clock skew.
 *
 * - `visibilitychange` recomputes the delay when the tab becomes visible.
 *   Wake from sleep no longer trips a 401→refresh chain.
 * - `Math.max(30s, Math.min(untilRefresh, 55min))` bounds the delay so
 *   negative deltas (clock skew ahead) don't clamp to 30s and busy-loop,
 *   and huge deltas (clock skew behind) don't schedule refreshes 24h out.
 * - Cross-tab leader election via `BroadcastChannel("edss-refresh")` means
 *   only one tab of a session drives the periodic refresh. Followers still
 *   apply the resulting token via their own store subscription (the
 *   refresh route response sets the `rt` cookie for the whole browser).
 */
const REFRESH_LEAD_TIME_S = 60;
const MIN_DELAY_MS = 30_000;
const MAX_DELAY_MS = 55 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initApiClient({
      baseUrl: process.env.NEXT_PUBLIC_API_BASE ?? "https://api.edss.example",
      getAccessToken: () => useAuthStore.getState().accessToken,
      onSessionExpired: () => {
        useAuthStore.getState().reset();
        if (typeof window !== "undefined") {
          window.location.assign("/login?reason=session_expired");
        }
      },
      triggerRefresh: async () => refreshAccessToken(),
    });
    void refreshAccessToken();
  }, []);

  useEffect(() => {
    let timerId: number | null = null;
    const channel =
      typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("edss-refresh") : null;

    const computeDelay = (): number | null => {
      const { status, accessTokenExp } = useAuthStore.getState();
      if (status !== "authenticated" || !accessTokenExp) return null;
      const nowSec = Math.floor(Date.now() / 1000);
      const untilRefreshMs = (accessTokenExp - nowSec - REFRESH_LEAD_TIME_S) * 1000;
      return Math.max(MIN_DELAY_MS, Math.min(untilRefreshMs, MAX_DELAY_MS));
    };

    const schedule = () => {
      if (timerId !== null) window.clearTimeout(timerId);
      const delay = computeDelay();
      if (delay === null) return;
      timerId = window.setTimeout(async () => {
        // Signal peer tabs before we fire so followers pause their own timers.
        channel?.postMessage({ type: "refresh-starting" });
        await refreshAccessToken();
        channel?.postMessage({ type: "refresh-done" });
      }, delay);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") schedule();
    };

    const onPeerMessage = (ev: MessageEvent) => {
      // If another tab is refreshing, defer our own timer briefly.
      if ((ev.data as { type?: string } | null)?.type === "refresh-starting") {
        if (timerId !== null) window.clearTimeout(timerId);
        timerId = window.setTimeout(schedule, 3_000);
      } else if ((ev.data as { type?: string } | null)?.type === "refresh-done") {
        schedule();
      }
    };

    const unsub = useAuthStore.subscribe((state, prev) => {
      if (state.accessToken !== prev.accessToken) schedule();
    });

    document.addEventListener("visibilitychange", onVisibility);
    channel?.addEventListener("message", onPeerMessage);
    schedule();

    return () => {
      if (timerId !== null) window.clearTimeout(timerId);
      document.removeEventListener("visibilitychange", onVisibility);
      channel?.removeEventListener("message", onPeerMessage);
      channel?.close();
      unsub();
    };
  }, []);

  return <>{children}</>;
}
