import { DealStatus } from "@escrow/core";
import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

const statusMap: Record<
  DealStatus,
  { label: string; className: string }
> = {
  PENDING: { label: "รอชำระ", className: "bg-gray-100 text-gray-700" },
  HOLD: { label: "พักเงิน", className: "bg-yellow-100 text-yellow-800" },
  SHIPPED: { label: "จัดส่งแล้ว", className: "bg-blue-100 text-blue-800" },
  RELEASED: { label: "โอนให้ผู้ขายแล้ว", className: "bg-emerald-100 text-emerald-800" },
  DISPUTE: { label: "มีข้อพิพาท", className: "bg-red-100 text-red-800" },
  REFUND: { label: "คืนเงิน", className: "bg-purple-100 text-purple-800" }
};

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: DealStatus;
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const statusInfo = statusMap[status];

  return (
    <span
      className={twMerge(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        statusInfo.className,
        className
      )}
      {...props}
    >
      {statusInfo.label}
    </span>
  );
}
