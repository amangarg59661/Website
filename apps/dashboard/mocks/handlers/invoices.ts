import { http, HttpResponse } from "msw";

const seed = [
  {
    id: "00000000-0000-0000-0000-000000000301",
    client_user_id: "u_admin_1",
    project_id: "00000000-0000-0000-0000-000000000201",
    milestone_id: null,
    number: "INV-2026-000001",
    amount_minor: 60_000,
    currency: "INR",
    status: "issued",
    provider: "manual",
    provider_payment_intent_id: null,
    payment_link: null,
    issued_at: new Date(Date.now() - 5 * 86400_000).toISOString(),
    due_at: new Date(Date.now() + 5 * 86400_000).toISOString(),
    paid_at: null,
    created_at: new Date(Date.now() - 5 * 86400_000).toISOString(),
  },
];

export const invoicesHandlers = [
  http.get("*/invoices", () => HttpResponse.json({ items: seed, cursor: null, has_more: false })),
];
