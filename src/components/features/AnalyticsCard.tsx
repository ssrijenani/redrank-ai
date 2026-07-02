import type { LucideIcon } from "lucide-react";
import { Card } from "../ui";

type Tone = "neutral" | "accent" | "success" | "warning" | "error";

interface AnalyticsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
  subtext?: string;
}

const toneStyle: Record<Tone, string> = {
  neutral: "bg-surface-raised text-text-muted",
  accent: "bg-accent-600/10 text-accent-400",
  success: "bg-success-500/10 text-success-400",
  warning: "bg-warning-500/10 text-warning-400",
  error: "bg-error-500/10 text-error-400",
};

export function AnalyticsCard({ label, value, icon: Icon, tone = "neutral", subtext }: AnalyticsCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-medium text-text-secondary">{label}</span>
        <span className={`flex size-7 items-center justify-center rounded-(--radius-md) ${toneStyle[tone]}`}>
          <Icon className="size-3.5" />
        </span>
      </div>
      <p className="mt-2.5 text-[22px] font-semibold tabular text-text-primary tracking-tight">{value}</p>
      {subtext && <p className="mt-0.5 text-[11px] text-text-muted">{subtext}</p>}
    </Card>
  );
}
