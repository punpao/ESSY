import '../app/globals.css'

import type { Metadata } from 'next'
import { Noto_Sans_Thai } from 'next/font/google'

import { Providers } from '../components/providers'
import { AuthProvider } from '../components/auth-context'
import { Header } from '../components/header'

const fontThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'PromptSafe Escrow',
  description:
    'โอนเงินผ่าน PromptPay แล้วพักไว้ จ่ายให้ผู้ขายเมื่อคุณยืนยันรับของ'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={`${fontThai.className} bg-slate-50`}>
        <Providers>
            <AuthProvider>
              <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
            <footer className="border-t border-slate-200 bg-white/90">
              <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <span>© {new Date().getFullYear()} PromptSafe Escrow</span>
                <div className="flex gap-3">
                  <a href="#">นโยบายความเป็นส่วนตัว</a>
                  <a href="#">เงื่อนไขการใช้บริการ</a>
                </div>
              </div>
            </footer>
            </div>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
