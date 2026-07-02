import { cn } from "../../lib/cn";
import { scoreTone } from "../../lib/scoring";

const toneBar: Record<string, string> = {
  success: "bg-success-500",
  accent: "bg-accent-500",
  warning: "bg-warning-500",
  error: "bg-error-500",
};

export function MiniScoreBar({ value, className }: { value: number; className?: string }) {
  const tone = scoreTone(value);
  return (
    <div className={cn("min-w-[64px]", className)}>
      <span className="text-[12.5px] tabular text-text-primary">{value}%</span>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-raised">
        <div className={cn("h-full rounded-full", toneBar[tone])} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
