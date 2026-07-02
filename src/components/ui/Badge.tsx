import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type BadgeTone = "neutral" | "accent" | "violet" | "success" | "warning" | "error";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: ReactNode;
  className?: string;
}

const toneStyles: Record<BadgeTone, string> = {
  neutral: "bg-surface-raised text-text-secondary border-border-strong",
  accent: "bg-accent-600/10 text-accent-400 border-accent-600/30",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  success: "bg-success-500/10 text-success-400 border-success-500/30",
  warning: "bg-warning-500/10 text-warning-400 border-warning-500/30",
  error: "bg-error-500/10 text-error-400 border-error-500/30",
};

export function Badge({ children, tone = "neutral", icon, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] font-medium leading-none",
        toneStyles[tone],
        className
      )}
    >
      {icon && <span className="inline-flex shrink-0 [&>svg]:size-3">{icon}</span>}
      {children}
    </span>
  );
}
