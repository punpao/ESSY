import type { ReactNode } from 'react'
import clsx from 'clsx'

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export const EmptyState = ({
  title,
  description,
  action,
  className
}: EmptyStateProps) => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center shadow-sm',
        className
      )}
    >
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {description ? (
        <p className="mt-3 max-w-md text-sm text-slate-500">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
