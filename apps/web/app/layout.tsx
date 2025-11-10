import "./globals.css";
import { AppShell } from "@/components/AppShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PromptPay Escrow สำหรับโซเชียลคอมเมิร์ซ",
  description:
    "แพลตฟอร์ม Escrow สำหรับผู้ซื้อ-ผู้ขายในไทย โอนแล้วพักเงินจนกว่าจะกดยืนยัน"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
