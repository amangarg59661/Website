"use client";
import { useMemo } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { useApiQuery, useApiMutation, makeMutationFn } from "@edss/api/queries";
import { notificationListSchema } from "@edss/validation/resources";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeNotifications } from "@/components/notifications/notifications-store";

/**
 * Notifications inbox. Paginated GET /notifications provides history;
 * the realtime store (NotificationsSocket) provides the live tail. Both
 * merge with de-dup on id — realtime items win on read state (they're
 * newer).
 */
const readAllResponseSchema = z.object({ updated: z.number() });

export default function ClientNotificationsPage() {
  const paged = useApiQuery(["notifications", "list"], "/notifications", notificationListSchema);
  const queryClient = useQueryClient();

  const markAllRead = useApiMutation(
    makeMutationFn<void, typeof readAllResponseSchema>(
      "/notifications/read-all",
      "POST",
      readAllResponseSchema,
    ),
    {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        useRealtimeNotifications.getState().markAllRead();
      },
    },
  );

  const realtime = useRealtimeNotifications((s) => s.items);
  const merged = useMemo(() => {
    const seen = new Set<string>();
    const out: typeof realtime = [];
    for (const item of realtime) {
      if (!seen.has(item.id)) {
        out.push(item);
        seen.add(item.id);
      }
    }
    for (const item of paged.data?.items ?? []) {
      if (!seen.has(item.id)) {
        out.push(item as (typeof realtime)[number]);
        seen.add(item.id);
      }
    }
    return out;
  }, [realtime, paged.data]);

  const unreadCount = merged.filter((n) => !n.read).length;

  return (
    <>
      <PageHeader
        kicker="Notifications"
        title="Your activity feed"
        subtitle="Everything the studio has flagged for you, newest first."
        actions={
          unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="h-9 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] px-3 text-sm hover:border-[var(--color-ink)] disabled:opacity-60"
            >
              {markAllRead.isPending ? "Marking…" : "Mark all read"}
            </button>
          )
        }
      />

      {paged.isLoading && (
        <div className="mt-8 space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              aria-hidden="true"
              className="h-16 animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-stone-2)]"
            />
          ))}
        </div>
      )}

      {paged.error && (
        <p role="alert" className="mt-8 text-sm text-[var(--color-danger)]">
          {paged.error.message}
        </p>
      )}

      {!paged.isLoading && merged.length === 0 && (
        <p className="mt-8 text-sm text-[var(--color-muted)]">
          You&apos;re clear. New activity across projects, invoices, and tickets will appear here.
        </p>
      )}

      {merged.length > 0 && (
        <ul className="mt-8 divide-y divide-[var(--color-line)]">
          {merged.map((n) => (
            <li key={n.id} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <SeverityDot severity={n.severity} />
                    <p className="text-sm font-medium text-[var(--color-ink)]">{n.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">{n.body}</p>
                  <p className="mt-2 text-xs text-[var(--color-muted-strong)]">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                {!n.read && (
                  <span
                    aria-label="Unread"
                    className="mt-1 inline-block h-2 w-2 flex-none rounded-full bg-[var(--color-gold)]"
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function SeverityDot({ severity }: { severity: "info" | "success" | "warning" | "critical" }) {
  const color =
    severity === "success"
      ? "var(--color-success)"
      : severity === "warning"
        ? "var(--color-gold-2)"
        : severity === "critical"
          ? "var(--color-danger)"
          : "var(--color-ink-3)";
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: color }}
      className="inline-block h-2 w-2 flex-none rounded-full"
    />
  );
}
