import * as React from 'react';
import clsx from 'clsx';

export const Table = ({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) => (
  <div className="overflow-hidden rounded-lg border border-slate-200">
    <table
      className={clsx('min-w-full divide-y divide-slate-200 bg-white text-left', className)}
      {...props}
    />
  </div>
);

export const TableHead = (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={clsx(
      'bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500',
      props.className
    )}
    {...props}
  />
);

export const TableCell = (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={clsx('px-4 py-3 text-sm text-slate-700', props.className)} {...props} />
);

export const TableRow = (props: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={clsx('even:bg-slate-50/60 transition hover:bg-blue-50/40', props.className)}
    {...props}
  />
);
