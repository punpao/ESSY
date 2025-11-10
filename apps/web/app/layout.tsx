import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'SocialTrust Escrow',
  description:
    'แพลตฟอร์มเอสโครว์สำหรับการซื้อขายบนโซเชียลในไทย โอนแล้วพักเงิน ปลอดภัยทั้งสองฝั่ง'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
