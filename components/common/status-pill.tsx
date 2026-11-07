import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type PillTone = "success" | "warning" | "pending" | "error" | "info" | "purple" | "neutral";

interface StatusPillProps {
  tone: PillTone;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

/** The one status pill for the whole app — soft bg + border + icon + words. Every status goes through this. */
export function StatusPill({ tone, icon: Icon, children, className, title }: StatusPillProps) {
  return (
    <span className={cn("status-pill", `status-pill-${tone}`, className)} title={title}>
      {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {children}
    </span>
  );
}
