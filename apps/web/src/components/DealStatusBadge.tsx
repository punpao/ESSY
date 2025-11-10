import { cn } from '@/lib/utils';
import type { DealStatus } from '@essy/core';

const statusLabels: Record<DealStatus, string> = {
  PENDING: 'รอชำระเงิน',
  HOLD: 'เงินถูกพัก',
  SHIPPED: 'จัดส่งแล้ว',
  RELEASED: 'โอนเงินแล้ว',
  DISPUTE: 'มีข้อพิพาท',
  REFUND: 'คืนเงินแล้ว',
};

const statusColors: Record<DealStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  HOLD: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  RELEASED: 'bg-green-100 text-green-800',
  DISPUTE: 'bg-red-100 text-red-800',
  REFUND: 'bg-gray-100 text-gray-800',
};

export function DealStatusBadge({ status }: { status: DealStatus }) {
  return (
    <span className={cn('inline-block px-3 py-1 rounded-full text-sm font-semibold', statusColors[status])}>
      {statusLabels[status]}
    </span>
  );
}
