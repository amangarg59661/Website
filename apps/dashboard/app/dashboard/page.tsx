"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@edss/auth";

/**
 * S-08: the redirect target is derived from the in-memory auth store
 * (primaryRole + hasBothRoles + activeRoleGroup), never from the
 * JS-readable `last_role_group` cookie. XSS or a browser extension can
 * flip that cookie; treating it as authoritative would silently widen
 * a client-only user into the staff shell.
 *
 * last_role_group is still consulted, but only as a soft UX preference
 * for dual-role users choosing between shells they already have
 * permission to enter.
 */
export default function DashboardLanding() {
  const router = useRouter();
  useEffect(() => {
    const { status, activeRoleGroup, primaryRole, hasBothRoles } = useAuthStore.getState();

    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "refreshing") {
      // wait for the silent refresh to settle; a follow-up render will re-fire.
      return;
    }

    if (activeRoleGroup) {
      router.replace(`/${activeRoleGroup}/overview`);
      return;
    }

    const readLastRoleGroup = (): "client" | "staff" | null => {
      if (typeof document === "undefined") return null;
      const m = document.cookie.match(/(?:^|;\s*)last_role_group=(client|staff)/u);
      return (m?.[1] as "client" | "staff" | undefined) ?? null;
    };

    if (hasBothRoles) {
      const soft = readLastRoleGroup();
      router.replace(`/${soft ?? primaryRole ?? "client"}/overview`);
      return;
    }

    router.replace(`/${primaryRole ?? "client"}/overview`);
  }, [router]);
  return <p className="p-8 text-sm text-[var(--color-muted)]">Loading dashboard…</p>;
}
