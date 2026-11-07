import Image from 'next/image';
import { Loader2 } from 'lucide-react';

/** Full-screen branded loading state shown while the session is checked. */
export function AppLoading({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="login-hero flex min-h-screen items-center justify-center p-6" aria-busy="true">
      <div className="login-card flex w-full max-w-xs flex-col items-center gap-4 rounded-xl bg-card p-8 text-center">
        <Image src="/images/coat-of-arms.png" alt="" width={48} height={48} className="h-12 w-12 object-contain" priority />
        <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
          {message}
        </div>
      </div>
    </div>
  );
}
