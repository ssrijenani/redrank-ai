import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import { pageTitles } from "../config/navigation";

interface TopbarProps {
  /** Optional override for routes with dynamic segments not present in config/navigation.ts. */
  title?: string;
  actions?: ReactNode;
}

export function Topbar({ title, actions }: TopbarProps) {
  const { pathname } = useLocation();
  const resolvedTitle = title ?? pageTitles[pathname] ?? "";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-bg/80 backdrop-blur px-4 md:px-6 sticky top-0 z-30">
      <h1 className="text-[15px] font-semibold text-text-primary tracking-tight">
        {resolvedTitle}
      </h1>
      <div className="flex items-center gap-3">
        {actions}
        <button
          aria-label="Notifications"
          className="flex size-8 items-center justify-center rounded-(--radius-md) text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
        >
          <Bell className="size-4" />
        </button>
        <div className="flex size-8 items-center justify-center rounded-full bg-accent-600/20 text-[12px] font-semibold text-accent-400">
          SJ
        </div>
      </div>
    </header>
  );
}
