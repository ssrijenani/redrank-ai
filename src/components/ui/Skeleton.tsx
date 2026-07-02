import { cn } from "../../lib/cn";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-(--radius-sm) bg-surface-raised",
        className
      )}
    />
  );
}

/** Pre-composed skeleton for a card with a title line and a couple of body lines. */
export function CardSkeleton() {
  return (
    <div className="rounded-(--radius-lg) bg-surface border border-border p-5">
      <Skeleton className="h-4 w-1/3 mb-3" />
      <Skeleton className="h-3 w-2/3 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

/** Pre-composed skeleton rows for a table while data loads. */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-(--radius-lg) border border-border overflow-hidden">
      <div className="bg-surface-raised/50 h-10 border-b border-border" />
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-3.5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
