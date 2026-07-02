import { Check } from "lucide-react";
import type { ActivityEvent } from "../../types";
import { Skeleton } from "../ui";
import { formatTime } from "../../lib/format";
import { cn } from "../../lib/cn";

interface ActivityTimelineProps {
  events: ActivityEvent[];
  isLoading: boolean;
}

export function ActivityTimeline({ events, isLoading }: ActivityTimelineProps) {
  return (
    <div className="rounded-(--radius-lg) border border-border bg-surface p-5">
      <h3 className="mb-4 text-[13px] font-semibold text-text-primary">Activity Timeline</h3>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : (
        <ol className="space-y-0">
          {events.map((event, i) => (
            <li key={event.type} className="relative flex gap-3 pb-5 last:pb-0">
              {i < events.length - 1 && (
                <span
                  className={cn(
                    "absolute left-[9px] top-5 h-full w-px",
                    event.completed ? "bg-accent-600/40" : "bg-border"
                  )}
                />
              )}
              <span
                className={cn(
                  "z-10 flex size-[18px] shrink-0 items-center justify-center rounded-full border-2",
                  event.completed
                    ? "border-accent-500 bg-accent-500 text-white"
                    : "border-border-strong bg-surface text-transparent"
                )}
              >
                {event.completed && <Check className="size-2.5" />}
              </span>
              <div className="-mt-0.5">
                <p
                  className={cn(
                    "text-[12.5px] font-medium",
                    event.completed ? "text-text-primary" : "text-text-muted"
                  )}
                >
                  {event.label}
                </p>
                {event.timestamp && (
                  <p className="text-[11.5px] text-text-muted">{formatTime(event.timestamp)}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
