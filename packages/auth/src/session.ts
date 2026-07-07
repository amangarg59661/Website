"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "./store.js";

const IDLE_MS = 30 * 60 * 1000;
const WARN_MS = 25 * 60 * 1000;
const CHANNEL = "edss-session";

const ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "wheel",
  "touchstart",
] as const;

export function useSessionIdleTimer(onExpire: () => void, onWarn: () => void) {
  const authed = useAuthStore((s) => s.status === "authenticated");
  const lastActivity = useRef<number>(Date.now());
  const warnedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!authed) return;
    const bc = new BroadcastChannel(CHANNEL);

    function bump() {
      const now = Date.now();
      lastActivity.current = now;
      warnedRef.current = false;
      bc.postMessage({ type: "activity", ts: now });
    }
    function onMsg(e: MessageEvent) {
      if (e.data?.type === "activity" && typeof e.data.ts === "number") {
        lastActivity.current = Math.max(lastActivity.current, e.data.ts);
        warnedRef.current = false;
      }
    }

    for (const ev of ACTIVITY_EVENTS)
      document.addEventListener(ev, bump, { passive: true });
    bc.addEventListener("message", onMsg);

    const tick = setInterval(() => {
      const idle = Date.now() - lastActivity.current;
      if (idle >= IDLE_MS) onExpire();
      else if (idle >= WARN_MS && !warnedRef.current) {
        warnedRef.current = true;
        onWarn();
      }
    }, 15_000);

    return () => {
      clearInterval(tick);
      for (const ev of ACTIVITY_EVENTS) document.removeEventListener(ev, bump);
      bc.removeEventListener("message", onMsg);
      bc.close();
    };
  }, [authed, onExpire, onWarn]);
}

export function useCountdown(fromMs: number) {
  const [remaining, setRemaining] = useState(fromMs);
  useEffect(() => {
    const t = setInterval(
      () => setRemaining((r) => Math.max(0, r - 1000)),
      1000,
    );
    return () => clearInterval(t);
  }, []);
  return remaining;
}
