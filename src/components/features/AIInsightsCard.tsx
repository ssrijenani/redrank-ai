import { Sparkles, Lightbulb } from "lucide-react";
import { Skeleton } from "../ui";

interface AIInsightsCardProps {
  insights: string[];
  isLoading: boolean;
}

export function AIInsightsCard({ insights, isLoading }: AIInsightsCardProps) {
  if (!isLoading && insights.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-(--radius-xl) border border-violet-500/25 bg-gradient-to-br from-violet-500/[0.07] via-surface to-surface p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-(--radius-md) bg-violet-500/15">
          <Sparkles className="size-3.5 text-violet-400" />
        </div>
        <h3 className="text-[13.5px] font-semibold text-text-primary">AI Insights</h3>
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-3.5 w-11/12" />
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-3.5 w-3/5" />
        </div>
      ) : (
        <ul className="space-y-2.5">
          {insights.map((insight, i) => (
            <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-text-secondary">
              <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-violet-400" />
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
