"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id: externalId, ...props }, ref) => {
    const generatedId = useId();
    const id = externalId || generatedId;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-semibold text-text-primary dark:text-slate-200"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-text-primary dark:text-slate-100 placeholder:text-text-muted dark:placeholder:text-slate-500",
            "focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-900",
            "transition-all duration-150",
            error && "border-danger focus:ring-danger/30 focus:border-danger",
            className
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={
            error ? `${id}-error` : helperText ? `${id}-helper` : undefined
          }
          {...props}
        />

        {error && (
          <p id={`${id}-error`} className="text-xs font-medium text-danger" role="alert">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${id}-helper`} className="text-xs text-text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
