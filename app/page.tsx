'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center app-gradient-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 mx-auto" style={{ borderColor: 'var(--brand-navy)' }}></div>
          <p className="mt-4 text-ink-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center app-gradient-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
            DHIS2 Data Validator
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Holistic Assessment Webapp
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Redirecting to login...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => router.push('/login')}
              style={{ backgroundColor: 'var(--brand-navy)' }}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-400">
            Designed by{' '}
            <a
              href="https://wisdomdzontoh.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-navy hover:text-brand-navy-dark"
            >
              Wisdom Dzontoh
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
