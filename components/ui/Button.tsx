"use client";

import React from "react";
import Link from "next/link";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "gradient" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface BaseButtonProps {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export type ButtonProps = BaseButtonProps &
  Omit<HTMLMotionProps<"button">, keyof BaseButtonProps | "children">;

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-light shadow-subtle border border-primary/20 dark:border-primary/40",
  gradient:
    "bg-gradient-primary text-white shadow-teal hover:opacity-95 border-0 font-semibold",
  secondary:
    "bg-white dark:bg-slate-800 text-text-primary dark:text-slate-100 border border-border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 shadow-subtle",
  outline:
    "bg-transparent text-text-primary dark:text-slate-100 border border-border dark:border-slate-700 hover:bg-teal/5 dark:hover:bg-teal/10 hover:border-teal hover:text-teal-dark",
  ghost:
    "bg-transparent text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800 border-0",
  danger:
    "bg-danger text-white hover:bg-red-600 shadow-subtle border border-red-600/20",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm rounded-xl gap-2 font-medium",
  lg: "px-6 py-3 text-base rounded-2xl gap-2.5 font-semibold",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        whileHover={{ y: -1 }}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-sans transition-all duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 select-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="inline-block">
      <motion.div
        whileTap={{ scale: 0.98 }}
        whileHover={{ y: -1 }}
        className={cn(
          "inline-flex items-center justify-center font-sans transition-all duration-150 select-none cursor-pointer",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
      >
        {leftIcon}
        <span>{children}</span>
        {rightIcon}
      </motion.div>
    </Link>
  );
}
