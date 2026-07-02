import { cn } from "../../lib/cn";
import { getMatchTier, type ScoreTone } from "../../lib/scoring";

const toneBar: Record<ScoreTone, string> = {
  success: "bg-success-500",
  accent: "bg-accent-500",
  warning: "bg-warning-500",
  error: "bg-error-500",
};

const toneText: Record<ScoreTone, string> = {
  success: "text-success-400",
  accent: "text-accent-400",
  warning: "text-warning-400",
  error: "text-error-400",
};

interface CandidateScoreBadgeProps {
  score: number;
  size?: "sm" | "md";
}

export function CandidateScoreBadge({ score, size = "md" }: CandidateScoreBadgeProps) {
  const tier = getMatchTier(score);

  return (
    <div className="min-w-[104px]">
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-semibold tabular",
            toneText[tier.tone],
            size === "md" ? "text-[16px]" : "text-[13px]"
          )}
        >
          {score}%
        </span>
        <span className="text-[11px] text-text-secondary">{tier.label}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
        <div
          className={cn("h-full rounded-full", toneBar[tier.tone])}
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        />
      </div>
    </div>
  );
}
