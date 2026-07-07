import { http, HttpResponse } from "msw";
export const notificationsHandlers = [
  http.get("*/notifications", () =>
    HttpResponse.json({ items: [], cursor: null, has_more: false }),
  ),
];
