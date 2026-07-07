"use client";

import { create } from "zustand";
import type { User, Permission, RoleGroup } from "@edss/types";

export type AuthStatus =
  | "idle"
  | "authenticating"
  | "authenticated"
  | "refreshing"
  | "unauthenticated";

export type AuthState = {
  status: AuthStatus;
  accessToken: string | null;
  accessTokenExp: number | null;
  user: User | null;
  permissions: Permission[];
  primaryRole: RoleGroup | null;
  hasBothRoles: boolean;
  activeRoleGroup: RoleGroup | null;
  sessionId: string | null;
  needsTwoFa: boolean;
  twoFaChallengeId: string | null;
};

export type AuthActions = {
  setAuthenticated: (p: {
    accessToken: string;
    accessTokenExp: number;
    user: User;
    permissions: Permission[];
    sessionId: string;
  }) => void;
  setRefreshed: (p: {
    accessToken: string;
    accessTokenExp: number;
    permissions: Permission[];
    sessionId: string;
  }) => void;
  setTwoFaChallenge: (challengeId: string) => void;
  setRoleGroup: (group: RoleGroup) => void;
  reset: () => void;
};

const initialState: AuthState = {
  status: "idle",
  accessToken: null,
  accessTokenExp: null,
  user: null,
  permissions: [],
  primaryRole: null,
  hasBothRoles: false,
  activeRoleGroup: null,
  sessionId: null,
  needsTwoFa: false,
  twoFaChallengeId: null,
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,
  setAuthenticated: (p) =>
    set({
      status: "authenticated",
      accessToken: p.accessToken,
      accessTokenExp: p.accessTokenExp,
      user: p.user,
      permissions: p.permissions,
      primaryRole: p.user.primaryRole,
      hasBothRoles: p.user.hasBothRoles,
      activeRoleGroup: p.user.primaryRole,
      sessionId: p.sessionId,
      needsTwoFa: false,
      twoFaChallengeId: null,
    }),
  setRefreshed: (p) =>
    set((s) => ({
      status: "authenticated",
      accessToken: p.accessToken,
      accessTokenExp: p.accessTokenExp,
      permissions: p.permissions,
      sessionId: p.sessionId,
      user: s.user,
    })),
  setTwoFaChallenge: (id) =>
    set({ status: "idle", needsTwoFa: true, twoFaChallengeId: id }),
  setRoleGroup: (group) => set({ activeRoleGroup: group }),
  reset: () => set({ ...initialState, status: "unauthenticated" }),
}));
