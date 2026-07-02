import type { LucideIcon } from "lucide-react";
import { Badge } from "../ui";

interface ComingSoonCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function ComingSoonCard({ icon: Icon, title, description }: ComingSoonCardProps) {
  return (
    <div className="rounded-(--radius-lg) border border-dashed border-border bg-surface-raised/30 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-(--radius-md) bg-surface-raised text-text-muted">
            <Icon className="size-4" />
          </div>
          <h3 className="text-[12.5px] font-semibold text-text-primary">{title}</h3>
        </div>
        <Badge tone="neutral">Coming Soon</Badge>
      </div>
      <p className="mt-2.5 text-[11.5px] leading-relaxed text-text-muted">{description}</p>
    </div>
  );
}
