import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Thai Escrow - ระบบพักเงินสำหรับซื้อขายออนไลน์',
  description: 'ซื้อขายปลอดภัยด้วยระบบพักเงิน PromptPay QR รองรับภาษาไทย',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
