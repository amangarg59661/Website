"use client";
import { useEffect } from "react";
import { useAuthStore } from "@edss/auth";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { SessionIdleWatcher } from "@/components/auth/SessionIdleWatcher";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const { status, activeRoleGroup, setRoleGroup } = useAuthStore.getState();
    if (status !== "authenticated") return;
    if (activeRoleGroup !== "staff") setRoleGroup("staff");
    document.cookie = `last_role_group=staff; Path=/; SameSite=Lax; Secure; Max-Age=31536000`;
  }, []);
  return (
    <div className="min-h-dvh">
      <Topbar />
      <SessionIdleWatcher />
      <div className="flex">
        <Sidebar />
        <div className="container-app flex-1 py-10">{children}</div>
      </div>
    </div>
  );
}
