import "./globals.css";
import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import { AuthProvider } from "../components/auth-provider";
import { SiteHeader } from "../components/site-header";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "PromptPay Escrow สำหรับ Social Commerce ไทย",
  description:
    "พักเงินให้ปลอดภัยก่อนกดยืนยัน — โอนผ่าน PromptPay แล้วมั่นใจ ได้ของก่อนเงินถึงผู้ขาย"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${prompt.className} bg-slate-50`}>
        <AuthProvider>
          <SiteHeader />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
