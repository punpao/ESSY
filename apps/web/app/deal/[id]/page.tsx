'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useDeal } from '../../../lib/deals';
import { useAuthStore } from '../../../store/auth';
import { api } from '../../../lib/api';
import { Button, Card, CardDescription, CardHeader, CardTitle, StateBadge } from '@thai-escrow/ui';

export default function DealDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: deal, mutate } = useDeal(id);
  const { user } = useAuthStore();
  const [tracking, setTracking] = useState('TH1234567890');
  const [courier, setCourier] = useState('ThailandPost');
  const [disputeReason, setDisputeReason] = useState<'not_arrived' | 'not_as_described' | 'other'>('not_arrived');
  const [disputeNote, setDisputeNote] = useState('แจ้งเหตุผลเพิ่มเติม');

  if (!deal) {
    return <p className="text-sm text-slate-500">กำลังโหลด...</p>;
  }

  const allowShip = user?.role === 'seller' && ['HOLD', 'SHIPPED'].includes(deal.status);
  const allowConfirm = user?.role === 'buyer' && ['HOLD', 'SHIPPED'].includes(deal.status);
  const allowDispute = user?.role === 'buyer' && ['HOLD', 'SHIPPED'].includes(deal.status);

  const ship = async () => {
    await api.post(`/deals/${deal.id}/ship`, {
      trackingNumber: tracking,
      courier,
    });
    await mutate();
  };

  const markDelivered = async () => {
    await api.post(`/deals/${deal.id}/delivered`);
    await mutate();
  };

  const confirm = async () => {
    await api.post(`/deals/${deal.id}/confirm`);
    await mutate();
  };

  const openDispute = async () => {
    await api.post(`/disputes/${deal.id}/open`, {
      dealId: deal.id,
      reason: disputeReason,
      note: disputeNote,
    });
    await mutate();
  };

  const formatCurrency = (satang: number) => (satang / 100).toLocaleString('th-TH', {
    style: 'currency',
    currency: 'THB',
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-slate-900">{deal.title}</h1>
          <StateBadge status={deal.status} />
        </div>
        <p className="text-sm text-slate-600">ยอด {formatCurrency(deal.amountSatang)} | ผู้ขาย {deal.seller.displayName}</p>
      </header>

      <Card className="p-6">
        <CardHeader>
          <CardTitle>รายละเอียด</CardTitle>
          <CardDescription>หมายเหตุจากผู้ซื้อ: {deal.buyerNote ?? '-'}</CardDescription>
        </CardHeader>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>ผู้ซื้อ: {deal.buyer?.displayName ?? '-'}</li>
          <li>PromptPay ชื่อ: {deal.seller?.sellerProfile?.promptpayName ?? '-'}</li>
          <li>เลขพัสดุ: {deal.trackingNumber ?? 'ยังไม่ระบุ'}</li>
        </ul>
      </Card>

      {allowShip && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle>อัปเดตการจัดส่ง</CardTitle>
            <CardDescription>กรอกเลขพัสดุและบริษัทขนส่ง เมื่ออัปเดตแล้วสถานะจะเป็น SHIPPED</CardDescription>
          </CardHeader>
          <div className="flex flex-col gap-3">
            <label className="text-sm text-slate-600">
              เลขพัสดุ
              <input
                value={tracking}
                onChange={(event) => setTracking(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm text-slate-600">
              บริษัทขนส่ง
              <input
                value={courier}
                onChange={(event) => setCourier(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <Button onClick={ship}>บันทึกการจัดส่ง</Button>
            <Button variant="secondary" onClick={markDelivered}>
              แจ้งว่าจัดส่งถึงแล้ว (จำลอง)
            </Button>
          </div>
        </Card>
      )}

      {allowConfirm && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle>ยืนยันรับของ</CardTitle>
            <CardDescription>กดยืนยันเพื่อปล่อยเงินให้ผู้ขายทันที</CardDescription>
          </CardHeader>
          <Button onClick={confirm}>ยืนยันแล้วได้รับสินค้า</Button>
        </Card>
      )}

      {allowDispute && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle>เปิดข้อพิพาท</CardTitle>
            <CardDescription>เลือกเหตุผลและทีมงานจะติดต่อภายใน 24 ชั่วโมง</CardDescription>
          </CardHeader>
          <div className="space-y-3 text-sm text-slate-600">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="not_arrived"
                checked={disputeReason === 'not_arrived'}
                onChange={() => setDisputeReason('not_arrived')}
              />
              ของยังไม่ถึง
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="not_as_described"
                checked={disputeReason === 'not_as_described'}
                onChange={() => setDisputeReason('not_as_described')}
              />
              ของไม่ตรงปก
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="other"
                checked={disputeReason === 'other'}
                onChange={() => setDisputeReason('other')}
              />
              อื่น ๆ
            </label>
            <textarea
              value={disputeNote}
              onChange={(event) => setDisputeNote(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              rows={3}
            />
            <Button variant="danger" onClick={openDispute}>
              เปิดข้อพิพาท
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
