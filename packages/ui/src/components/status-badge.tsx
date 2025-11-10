import { cva } from 'class-variance-authority'
import clsx from 'clsx'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-tight',
  {
    variants: {
      tone: {
        pending: 'bg-amber-100 text-amber-800',
        hold: 'bg-sky-100 text-sky-700',
        shipped: 'bg-indigo-100 text-indigo-700',
        released: 'bg-emerald-100 text-emerald-700',
        dispute: 'bg-rose-100 text-rose-700',
        refund: 'bg-slate-200 text-slate-800'
      }
    },
    defaultVariants: {
      tone: 'pending'
    }
  }
)

const statusCopy: Record<string, string> = {
  PENDING: 'รอการชำระ',
  HOLD: 'พักเงินไว้',
  SHIPPED: 'กำลังจัดส่ง',
  RELEASED: 'โอนให้ผู้ขายแล้ว',
  DISPUTE: 'มีปัญหา',
  REFUND: 'คืนเงินแล้ว'
}

const statusTone: Record<string, keyof typeof badgeVariants['variants']['tone']> = {
  PENDING: 'pending',
  HOLD: 'hold',
  SHIPPED: 'shipped',
  RELEASED: 'released',
  DISPUTE: 'dispute',
  REFUND: 'refund'
}

export type StatusBadgeProps = {
  status: string
  className?: string
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const tone = statusTone[status] ?? 'pending'
  const label = statusCopy[status] ?? status

  return (
    <span className={clsx(badgeVariants({ tone }), className)}>
      <span className="h-2 w-2 rounded-full bg-current opacity-75" aria-hidden />
      <span className="ml-2">{label}</span>
    </span>
  )
}
