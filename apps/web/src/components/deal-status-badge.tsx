import { Badge } from './ui/badge'

const STATUS_MAP = {
  PENDING: { label: 'รอชำระเงิน', variant: 'outline' as const },
  HOLD: { label: 'พักเงินแล้ว', variant: 'default' as const },
  SHIPPED: { label: 'จัดส่งแล้ว', variant: 'secondary' as const },
  RELEASED: { label: 'โอนเงินแล้ว', variant: 'default' as const },
  DISPUTE: { label: 'ข้อพิพาท', variant: 'destructive' as const },
  REFUND: { label: 'คืนเงินแล้ว', variant: 'outline' as const },
}

export function DealStatusBadge({ status }: { status: keyof typeof STATUS_MAP }) {
  const { label, variant } = STATUS_MAP[status] || { label: status, variant: 'outline' }
  
  return (
    <Badge variant={variant} className="font-thai">
      {label}
    </Badge>
  )
}
