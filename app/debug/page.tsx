'use client';

import { useState } from 'react';
import { debugService } from '@/lib/debug-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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
    try {
      const result = await debugService.testLogin(credentials);
      console.log('Login test result:', result);
      alert(`Login test completed. Check console for details. Status: ${result.status}`);
    } catch (error) {
      console.error('Login test error:', error);
      alert(`Login test failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">🔍 Authentication Debug</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Debug Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runDebug} disabled={loading}>
            {loading ? 'Running Debug...' : 'Run Debug Tests'}
          </Button>
          
          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              placeholder="DHIS2 username"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              placeholder="DHIS2 password"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Instance URL</Label>
            <Input
              value={credentials.instanceUrl}
              onChange={(e) => setCredentials(prev => ({ ...prev, instanceUrl: e.target.value }))}
              placeholder="DHIS2 instance URL"
            />
          </div>
          
          <Button onClick={testLogin} disabled={loading || !credentials.username || !credentials.password}>
            Test Login
          </Button>
        </CardContent>
      </Card>

      {debugInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
