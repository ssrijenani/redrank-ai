import { Sparkles, AlertTriangle } from "lucide-react";

interface ReadyForRankingCardProps {
  completedCount: number;
  failedCount?: number;
}

/**
 * Purely informational celebratory banner — the actual "Continue to AI Ranking"
 * action lives in the persistent bottom CTA bar on the page, per spec. Supports
 * partial success: the recruiter is never blocked by a handful of failed parses.
 */
export function ReadyForRankingCard({ completedCount, failedCount = 0 }: ReadyForRankingCardProps) {
  const hasFailures = failedCount > 0;

  return (
    <div className="relative overflow-hidden rounded-(--radius-xl) border border-accent-600/30 bg-gradient-to-br from-accent-600/10 via-surface to-surface p-6 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-accent-600/15">
        <Sparkles className="size-6 text-accent-400" />
      </div>
      <h3 className="text-[15px] font-semibold text-text-primary">
        {completedCount} {completedCount === 1 ? "resume" : "resumes"} successfully parsed
      </h3>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] text-text-secondary leading-relaxed">
        Ready for AI Candidate Ranking. Every parsed resume has been scored against your hiring rubric.
      </p>
      {hasFailures && (
        <p className="mx-auto mt-3 flex max-w-md items-center justify-center gap-1.5 text-[12px] text-warning-400">
          <AlertTriangle className="size-3.5 shrink-0" />
          {failedCount} {failedCount === 1 ? "resume" : "resumes"} failed to parse — retry below, or continue with the rest.
        </p>
      )}
    </div>
  );
}
