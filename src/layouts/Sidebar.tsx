import { NavLink } from "react-router-dom";
import { Sparkles, Settings } from "lucide-react";
import { primaryNavItems } from "../config/navigation";
import { appConfig } from "../config/app";
import { cn } from "../lib/cn";

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-bg">
      <div className="flex h-14 items-center gap-2 px-5 border-b border-border">
        <div className="flex size-7 items-center justify-center rounded-(--radius-md) bg-accent-600">
          <Sparkles className="size-4 text-white" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-text-primary">
          {appConfig.name}
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {primaryNavItems.map(({ path, label, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-(--radius-md) px-3 py-2 text-[13px] font-medium transition-colors duration-(--duration-fast)",
                isActive
                  ? "bg-accent-600/10 text-accent-400"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <button className="flex w-full items-center gap-2.5 rounded-(--radius-md) px-3 py-2 text-[13px] font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors">
          <Settings className="size-4 shrink-0" />
          Settings
        </button>
      </div>
    </aside>
  );
}
