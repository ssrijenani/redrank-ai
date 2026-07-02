import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/cn";
import { RUBRIC_TOTAL_WEIGHT } from "../../config/constants";

export function RubricWeightSummary({ total }: { total: number }) {
  const isBalanced = total === RUBRIC_TOTAL_WEIGHT;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-(--radius-md) border px-3 py-2 text-[12px] font-medium",
        isBalanced
          ? "border-success-500/30 bg-success-500/10 text-success-400"
          : "border-warning-500/30 bg-warning-500/10 text-warning-400"
      )}
    >
      {isBalanced ? (
        <CheckCircle2 className="size-3.5 shrink-0" />
      ) : (
        <AlertTriangle className="size-3.5 shrink-0" />
      )}
      <span className="tabular">
        Total weight: {total}%{" "}
        {!isBalanced && (
          <span className="font-normal opacity-90">
            — should sum to {RUBRIC_TOTAL_WEIGHT}%
          </span>
        )}
      </span>
    </div>
  );
}
