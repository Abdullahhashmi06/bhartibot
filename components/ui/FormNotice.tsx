import React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "error" | "success" | "info" | "warning";

const toneConfig: Record<
  Tone,
  { bg: string; border: string; text: string; icon: React.ReactNode }
> = {
  error: {
    bg: "bg-red-50/80",
    border: "border-red-200",
    text: "text-red-800",
    icon: <AlertCircle className="h-4 w-4 text-danger shrink-0" />,
  },
  success: {
    bg: "bg-emerald-50/80",
    border: "border-emerald-200",
    text: "text-emerald-900",
    icon: <CheckCircle2 className="h-4 w-4 text-success shrink-0" />,
  },
  info: {
    bg: "bg-blue-50/80",
    border: "border-blue-200",
    text: "text-blue-900",
    icon: <Info className="h-4 w-4 text-info shrink-0" />,
  },
  warning: {
    bg: "bg-amber-50/80",
    border: "border-amber-200",
    text: "text-amber-900",
    icon: <AlertTriangle className="h-4 w-4 text-warning shrink-0" />,
  },
};

export default function FormNotice({
  tone = "error",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  const config = toneConfig[tone];

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border p-3 text-xs sm:text-sm font-medium shadow-subtle",
        config.bg,
        config.border,
        config.text,
        className
      )}
    >
      {config.icon}
      <div className="flex-1">{children}</div>
    </div>
  );
}
