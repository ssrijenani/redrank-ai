import { Check, XCircle, Sparkles, ShieldCheck } from "lucide-react";
import type { Candidate, HiringRecommendation, ScoreBreakdown as ScoreBreakdownItem } from "../../types";
import { Skeleton } from "../ui";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { cn } from "../../lib/cn";

interface ExplainabilityPanelProps {
  candidate: Candidate;
  radarData: ScoreBreakdownItem[];
  isLoadingRadar: boolean;
  recommendation: HiringRecommendation | null;
  isLoadingRecommendation: boolean;
}

const tierStyle: Record<string, string> = {
  "Strong Hire": "border-success-500/30 bg-success-500/10 text-success-400",
  Hire: "border-accent-600/30 bg-accent-600/10 text-accent-400",
  Consider: "border-warning-500/30 bg-warning-500/10 text-warning-400",
  "No Hire": "border-error-500/30 bg-error-500/10 text-error-400",
};

export function ExplainabilityPanel({
  candidate,
  radarData,
  isLoadingRadar,
  recommendation,
  isLoadingRecommendation,
}: ExplainabilityPanelProps) {
  return (
    <div className="space-y-5">
      {/* Why AI ranked this candidate */}
      <div className="rounded-(--radius-xl) border border-violet-500/25 bg-gradient-to-br from-violet-500/[0.06] via-surface to-surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-(--radius-md) bg-violet-500/15">
            <Sparkles className="size-3.5 text-violet-400" />
          </div>
          <h2 className="text-[14.5px] font-semibold text-text-primary">Why AI Ranked This Candidate</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">
              Strengths
            </p>
            <ul className="space-y-1.5">
              {candidate.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-text-secondary">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-success-400" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">
              Potential Concerns
            </p>
            <ul className="space-y-1.5">
              {candidate.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-text-secondary">
                  <XCircle className="mt-0.5 size-3.5 shrink-0 text-error-400" />
                  {w}
                </li>
              ))}
              {candidate.missingSkills.map((s) => (
                <li key={s} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-text-secondary">
                  <XCircle className="mt-0.5 size-3.5 shrink-0 text-error-400" />
                  Missing {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Radar chart */}
      <div className="rounded-(--radius-lg) border border-border bg-surface p-5">
        <h3 className="mb-1 text-[13.5px] font-semibold text-text-primary">Holistic profile</h3>
        <p className="mb-3 text-[12px] text-text-secondary">
          Skills · Experience · Education · Projects · Communication · Resume Quality
        </p>
        {isLoadingRadar ? (
          <Skeleton className="h-56 w-full" />
        ) : (
          <ScoreBreakdown data={radarData} />
        )}
      </div>

      {/* Hiring rubric alignment */}
      <div className="rounded-(--radius-lg) border border-border bg-surface p-5">
        <h3 className="mb-3 text-[13.5px] font-semibold text-text-primary">Hiring Rubric Alignment</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">
              Required Skills
            </p>
            <ul className="space-y-1.5">
              {candidate.matchedSkills.map((s) => (
                <li key={s} className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                  <Check className="size-3.5 shrink-0 text-success-400" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          {candidate.missingSkills.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">
                Missing
              </p>
              <ul className="space-y-1.5">
                {candidate.missingSkills.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                    <XCircle className="size-3.5 shrink-0 text-error-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* AI Hiring Recommendation */}
      <div className="rounded-(--radius-lg) border border-border bg-surface p-5">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="size-4 text-accent-400" />
          <h3 className="text-[13.5px] font-semibold text-text-primary">AI Hiring Recommendation</h3>
        </div>
        {isLoadingRecommendation || !recommendation ? (
          <div className="space-y-2.5">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1 text-[13px] font-semibold",
                  tierStyle[recommendation.tier]
                )}
              >
                {recommendation.tier}
              </span>
              <span className="text-[12.5px] text-text-secondary">
                Confidence <span className="font-semibold tabular text-text-primary">{recommendation.confidence}%</span>
              </span>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-text-secondary">{recommendation.reason}</p>
          </>
        )}
      </div>
    </div>
  );
}
