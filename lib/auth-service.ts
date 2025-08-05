export interface LoginCredentials {
  username: string;
  password: string;
  instanceUrl?: string; // Optional DHIS2 instance URL
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    username: string;
    displayName: string;
    email?: string;
    organisationUnits?: any[];
  };
  session?: {
    expiresAt: string;
    dhis2Instance: string;
  };
}

export interface SessionStatus {
  isAuthenticated: boolean;
  user?: {
    id: string;
    username: string;
    displayName: string;
    email?: string;
  };
  session?: {
    expiresAt: string;
    dhis2Instance: string;
  };
}

class AuthService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/dhis2-auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session management
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/dhis2-auth/logout/`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Logout failed');
      }

      return data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async getSessionStatus(): Promise<SessionStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/dhis2-auth/session/status/`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();
      console.log('Session status response:', data);

      if (!response.ok) {
        console.log('Session status failed:', response.status, data);
        return { isAuthenticated: false };
      }

      return data;
    } catch (error) {
      console.error('Session status error:', error);
      return { isAuthenticated: false };
    }
  }

  async checkAuthority(): Promise<{ hasAuthority: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/dhis2-auth/authorities/check/`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return { hasAuthority: false, message: data.message };
      }

      return data;
    } catch (error) {
      console.error('Authority check error:', error);
      return { hasAuthority: false, message: 'Failed to check authority' };
    }
  }

  async getOrgUnits(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/dhis2-auth/org-units/`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch org units');
      }

      return data.orgUnits || [];
    } catch (error) {
      console.error('Get org units error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService(); 