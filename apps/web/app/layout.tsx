import '../app/globals.css';
import type { Metadata } from 'next';
import { TopNav } from '../components/TopNav';

export const metadata: Metadata = {
  title: 'โอนพัก Escrow - ปลอดภัยสำหรับของมือสอง',
  description:
    'แพลตฟอร์ม Escrow สำหรับ Social Commerce ในไทย รองรับ PromptPay, แชท, และข้อพิพาทเร็ว',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-slate-50">
        <TopNav />
        <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
