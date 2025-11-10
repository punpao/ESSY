'use client';

import { useState } from 'react';
import { Button, Card, CardBody, CardHeader } from '@thai-escrow/ui';
import { useAuth } from '../../../../lib/auth-context';
import { apiFetch } from '../../../../lib/apiClient';

interface CreateDealResponse {
  deal: {
    id: string;
    title: string;
    amountSatang: number;
    paylinkToken: string;
  };
  paylinkUrl: string;
}

export default function SellerCreateDealPage() {
  const { token, user } = useAuth();
  if (user && user.role !== 'seller') {
    return (
      <RoleWarning message="หน้านี้สำหรับผู้ขายเท่านั้น กรุณาเข้าสู่ระบบด้วยบัญชีผู้ขาย" />
    );
  }
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [result, setResult] = useState<CreateDealResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    const amountTHB = Number(amount);
    if (Number.isNaN(amountTHB) || amountTHB <= 0) {
      setMessage('กรุณากรอกจำนวนเงินให้ถูกต้อง');
      return;
    }
    try {
      setLoading(true);
      const response = await apiFetch<CreateDealResponse>('/deals', {
        method: 'POST',
        token,
        body: {
          title,
          amountTHB,
          buyerEmail: buyerEmail || undefined
        }
      });
      setResult(response);
      setMessage('สร้างเพย์ลิงก์สำเร็จ ส่งต่อให้ลูกค้าในแชทได้เลย!');
    } catch (error: any) {
      setMessage(error.message ?? 'ไม่สามารถสร้างเพย์ลิงก์ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">สร้างเพย์ลิงก์ใหม่</h1>
        <p className="text-sm text-slate-500">
          กรอกข้อมูลสินค้าและยอดเงิน ระบบจะสร้างลิงก์ให้คุณส่งในแชทได้ทันที
        </p>
      </div>

      <Card>
        <CardHeader title="รายละเอียดสินค้า" />
        <CardBody>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700">
              ชื่อสินค้า / รายการขาย
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              ยอดโอน (บาท)
              <input
                required
                type="number"
                min={1}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              อีเมลผู้ซื้อ (ไม่บังคับ)
              <input
                type="email"
                value={buyerEmail}
                onChange={(event) => setBuyerEmail(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <span className="mt-1 block text-xs text-slate-400">
                ถ้ากรอก ผู้ซื้อจะได้รับอีเมลพร้อมเพย์ลิงก์ (จำลอง)
              </span>
            </label>

            <Button type="submit" disabled={loading}>
              สร้างเพย์ลิงก์
            </Button>
          </form>

          {message ? <p className="mt-4 text-sm text-blue-600">{message}</p> : null}

          {result ? (
            <div className="mt-6 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <p>
                ลิงก์สำหรับลูกค้า:{' '}
                <a className="text-blue-600 underline" href={result.paylinkUrl} target="_blank">
                  {result.paylinkUrl}
                </a>
              </p>
              <p>รหัสเพย์ลิงก์: {result.deal.paylinkToken}</p>
              <p>
                ยอดเงิน:{' '}
                {(result.deal.amountSatang / 100).toLocaleString('th-TH', {
                  style: 'currency',
                  currency: 'THB'
                })}
              </p>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}

const RoleWarning = ({ message }: { message: string }) => (
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-700">
    {message}
  </div>
);
