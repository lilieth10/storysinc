import * as React from "react";

export type ButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
  | "destructive";
export type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50";
const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500",
  outline:
    "border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700 focus-visible:ring-gray-300",
  secondary:
    "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-300",
  ghost: "hover:bg-gray-100 text-gray-700 focus-visible:ring-gray-300",
  link: "text-green-600 underline-offset-4 hover:underline focus-visible:ring-green-500",
  destructive:
    "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500",
};
const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "h-10 w-10",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className = "", variant = "default", size = "default", ...props },
    ref,
  ) => {
    const classes = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return <button ref={ref} className={classes} {...props} />;
  },
);
Button.displayName = "Button";
