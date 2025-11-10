"use client"

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ShieldCheck, Zap, MessageSquare } from 'lucide-react'

import { useAuth } from '../../components/auth-context'

export default function LandingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer')

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
            PromptPay-first Escrow
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            โอนแล้วพักเงินจนกว่าคุณจะกดยืนยัน
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            ปิดจุดเสี่ยงการซื้อขายผ่านโซเชียลด้วยเอสโครว์ที่ออกแบบเพื่อคนไทย:
            ผูก PromptPay, มีปุ่มแปะลิงก์ในแชท, ยืนยันตัวตนผู้ขาย และชำระเงินคืนได้ไว
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() =>
                router.push(user?.role === 'seller' ? '/seller/dashboard' : '/seller/deal/new')
              }
              className="rounded-lg bg-primary px-6 py-3 text-white shadow-sm transition hover:bg-blue-600"
            >
              เริ่มใช้งานสำหรับผู้ขาย
            </button>
            <button
              onClick={() => router.push('/buyer/deals')}
              className="rounded-lg border border-blue-200 bg-white px-6 py-3 text-blue-700 transition hover:border-blue-300"
            >
              ดูสถานะดีลของฉัน
            </button>
          </div>
          <ul className="mt-8 space-y-3 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" /> Verified Seller
              พร้อมคะแนนความน่าเชื่อถือ
            </li>
            <li className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" /> ปลดเงินอัตโนมัติ 48
              ชั่วโมงหลังสถานะส่งสำเร็จ
            </li>
            <li className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" /> มีลิงก์ชำระเงินส่งใน
              LINE / IG / Facebook ได้ทันที
            </li>
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
          <div className="flex gap-2 rounded-full bg-slate-100 p-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab('buyer')}
              className={`flex-1 rounded-full px-4 py-2 transition ${
                activeTab === 'buyer' ? 'bg-white text-blue-600 shadow' : 'text-slate-500'
              }`}
            >
              ผู้ซื้อ
            </button>
            <button
              onClick={() => setActiveTab('seller')}
              className={`flex-1 rounded-full px-4 py-2 transition ${
                activeTab === 'seller' ? 'bg-white text-blue-600 shadow' : 'text-slate-500'
              }`}
            >
              ผู้ขาย
            </button>
          </div>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600">
            {activeTab === 'buyer' ? (
              <>
                <p>
                  1. ผู้ขายส่งลิงก์ PromptSafe มาให้ &rarr; กดดูรายละเอียดดีลและสแกน QR
                  PromptPay
                </p>
                <p>
                  2. หลังจ่ายเงิน ระบบแจ้งว่า <strong>“พักเงินให้คุณ”</strong> จนกว่าจะ
                  <strong>กดยืนยันรับของ</strong> หรือจนสถานะจัดส่งสำเร็จ
                </p>
                <p>
                  3. หากมีปัญหา กด “เปิดข้อพิพาท” เพื่อให้ทีมออปส์ตัดสิน
                  (ตอบกลับในไม่เกิน 24 ชม.)
                </p>
              </>
            ) : (
              <>
                <p>
                  1. สร้าง Paylink ระบุชื่อสินค้า ราคาบาท และ PromptPay ของคุณ
                  พร้อมส่งให้ลูกค้าในแชทได้ทันที
                </p>
                <p>
                  2. เงินจะพักไว้จนกว่าลูกค้าจะยืนยันหรือครบกำหนด เพื่อป้องกันการดึงเงิน
                  และระบบแจ้งเตือนให้ส่งเลขพัสดุ
                </p>
                <p>
                  3. ปรับสถานะส่งของ → ลูกค้ายืนยัน → เงินถูกโอนเข้าบัญชี PromptPay
                  ของคุณ
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mt-16 rounded-3xl bg-blue-50 p-8">
        <h2 className="text-2xl font-semibold text-blue-900">
          รวดเร็วและปลอดภัยสำหรับดีลบน Facebook / IG / LINE
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'PromptPay-first',
              detail:
                'ลูกค้าโอนผ่าน PromptPay ได้ทันที ไม่ต้องสมัครบัตรหรือผูกบัญชีซับซ้อน'
            },
            {
              title: 'ไทย UI และข้อความชัดเจน',
              detail:
                'แจ้งเตือนทุกขั้นตอนด้วยภาษาไทย “เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ”'
            },
            {
              title: 'ทีมออปส์ในประเทศ',
              detail:
                'ข้อพิพาทได้รับการดูแลโดยทีมงานคนไทย ภายใน 24-72 ชม. พร้อมหลักฐานประกอบ'
            }
          ].map((item) => (
            <div key={item.title} className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-700">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
