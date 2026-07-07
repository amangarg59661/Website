"use client";
import { Wordmark } from "@edss/icons";
import { Bell, Search } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@edss/auth";
import { UserMenu } from "./UserMenu";
import { CommandPalette } from "@/components/palette/CommandPalette";
import { NotificationsDrawer } from "./NotificationsDrawer";

export function Topbar() {
  const hasBoth = useAuthStore((s) => s.hasBothRoles);
  const group = useAuthStore((s) => s.activeRoleGroup);
  const setGroup = useAuthStore((s) => s.setRoleGroup);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] flex h-14 items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-paper)] px-4">
      <div className="flex items-center gap-4">
        <Wordmark className="h-5 w-auto" />
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] px-3 py-1.5 text-sm text-[var(--color-muted)] hover:border-[var(--color-ink)]"
        >
          <Search className="h-3.5 w-3.5" />
          Search…
          <kbd className="ml-2 rounded bg-[var(--color-stone)] px-1.5 py-0.5 text-[0.7rem]">⌘K</kbd>
        </button>
      </div>
      <div className="flex items-center gap-3">
        {hasBoth && (
          <div className="flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-line)] p-0.5">
            {(["client", "staff"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroup(g)}
                className={`rounded-[3px] px-2 py-1 text-xs ${
                  group === g
                    ? "bg-[var(--color-ink)] text-[var(--color-paper)]"
                    : "text-[var(--color-muted)]"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setNotifOpen(true)}
          aria-label="Open notifications"
          className="rounded-[var(--radius-sm)] p-2 hover:bg-[var(--color-stone)]"
        >
          <Bell className="h-4 w-4" />
        </button>
        <UserMenu />
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <NotificationsDrawer open={notifOpen} onOpenChange={setNotifOpen} />
    </header>
  );
}
