import { Badge } from "@/components/ui/badge";
import type { DealStatus } from "@essy/core";

const statusLabels: Record<DealStatus, string> = {
  PENDING: "รอชำระเงิน",
  HOLD: "เงินถูกพัก",
  SHIPPED: "จัดส่งแล้ว",
  RELEASED: "โอนเงินแล้ว",
  DISPUTE: "มีข้อพิพาท",
  REFUND: "คืนเงินแล้ว",
};

const statusColors: Record<DealStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  HOLD: "secondary",
  SHIPPED: "default",
  RELEASED: "default",
  DISPUTE: "destructive",
  REFUND: "destructive",
};

export function StatusBadge({ status }: { status: DealStatus }) {
  return (
    <Badge variant={statusColors[status]}>
      {statusLabels[status]}
    </Badge>
  );
}
