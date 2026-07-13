import { http, HttpResponse } from "msw";

const seed = [
  {
    id: "00000000-0000-0000-0000-000000000201",
    owner_user_id: "u_admin_1",
    title: "Northbrook renovation",
    description: "Full brand refresh + site rebuild for Northbrook.",
    status: "active",
    phase: "in_progress",
    billing_model: "per_milestone",
    maintenance_duration_days: 30,
    maintenance_starts_at: null,
    maintenance_ends_at: null,
    total_amount_minor: 1_200_000,
    currency: "INR",
    created_at: new Date(Date.now() - 21 * 86400_000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400_000).toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000202",
    owner_user_id: "u_client_1",
    title: "Aventis annual report",
    description: "Editorial + interactive one-pager.",
    status: "active",
    phase: "client_review",
    billing_model: "whole_project",
    maintenance_duration_days: null,
    maintenance_starts_at: null,
    maintenance_ends_at: null,
    total_amount_minor: 480_000,
    currency: "INR",
    created_at: new Date(Date.now() - 10 * 86400_000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400_000).toISOString(),
  },
];

export const projectsHandlers = [
  http.get("*/projects", () => HttpResponse.json({ items: seed, cursor: null, has_more: false })),
];
