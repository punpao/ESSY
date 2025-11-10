'use client';

import { useState } from 'react';
import { AuthGuard } from '../../../../../components/AuthGuard';
import { useSellerProfile } from '../../../../../lib/seller';
import { Button, Card, CardDescription, CardHeader, CardTitle } from '@thai-escrow/ui';
import { api } from '../../../../../lib/api';

export default function SellerKycPage() {
  const { data: profile, mutate } = useSellerProfile();
  const [promptpayId, setPromptpayId] = useState('0812345678');
  const [promptpayName, setPromptpayName] = useState('ร้านพี่มีของแท้');
  const [selfieUrl, setSelfieUrl] = useState('https://placehold.co/300x300?text=Selfie');
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const res = await api.post('/seller/verify/basic', {
      promptpayId,
      promptpayName,
      selfieUrl,
    });
    setMessage(res.data.message);
    mutate();
  };

  return (
    <AuthGuard role="seller">
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-slate-900">ยืนยันตัวตนผู้ขาย</h1>
          <p className="text-sm text-slate-600">
            จับคู่ PromptPay กับชื่อร้าน และอัปโหลดภาพเซลฟี่เพื่อรับตรา Verified Seller
          </p>
        </header>
        <Card className="p-6">
          <CardHeader>
            <CardTitle>ข้อมูล PromptPay</CardTitle>
            <CardDescription>
              ระบบจะตรวจสอบชื่อบัญชี PromptPay ให้ตรงกับข้อมูลบัตรประชาชน (จำลอง)
            </CardDescription>
          </CardHeader>
          <form className="grid gap-4" onSubmit={submit}>
            <label className="text-sm font-medium text-slate-700">
              PromptPay ID
              <input
                value={promptpayId}
                onChange={(event) => setPromptpayId(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              ชื่อบัญชี PromptPay
              <input
                value={promptpayName}
                onChange={(event) => setPromptpayName(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              ลิงก์ภาพเซลฟี่
              <input
                value={selfieUrl}
                onChange={(event) => setSelfieUrl(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <Button type="submit">ส่งข้อมูล</Button>
            {message && <p className="text-sm text-emerald-600">{message}</p>}
          </form>
        </Card>

        {profile?.sellerProfile?.verified && (
          <Card className="p-6">
            <CardTitle>สถานะ: Verified Seller ✅</CardTitle>
            <p className="mt-2 text-sm text-slate-600">
              ลูกค้าจะเห็นตรารับรองและชื่อ PromptPay ตรงกัน เพิ่มความเชื่อมั่น
            </p>
          </Card>
        )}
      </div>
    </AuthGuard>
  );
}
