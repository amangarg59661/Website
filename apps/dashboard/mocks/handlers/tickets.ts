import { http, HttpResponse } from "msw";

const seed = [
  {
    id: "00000000-0000-0000-0000-000000000401",
    raised_by_user_id: "u_admin_1",
    project_id: "00000000-0000-0000-0000-000000000201",
    subject: "Homepage hero copy tweak",
    description: "Second line reads as too long on mobile. Shorten to one clause.",
    priority: "normal",
    status: "open",
    assignee_user_id: null,
    is_maintenance: false,
    created_at: new Date(Date.now() - 2 * 86400_000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400_000).toISOString(),
  },
];

export const ticketsHandlers = [
  http.get("*/tickets", () => HttpResponse.json({ items: seed, cursor: null, has_more: false })),
];
