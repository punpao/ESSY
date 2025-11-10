'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardBody, CardHeader, EmptyState, StatusBadge, Table, TableCell, TableHead, TableRow } from '@thai-escrow/ui';
import { DealStatus } from '@thai-escrow/core';
import { useAuth } from '../../../lib/auth-context';
import { apiFetch } from '../../../lib/apiClient';
import Link from 'next/link';

type DisputeStatus = 'OPEN' | 'NEED_MORE_INFO' | 'RESOLVED_REFUND' | 'RESOLVED_RELEASE';

interface AdminDispute {
  id: string;
  status: DisputeStatus;
  reasonText: string;
  createdAt: string;
  deal: {
    id: string;
    title: string;
    status: DealStatus;
    amountSatang: number;
    sellerId: string;
    seller: {
      displayName: string;
    };
    buyerId: string;
    buyer: {
      displayName: string;
    };
  };
}

interface AdminDisputesResponse {
  disputes: AdminDispute[];
}

export default function AdminDisputesPage() {
  const { token, user } = useAuth();
  if (user && user.role !== 'admin') {
    return (
      <RoleWarning message="หน้านี้สำหรับทีมงานเท่านั้น กรุณาเข้าสู่ระบบด้วยบัญชีทีมงาน" />
    );
  }
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | 'ALL'>('OPEN');
  const [note, setNote] = useState('คืนเงินโดยทีมงานหลังตรวจสอบหลักฐาน');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-disputes', statusFilter],
    queryFn: () =>
      apiFetch<AdminDisputesResponse>(
        `/admin/disputes${statusFilter === 'ALL' ? '' : `?status=${statusFilter}`}`,
        {
          token
        }
      ),
    enabled: Boolean(token)
  });

  const resolveMutation = useMutation({
    mutationFn: (payload: { id: string; resolution: 'REFUND' | 'RELEASE'; note: string }) =>
      apiFetch(`/disputes/${payload.id}/resolve`, {
        method: 'POST',
        token,
        body: { resolution: payload.resolution, note: payload.note }
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-disputes', statusFilter] })
  });

  const disputes = data?.disputes ?? [];
  const summary = useMemo(() => {
    const total = disputes.length;
    const overdue = disputes.filter((d) => hoursSince(d.createdAt) > 72).length;
    return { total, overdue };
  }, [disputes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">จัดการข้อพิพาท</h1>
          <p className="text-sm text-slate-500">
            ตอบข้อพิพาทใน 24–72 ชั่วโมง พร้อมตัดสินคืนเงินหรือปล่อยเงิน
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">
            โน้ตการตัดสิน
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="ms-2 rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as DisputeStatus | 'ALL')}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="OPEN">รอการตรวจสอบ</option>
            <option value="NEED_MORE_INFO">ต้องการข้อมูลเพิ่ม</option>
            <option value="RESOLVED_REFUND">คืนเงินแล้ว</option>
            <option value="RESOLVED_RELEASE">ปล่อยเงินแล้ว</option>
            <option value="ALL">ทั้งหมด</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="ข้อพิพาทในคิว" value={summary.total.toString()} />
        <StatCard
          title="เสี่ยงเกิน SLA (>72ชม.)"
          value={summary.overdue.toString()}
          highlight={summary.overdue > 0}
        />
      </div>

      <Card>
        <CardHeader title="รายการข้อพิพาท" />
        <CardBody>
          {isLoading ? (
            <p className="text-sm text-slate-500">กำลังโหลด...</p>
          ) : disputes.length === 0 ? (
            <EmptyState title="ยังไม่มีข้อพิพาทในสถานะนี้" />
          ) : (
            <Table>
              <thead>
                <TableRow>
                  <TableHead>ดีล</TableHead>
                  <TableHead>เหตุผล</TableHead>
                  <TableHead>ผู้ขาย/ผู้ซื้อ</TableHead>
                  <TableHead>เวลา</TableHead>
                  <TableHead>การจัดการ</TableHead>
                </TableRow>
              </thead>
              <tbody>
                {disputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell className="text-sm font-medium text-slate-800">
                      <div>{dispute.deal.title}</div>
                      <StatusBadge status={dispute.deal.status as any} />
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      <p>{dispute.reasonText}</p>
                      <Link
                        className="text-xs text-blue-600 underline"
                        href={`/buyer/dispute/${dispute.id}`}
                        target="_blank"
                      >
                        ดูหน้าผู้ซื้อ
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      <p>ผู้ขาย: {dispute.deal.seller.displayName}</p>
                      <p>ผู้ซื้อ: {dispute.deal.buyer.displayName}</p>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      <SlaBadge createdAt={dispute.createdAt} />
                      <p>{new Date(dispute.createdAt).toLocaleString('th-TH')}</p>
                    </TableCell>
                    <TableCell className="space-y-2 text-sm">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          resolveMutation.mutate({
                            id: dispute.id,
                            resolution: 'REFUND',
                            note
                          })
                        }
                        disabled={resolveMutation.isPending}
                      >
                        คืนเงินให้ผู้ซื้อ
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          resolveMutation.mutate({
                            id: dispute.id,
                            resolution: 'RELEASE',
                            note
                          })
                        }
                        disabled={resolveMutation.isPending}
                      >
                        ปล่อยเงินให้ผู้ขาย
                      </Button>
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

const hoursSince = (timestamp: string) =>
  (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60);

const StatCard = ({
  title,
  value,
  highlight
}: {
  title: string;
  value: string;
  highlight?: boolean;
}) => (
  <div
    className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${
      highlight ? 'border-rose-200 bg-rose-50/60' : ''
    }`}
  >
    <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
    <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
  </div>
);

const SlaBadge = ({ createdAt }: { createdAt: string }) => {
  const hours = hoursSince(createdAt);
  let label = '';
  let color = 'bg-emerald-100 text-emerald-700';
  if (hours > 72) {
    label = 'เกิน 72 ชม.';
    color = 'bg-rose-100 text-rose-700';
  } else if (hours > 48) {
    label = 'ใกล้ครบ 72 ชม.';
    color = 'bg-amber-100 text-amber-700';
  } else if (hours > 24) {
    label = 'เกิน 24 ชม.';
    color = 'bg-blue-100 text-blue-700';
  } else {
    label = 'ภายใน 24 ชม.';
  }
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${color}`}>
      {label}
    </span>
  );
};

const RoleWarning = ({ message }: { message: string }) => (
  <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
    {message}
  </div>
);
