import type { ReactNode } from "react";
import { Inbox, AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../../lib/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  tone?: "empty" | "error";
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  tone = "empty",
  className,
}: EmptyStateProps) {
  const defaultIcon =
    tone === "error" ? (
      <AlertTriangle className="size-5 text-error-400" />
    ) : (
      <Inbox className="size-5 text-text-muted" />
    );

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-(--radius-lg) border border-dashed border-border px-6 py-14 text-center",
        className
      )}
    >
      <div
        className={cn(
          "mb-4 flex size-10 items-center justify-center rounded-full",
          tone === "error" ? "bg-error-500/10" : "bg-surface-raised"
        )}
      >
        {icon ?? defaultIcon}
      </div>
      <h3 className="text-[14px] font-medium text-text-primary">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] text-text-secondary leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <Button size="sm" variant={tone === "error" ? "secondary" : "primary"} onClick={action.onClick} className="mt-5">
          {action.label}
        </Button>
      )}
    </div>
  );
}
