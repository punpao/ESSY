"use client"

import { useState } from 'react'
import { Filter } from 'lucide-react'

import { StatusBadge } from '@escrow/ui'

import { useAdminDeals } from '../../../../lib/api-hooks'

const statuses = ['PENDING', 'HOLD', 'SHIPPED', 'RELEASED', 'DISPUTE', 'REFUND']

export default function AdminDealsPage() {
  const [status, setStatus] = useState<string>()
  const { data, isLoading } = useAdminDeals(status)
  const deals = (data as { deals?: any[] })?.deals ?? []

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">ดีลทั้งหมด (ทีมออปส์)</h1>
          <p className="text-sm text-slate-500">
            ตรวจสอบดีล พร้อมบังคับปล่อยเงินหรือคืนเงินได้ตามความจำเป็น
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={status ?? ''}
            onChange={(event) => setStatus(event.target.value || undefined)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">สถานะทั้งหมด</option>
            {statuses.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">ดีล</th>
              <th className="px-4 py-3">ผู้ขาย</th>
              <th className="px-4 py-3">ผู้ซื้อ</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3 text-right">ยอดเงิน</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-400" colSpan={5}>
                  กำลังโหลด...
                </td>
              </tr>
            ) : deals.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-400" colSpan={5}>
                  ไม่มีดีลในสถานะนี้
                </td>
              </tr>
            ) : (
              deals.map((deal: any) => (
                <tr key={deal.id} className="border-b border-slate-100 last:border-none">
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-800">{deal.title}</div>
                    <div className="text-xs text-slate-400">#{deal.id}</div>
                  </td>
                  <td className="px-4 py-4">{deal.seller?.displayName ?? '-'}</td>
                  <td className="px-4 py-4">{deal.buyer?.displayName ?? '-'}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={deal.status} />
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-slate-800">
                    ฿{(deal.amountSatang / 100).toLocaleString('th-TH')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
