import { Bot, User } from "lucide-react";
import type { AuditLogEntry } from "../../types";
import { Skeleton } from "../ui";
import { formatTime } from "../../lib/format";
import { cn } from "../../lib/cn";

interface AuditLogProps {
  entries: AuditLogEntry[];
  isLoading: boolean;
}

export function AuditLog({ entries, isLoading }: AuditLogProps) {
  return (
    <div className="rounded-(--radius-lg) border border-border bg-surface p-5">
      <h3 className="mb-4 text-[13px] font-semibold text-text-primary">Audit Log</h3>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-[12px] text-text-muted">No activity recorded yet.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full",
                  entry.actor === "ai" ? "bg-violet-500/15 text-violet-400" : "bg-accent-600/15 text-accent-400"
                )}
              >
                {entry.actor === "ai" ? <Bot className="size-3.5" /> : <User className="size-3.5" />}
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-text-primary">{entry.action}</p>
                {entry.detail && <p className="text-[11.5px] text-text-secondary">{entry.detail}</p>}
                <p className="text-[11px] text-text-muted">{formatTime(entry.timestamp)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
