'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@thai-escrow/ui';
import { useAuth } from '../../lib/auth-context';
import clsx from 'clsx';

const NAV_ITEMS: Record<string, Array<{ href: string; label: string }>> = {
  seller: [
    { href: '/seller/dashboard', label: 'แดชบอร์ด' },
    { href: '/seller/deal/new', label: 'สร้างเพย์ลิงก์' },
    { href: '/seller/kyc', label: 'ยืนยันตัวตน' }
  ],
  buyer: [
    { href: '/buyer/deals', label: 'ดีลของฉัน' }
  ],
  admin: [
    { href: '/admin/disputes', label: 'ข้อพิพาท' },
    { href: '/admin/deals', label: 'ดีลทั้งหมด' }
  ]
};

export const TopNav = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const items = NAV_ITEMS[user.role] ?? [];

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-blue-700">
          SocialTrust Escrow
        </Link>
        <nav className="flex items-center gap-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'text-sm font-medium transition',
                pathname.startsWith(item.href)
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-800">{user.displayName}</p>
            <p className="text-xs text-slate-500">บทบาท: {roleLabel(user.role)}</p>
          </div>
          <Button variant="ghost" onClick={logout}>
            ออกจากระบบ
          </Button>
        </div>
      </div>
    </header>
  );
};

const roleLabel = (role: 'buyer' | 'seller' | 'admin') => {
  switch (role) {
    case 'seller':
      return 'ผู้ขาย';
    case 'buyer':
      return 'ผู้ซื้อ';
    case 'admin':
      return 'ทีมงาน';
    default:
      return role;
  }
};
