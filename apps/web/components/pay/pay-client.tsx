"use client"

import { useMutation } from '@tanstack/react-query'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

import { StatusBadge } from '@escrow/ui'

import { apiFetch } from '../../lib/api-client'
import { useAuth } from '../auth-context'

type PaylinkDeal = {
  id: string
  title: string
  amountSatang: number
  status: string
  seller: {
    displayName: string
    sellerProfile?: {
      promptpayName: string
      verified: boolean
      reputationScore: number
    } | null
  }
  expiresAt: string
  buyerNote?: string | null
  canPay: boolean
}

type PayClientProps = {
  deal: PaylinkDeal
  paylinkToken: string
}

const formatCurrency = (satang: number) =>
  new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(satang / 100)

const buildQrUrl = (qrString: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    qrString
  )}`

export const PayClient = ({ deal, paylinkToken }: PayClientProps) => {
  const { user } = useAuth()
  const [qr, setQr] = useState<{
    qrString: string
    providerRef: string
  } | null>(null)

  const payMutation = useMutation({
    mutationFn: async () =>
      apiFetch<{
        qrString: string
        providerRef: string
        copy: string
      }>('/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          paylinkToken,
          buyerId: user?.id
        })
      }),
    onSuccess: (data) => {
      setQr({
        qrString: data.qrString,
        providerRef: data.providerRef
      })
    }
  })

  const webhookMutation = useMutation({
    mutationFn: async () => {
      if (!qr) throw new Error('ยังไม่มี QR')
      return apiFetch('/payments/webhook/mock', {
        method: 'POST',
        body: JSON.stringify({
          provider_ref: qr.providerRef,
          deal_id: deal.id,
          status: 'PAID',
          paid_amount: deal.amountSatang,
          buyer_id: user?.id
        })
      })
    }
  })

  const infoItems = useMemo(
    () => [
      {
        label: 'ผู้ขาย',
        value: deal.seller.displayName
      },
      {
        label: 'PromptPay',
        value: deal.seller.sellerProfile?.promptpayName ?? 'ไม่ระบุ'
      },
      {
        label: 'คะแนนความน่าเชื่อถือ',
        value:
          deal.seller.sellerProfile?.reputationScore != null
            ? `${(deal.seller.sellerProfile.reputationScore * 100).toFixed(0)} / 100`
            : 'ยังไม่มี'
      }
    ],
    [deal]
  )

  return (
    <div className="grid gap-10 lg:grid-cols-[2fr,1fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{deal.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              หมายเลขดีล: <span className="font-mono">{deal.id}</span>
            </p>
          </div>
          <StatusBadge status={deal.status} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {infoItems.map((item) => (
            <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                {item.label}
              </div>
              <div className="mt-1 text-sm font-medium text-slate-700">
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p>
            <strong>สำคัญ:</strong> เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่า
            “จัดส่งสำเร็จ” แล้ว
          </p>
          {deal.buyerNote ? (
            <p className="mt-2">
              <strong>โน้ตถึงผู้ขาย:</strong> {deal.buyerNote}
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          ชำระเงิน {formatCurrency(deal.amountSatang)}
        </h2>
        {deal.canPay ? (
          <>
            <p className="mt-2 text-sm text-slate-600">
              สแกน PromptPay QR ด้านล่าง หรือใช้ปุ่ม “ฉันชำระแล้ว (จำลอง)” เพื่อทดสอบ
            </p>
            <div className="mt-6 flex flex-col items-center">
              {qr ? (
                <Image
                  src={buildQrUrl(qr.qrString)}
                  alt="PromptPay QR"
                  width={220}
                  height={220}
                  className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                />
              ) : (
                <div className="flex h-56 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                  <span className="text-sm text-slate-500">
                    กด “สร้าง QR” เพื่อเริ่มชำระเงิน
                  </span>
                </div>
              )}

              <button
                onClick={() => payMutation.mutate()}
                className="mt-6 w-full rounded-lg bg-primary px-6 py-3 text-white shadow-sm transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={payMutation.isLoading}
              >
                {payMutation.isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังสร้าง QR...
                  </span>
                ) : (
                  'สร้าง QR PromptPay'
                )}
              </button>

              <button
                onClick={() => webhookMutation.mutate()}
                className="mt-3 w-full rounded-lg border border-slate-200 px-6 py-3 text-sm text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={!qr || webhookMutation.isLoading}
              >
                {webhookMutation.isLoading ? 'กำลังแจ้งชำระเงิน...' : 'ฉันชำระแล้ว (จำลอง)'}
              </button>

              {webhookMutation.isSuccess ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  ระบบแจ้งชำระแล้ว กรุณารอผู้ขายจัดส่ง
                </p>
              ) : null}

              {webhookMutation.isError ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-rose-600">
                  <AlertTriangle className="h-4 w-4" />
                  {(webhookMutation.error as Error).message}
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            ดีลนี้ไม่สามารถชำระได้แล้ว อาจหมดอายุหรือถูกปิดโดยทีมงาน
          </div>
        )}
      </div>
    </div>
  )
}
