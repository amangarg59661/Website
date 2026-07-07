import { http, HttpResponse } from "msw";
export const filesHandlers = [
  http.get("*/files", () => HttpResponse.json({ items: [], cursor: null, has_more: false })),
];
