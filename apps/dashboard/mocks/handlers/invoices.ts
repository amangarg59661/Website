import { http, HttpResponse } from "msw";
export const invoicesHandlers = [
  http.get("*/invoices", () => HttpResponse.json({ items: [], cursor: null, has_more: false })),
];
