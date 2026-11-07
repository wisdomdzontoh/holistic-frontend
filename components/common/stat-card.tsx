import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Tint = "blue" | "teal" | "violet" | "amber" | "rose";

const TINT_CLASS: Record<Tint, string> = {
  blue: "bg-tint-blue-bg text-tint-blue",
  teal: "bg-tint-teal-bg text-tint-teal",
  violet: "bg-tint-violet-bg text-tint-violet",
  amber: "bg-tint-amber-bg text-tint-amber",
  rose: "bg-tint-rose-bg text-tint-rose",
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  /** Decorative identity colour for the icon chip — never a status signal. */
  tint?: Tint;
  className?: string;
}

/** A single headline number: small uppercase label, large tabular value, optional hint line. */
export function StatCard({ label, value, hint, icon: Icon, tint = "blue", className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className="stat-card-label">{label}</p>
          <p className="stat-card-value">{value}</p>
        </div>
        {Icon && (
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", TINT_CLASS[tint])}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>
      {hint && <div className="mt-3 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
