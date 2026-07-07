import type { User, Permission, Session } from "./index.js";

export type LoginRequest = {
  email: string;
  password: string;
  remember_me: boolean;
};

export type LoginResponse = {
  access_token: string;
  access_token_exp: number;
  user: User;
  permissions: Permission[];
  session_id: string;
} & ({ needs_2fa: false } | { needs_2fa: true; two_fa_challenge_id: string });

export type RefreshResponse = {
  access_token: string;
  access_token_exp: number;
  permissions: Permission[];
  session_id: string;
};

export type TwoFaVerifyRequest = {
  challenge_id: string;
  code: string;
  remember_device: boolean;
};

export type ForgotPasswordRequest = { email: string };
export type ResetPasswordRequest = { token: string; new_password: string };

export type PaginatedResponse<T> = {
  items: T[];
  cursor: string | null;
  has_more: boolean;
};

export type SessionListResponse = { sessions: Session[] };
