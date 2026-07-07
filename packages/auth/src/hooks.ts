"use client";

import { useAuthStore } from "./store";

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
