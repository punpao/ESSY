'use client';

import Link from 'next/link';
import { useAuthStore } from '../store/auth';
import { Button } from '@thai-escrow/ui';
import { useEffect } from 'react';

export const TopNav = () => {
  const { user, logout, hydrate } = useAuthStore((state) => ({
    user: state.user,
    logout: state.logout,
    hydrate: state.hydrate,
  }));

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-slate-900">
          โอนพัก by Escrow
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/pay/demo" className="text-slate-600 hover:text-slate-900">
            ลองสแกน Paylink
          </Link>
          <Link href="/seller/dashboard" className="text-slate-600 hover:text-slate-900">
            สำหรับผู้ขาย
          </Link>
          <Link href="/buyer/deals" className="text-slate-600 hover:text-slate-900">
            สำหรับผู้ซื้อ
          </Link>
          <Link href="/admin/disputes" className="text-slate-600 hover:text-slate-900">
            ทีมงาน
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-slate-600 sm:inline">
                {user.displayName} ({user.role})
              </span>
              <Button variant="ghost" onClick={logout}>
                ออกจากระบบ
              </Button>
            </div>
          ) : (
            <Link href="/login" className="font-medium text-emerald-600">
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
