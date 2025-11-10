import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SafePay Thailand - แพลตฟอร์มชำระเงินแบบพักเงิน',
  description:
    'ซื้อขายปลอดภัยบนโซเชียล เงินพักไว้กับเราจนกว่าคุณจะยืนยันรับของ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
