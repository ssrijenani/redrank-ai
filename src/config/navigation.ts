/**
 * config/navigation.ts
 * Single source of truth for primary navigation. Sidebar renders this
 * list directly instead of hardcoding routes — adding/removing/reordering
 * a nav item means editing this file only.
 */

import {
  LayoutDashboard,
  Briefcase,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Exact-match required for active styling (e.g. avoids "/" matching everything). */
  end?: boolean;
}

export const primaryNavItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, end: true },
  { label: "Jobs", path: "/jobs/new", icon: Briefcase },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
];

/**
 * Static route → page title lookup, consumed by Topbar so titles aren't
 * hardcoded per-page. Routes with dynamic segments (e.g. candidate name)
 * are not listed here — those pages pass an explicit `title` override.
 */
export const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/jobs/new": "Job Studio",
  "/analytics": "Analytics",
};
