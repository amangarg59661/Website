import type { User, Permission } from "@edss/types";

export const seedUsers: Array<{
  user: User;
  password: string;
  totpCode: string | null;
  needs2Fa: boolean;
}> = [
  {
    user: {
      id: "u_client_1",
      email: "client@example.com",
      name: "Client User",
      avatarUrl: null,
      primaryRole: "client",
      hasBothRoles: false,
      createdAt: "2026-01-15T10:00:00Z",
    },
    password: "password",
    totpCode: null,
    needs2Fa: false,
  },
  {
    user: {
      id: "u_staff_1",
      email: "staff@example.com",
      name: "Staff User",
      avatarUrl: null,
      primaryRole: "staff",
      hasBothRoles: false,
      createdAt: "2026-01-10T10:00:00Z",
    },
    password: "password",
    totpCode: null,
    needs2Fa: false,
  },
  {
    user: {
      id: "u_admin_1",
      email: "admin@example.com",
      name: "Admin User",
      avatarUrl: null,
      primaryRole: "staff",
      hasBothRoles: true,
      createdAt: "2026-01-01T10:00:00Z",
    },
    password: "password",
    totpCode: "000000",
    needs2Fa: true,
  },
];

export function findUser(email: string) {
  return seedUsers.find((s) => s.user.email === email);
}

export const clientPermissions: Permission[] = [
  "projects:read",
  "invoices:read",
  "tickets:read",
  "tickets:write",
  "files:read",
  "files:write",
  "calendar:read",
  "notifications:read",
  "profile:read",
  "profile:write",
  "settings:read",
];
export const staffPermissions: Permission[] = [
  "projects:read",
  "projects:write",
  "invoices:read",
  "invoices:write",
  "sales:read",
  "sales:write",
  "users:read",
  "users:write",
  "reports:read",
  "audit_logs:read",
  "calendar:read",
  "notifications:read",
  "settings:read",
  "settings:write",
  "careers:read",
  "careers:write",
  "careers:applications:read",
  "careers:applications:write",
];

export function permissionsFor(userId: string): Permission[] {
  if (userId === "u_client_1") return clientPermissions;
  if (userId === "u_staff_1") return staffPermissions;
  if (userId === "u_admin_1") return [...new Set([...clientPermissions, ...staffPermissions])];
  return [];
}
