import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/layouts/dashboard-shell';

// The shell lives here (not in each page) so the sidebar and header stay
// mounted while moving between pages.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
