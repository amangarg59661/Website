export type Permission = string;

export type RoleGroup = "client" | "staff";

export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  primaryRole: RoleGroup;
  hasBothRoles: boolean;
  createdAt: string;
};

export type Session = {
  id: string;
  userId: string;
  createdAt: string;
  lastActiveAt: string;
  userAgent: string;
  ipAddress: string;
};

export type NotificationSeverity = "info" | "success" | "warning" | "critical";

export type Notification = {
  id: string;
  userId: string;
  severity: NotificationSeverity;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  href: string | null;
};

export type ApiErrorCode =
  | "INVALID_CREDENTIALS"
  | "INVALID_TOTP"
  | "SESSION_EXPIRED"
  | "SESSION_REVOKED"
  | "CSRF_MISMATCH"
  | "RATE_LIMITED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "INVALID_RESPONSE"
  | "NETWORK_ERROR"
  | "SERVER_ERROR"
  | "UNKNOWN";

export type ApiErrorBody = {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export * from "./api";
