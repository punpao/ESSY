import * as React from 'react';
import { Button, ButtonProps } from './button';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: ButtonProps['onClick'];
    variant?: ButtonProps['variant'];
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
    <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
    {description ? <p className="max-w-md text-sm text-slate-500">{description}</p> : null}
    {action ? (
      <Button variant={action.variant ?? 'primary'} onClick={action.onClick}>
        {action.label}
      </Button>
    ) : null}
  </div>
);
