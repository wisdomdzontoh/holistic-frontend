import type { LucideIcon } from "lucide-react";
import { BarChart3, BookOpen, ClipboardList, LayoutDashboard } from "lucide-react";

export type NavGroup = "home" | "assess" | "reference";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group: NavGroup;
  /** Match only the exact path (for the dashboard root). */
  exact?: boolean;
}

/** The one list of pages. The sidebar renders this — don't duplicate it elsewhere. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "home", exact: true },
  { label: "Assessment", href: "/dashboard/assessment", icon: ClipboardList, group: "assess" },
  { label: "Analysis", href: "/dashboard/analysis", icon: BarChart3, group: "assess" },
  { label: "Indicator definitions", href: "/dashboard/indicators", icon: BookOpen, group: "reference" },
];

export const NAV_GROUP_ORDER: NavGroup[] = ["home", "assess", "reference"];

export const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  home: "Home",
  assess: "Assess",
  reference: "Reference",
};

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
