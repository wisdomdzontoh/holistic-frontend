import { Illustration } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  /** What happened and what to do next — never a raw server message. */
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/** A section that failed to load — message + "Try again"; the rest of the page stays usable. */
export function ErrorState({
  title = "We couldn't load this",
  message = "Check your internet connection and try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-10 text-center", className)} role="alert">
      <Illustration name="error" />
      <div className="max-w-md space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
