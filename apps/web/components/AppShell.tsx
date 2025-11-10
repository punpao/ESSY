"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { Button } from "@escrow/ui";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/seller/dashboard", label: "ผู้ขาย" },
  { href: "/buyer/deals", label: "ผู้ซื้อ" },
  { href: "/admin/disputes", label: "เจ้าหน้าที่" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, clear } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clear();
    router.push("/login");
  };

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold text-sky-600">
            จ่ายแล้วพักเงิน (Escrow)
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 ${
                  pathname.startsWith(item.href)
                    ? "bg-sky-100 text-sky-700"
                    : "hover:bg-sky-50 text-slate-600"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-slate-500">บทบาท: {user.role}</p>
                </div>
                <Button variant="ghost" onClick={handleLogout}>
                  ออกจากระบบ
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="ghost">เข้าสู่ระบบ</Button>
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
