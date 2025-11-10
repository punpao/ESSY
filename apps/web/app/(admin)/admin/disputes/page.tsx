"use client"

import { useState } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'

import { useAdminDisputes } from '../../../../lib/api-hooks'

const statuses = ['OPEN', 'NEED_MORE_INFO', 'RESOLVED_REFUND', 'RESOLVED_RELEASE']

const statusLabels: Record<string, string> = {
  OPEN: 'รอทีมออปส์',
  NEED_MORE_INFO: 'ขอข้อมูลเพิ่ม',
  RESOLVED_REFUND: 'คืนเงิน',
  RESOLVED_RELEASE: 'ปล่อยเงิน'
}

const slaBadge = (createdAt: string) => {
  const created = new Date(createdAt).getTime()
  const now = Date.now()
  const hours = (now - created) / (1000 * 60 * 60)
  if (hours < 24) {
    return <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">ภายใน 24 ชม.</span>
  }
  if (hours < 48) {
    return <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">ภายใน 48 ชม.</span>
  }
  return <span className="rounded-full bg-rose-100 px-2 py-1 text-xs text-rose-700">เกิน SLA</span>
}

export default function AdminDisputesPage() {
  const [status, setStatus] = useState<string>()
  const { data, isLoading } = useAdminDisputes(status)
  const disputes = (data as { disputes?: any[] })?.disputes ?? []

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">คิวข้อพิพาท</h1>
          <p className="text-sm text-slate-500">
            ดูแลข้อพิพาทให้เสร็จภายใน 24-72 ชั่วโมง พร้อมตีตราสถานะ SLA
          </p>
        </div>
        <select
          value={status ?? ''}
          onChange={(event) => setStatus(event.target.value || undefined)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">สถานะทั้งหมด</option>
          {statuses.map((state) => (
            <option key={state} value={state}>
              {statusLabels[state]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <p className="text-sm text-slate-500">กำลังโหลดข้อพิพาท...</p>
        ) : disputes.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            ยังไม่มีข้อพิพาทในสถานะนี้
          </div>
        ) : (
          disputes.map((dispute: any) => (
            <div
              key={dispute.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-slate-800">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    ข้อพิพาท #{dispute.id.slice(-6)}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    ดีล: <strong>{dispute.deal?.title}</strong> • ผู้ซื้อ:{' '}
                    {dispute.openedBy?.displayName ?? '-'}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">เหตุผล: {dispute.reasonText}</p>
                </div>
                <div className="flex flex-col items-end gap-2 text-sm text-slate-500">
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    {statusLabels[dispute.status] ?? dispute.status}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    เปิดเมื่อ {new Date(dispute.createdAt).toLocaleString('th-TH')}
                  </div>
                  {slaBadge(dispute.createdAt)}
                </div>
              </div>
              {dispute.evidences?.length ? (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-700">หลักฐาน</p>
                  <ul className="mt-2 space-y-2 text-xs">
                    {dispute.evidences.map((evidence: any) => (
                      <li key={evidence.id}>
                        • [{evidence.kind}] {evidence.url}
                        {evidence.note ? ` – ${evidence.note}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
