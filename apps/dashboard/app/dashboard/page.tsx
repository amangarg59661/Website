"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@edss/auth";

export default function DashboardLanding() {
  const router = useRouter();
  useEffect(() => {
    const state = useAuthStore.getState();
    const readCookie = () => {
      if (typeof document === "undefined") return null;
      const m = document.cookie.match(/(?:^|;\s*)last_role_group=(client|staff)/u);
      return (m?.[1] as "client" | "staff" | undefined) ?? null;
    };
    const decide = (): string => {
      if (state.activeRoleGroup) return `/${state.activeRoleGroup}/overview`;
      const last = readCookie();
      if (last) return `/${last}/overview`;
      if (state.hasBothRoles) return "/client/overview";
      return `/${state.primaryRole ?? "client"}/overview`;
    };
    router.replace(decide());
  }, [router]);
  return <p className="p-8 text-sm text-[var(--color-muted)]">Loading dashboard…</p>;
}
