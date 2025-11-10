import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin", "thai"] });

export const metadata: Metadata = {
  title: "ESSY - ระบบพักเงินออนไลน์",
  description: "โอนแล้วพักเงินจนกว่าคุณจะกดยืนยัน",
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
