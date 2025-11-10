import type { Metadata } from 'next';
import { Sarabun } from 'next/font/google';
import './globals.css';

const sarabun = Sarabun({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Thai Escrow - ระบบพักเงินซื้อขายออนไลน์ที่ปลอดภัย',
  description: 'ซื้อขายออนไลน์ผ่าน Facebook, Instagram, LINE ด้วยความมั่นใจ เงินพักไว้จนกว่าคุณจะยืนยันรับสินค้า',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={sarabun.className}>{children}</body>
    </html>
  );
}
