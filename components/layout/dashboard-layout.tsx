'use client';

import React from 'react';
import { DashboardHeader } from '../dashboard/dashboard-header';
import { DashboardSidebar } from '../dashboard/dashboard-sidebar';
import { useAuth } from '@/lib/auth-context';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader user={user} />
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-3 px-6">
        <p className="text-xs text-gray-500 text-center">
          Designed by{' '}
          <a
            href="https://wisdomdzontoh.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Wisdom Dzontoh
          </a>
        </p>
      </footer>
    </div>
  );
} 