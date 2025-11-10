import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "thai"] });

export const metadata: Metadata = {
  title: "ESSY - ระบบ Escrow สำหรับการซื้อขายออนไลน์",
  description: "โอนแล้วพักเงินจนกว่าคุณจะกดยืนยัน",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
