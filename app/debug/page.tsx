'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { debugService } from '@/lib/debug-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageCard } from '@/components/layouts/page-card';
import { SectionCard } from '@/components/common/section-card';
import { InlineNotice } from '@/components/common/inline-notice';

/** Developer-only page for checking the DHIMS2 sign-in flow. */
export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loginResult, setLoginResult] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    instanceUrl: 'https://dhims.chimgh.org/dhims'
  });

  const runDebug = async () => {
    setLoading(true);
    try {
      const info = await debugService.getDebugInfo();
      setDebugInfo(info);
      debugService.logDebugInfo(info);
    } catch (error) {
      console.error('Debug error:', error);
      setDebugInfo({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setLoginResult(null);
    try {
      const result = await debugService.testLogin(credentials);
      console.log('Login test result:', result);
      setLoginResult({ tone: 'success', message: `Sign-in test finished with status ${result.status}. Full details are in the browser console.` });
    } catch (error) {
      console.error('Login test error:', error);
      setLoginResult({ tone: 'error', message: `Sign-in test failed: ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="canvas-dots min-h-screen">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <PageCard
          title="Sign-in diagnostics"
          description="For developers: check the session and test DHIMS2 sign-in against an instance."
          actions={
            <Button variant="outline" onClick={runDebug} disabled={loading}>
              {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
              Run session checks
            </Button>
          }
        />

        <SectionCard title="Test a sign-in">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="debug-username">Username</Label>
              <Input
                id="debug-username"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                placeholder="DHIMS2 username"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="debug-password">Password</Label>
              <Input
                id="debug-password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="debug-instance">Instance address</Label>
              <Input
                id="debug-instance"
                className="font-clinical"
                value={credentials.instanceUrl}
                onChange={(e) => setCredentials(prev => ({ ...prev, instanceUrl: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={testLogin} disabled={loading || !credentials.username || !credentials.password}>
              {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
              Test sign-in
            </Button>
          </div>
          {loginResult && (
            <InlineNotice tone={loginResult.tone} className="mt-4">
              {loginResult.message}
            </InlineNotice>
          )}
        </SectionCard>

        {debugInfo && (
          <SectionCard title="Session check results">
            <pre className="font-clinical overflow-auto rounded-lg bg-surface-subtle p-4 text-xs text-foreground">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </SectionCard>
        )}
      </div>
    </main>
  );
}
