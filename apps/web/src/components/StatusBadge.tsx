import { DEAL_STATUS_LABELS_TH, DealStatus } from '@thai-escrow/core';
import { cn } from '@thai-escrow/ui';

const statusColors: Record<DealStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  HOLD: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  RELEASED: 'bg-green-100 text-green-800',
  DISPUTE: 'bg-red-100 text-red-800',
  REFUND: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

export function StatusBadge({ status }: { status: DealStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
        statusColors[status]
      )}
    >
      {DEAL_STATUS_LABELS_TH[status]}
    </span>
  );
}
