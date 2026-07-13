"use client";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { RoleGroup } from "@edss/types";
import { useAuthStore } from "@edss/auth";
import { useCanEnterShell } from "@edss/auth/hooks";

/**
 * S-04 / S-08: shell-level gate. Refuses to render children when the
 * authenticated user's role membership does not cover the requested shell.
 * URL manipulation into /staff/* by a client-only user redirects to the
 * shell they belong in.
 */
export function ShellGate({ roleGroup, children }: { roleGroup: RoleGroup; children: ReactNode }) {
  const router = useRouter();
  const canEnter = useCanEnterShell(roleGroup);
  const status = useAuthStore((s) => s.status);
  const primaryRole = useAuthStore((s) => s.primaryRole);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status !== "authenticated") return;
    if (!canEnter) {
      const fallback = primaryRole ?? "client";
      router.replace(`/${fallback}/overview`);
    }
  }, [status, canEnter, primaryRole, router]);

  if (status !== "authenticated" || !canEnter) {
    return null;
  }
  return <>{children}</>;
}
