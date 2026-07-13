"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FolderKanban,
  Receipt,
  TicketCheck,
  Files as FilesIcon,
  Calendar,
  Bell,
  User as UserIcon,
  Settings,
  LineChart,
  Users,
  ScrollText,
  FileBarChart,
} from "lucide-react";
import { useAuthStore, useHasPermission } from "@edss/auth";
import { cn } from "@edss/utils/cn";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
};

function buildClientNav(prefix: string): Array<{ heading: string; items: Item[] }> {
  return [
    { heading: "Overview", items: [{ href: `${prefix}/overview`, label: "Overview", icon: Home }] },
    {
      heading: "Work",
      items: [
        {
          href: `${prefix}/projects`,
          label: "Projects",
          icon: FolderKanban,
          permission: "projects:read",
        },
        {
          href: `${prefix}/invoices`,
          label: "Invoices",
          icon: Receipt,
          permission: "invoices:read",
        },
        {
          href: `${prefix}/tickets`,
          label: "Tickets",
          icon: TicketCheck,
          permission: "tickets:read",
        },
        { href: `${prefix}/files`, label: "Files", icon: FilesIcon, permission: "files:read" },
        {
          href: `${prefix}/calendar`,
          label: "Calendar",
          icon: Calendar,
          permission: "calendar:read",
        },
      ],
    },
    {
      heading: "Account",
      items: [
        { href: `${prefix}/notifications`, label: "Notifications", icon: Bell },
        { href: `${prefix}/profile`, label: "Profile", icon: UserIcon },
        { href: `${prefix}/settings`, label: "Settings", icon: Settings },
      ],
    },
  ];
}

function buildStaffNav(prefix: string): Array<{ heading: string; items: Item[] }> {
  return [
    { heading: "Overview", items: [{ href: `${prefix}/overview`, label: "Overview", icon: Home }] },
    {
      heading: "Work",
      items: [
        {
          href: `${prefix}/projects`,
          label: "Projects",
          icon: FolderKanban,
          permission: "projects:read",
        },
        {
          href: `${prefix}/invoices`,
          label: "Invoices",
          icon: Receipt,
          permission: "invoices:read",
        },
        { href: `${prefix}/sales`, label: "Sales", icon: LineChart, permission: "sales:read" },
        { href: `${prefix}/calendar`, label: "Calendar", icon: Calendar },
      ],
    },
    {
      heading: "Admin",
      items: [
        { href: `${prefix}/users`, label: "Users", icon: Users, permission: "users:read" },
        {
          href: `${prefix}/reports`,
          label: "Reports",
          icon: FileBarChart,
          permission: "reports:read",
        },
        {
          href: `${prefix}/audit-logs`,
          label: "Audit logs",
          icon: ScrollText,
          permission: "audit_logs:read",
        },
      ],
    },
    {
      heading: "Account",
      items: [
        { href: `${prefix}/notifications`, label: "Notifications", icon: Bell },
        { href: `${prefix}/settings`, label: "Settings", icon: Settings },
      ],
    },
  ];
}

function NavItem({ item }: { item: Item }) {
  const pathname = usePathname();
  const allowedByPerm = useHasPermission(item.permission ?? "");
  const allowed = item.permission ? allowedByPerm : true;
  if (!allowed) return null;
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-10 items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 text-sm text-[var(--color-ink)]",
        active
          ? "bg-[color-mix(in_oklch,var(--color-gold)_12%,transparent)] text-[var(--color-gold-ink)]"
          : "hover:bg-[var(--color-stone)]",
      )}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

/**
 * U-27: the fixed 240px sidebar made the dashboard unusable below ~640px
 * (sidebar ate 64% of a 375px viewport). Now hidden below `md:` and paired
 * with `<MobileNavSheet>` in the Topbar. Shared inner render so the sheet
 * and the desktop rail stay in sync — one nav source of truth.
 */
export function Sidebar() {
  return (
    <nav
      aria-label="Primary"
      className="hidden h-full w-[240px] flex-col gap-6 border-r border-[var(--color-line)] px-4 py-6 md:flex"
    >
      <SidebarNavBody />
    </nav>
  );
}

export function SidebarNavBody() {
  const group = useAuthStore((s) => s.activeRoleGroup);
  const prefix = group === "staff" ? "/staff" : "/client";
  const nav = group === "staff" ? buildStaffNav(prefix) : buildClientNav(prefix);
  return (
    <>
      {nav.map((section) => (
        <div key={section.heading}>
          <p className="kicker mb-2 px-2.5">{section.heading}</p>
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
