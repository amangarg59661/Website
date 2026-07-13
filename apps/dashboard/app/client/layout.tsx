"use client";
import { useEffect } from "react";
import { useAuthStore } from "@edss/auth";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { SessionIdleWatcher } from "@/components/auth/SessionIdleWatcher";
import { ShellGate } from "@/components/auth/ShellGate";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const { status, activeRoleGroup, setRoleGroup } = useAuthStore.getState();
    if (status !== "authenticated") return;
    if (activeRoleGroup !== "client") setRoleGroup("client");
    document.cookie = `last_role_group=client; Path=/; SameSite=Lax; Secure; Max-Age=31536000`;
  }, []);
  return (
    <ShellGate roleGroup="client">
      <div className="min-h-dvh">
        <Topbar />
        <SessionIdleWatcher />
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
