'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, SessionStatus } from './auth-service';

interface AuthContextType {
  isAuthenticated: boolean;
  user: SessionStatus['user'] | null;
  session: SessionStatus['session'] | null;
  loading: boolean;
  login: (username: string, password: string, instanceUrl?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<SessionStatus['user'] | null>(null);
  const [session, setSession] = useState<SessionStatus['session'] | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const sessionStatus = await authService.getSessionStatus();
      setIsAuthenticated(sessionStatus.isAuthenticated);
      setUser(sessionStatus.user || null);
      setSession(sessionStatus.session || null);
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setIsAuthenticated(false);
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string, instanceUrl?: string) => {
    try {
      setLoading(true);
      const response = await authService.login({ username, password, instanceUrl });
      
      if (response.success) {
        setIsAuthenticated(true);
        setUser(response.user || null);
        setSession(response.session || null);
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setSession(null);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    session,
    loading,
    login,
    logout,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 