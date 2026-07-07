"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@edss/auth/client";

export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    void logout().then(() => router.replace("/login"));
  }, [router]);
  return <p className="p-8">Signing out…</p>;
}
