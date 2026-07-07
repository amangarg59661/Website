import { authHandlers } from "./auth";
import { usersHandlers } from "./users";
import { projectsHandlers } from "./projects";
import { invoicesHandlers } from "./invoices";
import { ticketsHandlers } from "./tickets";
import { filesHandlers } from "./files";
import { notificationsHandlers } from "./notifications";

export const handlers = [
  ...authHandlers,
  ...usersHandlers,
  ...projectsHandlers,
  ...invoicesHandlers,
  ...ticketsHandlers,
  ...filesHandlers,
  ...notificationsHandlers,
];
