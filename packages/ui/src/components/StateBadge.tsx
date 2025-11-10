import * as React from 'react';
import { clsx } from 'clsx';

type Status =
  | 'PENDING'
  | 'HOLD'
  | 'SHIPPED'
  | 'RELEASED'
  | 'DISPUTE'
  | 'REFUND';

const statusMap: Record<Status, { label: string; className: string }> = {
  PENDING: { label: 'รอชำระ', className: 'bg-slate-100 text-slate-700' },
  HOLD: { label: 'พักเงิน', className: 'bg-amber-100 text-amber-700' },
  SHIPPED: { label: 'ระหว่างจัดส่ง', className: 'bg-sky-100 text-sky-700' },
  RELEASED: { label: 'โอนให้ผู้ขายแล้ว', className: 'bg-emerald-100 text-emerald-700' },
  DISPUTE: { label: 'มีข้อพิพาท', className: 'bg-rose-100 text-rose-700' },
  REFUND: { label: 'คืนเงิน', className: 'bg-purple-100 text-purple-700' },
};

export const StateBadge: React.FC<{ status: Status; className?: string }> = ({
  status,
  className,
}) => {
  const info = statusMap[status];
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        info.className,
        className
      )}
    >
      {info.label}
    </span>
  );
};
