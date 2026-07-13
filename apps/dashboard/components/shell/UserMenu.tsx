"use client";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@edss/ui/dropdown-menu";
import { useUser, useAuthStore } from "@edss/auth";
import { logout } from "@edss/auth/client";
import { useRouter } from "next/navigation";

/**
 * U-01: Profile + Settings link targets derive from the user's current
 * shell (client vs staff). Client shell has profile + settings; staff
 * shell has settings only.
 * U-19: DropdownMenuTrigger carries an aria-label so screen readers
 * announce "Account menu for {name}" instead of just the initial.
 */
export function UserMenu() {
  const user = useUser();
  const activeRoleGroup = useAuthStore((s) => s.activeRoleGroup);
  const primaryRole = useAuthStore((s) => s.primaryRole);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const shell = activeRoleGroup ?? primaryRole ?? "client";
  const profileHref = shell === "staff" ? null : `/client/profile`;
  const settingsHref = `/${shell}/settings`;
  const triggerLabel = user?.name
    ? `Account menu for ${user.name}`
    : user
      ? "Account menu"
      : "Account menu — loading";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={triggerLabel}
        className="grid h-8 w-8 place-items-center rounded-full border border-[var(--color-line-strong)] text-xs"
      >
        <span aria-hidden="true">{user?.name?.charAt(0) ?? "?"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="text-sm">{user?.name}</div>
          <div className="text-xs text-[var(--color-muted)]">{user?.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profileHref && (
          <DropdownMenuItem asChild>
            <Link href={profileHref}>
              <UserIcon className="h-4 w-4" /> Profile
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href={settingsHref}>
            <SettingsIcon className="h-4 w-4" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Theme · {theme ?? "system"}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onSelect={() => setTheme("system")}>
              <Monitor className="h-4 w-4" /> System
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTheme("light")}>
              <Sun className="h-4 w-4" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTheme("dark")}>
              <Moon className="h-4 w-4" /> Dark
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            await logout();
            router.push("/login");
          }}
          className="text-[var(--color-danger)]"
        >
          <LogOut className="h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
