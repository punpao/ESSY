'use client';

import { FormEvent, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardDescription } from '@thai-escrow/ui';
import { useAuthStore } from '../store/auth';

export const LoginPanel = () => {
  const [email, setEmail] = useState('buyer@escrow.local');
  const [code, setCode] = useState('');
  const [lineSub, setLineSub] = useState('line-demo-123');
  const { requestEmailOtp, verifyEmailOtp, loginWithLine, loading, error, otpEmail } =
    useAuthStore((state) => ({
      requestEmailOtp: state.requestEmailOtp,
      verifyEmailOtp: state.verifyEmailOtp,
      loginWithLine: state.loginWithLine,
      loading: state.loading,
      error: state.error,
      otpEmail: state.otpEmail,
    }));

  const requestOtp = async (event: FormEvent) => {
    event.preventDefault();
    await requestEmailOtp(email);
  };

  const submitOtp = async (event: FormEvent) => {
    event.preventDefault();
    await verifyEmailOtp(email, code);
  };

  const loginLine = async () => {
    await loginWithLine({ lineSub, email, displayName: 'ผู้ใช้ LINE' });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-6">
        <CardHeader>
          <CardTitle>เข้าสู่ระบบด้วยอีเมล</CardTitle>
          <CardDescription>
            ระบบจะส่ง Magic Link (OTP) ไปที่อีเมลของคุณ — ไม่ต้องจำรหัสผ่าน
          </CardDescription>
        </CardHeader>
        <form className="flex flex-col gap-3" onSubmit={otpEmail ? submitOtp : requestOtp}>
          <label className="text-sm font-medium text-slate-700">
            อีเมล
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
              required
            />
          </label>
          {otpEmail && (
            <label className="text-sm font-medium text-slate-700">
              รหัส OTP 6 หลัก (ดูกลับในแชท/อีเมล หรือ dev console)
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                maxLength={6}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                required
              />
            </label>
          )}
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" disabled={loading}>
            {otpEmail ? 'ยืนยันรหัส' : 'ส่งรหัสไปที่อีเมล'}
          </Button>
        </form>
        <p className="mt-4 text-xs text-slate-500">
          แนะนำ: buyer@escrow.local, seller@escrow.local, ops@escrow.local
        </p>
      </Card>

      <Card className="p-6">
        <CardHeader>
          <CardTitle>เข้าสู่ระบบด้วย LINE</CardTitle>
          <CardDescription>
            เดโม่จำลอง LINE Login — กรอก Line Sub (เช่น line-demo-123) แล้วกดเข้าได้เลย
          </CardDescription>
        </CardHeader>
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-slate-700">
            LINE Sub
            <input
              value={lineSub}
              onChange={(event) => setLineSub(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <Button onClick={loginLine} disabled={loading}>
            ใช้ LINE Login (จำลอง)
          </Button>
        </div>
      </Card>
    </div>
  );
};
