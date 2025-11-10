"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { Package, PlusCircle } from 'lucide-react'

import { StatusBadge, EmptyState } from '@escrow/ui'

import { useAuth } from '../../../../components/auth-context'
import { useSellerDeals, useSellerProfile } from '../../../../lib/api-hooks'

export default function SellerDashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: profileData } = useSellerProfile()
  const { data: dealsData, isLoading } = useSellerDeals()

  const deals = useMemo(() => {
    if (!dealsData) return []
    const list = (dealsData as { deals: any[] }).deals ?? []
    return list.slice(0, 10)
  }, [dealsData])

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">แดชบอร์ดผู้ขาย</p>
          <h1 className="text-2xl font-semibold text-slate-900">
            สวัสดี {profileData?.displayName ?? user?.email}
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/seller/deal/new')}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600"
          >
            <PlusCircle className="h-4 w-4" />
            สร้าง Paylink
          </button>
          <Link
            href="/seller/kyc"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300"
          >
            จัดการ KYC
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">
              สถานะ KYC:{' '}
              <span className="font-medium text-slate-700">
                {profileData?.sellerProfile?.verified ? 'ผ่านการยืนยันแล้ว' : 'รอตรวจสอบ'}
              </span>
            </p>
            <p className="text-sm text-slate-500">
              PromptPay ที่ผูก: {profileData?.sellerProfile?.promptpayName ?? 'ยังไม่ระบุ'}
            </p>
          </div>
          <div className="rounded-xl bg-blue-50 px-4 py-2 text-sm text-blue-700">
            คะแนนความน่าเชื่อถือ{' '}
            <strong>
              {(profileData?.sellerProfile?.reputationScore ?? 0).toFixed(2)}
            </strong>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">ดีลล่าสุด</h2>
          {isLoading ? (
            <p className="mt-4 text-sm text-slate-500">กำลังโหลดข้อมูล...</p>
          ) : deals.length === 0 ? (
            <EmptyState
              title="ยังไม่มีดีล"
              description="กด “สร้าง Paylink” เพื่อเริ่มรับเงินแบบปลอดภัย"
              action={
                <button
                  onClick={() => router.push('/seller/deal/new')}
                  className="rounded-lg bg-primary px-4 py-2 text-sm text-white"
                >
                  สร้าง Paylink แรกของคุณ
                </button>
              }
            />
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {deals.map((deal: any) => (
                <div
                  key={deal.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-800">{deal.title}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Paylink: <span className="font-mono text-slate-600">{deal.paylinkToken}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={deal.status} />
                    <span className="text-sm font-semibold text-slate-700">
                      ฿{(deal.amountSatang / 100).toLocaleString('th-TH')}
                    </span>
                    <Link
                      href={`/pay/${deal.paylinkToken}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      ดู Paylink
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
