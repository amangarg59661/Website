"use client";

import { useAuthStore } from "./store";
import type { RoleGroup } from "@edss/types";

/**
 * @deprecated returns the whole store — every subscriber re-renders on any
 * store change. Prefer the narrow selector hooks below. Kept for the shell
 * scaffolding while consumers migrate.
 */
export function useAuth() {
  return useAuthStore();
}

export function useUser() {
  return useAuthStore((s) => s.user);
}

export function useIsAuthenticated() {
  return useAuthStore((s) => s.status === "authenticated");
}

export function usePermissions() {
  return useAuthStore((s) => s.permissions);
}

export function useHasPermission(permission: string) {
  return useAuthStore((s) => s.permissions.includes(permission));
}

export function useAnyPermission(permissions: string[]) {
  return useAuthStore((s) =>
    permissions.some((p) => s.permissions.includes(p)),
  );
}

/**
 * S-04 helper. Returns true only when the authenticated user's role
 * membership actually covers the requested shell. Client-only users get
 * false for "staff" — the staff layout uses this to refuse rendering
 * regardless of URL manipulation.
 */
export function useCanEnterShell(roleGroup: RoleGroup): boolean {
  return useAuthStore((s) => {
    if (s.status !== "authenticated") return false;
    if (s.hasBothRoles) return true;
    return s.primaryRole === roleGroup;
  });
}
