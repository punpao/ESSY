"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LinkIcon } from 'lucide-react'

import { useCreateDeal } from '../../../../../lib/api-hooks'

export default function NewDealPage() {
  const router = useRouter()
  const createDeal = useCreateDeal()
  const [result, setResult] = useState<{ paylinkUrl: string } | null>(null)
  const [form, setForm] = useState({
    title: '',
    amountTHB: '',
    buyerNote: ''
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const payload = {
      title: form.title,
      amountTHB: Number(form.amountTHB),
      buyerNote: form.buyerNote || undefined
    }
    const response = await createDeal.mutateAsync(payload)
    setResult(response as { paylinkUrl: string })
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับ
      </button>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">สร้าง Paylink ใหม่</h1>
        <p className="mt-2 text-sm text-slate-500">
          กรอกรายละเอียดดีลเพื่อสร้างลิงก์ชำระเงิน ส่งให้ลูกค้าในแชทได้ทันที
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">ชื่อสินค้า</label>
            <input
              required
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-blue-500 focus:outline-none"
              placeholder="เช่น เสื้อ Supreme มือสอง"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">ราคาสินค้า (บาท)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              required
              value={form.amountTHB}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, amountTHB: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-blue-500 focus:outline-none"
              placeholder="เช่น 1500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              โน้ตถึงผู้ซื้อ (optional)
            </label>
            <textarea
              value={form.buyerNote}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, buyerNote: event.target.value }))
              }
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-blue-500 focus:outline-none"
              placeholder="ระบุสิ่งที่อยากแจ้ง เช่น ขอถ่ายคลิปแกะกล่อง"
            />
          </div>

          <button
            type="submit"
            disabled={createDeal.isLoading}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {createDeal.isLoading ? 'กำลังสร้าง...' : 'สร้าง Paylink'}
          </button>
        </form>

        {result ? (
          <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <LinkIcon className="h-4 w-4" />
              ส่งลิงก์นี้ให้ลูกค้าในแชท:
            </div>
            <a
              href={result.paylinkUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block break-all rounded-lg bg-white px-3 py-2 text-sm text-blue-600 underline"
            >
              {result.paylinkUrl}
            </a>
          </div>
        ) : null}
      </div>
    </div>
  )
}
