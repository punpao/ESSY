'use client';

import Link from "next/link";
import { useState } from "react";
import { Button } from "@escrow/ui";
import { useAuth } from "./auth-provider";
import { apiFetch } from "../lib/api";

export function SiteHeader() {
  const auth = useAuth();
  const [loadingRole, setLoadingRole] = useState<"buyer" | "seller" | null>(null);

  const handleEmailLogin = async (role: "buyer" | "seller") => {
    const email = window.prompt(
      role === "seller"
        ? "กรุณากรอกอีเมลสำหรับใช้งานในฝั่งผู้ขาย"
        : "กรอกอีเมลเพื่อเข้าสู่ระบบในฝั่งผู้ซื้อ"
    );
    if (!email) return;

    try {
      setLoadingRole(role);
      const request = await apiFetch<{ code: string; expiresAt: string }>("/auth/email/request", {
        method: "POST",
        body: JSON.stringify({ email })
      });

      alert(`รหัส OTP (สำหรับเดโม): ${request.code}`);
      const otp = window.prompt("กรุณากรอกรหัส OTP 6 หลัก");
      if (!otp) return;

      const verify = await apiFetch<{ token: string; user: any }>("/auth/email/verify", {
        method: "POST",
        body: JSON.stringify({ email, code: otp, role })
      });

      auth.login(verify.token, {
        id: verify.user.id,
        displayName: verify.user.displayName,
        role: verify.user.role,
        email: verify.user.email
      });
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-slate-900">
          <span className="rounded-lg bg-brand px-2 py-1 text-xs font-semibold uppercase text-white">
            Escrow
          </span>
          <span className="text-sm font-semibold text-slate-800">
            สำหรับ Social Commerce ไทย
          </span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 sm:flex">
          <Link href="/seller/dashboard" className="hover:text-slate-900">
            หน้าผู้ขาย
          </Link>
          <Link href="/buyer/deals" className="hover:text-slate-900">
            ดีลของฉัน
          </Link>
          <Link href="/admin/deals" className="hover:text-slate-900">
            หน้าทีมงาน
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {auth.user ? (
            <>
              <span className="hidden text-sm text-slate-600 sm:inline">
                {auth.user.displayName} • {auth.user.role === "seller" ? "ผู้ขาย" : auth.user.role}
              </span>
              <Button variant="outline" size="sm" onClick={auth.logout}>
                ออกจากระบบ
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEmailLogin("buyer")}
                disabled={loadingRole === "buyer"}
              >
                {loadingRole === "buyer" ? "กำลังส่ง OTP..." : "เข้าสู่ระบบผู้ซื้อ"}
              </Button>
              <Button
                size="sm"
                onClick={() => handleEmailLogin("seller")}
                disabled={loadingRole === "seller"}
              >
                {loadingRole === "seller" ? "กำลังส่ง OTP..." : "เข้าสู่ระบบผู้ขาย"}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
