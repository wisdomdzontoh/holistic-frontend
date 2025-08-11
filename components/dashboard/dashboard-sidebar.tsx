'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Target,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  FileText,
  LogOut
} from 'lucide-react';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and reports'
  },
  {
    name: 'Assessment',
    href: '/dashboard/assessment',
    icon: Target,
    description: 'Create and manage assessments'
  },
  {
    name: 'Indicator Definitions',
    href: '/dashboard/indicators',
    icon: FileText,
    description: 'Manage indicator definitions'
  },
  {
    name: 'Analysis',
    href: '/dashboard/analysis',
    icon: BarChart3,
    description: 'Data analysis and insights'
  }
];

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside className={cn(
      "text-white transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64"
    )} style={{ backgroundColor: '#154360' }}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#2E86AB' }}>
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2E86AB' }}>
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-sm text-white">HOLISTIC ASSESSMENT</div>
                <div className="text-xs text-gray-300">Health Facility Tool</div>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0 text-white hover:bg-white/10"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
                style={isActive ? { backgroundColor: '#2E86AB' } : {}}
              >
                <item.icon className="h-5 w-5" />
                {!collapsed && (
                  <div className="flex-1">
                    <div>{item.name}</div>
                    {!collapsed && (
                      <div className="text-xs text-white/60 truncate">
                        {item.description}
                      </div>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t" style={{ borderColor: '#2E86AB' }}>
            <Link
              href="/login"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
} 