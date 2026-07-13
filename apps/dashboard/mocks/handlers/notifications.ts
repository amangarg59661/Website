import { http, HttpResponse } from "msw";

/**
 * Seeded notification fixture keyed against the seeded admin user so the
 * shell has something to render post-login. The realtime feed
 * (NotificationsSocket) is a separate surface — this endpoint powers the
 * initial paginated load.
 */
const now = Date.now();
const seed = [
  {
    id: "00000000-0000-0000-0000-000000000101",
    user_id: "u_admin_1",
    severity: "info" as const,
    title: "Welcome to your dashboard",
    body: "Your workspace is ready. Explore projects, invoices, and tickets from the sidebar.",
    read: false,
    created_at: new Date(now - 5 * 60_000).toISOString(),
    href: null,
    event_type: "identity.user_registered",
  },
  {
    id: "00000000-0000-0000-0000-000000000102",
    user_id: "u_admin_1",
    severity: "success" as const,
    title: "Project onboarding complete",
    body: "The onboarding call for Northbrook renovation has been marked done.",
    read: true,
    created_at: new Date(now - 3 * 3600_000).toISOString(),
    href: "/client/projects",
    event_type: "projects.onboarding_scheduled",
  },
];

export const notificationsHandlers = [
  http.get("*/notifications", ({ request }) => {
    const url = new URL(request.url);
    const unread = url.searchParams.get("unread") === "true";
    const items = unread ? seed.filter((n) => !n.read) : seed;
    return HttpResponse.json({ items, cursor: null, has_more: false });
  }),
  http.get("*/notifications/unread-count", () =>
    HttpResponse.json({ count: seed.filter((n) => !n.read).length }),
  ),
  http.post("*/notifications/:id/read", () => new HttpResponse(null, { status: 204 })),
  http.post("*/notifications/read-all", () => HttpResponse.json({ updated: seed.length })),
];
