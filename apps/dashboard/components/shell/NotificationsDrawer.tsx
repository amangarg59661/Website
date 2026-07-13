"use client";
import { Sheet, SheetContent } from "@edss/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@edss/ui/tabs";
import { useRealtimeNotifications } from "@/components/notifications/notifications-store";

/**
 * Consumes the realtime notification store fed by NotificationsSocket.
 * Paginated GET /notifications data lands here later via TanStack Query
 * merge; today the drawer shows only the live tail plus an empty state
 * when no messages have arrived since page load.
 */
export function NotificationsDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const items = useRealtimeNotifications((s) => s.items);
  const markAllRead = useRealtimeNotifications((s) => s.markAllRead);
  const unread = items.filter((i) => !i.read);
  const empty = items.length === 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px]">
        <div className="flex items-center justify-between">
          <h2 className="h4">Notifications</h2>
          {unread.length > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs text-[var(--color-muted)] underline-offset-2 hover:text-[var(--color-ink)] hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <Tabs defaultValue="all" className="mt-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="mentions">Mentions</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            {empty ? <EmptyFeed /> : <FeedList items={items} />}
          </TabsContent>
          <TabsContent value="unread">
            {unread.length === 0 ? (
              <EmptyFeed line="You're clear. Unread items land here as they arrive." />
            ) : (
              <FeedList items={unread} />
            )}
          </TabsContent>
          <TabsContent value="mentions">
            <EmptyFeed line="Mentions arrive once the notifications module wires @-references." />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function EmptyFeed({
  line = "You're clear. New activity across projects, invoices, and tickets will appear here.",
}: {
  line?: string;
}) {
  return <div className="py-16 text-center text-sm text-[var(--color-muted)]">{line}</div>;
}

function FeedList({
  items,
}: {
  items: ReturnType<typeof useRealtimeNotifications.getState>["items"];
}) {
  return (
    <ul className="mt-2 flex flex-col divide-y divide-[var(--color-line)]">
      {items.map((n) => (
        <li key={n.id} className="py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--color-ink)]">{n.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-[var(--color-muted)]">{n.body}</p>
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
  );
}
