"use client"

import Link from 'next/link'
import { useMemo } from 'react'
import { PackageSearch } from 'lucide-react'

import { StatusBadge, EmptyState } from '@escrow/ui'

import { useBuyerDeals, useConfirmReceipt } from '../../../../lib/api-hooks'

export default function BuyerDealsPage() {
  const { data, isLoading } = useBuyerDeals()
  const confirmReceipt = useConfirmReceipt()
  const deals = useMemo(() => {
    if (!data) return []
    return (data as { deals: any[] }).deals ?? []
  }, [data])

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">ดีลของฉัน</h1>
      <p className="mt-1 text-sm text-slate-500">
        ยืนยันรับสินค้าเมื่อได้รับแล้ว หรือเปิดข้อพิพาทหากพบปัญหา
      </p>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {isLoading ? (
          <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>
        ) : deals.length === 0 ? (
          <EmptyState
            title="ยังไม่มีดีล"
            description="เมื่อคุณจ่ายผ่าน PromptSafe ดีลจะปรากฏที่นี่ให้ติดตาม"
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {deals.map((deal: any) => (
              <div
                key={deal.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <PackageSearch className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-800">{deal.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    ผู้ขาย: <span className="font-medium">{deal.seller.displayName}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={deal.status} />
                  <span className="text-sm font-semibold text-slate-700">
                    ฿{(deal.amountSatang / 100).toLocaleString('th-TH')}
                  </span>
                  {deal.status === 'HOLD' || deal.status === 'SHIPPED' ? (
                    <Link
                      href={`/buyer/dispute/${deal.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      เปิดข้อพิพาท
                    </Link>
                  ) : null}
                  {deal.status === 'SHIPPED' ? (
                    <button
                      onClick={() => confirmReceipt.mutate(deal.id)}
                      className="text-sm text-emerald-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={confirmReceipt.isLoading}
                    >
                      {confirmReceipt.isLoading ? 'กำลังยืนยัน...' : 'ยืนยันรับของ'}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
