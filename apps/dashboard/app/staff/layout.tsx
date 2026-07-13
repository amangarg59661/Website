"use client";
import { useEffect } from "react";
import { useAuthStore } from "@edss/auth";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { SessionIdleWatcher } from "@/components/auth/SessionIdleWatcher";
import { ShellGate } from "@/components/auth/ShellGate";
import { NotificationsSocket } from "@/components/notifications/NotificationsSocket";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const { status, activeRoleGroup, setRoleGroup } = useAuthStore.getState();
    if (status !== "authenticated") return;
    if (activeRoleGroup !== "staff") setRoleGroup("staff");
    document.cookie = `last_role_group=staff; Path=/; SameSite=Lax; Secure; Max-Age=31536000`;
  }, []);
  return (
    <ShellGate roleGroup="staff">
      <div className="min-h-dvh">
        <Topbar />
        <SessionIdleWatcher />
        <NotificationsSocket />
        <div className="flex">
          <Sidebar />
          <main id="dashboard-main" tabIndex={-1} className="container-app flex-1 py-10">
            {children}
          </main>
        </div>
      </div>
    </ShellGate>
  );
}
