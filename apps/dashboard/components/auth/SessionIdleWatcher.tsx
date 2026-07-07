"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionIdleTimer, useCountdown } from "@edss/auth/session";
import { logout } from "@edss/auth/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@edss/ui/dialog";

export function SessionIdleWatcher() {
  const router = useRouter();
  const [warnOpen, setWarnOpen] = useState(false);

  useSessionIdleTimer(
    async () => {
      await logout();
      router.push("/login?reason=idle_timeout");
    },
    () => setWarnOpen(true),
  );

  const remaining = useCountdown(5 * 60 * 1000);
  const mins = Math.ceil(remaining / 60000);

  return (
    <Dialog open={warnOpen} onOpenChange={setWarnOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Still there?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[var(--color-muted)]">
          Your session will end in {mins} minute{mins === 1 ? "" : "s"}.
        </p>
        <DialogFooter>
          <button
            type="button"
            onClick={() => setWarnOpen(false)}
            className="h-10 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] px-4 text-sm"
          >
            Stay signed in
          </button>
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
            className="h-10 rounded-[var(--radius-sm)] bg-[var(--color-ink)] px-4 text-sm text-[var(--color-paper)]"
          >
            Log out
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
