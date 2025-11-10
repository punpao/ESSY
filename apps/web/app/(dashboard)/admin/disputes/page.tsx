'use client';

import { useState } from 'react';
import { AuthGuard } from '../../../../components/AuthGuard';
import { useAdminDisputes } from '../../../../lib/deals';
import { api } from '../../../../lib/api';
import { Button, Card } from '@thai-escrow/ui';

const statusOptions = ['OPEN', 'NEED_MORE_INFO', 'RESOLVED_REFUND', 'RESOLVED_RELEASE'];

export default function AdminDisputesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const { data: disputes, mutate } = useAdminDisputes(statusFilter || undefined);

  const resolve = async (id: string, resolution: 'refund' | 'release') => {
    await api.post(`/disputes/${id}/resolve`, { resolution });
    if (resolution === 'refund') {
      const dispute = disputes?.find((d: any) => d.id === id);
      if (dispute) {
        await api.post(`/payments/${dispute.dealId}/refund`);
      }
    }
    await mutate();
  };

  return (
    <AuthGuard role="admin">
      <div className="space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">คิวข้อพิพาท</h1>
            <p className="text-sm text-slate-600">ตัดสินข้อพิพาทภายใน 24–72 ชั่วโมง พร้อมตราสี SLA</p>
          </div>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">ทุกสถานะ</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </header>

        <div className="space-y-4">
          {disputes?.map((dispute: any) => (
            <Card key={dispute.id} className="p-6">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Deal: {dispute.deal.title}</h2>
                  <p className="text-sm text-slate-600">เหตุผล: {dispute.reasonText}</p>
                  <p className="text-xs text-slate-400">
                    เปิดโดย: {dispute.openedBy.email} | สถานะ: {dispute.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="danger" onClick={() => resolve(dispute.id, 'refund')}>
                    คืนเงิน
                  </Button>
                  <Button onClick={() => resolve(dispute.id, 'release')}>
                    โอนให้ผู้ขาย
                  </Button>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {dispute.evidence.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span>
                      [{item.kind}] {item.url}
                    </span>
                    {item.note && <span className="text-xs text-slate-400">{item.note}</span>}
                  </div>
                ))}
              </div>
            </Card>
          ))}
          {!disputes?.length && (
            <Card className="p-6 text-center text-sm text-slate-500">
              ยังไม่มีข้อพิพาทในสถานะนี้ 🎉
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
