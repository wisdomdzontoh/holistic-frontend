/**
 * Debug service to help diagnose authentication and API issues
 */

export interface DebugInfo {
  sessionStatus: any;
  authStatus: any;
  corsTest: any;
  apiTest: any;
  authTest: any;
}

class DebugService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  async getDebugInfo(): Promise<DebugInfo> {
    const results: DebugInfo = {
      sessionStatus: null,
      authStatus: null,
      corsTest: null,
      apiTest: null,
      authTest: null
    };

    try {
      // Test session debug endpoint
      const sessionResponse = await fetch(`${this.baseUrl}/dhis2-auth/debug-session/`, {
        method: 'GET',
        credentials: 'include',
      });
      results.sessionStatus = {
        status: sessionResponse.status,
        data: await sessionResponse.json().catch(() => 'Failed to parse JSON')
      };
    } catch (error) {
      results.sessionStatus = { error: error instanceof Error ? error.message : String(error) };
    }

    try {
      // Test authentication endpoint
      const authResponse = await fetch(`${this.baseUrl}/dhis2-auth/test-auth/`, {
        method: 'GET',
        credentials: 'include',
      });
      results.authStatus = {
        status: authResponse.status,
        data: await authResponse.json().catch(() => 'Failed to parse JSON')
      };
    } catch (error) {
      results.authStatus = { error: error instanceof Error ? error.message : String(error) };
    }

    try {
      // Test auth status
      const authResponse = await fetch(`${this.baseUrl}/dhis2-auth/session/status/`, {
        method: 'GET',
        credentials: 'include',
      });
      results.authStatus = {
        status: authResponse.status,
        data: await authResponse.json().catch(() => 'Failed to parse JSON')
      };
    } catch (error) {
      results.authStatus = { error: error instanceof Error ? error.message : String(error) };
    }

    try {
      // Test authentication endpoint
      const authTestResponse = await fetch(`${this.baseUrl}/dhis2-auth/test-auth/`, {
        method: 'GET',
        credentials: 'include',
      });
      results.authTest = {
        status: authTestResponse.status,
        data: await authTestResponse.json().catch(() => 'Failed to parse JSON')
      };
    } catch (error) {
      results.authTest = { error: error instanceof Error ? error.message : String(error) };
    }

    try {
      // Test CORS with preflight
      const corsResponse = await fetch(`${this.baseUrl}/dhis2-auth/debug-session/`, {
        method: 'OPTIONS',
        credentials: 'include',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type',
        }
      });
      results.corsTest = {
        status: corsResponse.status,
        headers: {
          'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
          'Access-Control-Allow-Credentials': corsResponse.headers.get('Access-Control-Allow-Credentials'),
          'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
          'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers'),
        }
      };
    } catch (error) {
      results.corsTest = { error: error instanceof Error ? error.message : String(error) };
    }

    try {
      // Test a simple API endpoint
      const apiResponse = await fetch(`${this.baseUrl}/assessments/dashboard/stats/`, {
        method: 'GET',
        credentials: 'include',
      });
      results.apiTest = {
        status: apiResponse.status,
        data: await apiResponse.json().catch(() => 'Failed to parse JSON')
      };
    } catch (error) {
      results.apiTest = { error: error instanceof Error ? error.message : String(error) };
    }

    return results;
  }

  async testLogin(credentials: { username: string; password: string; instanceUrl: string }) {
    try {
      const response = await fetch(`${this.baseUrl}/dhis2-auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      return {
        status: response.status,
        data: await response.json().catch(() => 'Failed to parse JSON'),
        headers: {
          'set-cookie': response.headers.get('set-cookie'),
          'content-type': response.headers.get('content-type'),
        }
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  logDebugInfo(info: DebugInfo) {
    console.group('🔍 Authentication Debug Info');
    console.log('Session Status:', info.sessionStatus);
    console.log('Auth Status:', info.authStatus);
    console.log('CORS Test:', info.corsTest);
    console.log('API Test:', info.apiTest);
    console.log('Current URL:', window.location.href);
    console.log('Cookies:', document.cookie);
    console.groupEnd();
  }
}

export const debugService = new DebugService();
