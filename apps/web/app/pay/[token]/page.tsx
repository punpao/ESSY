'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button, Card, CardDescription, CardHeader, CardTitle } from '@thai-escrow/ui';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/auth';

interface DealResponse {
  id: string;
  title: string;
  amountSatang: number;
  seller: {
    displayName: string;
    sellerProfile?: {
      promptpayName: string;
      verified: boolean;
    } | null;
  };
  status: string;
  buyerNote?: string | null;
}

export default function PaylinkPage() {
  const params = useParams();
  const token = params?.token as string;
  const [deal, setDeal] = useState<DealResponse | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [providerRef, setProviderRef] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/deals/paylink/${token}`);
        setDeal(res.data);
      } catch (error) {
        setMessage('ไม่พบ Paylink นี้แล้ว หรือหมดอายุ');
      }
    };
    if (token) {
      load();
    }
  }, [token]);

  const amountThb = useMemo(() => (deal ? deal.amountSatang / 100 : 0), [deal]);

  const createCharge = async () => {
    if (!deal) return;
    const res = await api.post('/payments/create', { dealId: deal.id });
    setQr(res.data.qrString);
    setProviderRef(res.data.providerRef);
    setMessage('สแกน PromptPay ได้เลย เมื่อโอนแล้วเงินจะถูกพักไว้');
  };

  const simulateWebhook = async () => {
    if (!deal || !providerRef) return;
    await api.post('/payments/webhook/mock', {
      providerRef,
      status: 'PAID',
      dealId: deal.id,
      amountSatang: deal.amountSatang,
    });
    setMessage('ระบบรับแจ้งชำระแล้ว! เงินอยู่ในสถานะ HOLD');
    setQr(null);
  };

  if (!deal) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">หน้าชำระเงิน</h1>
        <Card className="p-6 text-sm text-slate-500">{message ?? 'กำลังโหลด...'}</Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">ชำระเงินให้ {deal.seller.displayName}</h1>
        <p className="text-sm text-slate-600">
          เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่า “จัดส่งสำเร็จ” แล้ว
        </p>
      </header>

      <Card className="p-6">
        <CardHeader>
          <CardTitle>{deal.title}</CardTitle>
          <CardDescription>ยอดสุทธิ {amountThb.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</CardDescription>
        </CardHeader>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">ขั้นตอน</p>
            <ol className="mt-2 space-y-2 text-sm text-slate-600">
              <li>1. กด “สร้าง PromptPay QR”</li>
              <li>2. สแกนด้วยแอปธนาคาร (จำลอง)</li>
              <li>3. กด “แจ้งว่าโอนแล้ว” เพื่อจำลอง webhook</li>
              <li>4. เงินจะอยู่สถานะ HOLD จนผู้ซื้อกดยืนยัน</li>
            </ol>
            <div className="mt-4 space-y-2">
              <Button onClick={createCharge} disabled={!user}>
                สร้าง PromptPay QR
              </Button>
              <Button onClick={simulateWebhook} disabled={!providerRef} variant="secondary">
                แจ้งว่าโอนแล้ว (จำลอง)
              </Button>
              {!user && (
                <p className="text-xs text-rose-600">ต้องเข้าสู่ระบบผู้ซื้อก่อนเพื่อดำเนินการ</p>
              )}
            </div>
            {message && <p className="mt-4 text-sm text-emerald-600">{message}</p>}
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-6 text-center">
            {qr ? (
              <pre className="text-xs text-slate-600">{qr}</pre>
            ) : (
              <p className="text-sm text-slate-500">สแกน PromptPay พร้อมเพย์ — เมื่อสร้างโค้ดจะแสดงที่นี่</p>
            )}
            {providerRef && !qr && (
              <p className="mt-3 text-xs text-slate-400">Ref: {providerRef}</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
