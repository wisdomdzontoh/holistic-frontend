"use client";

import { useEffect, useState } from "react";
import { Database, Menu, WifiOff } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { displayName, initials, instanceHost } from "@/lib/display-name";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  /** Small screens only: opens the slide-out main menu. */
  onOpenMenu?: () => void;
}

/** White 64px top bar: greeting + role pill on the left, DHIMS2 connection badge on the right. */
export function AppHeader({ onOpenMenu }: AppHeaderProps) {
  const { user, session } = useAuth();
  const isOffline = useIsOffline();
  const name = displayName(user as Parameters<typeof displayName>[0]);
  const host = instanceHost(session?.dhis2Instance);

  return (
    <header
      className="no-print flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-3 sm:px-5"
      role="banner"
    >
      {onOpenMenu && (
        <Button type="button" variant="ghost" size="icon" className="shrink-0 md:hidden" onClick={onOpenMenu} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      )}

      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground"
          aria-hidden="true"
        >
          {initials(name || "User")}
        </span>
        <span className="hidden truncate text-sm text-foreground sm:block">
          {name ? (
            <>
              Hello, <span className="font-semibold">{name}</span>!
            </>
          ) : (
            "Hello!"
          )}
        </span>
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
          DHIMS2 user
        </span>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {isOffline && (
          <span className="status-pill status-pill-pending" role="status">
            <WifiOff className="h-3 w-3" aria-hidden="true" />
            You&apos;re offline
          </span>
        )}

        {/* Static badge — the DHIMS2 instance this session reads data from. */}
        <div
          className="flex h-10 items-center gap-2 rounded-md bg-primary pr-3 pl-1.5 text-primary-foreground"
          title={host ? `Connected to ${host}` : "Connected to DHIMS2"}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-card text-primary" aria-hidden="true">
            <Database className="h-3.5 w-3.5" />
          </span>
          <span className="hidden text-[13px] leading-tight font-medium sm:block">
            DHIMS2
            {host && <span className="block max-w-40 truncate text-2xs font-normal opacity-80">{host}</span>}
          </span>
        </div>
      </div>
    </header>
  );
}

/** True only while the browser reports no connection — no permanent "Online" badge. */
function useIsOffline(): boolean {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return offline;
}
