import { ButtonHTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "sm";
  loading?: boolean;
}

const baseClasses =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none px-4 py-2 ring-offset-background";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-emerald-600 hover:bg-emerald-700 text-white",
  secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900",
  ghost: "hover:bg-gray-100 text-gray-900",
  danger: "bg-red-600 hover:bg-red-700 text-white"
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  md: "px-4 py-2 text-sm",
  sm: "px-3 py-1.5 text-xs"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading = false, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={twMerge(
        baseClasses,
        variants[variant],
        sizes[size],
        loading ? "cursor-progress opacity-80" : "",
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? "..." : children}
    </button>
  );
});
