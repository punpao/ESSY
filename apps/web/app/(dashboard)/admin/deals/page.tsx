'use client';

import { useState } from 'react';
import { AuthGuard } from '../../../../components/AuthGuard';
import { useAdminDeals } from '../../../../lib/deals';
import { api } from '../../../../lib/api';
import { Button, Card } from '@thai-escrow/ui';

const statusOptions = ['PENDING', 'HOLD', 'SHIPPED', 'DISPUTE', 'REFUND'];

export default function AdminDealsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data: deals, mutate } = useAdminDeals(statusFilter || undefined);

  const forceRelease = async (id: string) => {
    await api.post(`/admin/deals/${id}/release`);
    await mutate();
  };

  return (
    <AuthGuard role="admin">
      <div className="space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">ภาพรวมดีล</h1>
            <p className="text-sm text-slate-600">ติดตามดีลที่ค้างโอนและจัดการกรณีพิเศษ</p>
          </div>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">สถานะทั้งหมด</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </header>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">ดีล</th>
                <th className="px-4 py-3">ผู้ซื้อ</th>
                <th className="px-4 py-3">ผู้ขาย</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {deals?.map((deal: any) => (
                <tr key={deal.id}>
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900">{deal.title}</div>
                    <div className="text-xs text-slate-500">฿{(deal.amountSatang / 100).toLocaleString('th-TH')}</div>
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-600">{deal.buyer?.email ?? '-'}</td>
                  <td className="px-4 py-4 text-xs text-slate-600">{deal.seller?.email}</td>
                  <td className="px-4 py-4 text-xs text-slate-600">{deal.status}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => forceRelease(deal.id)}
                        disabled={deal.status === 'RELEASED'}
                      >
                        Force Release
                      </Button>
                      <Button variant="ghost" asChild>
                        <a href={`/deal/${deal.id}`}>View</a>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!deals?.length && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={5}>
                    ไม่พบดีลตามเงื่อนไข
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Card className="p-4 text-sm text-slate-600">
          SLA สี: <span className="font-semibold text-emerald-600">24 ชม.</span> |{' '}
          <span className="font-semibold text-amber-600">48 ชม.</span> |{' '}
          <span className="font-semibold text-rose-600">เกินกำหนด</span>
        </Card>
      </div>
    </AuthGuard>
  );
}
