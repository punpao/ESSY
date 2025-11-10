import * as React from "react";
import { Badge } from "./badge";
import type { DealStatusType } from "@thai-escrow/core";

interface StatusBadgeProps {
  status: DealStatusType;
  lang?: "th" | "en";
}

const statusConfig: Record<
  DealStatusType,
  { label: { th: string; en: string }; variant: "default" | "warning" | "success" | "destructive" | "info" }
> = {
  PENDING: { label: { th: "รอชำระเงิน", en: "Pending Payment" }, variant: "warning" },
  HOLD: { label: { th: "พักเงิน", en: "Money Held" }, variant: "info" },
  SHIPPED: { label: { th: "จัดส่งแล้ว", en: "Shipped" }, variant: "info" },
  RELEASED: { label: { th: "โอนเรียบร้อย", en: "Released" }, variant: "success" },
  DISPUTE: { label: { th: "พิพาท", en: "Dispute" }, variant: "destructive" },
  REFUND: { label: { th: "คืนเงินแล้ว", en: "Refunded" }, variant: "default" },
};

export function StatusBadge({ status, lang = "th" }: StatusBadgeProps) {
  const config = statusConfig[status];
  if (!config) return null;

  return <Badge variant={config.variant}>{config.label[lang]}</Badge>;
}
