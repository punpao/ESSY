"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useAuth } from './auth-context'

export const Header = () => {
  const { user, logout } = useAuth()
  const router = useRouter()

  const menuItems = [
    { href: '/seller/dashboard', label: 'สำหรับผู้ขาย' },
    { href: '/buyer/deals', label: 'สำหรับผู้ซื้อ' },
    { href: '/admin/disputes', label: 'ทีมออปส์' }
  ]

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold text-primary">
          PromptSafe
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-600">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-slate-900">
              {item.label}
            </Link>
          ))}
          {user ? (
            <button
              onClick={() => logout()}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-slate-300"
            >
              ออกจากระบบ
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="rounded-lg bg-primary px-3 py-1 text-xs text-white shadow hover:bg-blue-600"
            >
              เข้าสู่ระบบ
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
