import { cn } from "../../lib/cn";

interface UploadProgressProps {
  /** 0-100 */
  value: number;
  tone?: "accent" | "success" | "error" | "neutral";
  size?: "sm" | "md";
  className?: string;
}

const toneStyles: Record<NonNullable<UploadProgressProps["tone"]>, string> = {
  accent: "bg-accent-500",
  success: "bg-success-500",
  error: "bg-error-500",
  neutral: "bg-text-muted",
};

export function UploadProgress({ value, tone = "accent", size = "sm", className }: UploadProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "w-full overflow-hidden rounded-full bg-surface-raised",
        size === "sm" ? "h-1.5" : "h-2.5",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-300 ease-(--ease-out-smooth)",
          toneStyles[tone]
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
