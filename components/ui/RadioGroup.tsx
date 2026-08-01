"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface RadioOption {
  label: string;
  value: string;
  description?: string;
}

interface RadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  name?: string;
  className?: string;
}

export default function RadioGroup({
  value,
  onChange,
  options,
  name: externalName,
  className,
}: RadioGroupProps) {
  const generatedId = useId();
  const name = externalName || `radio-${generatedId}`;

  return (
    <div className={cn("flex flex-col gap-2", className)} role="radiogroup">
      {options.map((option) => {
        const id = `${name}-${option.value}`;
        const isSelected = value === option.value;

        return (
          <label
            key={option.value}
            htmlFor={id}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border dark:border-slate-700 px-4 py-3 cursor-pointer transition-all duration-150",
              "hover:border-teal/50 hover:bg-teal-light/30 dark:hover:bg-teal/10",
              isSelected &&
                "border-teal bg-teal-light/50 dark:bg-teal/20 dark:border-teal ring-1 ring-teal/30"
            )}
          >
            <div className="relative flex items-center justify-center">
              <input
                id={id}
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
                aria-checked={isSelected}
              />
              <div
                className={cn(
                  "h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-600 transition-all duration-150",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-teal peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-slate-800",
                  isSelected
                    ? "border-teal"
                    : "bg-white dark:bg-slate-700"
                )}
              >
                {isSelected && (
                  <div className="h-full w-full rounded-full bg-teal scale-[0.6]" />
                )}
              </div>
            </div>

            <div>
              <span className="text-xs sm:text-sm font-semibold text-text-primary dark:text-slate-200">
                {option.label}
              </span>
              {option.description && (
                <p className="text-[11px] text-text-muted mt-0.5">
                  {option.description}
                </p>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}
