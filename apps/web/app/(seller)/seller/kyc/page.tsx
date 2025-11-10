"use client"

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { useSellerProfile } from '../../../../lib/api-hooks'
import { apiFetch } from '../../../../lib/api-client'
import { useAuth } from '../../../../components/auth-context'

export default function SellerKycPage() {
  const { data: profile } = useSellerProfile()
  const { token } = useAuth()
  const [form, setForm] = useState({
    promptpayId: profile?.sellerProfile?.promptpayId ?? '',
    promptpayName: profile?.sellerProfile?.promptpayName ?? '',
    selfieUrl: ''
  })

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch('/seller/verify/basic', {
        method: 'POST',
        body: JSON.stringify(form),
        token
      })
  })

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">ยืนยันตัวตนผู้ขาย</h1>
        <p className="mt-2 text-sm text-slate-500">
          ยืนยัน PromptPay และอัปโหลดภาพเซลฟี่เพื่อรับป้าย Verified Seller
        </p>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p>
            สถานะปัจจุบัน:{' '}
            <strong>
              {profile?.sellerProfile?.verified ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน'}
            </strong>
          </p>
          <p className="mt-1">
            เราจะใช้ข้อมูลเพื่อจับคู่ชื่อบัญชี PromptPay กับชื่อที่แสดงให้ผู้ซื้อเห็น
          </p>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            mutation.mutate()
          }}
        >
          <div>
            <label className="text-sm font-medium text-slate-700">PromptPay ID</label>
            <input
              required
              value={form.promptpayId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, promptpayId: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-blue-500 focus:outline-none"
              placeholder="เช่น 0812345678 หรือหมายเลขบัตรประชาชน"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              ชื่อบัญชี PromptPay (สำหรับแสดงให้ผู้ซื้อ)
            </label>
            <input
              required
              value={form.promptpayName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, promptpayName: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-blue-500 focus:outline-none"
              placeholder="ชื่อ-นามสกุล หรือชื่อร้าน"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              ลิงก์ภาพเซลฟี่คู่บัตร / สมุดบัญชี
            </label>
            <input
              required
              value={form.selfieUrl}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, selfieUrl: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-blue-500 focus:outline-none"
              placeholder="วางลิงก์ Google Drive / Cloud ของคุณ"
            />
          </div>
          <button
            type="submit"
            disabled={mutation.isLoading}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {mutation.isLoading ? 'กำลังส่งคำขอ...' : 'ส่งเพื่อยืนยัน'}
          </button>
          {mutation.isSuccess ? (
            <p className="text-sm text-emerald-600">
              ส่งคำขอแล้ว ทีมงานจะตรวจสอบและยืนยันให้ภายใน 24 ชั่วโมง
            </p>
          ) : null}
        </form>
      </div>
    </div>
  )
}
