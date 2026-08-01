"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export default function Checkbox({
  checked,
  onCheckedChange,
  label,
  id: externalId,
  disabled = false,
  className,
}: CheckboxProps) {
  const generatedId = useId();
  const id = externalId || generatedId;

  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex items-center gap-2.5 cursor-pointer select-none group",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          disabled={disabled}
          className="peer sr-only"
          aria-checked={checked}
        />
        <div
          className={cn(
            "h-4 w-4 rounded border-2 border-slate-300 dark:border-slate-600 transition-all duration-150 flex items-center justify-center",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-teal peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-slate-800",
            checked
              ? "bg-teal border-teal dark:bg-teal dark:border-teal"
              : "bg-white dark:bg-slate-700 group-hover:border-teal/50"
          )}
        >
          {checked && (
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          )}
        </div>
      </div>
      {label && (
        <span className="text-xs sm:text-sm font-medium text-text-primary dark:text-slate-200">
          {label}
        </span>
      )}
    </label>
  );
}
