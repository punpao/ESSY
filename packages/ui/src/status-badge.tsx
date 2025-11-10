import * as React from 'react';
import { DealStatus, DEAL_STATUS_LABEL_TH } from '@thai-escrow/core';
import clsx from 'clsx';

const statusStyles: Record<DealStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  HOLD: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  RELEASED: 'bg-emerald-100 text-emerald-700',
  DISPUTE: 'bg-rose-100 text-rose-700',
  REFUND: 'bg-slate-200 text-slate-700'
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: DealStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, ...props }) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full px-3 py-0.5 text-sm font-medium',
      statusStyles[status],
      className
    )}
    {...props}
  >
    {DEAL_STATUS_LABEL_TH[status]}
  </span>
);
