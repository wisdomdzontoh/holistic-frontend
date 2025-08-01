'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  BarChart3,
  Target,
  Building2,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  Calendar,
  Download
} from 'lucide-react';

const navigationItems = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Dashboard overview'
  },
  {
    name: 'Assessments',
    href: '/dashboard/assessments',
    icon: Target,
    description: 'View and manage assessments'
  },
  {
    name: 'Indicators',
    href: '/dashboard/indicators',
    icon: BarChart3,
    description: 'Manage indicators and thresholds'
  },
  {
    name: 'Facilities',
    href: '/dashboard/facilities',
    icon: Building2,
    description: 'Health facilities management'
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
    description: 'Generate and view reports'
  },
  {
    name: 'Trends',
    href: '/dashboard/trends',
    icon: TrendingUp,
    description: 'Performance trends analysis'
  },
  {
    name: 'Users',
    href: '/dashboard/users',
    icon: Users,
    description: 'User management'
  },
  {
    name: 'Periods',
    href: '/dashboard/periods',
    icon: Calendar,
    description: 'Assessment periods'
  },
  {
    name: 'Exports',
    href: '/dashboard/exports',
    icon: Download,
    description: 'Export data and reports'
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'System configuration'
  }
];

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside className={cn(
      "bg-white shadow-lg transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Toggle button */}
        <div className="flex justify-end p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0"
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
                    ? "bg-blue-100 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5",
                  isActive ? "text-blue-700" : "text-gray-500"
                )} />
                {!collapsed && (
                  <div className="flex-1">
                    <div>{item.name}</div>
                    {!collapsed && (
                      <div className="text-xs text-gray-500 truncate">
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
          <div className="p-4 border-t">
            <div className="text-xs text-gray-500 text-center">
              Holistic Assessment Tool
            </div>
            <div className="text-xs text-gray-400 text-center mt-1">
              v1.0.0
            </div>
          </div>
        )}
      </div>
    </aside>
  );
} 