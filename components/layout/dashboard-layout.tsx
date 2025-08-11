'use client';

import React from 'react';
import { DashboardHeader } from '../dashboard/dashboard-header';
import { DashboardSidebar } from '../dashboard/dashboard-sidebar';
import { useAuth } from '@/lib/auth-context';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-200">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2" style={{ borderColor: '#2E86AB' }}></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col">
      <DashboardHeader user={user} />
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      {/* Footer */}
      <footer className="text-white border-t py-3 px-6" style={{ backgroundColor: '#154360', borderColor: '#2E86AB' }}>
        <p className="text-xs text-center text-gray-300">
          Designed by{' '}
          <a
            href="https://wisdomdzontoh.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-200 underline"
          >
            Wisdom Dzontoh
          </a>
        </p>
      </footer>
    </div>
  );
} 