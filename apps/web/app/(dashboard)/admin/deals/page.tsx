'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardBody, CardHeader, EmptyState, StatusBadge, Table, TableCell, TableHead, TableRow } from '@thai-escrow/ui';
import { useAuth } from '../../../lib/auth-context';
import { apiFetch } from '../../../lib/apiClient';
import Link from 'next/link';

type DealStatus = 'PENDING' | 'HOLD' | 'SHIPPED' | 'RELEASED' | 'DISPUTE' | 'REFUND';

interface AdminDeal {
  id: string;
  title: string;
  status: DealStatus;
  amountSatang: number;
  createdAt: string;
  paylinkToken: string;
  seller: { displayName: string };
  buyer: { displayName: string } | null;
  dispute: { id: string; status: string } | null;
}

interface AdminDealsResponse {
  deals: AdminDeal[];
}

export default function AdminDealsPage() {
  const { token, user } = useAuth();
  if (user && user.role !== 'admin') {
    return (
      <RoleWarning message="หน้านี้สำหรับทีมงานเท่านั้น กรุณาเข้าสู่ระบบด้วยบัญชีทีมงาน" />
    );
  }
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<DealStatus | 'ALL'>('HOLD');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-deals', statusFilter],
    queryFn: () =>
      apiFetch<AdminDealsResponse>(
        `/admin/deals${statusFilter === 'ALL' ? '' : `?status=${statusFilter}`}`,
        {
          token
        }
      ),
    enabled: Boolean(token)
  });

  const releaseMutation = useMutation({
    mutationFn: (dealId: string) =>
      apiFetch(`/admin/deals/${dealId}/release`, {
        method: 'POST',
        token
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-deals', statusFilter] })
  });

  const refundMutation = useMutation({
    mutationFn: (dealId: string) =>
      apiFetch(`/payments/${dealId}/refund`, {
        method: 'POST',
        token,
        body: { reason: 'คืนเงินจากทีมงานผ่านแดชบอร์ด' }
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-deals', statusFilter] })
  });

  const deals = data?.deals ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">ดีลทั้งหมด</h1>
          <p className="text-sm text-slate-500">
            ตรวจสอบดีลค้างพักเงิน และจัดการกรณีพิเศษ
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as DealStatus | 'ALL')}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="ALL">ทุกสถานะ</option>
          <option value="HOLD">พักเงิน</option>
          <option value="SHIPPED">กำลังจัดส่ง</option>
          <option value="DISPUTE">ข้อพิพาท</option>
          <option value="RELEASED">ปล่อยเงินแล้ว</option>
          <option value="REFUND">คืนเงินแล้ว</option>
        </select>
      </div>

      <Card>
        <CardHeader title="รายการดีล" />
        <CardBody>
          {isLoading ? (
            <p className="text-sm text-slate-500">กำลังโหลด...</p>
          ) : deals.length === 0 ? (
            <EmptyState title="ไม่พบดีลในสถานะที่เลือก" />
          ) : (
            <Table>
              <thead>
                <TableRow>
                  <TableHead>สินค้า</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ผู้ขาย / ผู้ซื้อ</TableHead>
                  <TableHead>ยอดเงิน</TableHead>
                  <TableHead>การจัดการ</TableHead>
                </TableRow>
              </thead>
              <tbody>
                {deals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="text-sm font-medium text-slate-800">
                      <div>{deal.title}</div>
                      <Link
                        className="text-xs text-blue-600 underline"
                        href={`/pay/${deal.paylinkToken}`}
                        target="_blank"
                      >
                        เปิดเพย์ลิงก์
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={deal.status} />
                      {deal.dispute ? (
                        <p className="text-xs text-rose-600">
                          มีข้อพิพาท ({deal.dispute.status})
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      <p>ผู้ขาย: {deal.seller.displayName}</p>
                      <p>ผู้ซื้อ: {deal.buyer?.displayName ?? 'รอชำระ'}</p>
                    </TableCell>
                    <TableCell>
                      {(deal.amountSatang / 100).toLocaleString('th-TH', {
                        style: 'currency',
                        currency: 'THB'
                      })}
                    </TableCell>
                    <TableCell className="space-y-2 text-sm">
                      <Button
                        variant="secondary"
                        disabled={releaseMutation.isPending}
                        onClick={() => releaseMutation.mutate(deal.id)}
                      >
                        บังคับปล่อยเงิน
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={refundMutation.isPending}
                        onClick={() => refundMutation.mutate(deal.id)}
                      >
                        คืนเงิน (admin)
                      </Button>
                      {deal.dispute ? (
                        <Link
                          href={`/admin/disputes`}
                          className="block text-xs text-blue-600 underline"
                        >
                          ไปที่ข้อพิพาท
                        </Link>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

const RoleWarning = ({ message }: { message: string }) => (
  <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
    {message}
  </div>
);
