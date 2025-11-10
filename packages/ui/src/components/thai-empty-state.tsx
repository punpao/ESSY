import { HTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export interface ThaiEmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function ThaiEmptyState({
  title = "ยังไม่มีข้อมูล",
  description = "เริ่มต้นใช้งานเพื่อเห็นรายการที่นี่",
  action,
  className,
  ...props
}: ThaiEmptyStateProps) {
  return (
    <div
      className={twMerge(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center",
        className
      )}
      {...props}
    >
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-gray-600">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
