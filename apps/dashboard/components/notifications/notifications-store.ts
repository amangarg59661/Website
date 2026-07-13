"use client";

import { create } from "zustand";

/**
 * Realtime notification buffer fed by NotificationsSocket. The TanStack
 * Query cache holds the paginated GET /notifications result; this store
 * only carries the tail of pushed items that arrived since page load.
 * When the user opens the drawer we merge (backend paged list + realtime
 * tail) with de-dup on id.
 */
export type RealtimeNotification = {
  id: string;
  user_id: string;
  severity: "info" | "success" | "warning" | "critical";
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  href?: string | null;
  event_type?: string | null;
};

type State = {
  items: RealtimeNotification[];
  unreadCount: number;
  push: (n: RealtimeNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
};

export const useRealtimeNotifications = create<State>((set) => ({
  items: [],
  unreadCount: 0,
  push: (n) =>
    set((s) => {
      if (s.items.some((existing) => existing.id === n.id)) return s;
      const items = [n, ...s.items].slice(0, 50);
      const unreadCount = items.filter((i) => !i.read).length;
      return { items, unreadCount };
    }),
  markRead: (id) =>
    set((s) => {
      const items = s.items.map((i) => (i.id === id ? { ...i, read: true } : i));
      return { items, unreadCount: items.filter((i) => !i.read).length };
    }),
  markAllRead: () =>
    set((s) => ({
      items: s.items.map((i) => ({ ...i, read: true })),
      unreadCount: 0,
    })),
  clear: () => set({ items: [], unreadCount: 0 }),
}));
