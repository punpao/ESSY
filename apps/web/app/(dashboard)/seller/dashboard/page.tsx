'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, CardBody, CardHeader, EmptyState, Table, TableCell, TableHead, TableRow, StatusBadge } from '@thai-escrow/ui';
import { useAuth } from '../../../lib/auth-context';
import { apiFetch } from '../../../lib/apiClient';
import Link from 'next/link';

interface SellerDealsResponse {
  deals: Array<{
    id: string;
    title: string;
    status: 'PENDING' | 'HOLD' | 'SHIPPED' | 'RELEASED' | 'DISPUTE' | 'REFUND';
    amountSatang: number;
    createdAt: string;
    paylinkToken: string;
  }>;
}

const formatBaht = (satang: number) =>
  (satang / 100).toLocaleString('th-TH', { style: 'currency', currency: 'THB' });

export default function SellerDashboardPage() {
  const { token, user } = useAuth();
  if (user && user.role !== 'seller') {
    return (
      <RoleWarning message="หน้านี้สำหรับผู้ขายเท่านั้น กรุณาเข้าสู่ระบบด้วยบัญชีผู้ขาย" />
    );
  }

  const { data, isLoading } = useQuery({
    queryKey: ['seller-deals'],
    queryFn: () =>
      apiFetch<SellerDealsResponse>('/seller/deals', {
        token
      }),
    enabled: Boolean(token)
  });

  const deals = data?.deals ?? [];

  const stats = useMemo(() => {
    const total = deals.length;
    const hold = deals.filter((deal) => deal.status === 'HOLD').length;
    const shipped = deals.filter((deal) => deal.status === 'SHIPPED').length;
    const dispute = deals.filter((deal) => deal.status === 'DISPUTE').length;
    return { total, hold, shipped, dispute };
  }, [deals]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">แดชบอร์ดผู้ขาย</h1>
          <p className="text-sm text-slate-500">
            ดูสถานะดีล ปล่อยเงิน และเปิดดำเนินการข้อพิพาทแบบเรียลไทม์
          </p>
        </div>
        <Link href="/seller/deal/new">
          <Button>สร้างเพย์ลิงก์ใหม่</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard title="ดีลทั้งหมด" value={stats.total.toString()} />
        <StatCard title="พักเงิน (HOLD)" value={stats.hold.toString()} />
        <StatCard title="กำลังจัดส่ง" value={stats.shipped.toString()} />
        <StatCard title="ข้อพิพาท" value={stats.dispute.toString()} highlight />
      </div>

      <Card>
        <CardHeader title="ดีลล่าสุด" actions={<Link href="/seller/deal/new"><Button variant="secondary">สร้างเพย์ลิงก์</Button></Link>} />
        <CardBody>
          {isLoading ? (
            <p className="text-sm text-slate-500">กำลังโหลด...</p>
          ) : deals.length === 0 ? (
            <EmptyState
              title="ยังไม่มีดีล"
              description="เริ่มต้นสร้างเพย์ลิงก์แล้วส่งให้ลูกค้าผ่านแชท Facebook / LINE ได้เลย"
              action={{
                label: 'สร้างเพย์ลิงก์แรก',
                onClick: () => {
                  window.location.href = '/seller/deal/new';
                }
              }}
            />
          ) : (
            <Table>
              <thead>
                <TableRow>
                  <TableHead>รายการ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ยอดเงิน</TableHead>
                  <TableHead>สร้างเมื่อ</TableHead>
                  <TableHead>ลิงก์</TableHead>
                </TableRow>
              </thead>
              <tbody>
                {deals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium text-slate-800">{deal.title}</TableCell>
                    <TableCell>
                      <StatusBadge status={deal.status} />
                    </TableCell>
                    <TableCell>{formatBaht(deal.amountSatang)}</TableCell>
                    <TableCell>
                      {new Date(deal.createdAt).toLocaleString('th-TH', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </TableCell>
                    <TableCell>
                      <Link
                        target="_blank"
                        className="text-sm text-blue-600 underline"
                        href={`/pay/${deal.paylinkToken}`}
                      >
                        เปิดลิงก์
                      </Link>
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

const RoleWarning = ({ message }: { message: string }) => (
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-700">
    {message}
  </div>
);
