import { http, HttpResponse } from "msw";
export const projectsHandlers = [
  http.get("*/projects", () => HttpResponse.json({ items: [], cursor: null, has_more: false })),
];
