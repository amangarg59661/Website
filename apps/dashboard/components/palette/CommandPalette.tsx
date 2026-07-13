"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@edss/ui/command";
import { useAuthStore } from "@edss/auth";
import { paletteRoutes } from "./palette-routes";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const group = useAuthStore((s) => s.activeRoleGroup);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) return;
      // U-17: never hijack Cmd/Ctrl+K while the user is typing in an input,
      // textarea, or contenteditable region. Login / 2FA / reset forms all
      // rely on the browser's default behaviour there.
      const target = e.target as HTMLElement | null;
      if (target && target.matches("input, textarea, select, [contenteditable=true]")) return;
      e.preventDefault();
      onOpenChange(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  const routes = paletteRoutes.filter((r) => r.group === group);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search routes and actions…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {routes.map((r) => (
            <CommandItem
              key={r.id}
              onSelect={() => {
                onOpenChange(false);
                router.push(r.href);
              }}
            >
              {r.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
