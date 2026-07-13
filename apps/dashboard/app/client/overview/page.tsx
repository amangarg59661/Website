"use client";
import Link from "next/link";
import { PageHeader } from "@/components/shell/PageHeader";
import { useApiQuery } from "@edss/api/queries";
import {
  invoiceListSchema,
  notificationListSchema,
  projectListSchema,
  ticketListSchema,
} from "@edss/validation/resources";
import { useUser } from "@edss/auth";

/**
 * Client overview — five tiles summarising the workspace. Each tile owns
 * its own useApiQuery, so a slow endpoint never blocks a fast one.
 * Zod schemas from @edss/validation/resources are the single wire
 * contract; MSW seed data mirrors the same shape in dev.
 */
export default function ClientOverviewPage() {
  const user = useUser();
  const projects = useApiQuery(["projects", "list"], "/projects", projectListSchema);
  const invoices = useApiQuery(["invoices", "list"], "/invoices", invoiceListSchema);
  const tickets = useApiQuery(["tickets", "list"], "/tickets", ticketListSchema);
  const notifications = useApiQuery(
    ["notifications", "unread"],
    "/notifications?unread=true",
    notificationListSchema,
  );

  return (
    <>
      <PageHeader
        kicker="Overview"
        title={user?.name ? `Welcome back, ${user.name.split(" ")[0]}.` : "Welcome back."}
        subtitle="Everything you're working on with the studio, in one glance."
      />
      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="Active projects"
          value={countActive(projects.data?.items ?? [], (p) => p.status === "active")}
          isLoading={projects.isLoading}
          error={projects.error?.message ?? null}
          href="/client/projects"
        />
        <Tile
          label="Open invoices"
          value={countActive(invoices.data?.items ?? [], (i) => i.status === "issued")}
          isLoading={invoices.isLoading}
          error={invoices.error?.message ?? null}
          href="/client/invoices"
        />
        <Tile
          label="Open tickets"
          value={countActive(
            tickets.data?.items ?? [],
            (t) => t.status === "open" || t.status === "in_progress",
          )}
          isLoading={tickets.isLoading}
          error={tickets.error?.message ?? null}
          href="/client/tickets"
        />
        <Tile
          label="Unread notifications"
          value={notifications.data?.items.length ?? 0}
          isLoading={notifications.isLoading}
          error={notifications.error?.message ?? null}
          href="/client/notifications"
        />
      </section>

      <section className="mt-12">
        <h2 className="h4">Recent projects</h2>
        {projects.isLoading && <SkeletonRow />}
        {projects.error && (
          <p role="alert" className="mt-4 text-sm text-[var(--color-danger)]">
            {projects.error.message}
          </p>
        )}
        {!projects.isLoading && projects.data && projects.data.items.length === 0 && (
          <p className="mt-4 text-sm text-[var(--color-muted)]">No projects yet.</p>
        )}
        {projects.data && projects.data.items.length > 0 && (
          <ul className="mt-4 divide-y divide-[var(--color-line)]">
            {projects.data.items.slice(0, 5).map((p) => (
              <li key={p.id} className="py-3">
                <Link
                  href="/client/projects"
                  className="flex items-center justify-between gap-3 hover:text-[var(--color-ink)]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                      {p.title}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                      Phase · {p.phase.replaceAll("_", " ")}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--color-muted)]">
                    {new Date(p.updated_at).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function countActive<T>(items: T[], predicate: (t: T) => boolean): number {
  return items.filter(predicate).length;
}

function SkeletonRow() {
  return (
    <div
      aria-hidden="true"
      className="mt-4 h-10 animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-stone-2)]"
    />
  );
}

function Tile({
  label,
  value,
  isLoading,
  error,
  href,
}: {
  label: string;
  value: number;
  isLoading: boolean;
  error: string | null;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--color-line)] p-4 hover:border-[var(--color-line-strong)]"
    >
      <p className="kicker">{label}</p>
      {isLoading ? (
        <div
          aria-hidden="true"
          className="h-8 w-16 animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-stone-2)]"
        />
      ) : error ? (
        <p className="text-sm text-[var(--color-danger)]">Unable to load</p>
      ) : (
        <p className="h2">{value}</p>
      )}
    </Link>
  );
}
