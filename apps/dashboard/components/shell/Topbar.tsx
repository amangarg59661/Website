"use client";
import { Wordmark } from "@edss/icons";
import { Bell, Menu, Search } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@edss/auth";
import { Sheet, SheetContent, SheetTrigger } from "@edss/ui/sheet";
import { UserMenu } from "./UserMenu";
import { CommandPalette } from "@/components/palette/CommandPalette";
import { NotificationsDrawer } from "./NotificationsDrawer";
import { SidebarNavBody } from "./Sidebar";

export function Topbar() {
  const hasBoth = useAuthStore((s) => s.hasBothRoles);
  const group = useAuthStore((s) => s.activeRoleGroup);
  const setGroup = useAuthStore((s) => s.setRoleGroup);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] flex h-14 items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-paper)] px-4">
      <div className="flex items-center gap-4">
        {/* U-27: mobile nav trigger; Sheet reuses the desktop nav body. */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger
            aria-label="Open navigation"
            className="rounded-[var(--radius-sm)] p-2 hover:bg-[var(--color-stone)] md:hidden"
          >
            <Menu className="h-4 w-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <div className="flex h-full flex-col gap-6 px-4 py-6">
              <SidebarNavBody />
            </div>
          </SheetContent>
        </Sheet>
        <Wordmark className="h-5 w-auto" />
        {/* U-28: Cmd+K trigger is desktop-only. No keyboard on mobile means no palette. */}
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="hidden items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] px-3 py-1.5 text-sm text-[var(--color-muted)] hover:border-[var(--color-ink)] md:flex"
        >
          <Search className="h-3.5 w-3.5" />
          Search…
          <kbd
            aria-hidden="true"
            className="ml-2 rounded bg-[var(--color-stone)] px-1.5 py-0.5 text-[0.7rem]"
          >
            ⌘K
          </kbd>
        </button>
      </div>
      <div className="flex items-center gap-3">
        {hasBoth && (
          <div className="hidden items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-line)] p-0.5 sm:flex">
            {(["client", "staff"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroup(g)}
                aria-pressed={group === g}
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
