import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  ClipboardList,
  CloudOff,
  Frown,
  ListX,
  MousePointerClick,
  ServerCrash,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type IllustrationName =
  | "no-results"
  | "all-done"
  | "empty-list"
  | "choose-first"
  | "assessment"
  | "error"
  | "offline";

const ICONS: Record<IllustrationName, LucideIcon> = {
  "no-results": Frown,
  "all-done": CheckCircle2,
  "empty-list": ListX,
  "choose-first": MousePointerClick,
  assessment: ClipboardList,
  error: ServerCrash,
  offline: CloudOff,
};

/** Plain greyscale icon-in-a-circle "illustration" used by EmptyState / ErrorState. */
export function Illustration({ name, tone = "default" }: { name: IllustrationName; tone?: "default" | "good-news" }) {
  const Icon = ICONS[name];
  return (
    <div
      className={cn(
        "mx-auto flex h-14 w-14 items-center justify-center rounded-full",
        tone === "good-news" ? "bg-success-bg" : "bg-muted",
      )}
    >
      <Icon
        className={cn("h-7 w-7", tone === "good-news" ? "text-success" : "text-muted-foreground")}
        aria-hidden="true"
      />
    </div>
  );
}

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface EmptyStateProps {
  illustration: IllustrationName;
  title: string;
  description: ReactNode;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  tone?: "default" | "good-news";
  className?: string;
  children?: ReactNode;
}

/** Nothing yet / no results / needs a choice first — icon + title + sentence + next step. */
export function EmptyState({
  illustration,
  title,
  description,
  action,
  secondaryAction,
  tone = "default",
  className,
  children,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-10 text-center", className)}>
      <Illustration name={illustration} tone={tone} />
      <div className="max-w-md space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      {children}
      {(action || secondaryAction) && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {action && <ActionButton action={action} variant="default" />}
          {secondaryAction && <ActionButton action={secondaryAction} variant="outline" />}
        </div>
      )}
    </div>
  );
}

function ActionButton({ action, variant }: { action: EmptyStateAction; variant: "default" | "outline" }) {
  if (action.href) {
    return (
      <Button asChild variant={variant}>
        <Link href={action.href}>{action.label}</Link>
      </Button>
    );
  }
  return (
    <Button type="button" variant={variant} onClick={action.onClick}>
      {action.label}
    </Button>
  );
}
