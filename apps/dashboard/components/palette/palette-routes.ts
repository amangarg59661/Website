export type PaletteRoute = {
  id: string;
  title: string;
  group: "client" | "staff";
  href: string;
  permission?: string;
};

export const paletteRoutes: PaletteRoute[] = [
  { id: "c.overview", group: "client", title: "Client · Overview", href: "/client/overview" },
  {
    id: "c.projects",
    group: "client",
    title: "Client · Projects",
    href: "/client/projects",
    permission: "projects:read",
  },
  {
    id: "c.invoices",
    group: "client",
    title: "Client · Invoices",
    href: "/client/invoices",
    permission: "invoices:read",
  },
  {
    id: "c.tickets",
    group: "client",
    title: "Client · Tickets",
    href: "/client/tickets",
    permission: "tickets:read",
  },
  {
    id: "c.files",
    group: "client",
    title: "Client · Files",
    href: "/client/files",
    permission: "files:read",
  },
  {
    id: "c.calendar",
    group: "client",
    title: "Client · Calendar",
    href: "/client/calendar",
    permission: "calendar:read",
  },
  { id: "c.notifications", group: "client", title: "Notifications", href: "/client/notifications" },
  { id: "c.profile", group: "client", title: "Profile", href: "/client/profile" },
  { id: "c.settings", group: "client", title: "Settings", href: "/client/settings" },
  { id: "s.overview", group: "staff", title: "Staff · Overview", href: "/staff/overview" },
  {
    id: "s.projects",
    group: "staff",
    title: "Staff · Projects",
    href: "/staff/projects",
    permission: "projects:read",
  },
  {
    id: "s.invoices",
    group: "staff",
    title: "Staff · Invoices",
    href: "/staff/invoices",
    permission: "invoices:read",
  },
  {
    id: "s.sales",
    group: "staff",
    title: "Staff · Sales",
    href: "/staff/sales",
    permission: "sales:read",
  },
  {
    id: "s.users",
    group: "staff",
    title: "Staff · Users",
    href: "/staff/users",
    permission: "users:read",
  },
  {
    id: "s.careers",
    group: "staff",
    title: "Staff · Careers",
    href: "/staff/careers",
    permission: "careers:read",
  },
  {
    id: "s.careers.new",
    group: "staff",
    title: "Staff · Careers — new draft",
    href: "/staff/careers/new",
    permission: "careers:write",
  },
  {
    id: "s.reports",
    group: "staff",
    title: "Staff · Reports",
    href: "/staff/reports",
    permission: "reports:read",
  },
  {
    id: "s.audit",
    group: "staff",
    title: "Staff · Audit logs",
    href: "/staff/audit-logs",
    permission: "audit_logs:read",
  },
];
