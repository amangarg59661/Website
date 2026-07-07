"use client";
import { useEffect, type ReactNode } from "react";
import { initApiClient } from "@edss/api";
import { useAuthStore } from "@edss/auth/store";
import { refreshAccessToken } from "@edss/auth/client";

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initApiClient({
      baseUrl: process.env.NEXT_PUBLIC_API_BASE ?? "https://api.edss.example",
      getAccessToken: () => useAuthStore.getState().accessToken,
      onSessionExpired: () => {
        useAuthStore.getState().reset();
        if (typeof window !== "undefined") window.location.assign("/login?reason=session_expired");
      },
      triggerRefresh: async () => refreshAccessToken(),
    });
    void refreshAccessToken();
  }, []);

  useEffect(() => {
    let timerId: number | null = null;
    const unsub = useAuthStore.subscribe((state, prev) => {
      if (state.accessToken === prev.accessToken) return;
      if (timerId !== null) window.clearTimeout(timerId);
      timerId = null;
      if (state.status !== "authenticated" || !state.accessTokenExp) return;
      const nowSec = Math.floor(Date.now() / 1000);
      const untilRefresh = Math.max(30_000, (state.accessTokenExp - nowSec - 60) * 1000);
      timerId = window.setTimeout(() => {
        void refreshAccessToken();
      }, untilRefresh);
    });
    return () => {
      if (timerId !== null) window.clearTimeout(timerId);
      unsub();
    };
  }, []);

  return <>{children}</>;
}
