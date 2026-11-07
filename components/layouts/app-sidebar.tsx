"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";

import { NAV_GROUP_LABELS, NAV_GROUP_ORDER, NAV_ITEMS, isNavItemActive } from "@/config/navigation";
import { useAuth } from "@/lib/auth-context";
import { useSidebarCollapsed } from "@/lib/hooks/use-sidebar-collapsed";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AppSidebarProps {
  /** "rail" = the fixed desktop sidebar (collapsible); "drawer" = the slide-out menu on small screens. */
  variant?: "rail" | "drawer";
  /** Drawer only: close the menu after the user picks a page. */
  onNavigate?: () => void;
}

const GROUPS = NAV_GROUP_ORDER.map((group) => ({
  group,
  items: NAV_ITEMS.filter((item) => item.group === group),
})).filter((g) => g.items.length > 0);

/** Deep-navy main menu: white wordmark block, grouped pages, Log out pinned at the bottom. */
export function AppSidebar({ variant = "rail", onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const isDrawer = variant === "drawer";
  const [storedCollapsed, setCollapsed] = useSidebarCollapsed();
  const collapsed = !isDrawer && storedCollapsed;

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <aside
      className={cn(
        "sidebar-shell flex h-full shrink-0 flex-col border-r transition-[width] duration-150",
        isDrawer ? "w-full" : collapsed ? "w-16" : "w-60",
      )}
      aria-label="Main menu"
    >
      {/* White header block — lines up with the top bar */}
      <div className={cn("flex h-16 shrink-0 items-center gap-2.5 border-b border-border bg-card", collapsed ? "justify-center px-2" : "px-4")}>
        <Image
          src="/images/coat-of-arms.png"
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 object-contain"
          priority
        />
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-bold tracking-wide text-foreground uppercase">Holistic</p>
            <p className="truncate text-2xs font-medium tracking-wider text-muted-foreground uppercase">Assessment tool</p>
          </div>
        )}
      </div>

      <nav className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-2 py-3">
        {GROUPS.map(({ group, items }, groupIndex) => (
          <div key={group}>
            {!collapsed && (
              <div className="flex items-center justify-between px-2.5 pb-1.5">
                <p className="sidebar-role-label text-2xs font-semibold tracking-wider uppercase">
                  {NAV_GROUP_LABELS[group]}
                </p>
                {groupIndex === 0 && !isDrawer && (
                  <button
                    type="button"
                    onClick={() => setCollapsed(true)}
                    className="sidebar-toggle -mr-1 flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-sidebar-accent"
                    aria-label="Collapse menu"
                  >
                    <Menu className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            <ul className="space-y-0.5">
              {items.map((item) => {
                const isActive = isNavItemActive(item, pathname);
                const Icon = item.icon;
                const link = (
                  <Link
                    href={item.href}
                    className={cn("sidebar-item", isActive && "active", collapsed && "justify-center px-0")}
                    aria-current={isActive ? "page" : undefined}
                    onClick={onNavigate}
                  >
                    <Icon
                      className={cn("h-[18px] w-[18px] shrink-0", isActive ? "sidebar-icon-active" : "sidebar-icon-muted")}
                      aria-hidden="true"
                    />
                    {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
                  </Link>
                );

                return (
                  <li key={item.href}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {collapsed && (
        <div className="sidebar-divider flex shrink-0 justify-center border-t p-2">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="sidebar-toggle flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent"
            aria-label="Expand menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="sidebar-divider shrink-0 space-y-2 border-t p-2">
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleLogout}
                className="sidebar-item mx-auto flex h-9 w-9 items-center justify-center px-0"
                aria-label="Log out"
              >
                <LogOut className="sidebar-icon-muted h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Log out</TooltipContent>
          </Tooltip>
        ) : (
          <>
            <button type="button" onClick={handleLogout} className="sidebar-item w-full">
              <LogOut className="sidebar-icon-muted h-4 w-4" aria-hidden="true" />
              <span>Log out</span>
            </button>
            <p className="sidebar-role-label px-3 pb-1 text-2xs">
              Developed by{" "}
              <a
                href="https://wisdomdzontoh.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-sidebar-accent-foreground"
              >
                Wisdom Dzontoh
              </a>
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
