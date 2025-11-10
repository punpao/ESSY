'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '../../../../../components/AuthGuard';
import { Button, Card, CardDescription, CardHeader, CardTitle } from '@thai-escrow/ui';
import { api } from '../../../../../lib/api';

export default function SellerCreateDealPage() {
  const router = useRouter();
  const [title, setTitle] = useState('กระเป๋า Coach มือสอง');
  const [amount, setAmount] = useState(1590);
  const [note, setNote] = useState('แพ็กดี ๆ ให้ด้วยนะคะ');
  const [loading, setLoading] = useState(false);
  const [paylink, setPaylink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/deals', {
        title,
        amountThb: amount,
        buyerNote: note,
      });
      setPaylink(res.data.paylinkUrl);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'สร้างรายการไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard role="seller">
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-slate-900">สร้าง Paylink ใหม่</h1>
          <p className="text-sm text-slate-600">
            กรอกรายละเอียดสินค้า แล้วส่งลิงก์นี้ให้ลูกค้าสแกน PromptPay ภายในแชท
          </p>
        </header>
        <Card className="p-6">
          <CardHeader>
            <CardTitle>รายละเอียดดีล</CardTitle>
            <CardDescription>
              เมื่อบันทึก ระบบจะสร้างลิงก์ `/pay/[token]` เพื่อส่งให้ลูกค้า
            </CardDescription>
          </CardHeader>
          <form className="grid gap-4" onSubmit={submit}>
            <label className="text-sm font-medium text-slate-700">
              ชื่อสินค้า
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              ราคา (บาท)
              <input
                type="number"
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                required
                min={1}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              โน้ตถึงผู้ซื้อ
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
              />
            </label>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                สร้างลิงก์ชำระเงิน
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.back()}>
                ย้อนกลับ
              </Button>
            </div>
            {paylink && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <p className="font-semibold">แชร์ลิงก์นี้ให้ลูกค้าในแชท:</p>
                <code className="mt-2 block break-all rounded bg-white px-3 py-2">{paylink}</code>
              </div>
            )}
          </form>
        </Card>
      </div>
    </AuthGuard>
  );
}
