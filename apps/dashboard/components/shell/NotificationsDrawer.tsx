"use client";
import { Sheet, SheetContent } from "@edss/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@edss/ui/tabs";

export function NotificationsDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px]">
        <h2 className="h4">Notifications</h2>
        <Tabs defaultValue="all" className="mt-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="mentions">Mentions</TabsTrigger>
          </TabsList>
          {["all", "unread", "mentions"].map((v) => (
            <TabsContent key={v} value={v}>
              <div className="py-16 text-center text-sm text-[var(--color-muted)]">
                No notifications yet. We&apos;ll ping you when things happen.
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
