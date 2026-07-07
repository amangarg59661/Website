import { http, HttpResponse } from "msw";
export const ticketsHandlers = [
  http.get("*/tickets", () => HttpResponse.json({ items: [], cursor: null, has_more: false })),
];
