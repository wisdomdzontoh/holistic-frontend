import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Remove body padding (tables that run edge to edge). */
  flush?: boolean;
  className?: string;
  bodyClassName?: string;
}

/** The standard white content card: optional header (title, description, actions), body, footer. */
export function SectionCard({
  title,
  description,
  actions,
  children,
  footer,
  flush = false,
  className,
  bodyClassName,
}: SectionCardProps) {
  const hasHeader = title || description || actions;
  return (
    <section className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      {hasHeader && (
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-4">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(!flush && (hasHeader ? "px-5 pb-5" : "p-5"), bodyClassName)}>{children}</div>
      {footer && <div className="border-t border-border bg-surface-subtle px-5 py-3">{footer}</div>}
    </section>
  );
}
