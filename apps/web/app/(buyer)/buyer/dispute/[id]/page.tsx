"use client"

import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud } from 'lucide-react'

import { apiFetch } from '../../../../../lib/api-client'
import { useAuth } from '../../../../../components/auth-context'

type EvidenceItem = {
  url: string
  kind: string
  note?: string
}

export default function BuyerDisputePage({ params }: { params: { id: string } }) {
  const { token } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<EvidenceItem[]>([
    { url: '', kind: 'image', note: '' }
  ])

  const { data, isLoading } = useQuery({
    queryKey: ['deal', params.id],
    queryFn: () =>
      apiFetch(`/deals/${params.id}`, {
        token,
        cache: 'no-store'
      }),
    enabled: !!token
  })

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch(`/disputes/${data?.dispute?.id}/evidence`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          items: items
            .filter((item) => item.url)
            .map((item) => ({
              url: item.url,
              kind: item.kind,
              note: item.note || undefined
            }))
        })
      })
  })

  if (isLoading) {
    return <p className="px-6 py-10 text-sm text-slate-500">กำลังโหลดข้อมูล...</p>
  }

  if (!data?.dispute) {
    return (
      <div className="px-6 py-10">
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          ดีลนี้ยังไม่มีข้อพิพาท หรือคุณอาจไม่ได้รับสิทธิ์เข้าถึง
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <button
        onClick={() => router.back()}
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        ย้อนกลับ
      </button>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900">
        ส่งหลักฐานข้อพิพาท: {data.title}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        ระบุลิงก์รูปภาพ / แชต / เอกสารที่ช่วยให้ทีมออปส์ตัดสินได้เร็วขึ้น (ตอบกลับภายใน
        24-72 ชม.)
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate()
        }}
      >
        {items.map((item, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex gap-3">
              <select
                value={item.kind}
                onChange={(event) => {
                  const value = event.target.value
                  setItems((prev) =>
                    prev.map((entry, idx) =>
                      idx === index ? { ...entry, kind: value } : entry
                    )
                  )
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="image">รูปภาพ</option>
                <option value="chatlog">แชต</option>
                <option value="other">อื่น ๆ</option>
              </select>
              <input
                required
                value={item.url}
                onChange={(event) => {
                  const value = event.target.value
                  setItems((prev) =>
                    prev.map((entry, idx) =>
                      idx === index ? { ...entry, url: value } : entry
                    )
                  )
                }}
                placeholder="วางลิงก์ Google Drive / Cloud / โพสต์"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <textarea
              value={item.note}
              onChange={(event) => {
                const value = event.target.value
                setItems((prev) =>
                  prev.map((entry, idx) =>
                    idx === index ? { ...entry, note: value } : entry
                  )
                )
              }}
              placeholder="อธิบายสั้น ๆ ว่าหลักฐานนี้คืออะไร"
              rows={2}
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        ))}

        <button
          type="button"
          onClick={() => setItems((prev) => [...prev, { url: '', kind: 'image' }])}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300"
        >
          เพิ่มหลักฐานอีกชิ้น
        </button>

        <button
          type="submit"
          disabled={mutation.isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <UploadCloud className="h-4 w-4" />
          {mutation.isLoading ? 'กำลังอัปโหลด...' : 'ส่งหลักฐานให้ทีมออปส์'}
        </button>
        {mutation.isSuccess ? (
          <p className="text-sm text-emerald-600">
            ส่งหลักฐานแล้ว ทีมงานจะอัปเดตสถานะผ่านอีเมล/แจ้งเตือน
          </p>
        ) : null}
      </form>
    </div>
  )
}
