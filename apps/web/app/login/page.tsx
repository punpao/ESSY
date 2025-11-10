'use client';

import { useState } from 'react';
import { Button, Card, CardBody, CardHeader, EmptyState } from '@thai-escrow/ui';
import { useAuth } from '../../lib/auth-context';

export default function LoginPage() {
  const { requestEmailOtp, verifyEmailOtp, loginWithLineDemo, user } = useAuth();
  const [email, setEmail] = useState('seller@socialtrust.th');
  const [otp, setOtp] = useState('');
  const [otpPreview, setOtpPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    try {
      setLoading(true);
      const response = await requestEmailOtp(email);
      setOtpPreview(response.otpPreview);
      setMessage(`รหัสจำลองสำหรับ ${email}: ${response.otpPreview}`);
    } catch (error: any) {
      setMessage(error.message ?? 'ไม่สามารถขอรหัสได้');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);
      await verifyEmailOtp({ email, code: otp });
      setMessage('เข้าสู่ระบบสำเร็จ 🎉');
    } catch (error: any) {
      setMessage(error.message ?? 'รหัสไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
        <Card>
          <CardHeader title="เข้าสู่ระบบด้วย LINE (เดโม่)" />
          <CardBody className="flex flex-col gap-3">
            <p className="text-sm text-slate-500">
              สำหรับเวอร์ชันเดโม่ คุณสามารถเลือกบทบาทเพื่อเข้าสู่ระบบได้ทันที
            </p>
            <div className="grid gap-2">
              <Button
                variant="secondary"
                onClick={() => loginWithLineDemo('demo-seller')}
              >
                เชื่อมต่อ LINE (ผู้ขาย)
              </Button>
              <Button variant="secondary" onClick={() => loginWithLineDemo('demo-buyer')}>
                เชื่อมต่อ LINE (ผู้ซื้อ)
              </Button>
              <Button variant="secondary" onClick={() => loginWithLineDemo('demo-admin')}>
                เชื่อมต่อ LINE (ทีมงาน)
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="หรือเข้าสู่ระบบด้วยอีเมล OTP"
            description="ระบบจะส่งรหัส 6 หลัก (จำลอง) เพื่อความปลอดภัย"
          />
          <CardBody className="flex flex-col gap-4">
            <label className="text-sm font-medium text-slate-700">
              อีเมลสำหรับรับรหัส
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleRequestOtp} disabled={loading}>
                ขอรหัส OTP
              </Button>
              {otpPreview ? (
                <span className="text-xs text-slate-500">
                  รหัสจำลอง: <strong>{otpPreview}</strong>
                </span>
              ) : null}
            </div>

            <label className="text-sm font-medium text-slate-700">
              กรอกรหัส 6 หลัก
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                maxLength={6}
                placeholder="123456"
              />
            </label>

            <Button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}>
              ยืนยันและเข้าสู่ระบบ
            </Button>

            {message ? <p className="text-sm text-blue-600">{message}</p> : null}
            {user ? (
              <EmptyState
                title={`ยินดีต้อนรับ ${user.displayName}`}
                description={`คุณเข้าสู่ระบบในบทบาท ${roleLabel(user.role)} แล้ว`}
                action={{
                  label: 'ไปยังแดชบอร์ด',
                  onClick: () => {
                    const to =
                      user.role === 'seller'
                        ? '/seller/dashboard'
                        : user.role === 'buyer'
                        ? '/buyer/deals'
                        : '/admin/disputes';
                    window.location.href = to;
                  }
                }}
              />
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

const roleLabel = (role: 'buyer' | 'seller' | 'admin') => {
  switch (role) {
    case 'seller':
      return 'ผู้ขาย';
    case 'buyer':
      return 'ผู้ซื้อ';
    case 'admin':
      return 'ทีมงาน';
    default:
      return role;
  }
};
