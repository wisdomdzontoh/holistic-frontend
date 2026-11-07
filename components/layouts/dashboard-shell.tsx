"use client";

import { useState } from "react";

import { AppHeader } from "@/components/layouts/app-header";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

/**
 * The app frame: navy sidebar + white top bar + dotted-canvas main.
 * Rendered once by app/dashboard/layout.tsx so it persists across page changes.
 * Pages own their padding via <PageContainer> (the assessment workspace runs full-bleed).
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell flex h-screen overflow-hidden bg-background">
      {/* Fixed sidebar from tablet width up; below that the same menu slides out from the header. */}
      <div className="no-print hidden md:flex">
        <AppSidebar />
      </div>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-64 max-w-[85vw] border-0 p-0">
          <SheetTitle className="sr-only">Main menu</SheetTitle>
          <AppSidebar variant="drawer" onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onOpenMenu={() => setMenuOpen(true)} />
        <main id="main-content" className="canvas-dots relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Standard scrollable page column inside the shell. */
export function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-screen-2xl space-y-6 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</div>;
}
