'use client';

import { RequireAuth } from '../../components/RequireAuth';
import { TopNav } from '../../components/navigation/TopNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-50">
        <TopNav />
        <main className="mx-auto max-w-6xl px-6 pb-16 pt-8">{children}</main>
      </div>
    </RequireAuth>
  );
}
