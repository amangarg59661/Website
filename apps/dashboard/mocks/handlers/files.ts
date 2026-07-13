import { http, HttpResponse } from "msw";

const seed = [
  {
    id: "00000000-0000-0000-0000-000000000501",
    owner_user_id: "u_admin_1",
    name: "northbrook-brand-book-v2.pdf",
    size_bytes: 4_312_020,
    mime_type: "application/pdf",
    storage_key: "files/northbrook-brand-book-v2.pdf",
    bucket: "edss-files",
    project_id: "00000000-0000-0000-0000-000000000201",
    milestone_id: null,
    kind: "project_asset",
    created_at: new Date(Date.now() - 6 * 86400_000).toISOString(),
  },
];

export const filesHandlers = [
  http.get("*/files", () => HttpResponse.json({ items: seed, cursor: null, has_more: false })),
];
