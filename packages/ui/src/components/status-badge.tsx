import { DealStatus } from "@escrow/core";
import { cn } from "../lib/utils";

const statusMap: Record<
  DealStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "รอการชำระ",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200"
  },
  HOLD: {
    label: "พักเงินไว้",
    className: "bg-blue-100 text-blue-800 border-blue-200"
  },
  SHIPPED: {
    label: "จัดส่งแล้ว",
    className: "bg-indigo-100 text-indigo-800 border-indigo-200"
  },
  RELEASED: {
    label: "โอนให้ผู้ขายแล้ว",
    className: "bg-green-100 text-green-800 border-green-200"
  },
  DISPUTE: {
    label: "อยู่ระหว่างข้อพิพาท",
    className: "bg-orange-100 text-orange-800 border-orange-200"
  },
  REFUND: {
    label: "คืนเงินแล้ว",
    className: "bg-red-100 text-red-800 border-red-200"
  }
};

export type StatusBadgeProps = {
  status: DealStatus;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = statusMap[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        meta.className,
        className
      )}
    >
      {meta.label}
    </span>
  );
}
