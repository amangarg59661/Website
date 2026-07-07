"use client";
import * as Toast from "@radix-ui/react-toast";
import { create } from "zustand";
import type { ReactNode } from "react";

type ToastItem = {
  id: string;
  severity: "info" | "success" | "warning" | "error";
  title: string;
  body?: string;
  durationMs: number;
};

type ToastStore = {
  items: ToastItem[];
  push: (t: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  items: [],
  push: (t) =>
    set((s) => ({
      items: [...s.items, { ...t, id: crypto.randomUUID() }].slice(-3),
    })),
  dismiss: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));

export function ToastProvider({ children }: { children: ReactNode }) {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <Toast.Provider swipeDirection="right">
      {children}
      {items.map((t) => (
        <Toast.Root
          key={t.id}
          duration={t.durationMs}
          onOpenChange={(o) => !o && dismiss(t.id)}
          className="fixed top-6 right-6 z-[var(--z-toast)] rounded-[var(--radius-md)] border border-[var(--color-line-strong)] bg-[var(--color-paper)] px-4 py-3 shadow-[var(--shadow-md)]"
        >
          <Toast.Title className="text-sm font-medium">{t.title}</Toast.Title>
          {t.body && (
            <Toast.Description className="mt-1 text-sm text-[var(--color-muted)]">
              {t.body}
            </Toast.Description>
          )}
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed top-0 right-0 z-[var(--z-toast)] flex w-96 flex-col gap-2 p-6" />
    </Toast.Provider>
  );
}
