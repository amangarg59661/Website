"use client";

import type { ReactNode } from "react";
import { useHasPermission } from "./hooks";

export function PermissionGate({
  permission,
  fallback = null,
  children,
}: {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const allowed = useHasPermission(permission);
  return allowed ? <>{children}</> : <>{fallback}</>;
}

export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string,
  Unauthorized: React.ComponentType = DefaultUnauthorized,
) {
  return function Guarded(props: P) {
    const allowed = useHasPermission(permission);
    return allowed ? <Component {...props} /> : <Unauthorized />;
  };
}

function DefaultUnauthorized() {
  return (
    <div className="p-8">
      <h1 className="h2">Not permitted</h1>
      <p className="lede">You do not have permission for this area.</p>
    </div>
  );
}
