"use client"

import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { apiFetch } from '../../../lib/api-client'
import { useAuth } from '../../../components/auth-context'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [serverOtp, setServerOtp] = useState<string | null>(null)

  const requestOtp = useMutation({
    mutationFn: () =>
      apiFetch<{ otp: string }>('/auth/email/request', {
        method: 'POST',
        body: JSON.stringify({ email })
      }),
    onSuccess: (data) => {
      setServerOtp(data.otp)
    }
  })

  const verifyOtp = useMutation({
    mutationFn: () =>
      apiFetch<{ accessToken: string; user: any }>('/auth/email/verify', {
        method: 'POST',
        body: JSON.stringify({ email, otp })
      }),
    onSuccess: (data) => {
      login({ token: data.accessToken, user: data.user })
    }
  })

  const lineLogin = useMutation({
    mutationFn: () =>
      apiFetch<{ accessToken: string; user: any }>('/auth/line/callback', {
        method: 'POST',
        body: JSON.stringify({ code: `demo-${Date.now()}`, state: 'demo-state' })
      }),
    onSuccess: (data) => {
      login({ token: data.accessToken, user: data.user })
    }
  })

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">เข้าสู่ระบบ</h1>
        <p className="mt-1 text-sm text-slate-500">
          เลือกวิธีการเข้าสู่ระบบที่คุณสะดวก (OTP หรือ LINE Login จำลอง)
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            verifyOtp.mutate()
          }}
        >
          <div>
            <label className="text-sm font-medium text-slate-700">อีเมล</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => requestOtp.mutate()}
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300"
          >
            ขอ OTP
          </button>
          {serverOtp ? (
            <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              OTP (mock): <strong>{serverOtp}</strong>
            </p>
          ) : null}
          <div>
            <label className="text-sm font-medium text-slate-700">OTP</label>
            <input
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              maxLength={6}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={verifyOtp.isLoading}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {verifyOtp.isLoading ? 'กำลังเข้าสู่ระบบ...' : 'ยืนยัน OTP'}
          </button>
        </form>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">เข้าสู่ระบบด้วย LINE</h2>
        <p className="mt-1 text-sm text-slate-500">
          โหมดจำลอง: ใช้รหัสสุ่มเพื่อสร้างบัญชี LINE ผู้ใช้ใหม่
        </p>
        <button
          onClick={() => lineLogin.mutate()}
          disabled={lineLogin.isLoading}
          className="mt-4 w-full rounded-lg bg-[#06C755] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#05b24d] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {lineLogin.isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย LINE (mock)'}
        </button>
      </div>
    </div>
  )
}
