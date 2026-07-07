"use client";
import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  subtitle,
  actions,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-4 border-b border-[var(--color-line)] pb-6">
      <div>
        {kicker && <p className="kicker">{kicker}</p>}
        <h1 className="h2 mt-1">{title}</h1>
        {subtitle && <p className="lede mt-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
