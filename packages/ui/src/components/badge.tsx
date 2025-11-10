import * as React from 'react';
import { cn } from '../lib/utils';

const palette: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-700 border border-slate-200',
  HOLD: 'bg-amber-100 text-amber-700 border border-amber-200',
  SHIPPED: 'bg-sky-100 text-sky-700 border border-sky-200',
  RELEASED: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  DISPUTE: 'bg-rose-100 text-rose-700 border border-rose-200',
  REFUND: 'bg-purple-100 text-purple-700 border border-purple-200'
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof palette | string;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className, tone = 'PENDING', ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        palette[tone] ?? 'bg-slate-100 text-slate-700',
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = 'Badge';
