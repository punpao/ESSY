'use client';

import Link from 'next/link';
import { StateBadge, Card } from '@thai-escrow/ui';

interface DealRow {
  id: string;
  title: string;
  amountSatang: number;
  status: 'PENDING' | 'HOLD' | 'SHIPPED' | 'RELEASED' | 'DISPUTE' | 'REFUND';
  createdAt?: string;
  buyerId?: string | null;
  sellerId?: string;
  trackingNumber?: string | null;
  courier?: string | null;
  paylinkToken?: string;
}

const formatCurrency = (satang: number) => (satang / 100).toLocaleString('th-TH', {
  style: 'currency',
  currency: 'THB',
});

export const DealTable = ({ deals, empty }: { deals: DealRow[]; empty?: string }) => {
  if (!deals?.length) {
    return (
      <Card className="p-6 text-center text-sm text-slate-500">
        {empty ?? 'ยังไม่มีรายการ'}
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3">ดีล</th>
            <th className="px-4 py-3">สถานะ</th>
            <th className="px-4 py-3">จำนวน</th>
            <th className="px-4 py-3">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {deals.map((deal) => (
            <tr key={deal.id}>
              <td className="px-4 py-4">
                <div className="font-medium text-slate-900">{deal.title}</div>
                <div className="text-xs text-slate-500">#{deal.id.slice(-6)}</div>
              </td>
              <td className="px-4 py-4">
                <StateBadge status={deal.status} />
              </td>
              <td className="px-4 py-4 text-slate-700">{formatCurrency(deal.amountSatang)}</td>
              <td className="px-4 py-4">
                <Link href={`/deal/${deal.id}`} className="text-emerald-600 hover:text-emerald-700">
                  ดูรายละเอียด
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const SellerQuickActions = ({ paylinkToken }: { paylinkToken?: string }) => {
  if (!paylinkToken) return null;
  const paylink = `${process.env.NEXT_PUBLIC_APP_BASE_URL ?? 'http://localhost:3000'}/pay/${paylinkToken}`;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
      <span className="font-medium text-slate-600">Paylink:</span>
      <code className="rounded bg-slate-100 px-2 py-1">{paylink}</code>
    </div>
  );
};
