"use client";

import './globals.css';
import { Noto_Sans_Thai } from 'next/font/google';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const notoThai = Noto_Sans_Thai({
  subsets: ['thai'],
  weight: ['400', '500', '600', '700']
});

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body className={notoThai.className}>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen">
            <header className="border-b border-slate-200 bg-white">
              <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                <div className="text-xl font-semibold text-emerald-700">PromptHold</div>
                <nav className="flex items-center gap-4 text-sm">
                  <a href="/seller/dashboard">สำหรับผู้ขาย</a>
                  <a href="/buyer/deals">ติดตามคำสั่งซื้อ</a>
                  <a href="/admin/disputes">ทีมดูแล</a>
                </nav>
              </div>
            </header>
            <main className="mx-auto max-w-5xl p-6">{children}</main>
          </div>
        </QueryClientProvider>
      </body>
    </html>
  );
}
