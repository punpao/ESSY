'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardBody, CardHeader, EmptyState, StatusBadge, Table, TableCell, TableHead, TableRow } from '@thai-escrow/ui';
import { useAuth } from '../../../lib/auth-context';
import { apiFetch } from '../../../lib/apiClient';
import Link from 'next/link';

interface BuyerDealsResponse {
  deals: Array<{
    id: string;
    title: string;
    status: 'PENDING' | 'HOLD' | 'SHIPPED' | 'RELEASED' | 'DISPUTE' | 'REFUND';
    amountSatang: number;
    createdAt: string;
    paylinkToken: string;
    dispute: { id: string; status: string } | null;
  }>;
}

export default function BuyerDealsPage() {
  const { token, user } = useAuth();
  if (user && user.role !== 'buyer') {
    return (
      <RoleWarning message="หน้านี้สำหรับผู้ซื้อเท่านั้น กรุณาเข้าสู่ระบบด้วยบัญชีผู้ซื้อ" />
    );
  }
  const queryClient = useQueryClient();
  const [openReason, setOpenReason] = useState('ของไม่ตรงปก');
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['buyer-deals'],
    queryFn: () =>
      apiFetch<BuyerDealsResponse>('/buyer/deals', {
        token
      }),
    enabled: Boolean(token)
  });

  const confirmMutation = useMutation({
    mutationFn: (dealId: string) =>
      apiFetch(`/deals/${dealId}/confirm`, {
        method: 'POST',
        token
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['buyer-deals'] })
  });

  const disputeMutation = useMutation({
    mutationFn: (dealId: string) =>
      apiFetch(`/disputes/${dealId}/open`, {
        method: 'POST',
        token,
        body: { reason: openReason }
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['buyer-deals'] })
  });

  const deals = data?.deals ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">ดีลของฉัน</h1>
        <p className="text-sm text-slate-500">
          ตรวจสอบสถานะ พักเงิน และเปิดข้อพิพาทได้จากที่เดียว
        </p>
      </div>

      <Card>
        <CardHeader title="รายการล่าสุด" />
        <CardBody>
          {isLoading ? (
            <p className="text-sm text-slate-500">กำลังโหลด...</p>
          ) : deals.length === 0 ? (
            <EmptyState title="ยังไม่มีดีล" description="ซื้อสินค้าผ่านเพย์ลิงก์เพื่อเริ่มใช้ระบบเอสโครว์" />
          ) : (
            <Table>
              <thead>
                <TableRow>
                  <TableHead>สินค้า</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ยอดเงิน</TableHead>
                  <TableHead>อัปเดตล่าสุด</TableHead>
                  <TableHead>การจัดการ</TableHead>
                </TableRow>
              </thead>
              <tbody>
                {deals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium text-slate-800">
                      <div>{deal.title}</div>
                      <Link className="text-xs text-blue-600 underline" href={`/pay/${deal.paylinkToken}`} target="_blank">
                        ดูเพย์ลิงก์
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={deal.status} />
                    </TableCell>
                    <TableCell>
                      {(deal.amountSatang / 100).toLocaleString('th-TH', {
                        style: 'currency',
                        currency: 'THB'
                      })}
                    </TableCell>
                    <TableCell>
                      {new Date(deal.createdAt).toLocaleString('th-TH', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </TableCell>
                    <TableCell className="space-y-2">
                      {deal.status === 'SHIPPED' ? (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSelectedDeal(deal.id);
                            confirmMutation.mutate(deal.id);
                          }}
                          disabled={confirmMutation.isPending && selectedDeal === deal.id}
                        >
                          ยืนยันรับสินค้า
                        </Button>
                      ) : null}

                      {deal.status === 'HOLD' || deal.status === 'SHIPPED' ? (
                        <div className="space-y-1">
                          <select
                            value={openReason}
                            onChange={(event) => setOpenReason(event.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          >
                            <option>ของยังไม่ถึง</option>
                            <option>ของไม่ตรงปก</option>
                            <option>อื่น ๆ</option>
                          </select>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setSelectedDeal(deal.id);
                              disputeMutation.mutate(deal.id);
                            }}
                            disabled={disputeMutation.isPending && selectedDeal === deal.id}
                          >
                            เปิดข้อพิพาท
                          </Button>
                        </div>
                      ) : null}

                      {deal.dispute ? (
                        <Link
                          href={`/buyer/dispute/${deal.dispute.id}`}
                          className="block text-xs text-blue-600 underline"
                        >
                          ดูข้อพิพาท
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
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-700">
    {message}
  </div>
);
